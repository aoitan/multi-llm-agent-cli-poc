import argparse
import os
import json
import re # 正規表現のために追加
from datetime import datetime
import subprocess

def logging(msg: str, is_json: bool):
    """json_onlyフラグがFalseのときだけメッセージをprintする"""
    if not is_json:
        print(msg)


def emit_error(message: str, is_json: bool) -> None:
    """Emit an error message respecting the --json flag."""
    if is_json:
        print(json.dumps({"error": {"message": message}}, ensure_ascii=False))
    else:
        logging(message, is_json)

def extract_metrics(discussion_log: list) -> dict:
    """
    discussionLogから応答の長さとLLMの応答速度を抽出する。
    """
    total_response_length = 0
    total_response_time_ms = 0
    num_llm_calls = 0

    for entry in discussion_log:
        if "response_received" in entry:
            total_response_length += len(entry["response_received"])
        
        # LLMの応答速度を抽出
        # 例: "Ollama API call to llama3:8b took 16103.49 ms"
        match = re.search(r"Ollama API call to llama3:8b took (\d+\.\d+) ms", entry.get("response_received", ""))
        if match:
            total_response_time_ms += float(match.group(1))
            num_llm_calls += 1
    
    avg_response_time_ms = total_response_time_ms / num_llm_calls if num_llm_calls > 0 else 0
    
    return {
        "total_response_length": total_response_length,
        "avg_response_time_ms": avg_response_time_ms,
        "num_llm_calls": num_llm_calls
    }

def main():
    parser = argparse.ArgumentParser(description='Generate A/B test reports for LLM prompts.')
    parser.add_argument('--json', action='store_true', help='Output results in JSON format.')
    parser.add_argument('--config', type=str, default='config/ab_test_config.json', help='Path to the A/B test configuration file.')
    args = parser.parse_args()

    logging("--- レポート生成を開始します ---", args.json)

    config = {}
    if os.path.exists(args.config):
        with open(args.config, 'r', encoding='utf-8') as f:
            config = json.load(f)
        logging(f"Loaded config from {args.config}", args.json)
    else:
        logging(f"Error: Config file not found: {args.config}. Exiting.", args.json)
        return

    test_prompts = config.get("test_prompts", [])
    if not isinstance(test_prompts, list) or not test_prompts:
        emit_error("Error: 'test_prompts' not found or empty in config. Exiting.", args.json)
        return

    first_prompt = test_prompts[0]
    if not isinstance(first_prompt, dict):
        emit_error("Error: The first entry in 'test_prompts' must be an object with prompt metadata.", args.json)
        return

    if (
        "user_prompt" not in first_prompt
        or not isinstance(first_prompt["user_prompt"], str)
        or not first_prompt["user_prompt"].strip()
    ):
        emit_error("Error: The first entry in 'test_prompts' must include a non-empty user_prompt.", args.json)
        return
    user_prompt = first_prompt["user_prompt"]

    # ab_test_runner.pyをsubprocessで実行し、その出力をキャプチャする
    evaluation_models = config.get("evaluation_models", ["llama3:8b", "llama3:8b"])
    ab_test_runner_command = [
        "python3",
        "scripts/ab_test_runner.py",
        "--json",
        user_prompt,
        "--config", args.config, # --config オプション
        "--model1", evaluation_models[0], # --model1 オプションを追加
        "--model2", evaluation_models[1]  # --model2 オプションを追加
    ]
    logging(f'''Running A/B test command: {" ".join(ab_test_runner_command)}''', args.json)
    try:
        ab_test_result = subprocess.run(ab_test_runner_command, capture_output=True, text=True, check=True, env=os.environ)
        all_results = json.loads(ab_test_result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error: A/B test runner failed with exit code {e.returncode}", args.json)
        print(f"Stdout:\n{e.stdout}", args.json)
        print(f"Stderr:\n{e.stderr}", args.json)
        return
    except json.JSONDecodeError as e:
        print(f"Error: Failed to parse A/B test results as JSON.", args.json)
        print(f"Stdout:\n{ab_test_result.stdout}", args.json)
        return

    report_content = "# A/Bテストレポート\n\n"
    report_content += f"生成日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    report_content += "## テスト概要\n"
    report_content += f"設定ファイル: `{args.config}`\n"
    report_content += f"プロンプト言語A/Bテスト有効: {config.get('prompt_language_test_enabled', False)}\n\n"

    for prompt_id, prompt_data in all_results.items():
        report_content += f"### プロンプト: {prompt_id}\n\n"
        
        control_group_data = prompt_data.get("control", {}).get("run_1", {})
        dynamic_group_data = prompt_data.get("dynamic_prompt_group", {}).get("run_1", {})

        # メトリクス抽出
        control_metrics = extract_metrics(control_group_data.get("discussionLog", []))
        dynamic_metrics = extract_metrics(dynamic_group_data.get("discussionLog", []))

        report_content += "#### 評価指標\n"
        report_content += "| 指標 | Control Group (日本語) | Dynamic Prompt Group (英語) |\n"
        report_content += "|---|---|---|\n"
        report_content += f"| 総応答文字数 | {control_metrics['total_response_length']} | {dynamic_metrics['total_response_length']} |\n"
        report_content += f"| 平均応答時間 (ms) | {control_metrics['avg_response_time_ms']:.2f} | {dynamic_metrics['avg_response_time_ms']:.2f} |\n"
        report_content += f"| LLM呼び出し回数 | {control_metrics['num_llm_calls']} | {dynamic_metrics['num_llm_calls']} |\n\n"

        report_content += "#### LLM応答比較\n"
        report_content += "##### Control Group (日本語)\n"
        report_content += "```\n"
        report_content += control_group_data.get("finalOutput", "N/A") + "\n"
        report_content += "```\n\n"

        report_content += "##### Dynamic Prompt Group (英語)\n"
        report_content += "```\n"
        report_content += dynamic_group_data.get("finalOutput", "N/A") + "\n"
        report_content += "```\n\n"

    if args.json:
        # JSON出力モードの場合は、レポート内容もJSONの一部として含める
        json_output = {
            "report_metadata": {
                "generated_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "config_file": args.config,
                "prompt_language_test_enabled": config.get('prompt_language_test_enabled', False)
            },
            "test_results": all_results,
            "report_content_markdown": report_content # Markdown形式のレポート内容
        }
        print(json.dumps(json_output, indent=2, ensure_ascii=False))
    else:
        print(report_content)

if __name__ == '__main__':
    main()
