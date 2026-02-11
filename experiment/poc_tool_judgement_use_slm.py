# poc_tool_judgement_use_slm.py
import argparse
import json
import os
import subprocess
import time
from collections import Counter
from typing import Optional

PRIMARY_MODEL = "gemma3:4b"
SECONDARY_MODEL = "llama3.2:3b"
FALLBACK_MODEL = "qwen3:8b"

BENCH_MODELS = [
    "qwen2.5-coder:1.5b-base",
    "gemma3:1b",
    "gemma3:4b",
    "llama3.2:3b",
    "phi3:3.8b",
    "llama3.1:8b",
    "qwen3:8b",
]

FALLBACK_STATUSES = {"bad_tool", "rule_mismatch", "empty_query", "parse_error", "unexpected_output"}
NO_QUERY_TOOLS = {"none"}
HIGH_RISK_TOOLS = {"file_write", "mcp_read_resource"}
OLLAMA_HOST = ""

TOOL_DESCRIPTIONS = {
    "web_search": "Use for web/news/weather/stock/time-sensitive lookup.",
    "calculator": "Use for arithmetic, formulas, unit conversion.",
    "file_list": "Use for listing files/folders in a workspace.",
    "file_read": "Use for reading text/code files.",
    "file_search": "Use for searching text patterns in files.",
    "file_write": "Use for creating/updating file contents.",
    "mcp_list_resources": "Use for listing MCP resources/templates.",
    "mcp_read_resource": "Use for reading one MCP resource URI.",
    "none": "Use for chat, greeting, creative writing, subjective talk.",
}

TOOL_SYNONYMS = {
    "web_search": ["search", "web", "browse", "internet", "google", "news", "weather", "stock"],
    "calculator": ["calc", "math", "compute", "arithmetic", "conversion", "convert"],
    "file_list": ["list_files", "ls", "dir", "file_list", "list_directory"],
    "file_read": ["read_file", "cat", "open_file", "view_file"],
    "file_search": ["grep", "ripgrep", "rg", "find_in_files", "search_file"],
    "file_write": ["write_file", "edit_file", "create_file", "update_file"],
    "mcp_list_resources": ["mcp_list", "list_resources", "list_mcp_resources"],
    "mcp_read_resource": ["mcp_read", "read_resource", "read_mcp_resource"],
    "none": ["none", "no_tool", "chat", "smalltalk"],
}

EXPERIMENTS = {
    "basic": {
        "tools": ["web_search", "calculator", "none"],
        "tests": [
            ("17*42", "calculator"),
            ("sqrt(144)は？", "calculator"),
            ("天気 東京", "web_search"),
            ("NVIDIAの時価総額", "web_search"),
            ("ジョーク言って", "none"),
            ("今日の気分は？", "none"),
        ],
        "rules": [
            (("17*42", "sqrt", "計算", "乗"), "calculator"),
            (("天気", "時価総額", "ニュース", "リリースノート"), "web_search"),
            (("ジョーク", "雑談", "こんにちは", "気分"), "none"),
        ],
    },
    "file_mcp": {
        "tools": [
            "file_list",
            "file_read",
            "file_search",
            "file_write",
            "mcp_list_resources",
            "mcp_read_resource",
            "web_search",
            "calculator",
            "none",
        ],
        "tests": [
            ("このリポジトリのsrc配下のファイル一覧を見せて", "file_list"),
            ("workspace直下のディレクトリを列挙して", "file_list"),
            ("docフォルダの中身を見たい", "file_list"),
            ("scripts以下のファイル一覧を表示", "file_list"),
            ("README.mdの先頭20行を読んで", "file_read"),
            ("pyproject.tomlを開いて内容を確認して", "file_read"),
            (".github/workflows/ci.ymlを読んで", "file_read"),
            ("experiment/poc_tool_judgement_use_slm.pyの先頭を見せて", "file_read"),
            ("全ファイルからTODOを検索して", "file_search"),
            ("リポジトリ内で'fallback'文字列を検索して", "file_search"),
            ("rgで'PRIMARY_MODEL'を探して", "file_search"),
            ("ci.yml内で'upload-sarif'を見つけて", "file_search"),
            ("doc/notes.mdに実験メモを追記して", "file_write"),
            ("tmp_test.txtを新規作成してhelloを書いて", "file_write"),
            ("READMEの末尾に1行追加して", "file_write"),
            ("設定ファイルを更新して値を変更して", "file_write"),
            ("MCPで使えるresource一覧を出して", "mcp_list_resources"),
            ("MCPのresource templatesを確認したい", "mcp_list_resources"),
            ("serenaサーバーで参照可能なresourcesを列挙して", "mcp_list_resources"),
            ("MCPで何が読めるか一覧を見せて", "mcp_list_resources"),
            ("MCP resource URIを指定するので中身を読んで", "mcp_read_resource"),
            ("このURIのMCP resourceを取得して", "mcp_read_resource"),
            ("read_mcp_resourceで内容を表示して", "mcp_read_resource"),
            ("MCPの特定resourceを開いて内容確認して", "mcp_read_resource"),
            ("東京の今日の天気を調べて", "web_search"),
            ("最新のNode.jsリリース情報を検索して", "web_search"),
            ("OpenAI APIの最新ドキュメント変更を調べて", "web_search"),
            ("Apple株価を調べて", "web_search"),
            ("12345*6789を計算して", "calculator"),
            ("2の20乗を計算", "calculator"),
            ("(128+512)/4を解いて", "calculator"),
            ("1 mileをkmに換算して", "calculator"),
            ("雑談しよう", "none"),
            ("こんにちは", "none"),
            ("おはよう、元気？", "none"),
            ("短いジョークを作って", "none"),
            ("このアイデアどう思う？", "none"),
            ("今日の気分を聞かせて", "none"),
        ],
        "rules": [
            (("一覧", "list", "配下", "ディレクトリ"), "file_list"),
            (("読んで", "先頭", "内容", "open"), "file_read"),
            (("検索", "grep", "rg", "find"), "file_search"),
            (("追記", "書いて", "作成", "更新"), "file_write"),
            (("mcp", "resource一覧", "resources"), "mcp_list_resources"),
            (("uri", "resource uri", "read resource"), "mcp_read_resource"),
            (("天気", "ニュース", "株価"), "web_search"),
            (("計算", "*", "/", "+", "-"), "calculator"),
            (("雑談", "こんにちは"), "none"),
        ],
    },
}


