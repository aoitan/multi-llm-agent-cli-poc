import subprocess
import os

def run_script(script_path):
    print(f"--- Running {script_path} ---")
    result = subprocess.run(["python3", script_path], capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(result.stderr)
    if result.returncode != 0:
        print(f"Error: {script_path} failed with exit code {result.returncode}")
        exit(result.returncode)

def run_all_evaluation_steps():
    print("--- ブラインド評価の全ステップを開始します ---")

    # 1. 前準備 (出力ディレクトリのクリーンアップと作成)
    run_script("scripts/prepare_evaluation.py")

    # 2. レポート生成
    run_script("scripts/generate_reports.py")

    # 3. マッピング生成
    run_script("scripts/generate_mapping.py")

    # 4. 評価プロンプト生成
    run_script("scripts/generate_evaluation_prompts.py")

    print("--- ブラインド評価の全ステップが完了しました ---")

if __name__ == "__main__":
    run_all_evaluation_steps()
