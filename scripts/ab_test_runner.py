import argparse
import os
import json
import subprocess
from datetime import datetime

def run_llm_consultation(user_prompt: str, model1: str, model2: str, prompt_file_path: str):
    """Runs the LLM consultation and returns the final summary and discussion log."""
    command = [
        "node",
        "dist/index.js", # Assuming dist/index.js is the entry point for conductConsultation
        user_prompt,
        model1,
        model2,
        "--config", prompt_file_path # Pass the prompt file path as a config
    ]
    print(f"Running command: {" ".join(command)}")
    result = subprocess.run(command, capture_output=True, text=True, check=True)
    # The output from index.js will contain console.logs and then the final JSON output
    # We need to parse the JSON output from the end of the stdout
    output_lines = result.stdout.strip().split('\n')
    # Try to extract the last valid JSON object from the output (supporting multi-line JSON)
    def extract_last_json(lines):
        # Scan from the end, accumulate lines that could form a JSON object
        for start in range(len(lines)):
            candidate = '\n'.join(lines[start:])
            try:
                data = json.loads(candidate)
                return data
            except json.JSONDecodeError:
                continue
        return None

    data = extract_last_json(output_lines)
    if data is not None:
        return data.get('finalSummary', ''), data.get('discussionLog', [])
    else:
        print("Warning: No valid JSON output found in stdout.")
        return result.stdout, [] # Return raw stdout if no JSON is found

def main():
    parser = argparse.ArgumentParser(description='Run A/B test for LLM prompts.')
    parser.add_argument('user_prompt', type=str, help='The user prompt for the LLM.')
    parser.add_argument('--runs', type=int, default=1, help='Number of runs for each prompt (default: 1).')
    parser.add_argument('--config', type=str, default='config/ab_test_config.json', help='Path to the A/B test configuration file.')

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

    base_prompt_file = "prompts/default_prompts.json"
    experimental_prompt_file = config.get("experimental_prompt_file_path")

    if not experimental_prompt_file:
        print("Error: 'experimental_prompt_file_path' not found in config. Please specify it.")
        return

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    output_dir = os.path.join("eval", "prompt_comparison", timestamp)
    os.makedirs(output_dir, exist_ok=True)

    # メタデータの保存
    metadata = {
        "user_prompt": args.user_prompt,
        "runs": args.runs,
        "config_file": args.config,
        "base_prompt_file": base_prompt_file,
        "experimental_prompt_file": experimental_prompt_file,
        "timestamp": timestamp
    }
    with open(os.path.join(output_dir, "metadata.json"), 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    for i in range(args.runs):
        print(f"\n--- Run {i+1}/{args.runs} ---")

        # Base Prompt 実行
        print("Running with Base Prompt...")
        base_summary, base_log = run_llm_consultation(args.user_prompt, "llama3:8b", "llama3:8b", base_prompt_file)
        with open(os.path.join(output_dir, f"base_output_{i+1}.md"), 'w', encoding='utf-8') as f:
            f.write(base_summary)
        with open(os.path.join(output_dir, f"base_log_{i+1}.json"), 'w', encoding='utf-8') as f:
            json.dump(base_log, f, indent=2, ensure_ascii=False)

        # Experimental Prompt 実行
        print("Running with Experimental Prompt...")
        exp_summary, exp_log = run_llm_consultation(args.user_prompt, "llama3:8b", "llama3:8b", experimental_prompt_file)
        with open(os.path.join(output_dir, f"exp_output_{i+1}.md"), 'w', encoding='utf-8') as f:
            f.write(exp_summary)
        with open(os.path.join(output_dir, f"exp_log_{i+1}.json"), 'w', encoding='utf-8') as f:
            json.dump(exp_log, f, indent=2, ensure_ascii=False)

    print("\nA/B test completed.")

if __name__ == '__main__':
    main()