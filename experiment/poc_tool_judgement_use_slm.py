# poc_tool_judgement_use_slm.py
import json
import subprocess
import time

# プライマリとフォールバックモデル
PRIMARY_MODEL = "phi3:3.8b"
FALLBACK_MODEL = "qwen3:8b"  # 代替: "llama3.1:8b"

# 全モデルの連続ベンチ（参考用。mainで使う）
BENCH_MODELS = [
    "qwen2.5-coder:1.5b-base",
    "llama3.2:3b",
    "phi3:3.8b",
    "llama3.1:8b",
    "qwen3:8b",
]

# ルールベースの期待カテゴリ（フォールバック判定用）
CALC_HINTS = ("+", "-", "*", "/", "^", "sqrt", "乗", "pow", "×", "÷")
ROMAN = (" I", " V", " X", " L", " C", " D", " M")
SEARCH_HINTS = (
    "天気", "weather", "株", "stock", "price", "news", "release", "時価", "予定",
    "where", "when", "market", "cap", "forecast", "temperature"
)

# フォールバックを要するステータス
FALLBACK_STATUSES = {"bad_tool", "rule_mismatch", "empty_query", "parse_error", "unexpected_output"}

PROMPT = """You are a strict router. Decide the needed tool and give confidence 0-1.
Rules:
- calculator: arithmetic, sqrt, power, unit/number conversion, roman-numeral conversion.
- web_search: weather, stock/price/market cap, news, release notes, schedules/dates, location info.
- none: jokes, chit-chat, greetings, feelings, opinions, creative writing/story.
Output exactly this JSON (no lists, no extra fields):
{{"tool": "<web_search|calculator|none>", "query": "<string or empty>", "confidence": "<0.0-1.0 float>"}}

User: {message}
JSON:"""

TESTS = [
    # 計算系
    ("17*42", "calculator"),
    ("計算して 9999*8888", "calculator"),
    ("sqrt(144) は？", "calculator"),
    ("2の15乗を教えて", "calculator"),
    ("ローマ数字をアラビア数字にして XCVII", "calculator"),
    # 検索系
    ("天気 東京", "web_search"),
    ("株価 Apple", "web_search"),
    ("NVIDIAの時価総額", "web_search"),
    ("来週のボストンの天気", "web_search"),
    ("Python 3.13 のリリースノート", "web_search"),
    # 雑談/なし
    ("ジョーク言って", "none"),
    ("暇つぶしに雑談", "none"),
    ("こんにちは！", "none"),
    ("今日の気分は？", "none"),
    ("物語を作って", "none"),
]

