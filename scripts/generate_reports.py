import argparse
import os
import json
import re # 正規表現のために追加
from datetime import datetime

def run_llm_consultation(user_prompt: str, model1: str, model2: str, workflow_id: str = None, prompt_file: str = None):
    """Runs the LLM consultation and returns the final summary and discussion log."""
    command = [
        "node",
        "dist/index.js",
        "--json", # Add --json argument
        "--user-prompt", user_prompt,
        model1,
        model2,
    ]
    if workflow_id:
        command.extend(["--workflow", workflow_id])
    if prompt_file:
        command.extend(["--prompt-file", prompt_file])
    print(f"Running command: {' '.join(command)}")
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        return data.get('finalOutput', ''), data.get('discussionLog', [])
    except subprocess.CalledProcessError as e:
        print(f"Error: Command '{' '.join(command)}' failed with exit code {e.returncode}")
        print(f"Stdout:\n{e.stdout}")
        print(f"Stderr:\n{e.stderr}")
        return e.stdout if e.stdout else "", []
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode JSON from stdout: {e}")
        print(f"Stdout:\n{result.stdout}")
        return result.stdout, []

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

    print("--- レポート生成を開始します ---")

    config = {}
    if os.path.exists(args.config):
        with open(args.config, 'r', encoding='utf-8') as f:
            config = json.load(f)
        print(f"Loaded config from {args.config}")
    else:
        print(f"Error: Config file not found: {args.config}. Exiting.")
        return

    # ab_test_runner.pyをsubprocessで実行し、その出力をキャプチャする
    ab_test_runner_command = ["python3", "scripts/ab_test_runner.py", "--json", "dummy_prompt"] # dummy_promptは必須引数なので適当な値を渡す
    print(f"Running A/B test command: {' '.join(ab_test_runner_command)}")
    try:
        ab_test_result = subprocess.run(ab_test_runner_command, capture_output=True, text=True, check=True)
        all_results = json.loads(ab_test_result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error: A/B test runner failed with exit code {e.returncode}")
        print(f"Stdout:\n{e.stdout}")
        print(f"Stderr:\n{e.stderr}")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Failed to parse A/B test results as JSON.")
        print(f"Stdout:\n{ab_test_result.stdout}")
        return

    report_content = "# A/Bテストレポート\n\n"
    report_content += f"生成日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    report_content += "## テスト概要\n"
    report_content += f"設定ファイル: `{args.config}`\n"
    report_content += f"プロンプト言語A/Bテスト有効: {config.get('prompt_language_test_enabled', False)}\n\n"

    for prompt_id, prompt_data in all_results.items():
        report_content += f"### プロンプト: {prompt_id}\n\n"
        
        control_group_data = prompt_data.get("control", {}).get("run_1", {}) # run_1を仮定
        dynamic_group_data = prompt_data.get("dynamic_prompt_group", {}).get("run_1", {}) # run_1を仮定

        # メトリクス抽出
        control_metrics = extract_metrics(control_group_data.get("discussionLog", []))
        dynamic_metrics = extract_metrics(dynamic_group_data.get("discussionLog", []))

        report_content += "#### 評価指標\n"
        report_content += "| 指標 | Control Group (日本語) | Dynamic Prompt Group (英語) |\n"
        report_content += "|---|---|---|
"
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