def percentile(values: list[float], ratio: float) -> float:
    if not values:
        return 0.0
    sorted_values = sorted(values)
    index = int((len(sorted_values) - 1) * ratio)
    return sorted_values[index]


def summarize_records(records: list[dict], tools: list[str], title: str):
    total = len(records)
    if total == 0:
        print(f"{title} no records")
        return

    ok = sum(1 for record in records if record["hit"])
    times = [record["time"] for record in records]
    confs = [record["confidence"] for record in records if record["confidence"] is not None]
    status_counter = Counter(record["status"] for record in records)
    confusion_counter = Counter((record["gold"], record["pred"]) for record in records if not record["hit"])

    print(
        f"{title} acc={ok/total:.2f} n={total} avg_conf={(sum(confs)/len(confs) if confs else 0.0):.2f} "
        f"avg_time={sum(times)/len(times):.2f}s p50={percentile(times, 0.50):.2f}s p95={percentile(times, 0.95):.2f}s"
    )
    print("status_counts: " + ", ".join(f"{k}={v}" for k, v in sorted(status_counter.items())))

    print("per_tool_metrics:")
    for tool in tools:
        tp = sum(1 for record in records if record["gold"] == tool and record["pred"] == tool)
        fp = sum(1 for record in records if record["gold"] != tool and record["pred"] == tool)
        fn = sum(1 for record in records if record["gold"] == tool and record["pred"] != tool)
        support = sum(1 for record in records if record["gold"] == tool)
        precision = tp / (tp + fp) if (tp + fp) else 0.0
        recall = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
        print(
            f"- {tool}: precision={precision:.2f} recall={recall:.2f} "
            f"f1={f1:.2f} support={support}"
        )

    if confusion_counter:
        print("top_confusions:")
        for (gold, pred), count in confusion_counter.most_common(5):
            print(f"- {gold} -> {pred}: {count}")
    else:
        print("top_confusions: none")


def compute_summary(records: list[dict], tools: list[str]) -> dict:
    total = len(records)
    ok = sum(1 for record in records if record["hit"])
    times = [record["time"] for record in records]
    confs = [record["confidence"] for record in records if record["confidence"] is not None]
    status_counter = Counter(record["status"] for record in records)
    return {
        "acc": (ok / total) if total else 0.0,
        "n": total,
        "avg_conf": (sum(confs) / len(confs)) if confs else 0.0,
        "avg_time": (sum(times) / len(times)) if times else 0.0,
        "p95_time": percentile(times, 0.95) if times else 0.0,
        "status_counts": status_counter,
    }


def build_prompt(message: str, tools: list[str]) -> str:
    rules = [f"- {tool}: {TOOL_DESCRIPTIONS[tool]}" for tool in tools]
    tool_enum = "|".join(tools)
    return (
        "You are a strict tool router. Decide one best tool.\n"
        "Available tools:\n"
        + "\n".join(rules)
        + "\nOutput exactly this JSON (no lists, no extra fields):\n"
        + '{{"tool":"<'
        + tool_enum
        + '>","query":"<string or empty>","confidence":"<0.0-1.0 float>"}}\n\n'
        + f"User: {message}\nJSON:"
    )


