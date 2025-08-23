import argparse
import os
import json
import subprocess
from datetime import datetime
from string import Template

def run_llm_consultation(user_prompt: str, model1: str, model2: str, config_file_path: str = None, workflow_id: str = None):
    """Runs the LLM consultation and returns the final summary and discussion log."""
    command = [
        "node",
        "dist/index.js",
        "--json", # Add --json argument
        "--user-prompt", user_prompt,
        model1,
        model2,
    ]
    if config_file_path:
        command.extend(["--config", config_file_path])
    if workflow_id: # workflow_id があれば追加
        command.extend(["--workflow", workflow_id])
    print(f"Running command: {' '.join(command)}")
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        return data.get('finalOutput', ''), data.get('discussionLog', [])
    except subprocess.CalledProcessError as e:
        print(f"Error: Command '{' '.join(command)}' failed with exit code {e.returncode}")
        print(f"Stdout:\n{e.stdout}")
        print(f"Stderr:\n{e.stderr}")
        return e.stdout if e.stdout else "", []  # Return error output and empty log
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode JSON from stdout: {e}")
        print(f"Stdout:\n{result.stdout}")
        return result.stdout, [] # Return raw stdout if JSON decoding fails

def main():
    parser = argparse.ArgumentParser(description='Run A/B test for LLM prompts.')
    parser.add_argument('user_prompt', type=str, help='The user prompt for the LLM.')
    parser.add_argument('--runs', type=int, default=1, help='Number of runs for each prompt (default: 1).')
    parser.add_argument('--config', type=str, default='config/ab_test_config.json', help='Path to the A/B test configuration file.')

    parser.add_argument('--json', action='store_true', help='Output results in JSON format.') # --json オプションを追加

    args = parser.parse_args()

    print(f"Starting A/B test for prompt: \"{args.user_prompt}\"")
    print(f"Number of runs: {args.runs}")
    print(f"Config file: {args.config}")

    # タスク 1.4: 設定ファイルの読み込み機能の実装
    config = {}
    if os.path.exists(args.config):
        with open(args.config, 'r', encoding='utf-8') as f:
            config = json.load(f)
        print(f"Loaded config from {args.config}")
    else:
        print(f"Config file not found: {args.config}. Using default settings.")
        # 設定ファイルが見つからない場合はエラーとするか、デフォルト設定を厳密に定義する
        # 今回はエラーとして終了する

    if not config.get("dynamic_prompt_ab_test_enabled", False):
        print("Error: 'dynamic_prompt_ab_test_enabled' is not true in config. Exiting.")
        return

    test_groups = config.get("test_groups", [])
    if not test_groups:
        print("Error: 'test_groups' not found or empty in config. Exiting.")
        return

    evaluation_models = config.get("evaluation_models", ["llama3:8b", "llama3:8b"])

    # 評価プロンプトテンプレートの読み込み (これはA/Bテストの評価用なので残す)
    evaluation_prompt_template_path = "prompts/evaluation_prompt_template.md"
    evaluation_prompt_template = ""
    if os.path.exists(evaluation_prompt_template_path):
        with open(evaluation_prompt_template_path, 'r', encoding='utf-8') as f:
            evaluation_prompt_template = f.read()
    else:
        print(f"Error: Evaluation prompt template not found at {evaluation_prompt_template_path}")
        return

    all_results = {} # 全てのテスト結果を格納する辞書

    for group in test_groups:
        group_id = group.get("id")
        group_type = group.get("type")
        group_results = {} # このグループのテスト結果

        print(f"\n--- Running Test Group: {group_id} (Type: {group_type}) ---")

        for i in range(args.runs):
            print(f"  --- Run {i+1}/{args.runs} for Group {group_id} ---")
            run_key = f"run_{i+1}"
            
            current_config_file = None
            current_workflow_id = None
            
            if group_type == "static":
                current_config_file = group.get("prompt_file_path")
                current_workflow_id = group.get("workflow_id")
                if not current_config_file or not current_workflow_id:
                    print(f"Error: Static group '{group_id}' is missing 'prompt_file_path' or 'workflow_id'. Skipping.")
                    continue
                
                summary, log = run_llm_consultation(
                    args.user_prompt, 
                    evaluation_models[0], 
                    evaluation_models[1], 
                    config_file_path=current_config_file,
                    workflow_id=current_workflow_id # run_llm_consultation に workflow_id を渡すように変更が必要
                )
            elif group_type == "dynamic":
                scenario_based_selection = group.get("scenario_based_workflow_selection_enabled", False)
                default_scenario_id = group.get("default_scenario_id")
                
                if not scenario_based_selection:
                    print(f"Error: Dynamic group '{group_id}' has 'scenario_based_workflow_selection_enabled' as false. Skipping.")
                    continue
                
                # dynamic の場合は、index.js がシナリオに基づいてプロンプトとワークフローを解決するので、
                # config_file_path は不要、workflow_id も index.js に任せる
                summary, log = run_llm_consultation(
                    args.user_prompt, 
                    evaluation_models[0], 
                    evaluation_models[1],
                    config_file_path=None, # index.js が解決
                    workflow_id=None # index.js が解決
                )
            else:
                print(f"Error: Unknown group type '{group_type}' for group '{group_id}'. Skipping.")
                continue

            group_results[run_key] = {
                "finalOutput": summary,
                "discussionLog": log
            }
            
            # 評価LLMによる評価実行 (これは各グループの実行結果に対して行う)
            # ここでは簡略化のため、評価LLMの実行は省略。必要に応じて追加する。
            # 評価LLMは generate_reports.py で行うのが適切かもしれない。

        all_results[group_id] = group_results

    if args.json:
        print(json.dumps(all_results, indent=2, ensure_ascii=False))
    else:
        print("\nA/B test completed. Results are available in 'all_results' variable if not in JSON mode.")

if __name__ == '__main__':
    main()