def classify(model: str, msg: str):
    t0 = time.time()
    prompt = PROMPT.format(message=msg)
    try:
        out = subprocess.run(
            ["ollama", "run", model, prompt, "--format", "json"],
            check=True,
            capture_output=True,
            text=True,
            timeout=120,
        )
    except subprocess.CalledProcessError as e:
        detail = e.stderr.strip() if e.stderr else str(e)
        return None, time.time() - t0, f"ollama_error: {detail}"
    dt = time.time() - t0
    raw = out.stdout.strip()
    try:
        obj = json.loads(raw)
    except Exception as e:
        return None, dt, f"parse_error: {e}"

    # Normalize sloppy outputs from small models.
    if isinstance(obj, list):
        obj = {"tool": obj[0], "query": "", "confidence": None}
    if isinstance(obj, dict):
        tool = obj.get("tool")
        query = obj.get("query", "")
        conf = obj.get("confidence", None)
        if isinstance(tool, list) and tool:
            tool = tool[0]
        obj = {"tool": tool, "query": query, "confidence": conf}
    else:
        return None, dt, "unexpected_output"

    # Heuristic mapping for near-miss labels
    tool_raw = str(obj["tool"]).lower() if obj["tool"] is not None else ""
    if tool_raw in {"web_search", "search", "browser", "internet"}:
        obj["tool"] = "web_search"
    elif any(s in tool_raw for s in ["math", "calc", "calculator", "compute"]):
        obj["tool"] = "calculator"
    elif tool_raw in {"none", "no", "null", "nothing"} or tool_raw == "":
        obj["tool"] = "none"
    else:
        if any(s in tool_raw for s in ["weather", "stock", "price", "news", "release", "note", "cap"]):
            obj["tool"] = "web_search"
        elif any(s in tool_raw for s in ["joke", "chat", "talk", "hello", "hi", "feels", "feel", "mood", "greet", "thank"]):
            obj["tool"] = "none"
        else:
            return obj, dt, "bad_tool"

    if obj["tool"] not in {"web_search", "calculator", "none"}:
        return obj, dt, "bad_tool"

    conf = obj.get("confidence")
    if conf is None or conf == "":
        obj["confidence"] = None
    else:
        try:
            conf_val = float(conf)
            obj["confidence"] = max(0.0, min(1.0, conf_val))
        except Exception:
            obj["confidence"] = None

    # Rule-based expectation check for fallback signaling
    text = obj.get("query", "") or ""
    lower_text = text.lower()
    expected = None
    if any(h in lower_text for h in CALC_HINTS) or any(h in text for h in ROMAN):
        expected = "calculator"
    elif any(h in lower_text for h in SEARCH_HINTS):
        expected = "web_search"
    elif len(text.strip()) <= 3 and obj["tool"] != "calculator":
        expected = "none"

    if expected and obj["tool"] != expected:
        return obj, dt, "rule_mismatch"
    if obj["tool"] in {"web_search", "calculator"} and (text is None or len(text.strip()) < 1):
        return obj, dt, "empty_query"

    return obj, dt, "ok"

def run_model(model: str):
    ok = 0
    confs = []
    times = []
    for msg, gold in TESTS:
        obj, dt, status = classify(model, msg)
        pred = obj.get("tool") if obj else None
        conf = obj.get("confidence") if obj else None
        hit = (pred == gold)
        ok += int(hit)
        times.append(dt)
        if conf is not None:
            try:
                conf_f = float(conf)
                confs.append(conf_f)
                conf_str = f"{conf_f:.2f}"
            except Exception:
                conf_str = "-"
        else:
            conf_str = "-"
        print(f"{msg:20s} -> {pred} (gold {gold}) conf={conf_str} {dt:.2f}s {status} {'OK' if hit else 'NG'}")
    avg_conf = sum(confs)/len(confs) if confs else 0.0
    avg_time = sum(times)/len(times) if times else 0.0
    print(f"acc={ok/len(TESTS):.2f}  n={len(TESTS)}  avg_conf={avg_conf:.2f}  avg_time={avg_time:.2f}s  model={model}")

def main():
    # Primary -> fallback pipeline
    print(f"\n=== Primary/Fallback pipeline: {PRIMARY_MODEL} -> {FALLBACK_MODEL} ===")
    ok = 0
    times = []
    for msg, gold in TESTS:
        obj, dt, status = classify(PRIMARY_MODEL, msg)
        total_t = dt
        used_fallback = False
        if status in FALLBACK_STATUSES:
            obj, dt_fb, status_fb = classify(FALLBACK_MODEL, msg)
            total_t += dt_fb
            status = status_fb
            used_fallback = True
        pred = obj.get("tool") if obj else None
        hit = (pred == gold)
        ok += int(hit)
        times.append(total_t)
        print(f"{msg:20s} -> {pred} (gold {gold}) status={status} fallback={used_fallback} time={total_t:.2f}s {'OK' if hit else 'NG'}")
    avg_time = sum(times)/len(times) if times else 0.0
    print(f"pipeline acc={ok/len(TESTS):.2f}  n={len(TESTS)}  avg_time={avg_time:.2f}s  primary={PRIMARY_MODEL}  fallback={FALLBACK_MODEL}")

    # Full bench for reference
    for model in BENCH_MODELS:
        print(f"\n=== Model: {model} ===")
        run_model(model)

if __name__ == "__main__":
    main()