def expected_tool_from_rules(message: str, rules: list[tuple[tuple[str, ...], str]]) -> Optional[str]:
    lower_message = message.lower()
    for keywords, tool in rules:
        if any(keyword.lower() in lower_message for keyword in keywords):
            return tool
    return None


def canonicalize_tool(tool_value: str, allowed_tools: list[str]) -> Optional[str]:
    raw = tool_value.strip().lower().replace("<", "").replace(">", "").replace("-", "_").replace(" ", "_")
    if raw in allowed_tools:
        return raw
    for allowed in allowed_tools:
        if allowed in raw:
            return allowed
    for canonical, keywords in TOOL_SYNONYMS.items():
        if canonical not in allowed_tools:
            continue
        if raw == canonical or any(keyword in raw for keyword in keywords):
            return canonical
    return None


def classify(model: str, message: str, tools: list[str], rules: list[tuple[tuple[str, ...], str]]):
    t0 = time.time()
    prompt = build_prompt(message, tools)
    try:
        env = os.environ.copy()
        if OLLAMA_HOST:
            env["OLLAMA_HOST"] = OLLAMA_HOST
        out = subprocess.run(
            ["ollama", "run", model, prompt, "--format", "json"],
            check=True,
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )
    except subprocess.CalledProcessError as e:
        detail = e.stderr.strip() if e.stderr else str(e)
        return None, time.time() - t0, f"ollama_error: {detail}"

    dt = time.time() - t0
    try:
        obj = json.loads(out.stdout.strip())
    except Exception as e:
        return None, dt, f"parse_error: {e}"

    if isinstance(obj, list):
        obj = {"tool": obj[0], "query": "", "confidence": None}
    elif isinstance(obj, dict):
        if isinstance(obj.get("tool"), list):
            tool_value = obj["tool"][0] if obj["tool"] else None
        else:
            tool_value = obj.get("tool")
        obj = {"tool": tool_value, "query": obj.get("query", ""), "confidence": obj.get("confidence")}
    else:
        return None, dt, "unexpected_output"

    tool_value = str(obj.get("tool", ""))
    canonical_tool = canonicalize_tool(tool_value, tools)
    if canonical_tool is None:
        return obj, dt, "bad_tool"
    obj["tool"] = canonical_tool

    conf = obj.get("confidence")
    try:
        obj["confidence"] = max(0.0, min(1.0, float(conf))) if conf not in (None, "") else None
    except Exception:
        obj["confidence"] = None

    query = (obj.get("query") or "").strip()
    expected = expected_tool_from_rules(message, rules)
    if expected and obj["tool"] != expected:
        return obj, dt, "rule_mismatch"
    if obj["tool"] not in NO_QUERY_TOOLS and len(query) == 0:
        return obj, dt, "empty_query"
    return obj, dt, "ok"


def run_single_model(model: str, suite_name: str, suite: dict, verbose: bool = True) -> dict:
    tools = suite["tools"]
    rules = suite["rules"]
    tests = suite["tests"]
    records = []
    if verbose:
        print(f"\n=== Suite: {suite_name} / Model: {model} ===")
    for message, gold in tests:
        obj, dt, status = classify(model, message, tools, rules)
        pred = obj.get("tool") if obj else None
        conf = obj.get("confidence") if obj else None
        hit = pred == gold
        conf_str = f"{float(conf):.2f}" if conf is not None else "-"
        if verbose:
            print(f"{message:26s} -> {pred} (gold {gold}) conf={conf_str} {dt:.2f}s {status} {'OK' if hit else 'NG'}")
        records.append(
            {
                "message": message,
                "gold": gold,
                "pred": pred,
                "confidence": conf,
                "status": status,
                "time": dt,
                "hit": hit,
            }
        )
    if verbose:
        summarize_records(records, tools, "single_model")
    return compute_summary(records, tools)


