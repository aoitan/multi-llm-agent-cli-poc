import argparse
import os
import json
import subprocess
from datetime import datetime
from string import Template

def logging(msg: str, is_json: bool):
    """json_onlyフラグがFalseのときだけメッセージをprintする"""
    if not is_json:
        print(msg)

def run_llm_consultation(user_prompt: str, model1: str, model2: str, workflow_id: str = None, prompt_file: str = None, prompt_language: str = None, is_json: bool = False):
    """Runs the LLM consultation and returns the final summary and discussion log."""
    command = [
        "node",
        "dist/index.js",
        "--json", # Add --json argument
        "--user-prompt", user_prompt,
        model1,
        model2,
    ]
    if workflow_id: # workflow_id があれば追加
        command.extend(["--workflow", workflow_id])
    # prompt_languageに基づいてprompt_fileを決定
    if prompt_language == "english":
        actual_prompt_file = "prompts/english_prompts.json"
    elif prompt_language == "japanese":
        actual_prompt_file = "prompts/default_prompts.json"
    else:
        actual_prompt_file = prompt_file # configで指定されたもの、またはデフォルト

    if actual_prompt_file: # 決定されたprompt_fileがあれば追加
        command.extend(["--prompt-file", actual_prompt_file])
    logging(f'Running command: {" ".join(command)}', is_json)
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True, env=os.environ)
        data = json.loads(result.stdout)
        return data.get('finalOutput', ''), data.get('discussionLog', [])
    except subprocess.CalledProcessError as e:
        print(f"Error: Command '{' '.join(command)}' failed with exit code {e.returncode}", is_json)
        print(f"Stdout:\n{e.stdout}", is_json)
        print(f"Stderr:\n{e.stderr}", is_json)
        return e.stdout if e.stdout else "", []  # Return error output and empty log
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode JSON from stdout: {e}", is_json)
        print(f"Stdout:\n{result.stdout}", is_json)
        return result.stdout, [] # Return raw stdout if JSON decoding fails

