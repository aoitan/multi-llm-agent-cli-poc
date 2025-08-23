import subprocess
import os
import json

CONFIG_FILE_PATH = "config/ab_test_config.json"

def load_ab_test_config():
    try:
        with open(CONFIG_FILE_PATH, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: {CONFIG_FILE_PATH} not found.")
        exit(1)
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in {CONFIG_FILE_PATH}.")
        exit(1)

AB_TEST_CONFIG = load_ab_test_config()

def get_base_dir():
    try:
        with open("eval/model_comparison/current_run_base_dir.txt", "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        print("Error: current_run_base_dir.txt not found. Run prepare_evaluation.py first.")
        exit(1)

BASE_DIR = get_base_dir()
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
RECORDS_DIR = os.path.join(BASE_DIR, "records")



def calculate_metrics(response: str, user_prompt: str) -> dict:
    metrics = {}
    # 応答の長さ
    metrics["response_length"] = len(response.strip())

    # 特定のキーワードの出現率 (例: user_prompt内の単語をキーワードとする)
    user_prompt_words = set(word.lower() for word in user_prompt.split() if len(word) > 2) # 短い単語は除外
    found_keywords = 0
    for word in user_prompt_words:
        if word in response.lower():
            found_keywords += 1
    metrics["keyword_match_rate"] = (found_keywords / len(user_prompt_words)) if user_prompt_words else 0

    # 他の評価指標もここに追加可能
    return metrics

def generate_reports():
    print("--- レポート生成を開始します ---")

    if not AB_TEST_CONFIG.get("dynamic_prompt_ab_test_enabled", False):
        print("Dynamic prompt A/B test is not enabled in ab_test_config.json. Exiting.")
        return

    # A/Bテストを実行するコマンドを構築
    # ab_test_runner.py は、テストグループ、ユーザープロンプト、モデルなどを引数に取る
    # ここでは、簡単な例として、ab_test_runner.py を直接呼び出す
    # 実際には、ab_test_runner.py がテスト結果をファイルに出力するように変更する必要がある
    
    # 仮のコマンド。ab_test_runner.py がJSONを標準出力に出すと仮定
    ab_test_cmd = ["python", "scripts/ab_test_runner.py", "--json"] 
    
    print(f"Running A/B test command: ", " ".join(ab_test_cmd))
    process = subprocess.Popen(ab_test_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    stdout, stderr = process.communicate()

    if process.returncode != 0:
        print(f"A/B test command failed with exit code {process.returncode}")
        print("Stderr:", stderr)
        return

    try:
        ab_test_results = json.loads(stdout)
    except json.JSONDecodeError:
        print("Error: Failed to parse A/B test results as JSON.")
        print("Stdout:", stdout)
        return

    # ここからab_test_resultsを解析してレポートを生成するロジック
    print("\n--- A/B Test Results Summary ---")
    for group_id, group_data in ab_test_results.items():
        print(f"\nGroup: {group_id}")
        for prompt_id, prompt_results in group_data.items():
            print(f"  Prompt: {prompt_id}")
            for run_id, run_data in prompt_results.items():
                print(f"    Run {run_id}:")
                final_output = run_data.get('finalOutput', '')
                print(f"      Final Output: {final_output}")
                
                # 評価指標の計算
                metrics = calculate_metrics(final_output, user_prompt) # user_prompt を渡す
                for metric_name, metric_value in metrics.items():
                    print(f"      {metric_name.replace('_', ' ').title()}: {metric_value}")
    
    print("\n--- レポート生成が完了しました ---")

if __name__ == "__main__":
    generate_reports()