def run_pipeline(suite_name: str, suite: dict, verbose: bool = True) -> dict:
    tools = suite["tools"]
    rules = suite["rules"]
    tests = suite["tests"]
    secondary_count = 0
    fallback_count = 0
    records = []
    if verbose:
        print(
            f"\n=== Suite: {suite_name} / Pipeline: "
            f"{PRIMARY_MODEL} -> {SECONDARY_MODEL} -> {FALLBACK_MODEL} ==="
        )
    for message, gold in tests:
        obj_primary, dt_primary, status_primary = classify(PRIMARY_MODEL, message, tools, rules)
        total_t = dt_primary
        obj = obj_primary
        status = status_primary

        used_secondary = False
        used_fallback = False

        need_secondary = status_primary in FALLBACK_STATUSES
        obj_secondary = None
        status_secondary = None
        if need_secondary:
            obj_secondary, dt_secondary, status_secondary = classify(SECONDARY_MODEL, message, tools, rules)
            total_t += dt_secondary
            obj = obj_secondary
            status = status_secondary
            used_secondary = True
            secondary_count += 1

        need_fallback = False
        if used_secondary:
            primary_pred = obj_primary.get("tool") if obj_primary else None
            secondary_pred = obj_secondary.get("tool") if obj_secondary else None
            if status_secondary in FALLBACK_STATUSES:
                need_fallback = True
            elif primary_pred != secondary_pred:
                need_fallback = True
            elif secondary_pred in HIGH_RISK_TOOLS and status_secondary != "ok":
                need_fallback = True
        elif (obj_primary and obj_primary.get("tool") in HIGH_RISK_TOOLS and status_primary != "ok"):
            need_fallback = True

        if need_fallback:
            obj_fb, dt_fb, status_fb = classify(FALLBACK_MODEL, message, tools, rules)
            total_t += dt_fb
            obj = obj_fb
            status = status_fb
            used_fallback = True
            fallback_count += 1

        pred = obj.get("tool") if obj else None
        hit = pred == gold
        conf = obj.get("confidence") if obj else None
        if verbose:
            print(
                f"{message:26s} -> {pred} (gold {gold}) "
                f"status={status} secondary={used_secondary} "
                f"fallback={used_fallback} time={total_t:.2f}s {'OK' if hit else 'NG'}"
            )
        records.append(
            {
                "message": message,
                "gold": gold,
                "pred": pred,
                "confidence": conf,
                "status": status,
                "time": total_t,
                "hit": hit,
                "secondary": used_secondary,
                "fallback": used_fallback,
            }
        )
    if verbose:
        summarize_records(records, tools, "pipeline")
        print(f"secondary_count={secondary_count}/{len(tests)} rate={secondary_count/len(tests):.2f}")
        print(f"fallback_count={fallback_count}/{len(tests)} rate={fallback_count/len(tests):.2f}")
    summary = compute_summary(records, tools)
    summary["secondary_rate"] = (secondary_count / len(tests)) if tests else 0.0
    summary["fallback_rate"] = (fallback_count / len(tests)) if tests else 0.0
    return summary


def main():
    global OLLAMA_HOST
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--suite",
        default="basic,file_mcp",
        help="Comma-separated suite names. available: basic,file_mcp",
    )
    parser.add_argument(
        "--bench",
        action="store_true",
        help="Run all benchmark models in addition to pipeline.",
    )
    parser.add_argument(
        "--model",
        default="",
        help="Single model to evaluate repeatedly (example: gemma3:4b).",
    )
    parser.add_argument(
        "--repeat",
        type=int,
        default=1,
        help="Number of repeated runs when --model is set.",
    )
    parser.add_argument(
        "--no-pipeline",
        action="store_true",
        help="Skip pipeline run.",
    )
    parser.add_argument(
        "--ollama-host",
        default="",
        help="Override OLLAMA_HOST (example: http://192.168.10.116:7862).",
    )
    args = parser.parse_args()
    OLLAMA_HOST = args.ollama_host.strip()

    selected = [name.strip() for name in args.suite.split(",") if name.strip()]
    for suite_name in selected:
        if suite_name not in EXPERIMENTS:
            print(f"skip unknown suite: {suite_name}")
            continue
        suite = EXPERIMENTS[suite_name]
        if not args.no_pipeline:
            run_pipeline(suite_name, suite)
        if args.model:
            repeats = max(1, args.repeat)
            print(f"\n=== Suite: {suite_name} / Repeat Model: {args.model} x{repeats} ===")
            run_summaries = []
            for i in range(repeats):
                summary = run_single_model(args.model, suite_name, suite, verbose=False)
                run_summaries.append(summary)
                print(
                    f"run={i+1:02d} acc={summary['acc']:.2f} avg_time={summary['avg_time']:.2f}s "
                    f"p95={summary['p95_time']:.2f}s"
                )
            avg_acc = sum(s["acc"] for s in run_summaries) / repeats
            min_acc = min(s["acc"] for s in run_summaries)
            avg_time = sum(s["avg_time"] for s in run_summaries) / repeats
            avg_p95 = sum(s["p95_time"] for s in run_summaries) / repeats
            print(
                f"repeat_summary model={args.model} suite={suite_name} repeat={repeats} "
                f"avg_acc={avg_acc:.3f} min_acc={min_acc:.3f} avg_time={avg_time:.2f}s avg_p95={avg_p95:.2f}s"
            )
        if args.bench and not args.model:
            for model in BENCH_MODELS:
                run_single_model(model, suite_name, suite)


if __name__ == "__main__":
    main()
