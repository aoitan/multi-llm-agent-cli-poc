import os
import shutil
from datetime import datetime

def prepare_evaluation():
    timestamp = datetime.now().strftime("%Y%m%d%H%M")
    base_dir = os.path.join("eval/model_comparison", timestamp)
    
    OUTPUT_DIR = os.path.join(base_dir, "outputs")
    RECORDS_DIR = os.path.join(base_dir, "records")

    print("--- 出力ディレクトリをクリーンアップ中 ---")
    # If the base_dir already exists from a previous run with the same timestamp, remove it.
    if os.path.exists(base_dir):
        shutil.rmtree(base_dir)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(RECORDS_DIR, exist_ok=True)
    print(f"--- 出力ディレクトリのクリーンアップと作成が完了しました: {base_dir} ---")
    
    # Save the base_dir to a temporary file for other scripts to use
    with open("eval/model_comparison/current_run_base_dir.txt", "w") as f:
        f.write(base_dir)

if __name__ == "__main__":
    prepare_evaluation()