def main():
    parser = argparse.ArgumentParser(description='Run A/B test for LLM prompts.')
    parser.add_argument('user_prompt', type=str, help='The user prompt for the LLM.')
    parser.add_argument('--runs', type=int, default=1, help='Number of runs for each prompt (default: 1).')
    parser.add_argument('--config', type=str, default='config/ab_test_config.json', help='Path to the A/B test configuration file.')

    parser.add_argument('--json', action='store_true', help='Output results in JSON format.') # --json オプションを追加
    parser.add_argument('--model1', type=str, help='Model for agent 1 (e.g., llama3:8b). Overrides config.', default=None) # 追加
    parser.add_argument('--model2', type=str, help='Model for agent 2 (e.g., llama3:8b). Overrides config.', default=None) # 追加

    args = parser.parse_args()

    logging(f"Starting A/B test for prompt: \"{args.user_prompt}\"", args.json)
    logging(f"Number of runs: {args.runs}", args.json)
    logging(f"Config file: {args.config}", args.json)

    # タスク 1.4: 設定ファイルの読み込み機能の実装
    config = {}
    if os.path.exists(args.config):
        with open(args.config, 'r', encoding='utf-8') as f:
            config = json.load(f)
        logging(f"Loaded config from {args.config}", args.json)
    else:
        logging(f"Error: Config file not found: {args.config}. Using default settings.", args.json)
        # 設定ファイルが見つからない場合はエラーとするか、デフォルト設定を厳密に定義する
        # 今回はエラーとして終了する

    if not config.get("dynamic_prompt_ab_test_enabled", False):
        logging("Error: 'dynamic_prompt_ab_test_enabled' is not true in config. Exiting.", args.json)
        return

    test_groups = config.get("test_groups", [])
    if not test_groups:
        logging("Error: 'test_groups' not found or empty in config. Exiting.", args.json)
        return

    evaluation_models = config.get("evaluation_models", ["llama3:8b", "llama3:8b"])
    if args.model1: # CLIオプションが指定されていれば上書き
        evaluation_models[0] = args.model1
    if args.model2: # CLIオプションが指定されていれば上書き
        evaluation_models[1] = args.model2

    # 評価プロンプトテンプレートの読み込み (これはA/Bテストの評価用なので残す)
    evaluation_prompt_template_path = "prompts/evaluation_prompt_template.md"
    evaluation_prompt_template = ""
    if os.path.exists(evaluation_prompt_template_path):
        with open(evaluation_prompt_template_path, 'r', encoding='utf-8') as f:
            evaluation_prompt_template = f.read()
    else:
        logging(f"Error: Evaluation prompt template not found at {evaluation_prompt_template_path}", args.json)
        return

    all_results = {} # 全てのテスト結果を格納する辞書

    test_prompts = config.get("test_prompts", [])
    if not test_prompts:
        logging("Error: 'test_prompts' not found or empty in config. Exiting.", args.json)
        return

    for test_prompt_data in test_prompts:
        prompt_id = test_prompt_data.get("id")
        user_prompt = test_prompt_data.get("user_prompt")
        expected_scenario_id = test_prompt_data.get("expected_scenario_id") # 必要に応じて使用

        logging(f"\n--- Running A/B Test for Prompt: {prompt_id} ---", args.json)

        prompt_results = {} # このプロンプトのテスト結果

        for group in test_groups:
            group_id = group.get("id")
            group_type = group.get("type")
            group_results = {} # このグループのテスト結果

            logging(f"\n--- Running Test Group: {group_id} (Type: {group_type}) for Prompt {prompt_id} ---", args.json)

            for i in range(args.runs):
                logging(f"  --- Run {i+1}/{args.runs} for Group {group_id} and Prompt {prompt_id} ---", args.json)
                run_key = f"run_{i+1}"
                
                current_config_file = None
                current_workflow_id = None
                
                if group_type == "static":
                    current_config_file = group.get("prompt_file_path")
                    current_workflow_id = group.get("workflow_id")
                    if not current_config_file or not current_workflow_id:
                        logging(f"Error: Static group '{group_id}' is missing 'prompt_file_path' or 'workflow_id'. Skipping.", args.json)
                        continue
                    
                    summary, log = run_llm_consultation(
                        user_prompt, # ここで test_prompts から取得した user_prompt を使用
                        evaluation_models[0],
                        evaluation_models[1],
                        workflow_id=current_workflow_id,
                        prompt_file=current_config_file,
                        prompt_language=group.get("prompt_language"),
                        is_json=args.json
                    )
                elif group_type == "dynamic":
                    scenario_based_selection = group.get("scenario_based_workflow_selection_enabled", False)
                    
                    if not scenario_based_selection:
                        logging(f"Error: Dynamic group '{group_id}' has 'scenario_based_workflow_selection_enabled' as false. Skipping.", args.json)
                        continue
                    
                    summary, log = run_llm_consultation(
                        user_prompt, # ここで test_prompts から取得した user_prompt を使用
                        evaluation_models[0], 
                        evaluation_models[1],
                        workflow_id=None, # index.js が解決
                        prompt_language=group.get("prompt_language"),
                        is_json=args.json
                    )
                else:
                    logging(f"Error: Unknown group type '{group_type}' for group '{group_id}'. Skipping.", args.json)
                    continue

                group_results[run_key] = {
                    "finalOutput": json.dumps(summary, indent=2, ensure_ascii=False),
                    "discussionLog": log
                }
                
            prompt_results[group_id] = group_results # プロンプトIDの下にグループ結果を格納

        all_results[prompt_id] = prompt_results # 全体結果にプロンプト結果を格納

    if args.json:
        print(json.dumps(all_results, indent=2, ensure_ascii=False))
    else:
        print("A/B test completed. Results are available in 'all_results' variable if not in JSON mode.")

if __name__ == '__main__':
    main()
