import os
import shutil

OUTPUT_DIR = "eval/model_comparison/outputs/"
RECORDS_DIR = "eval/model_comparison/records/"

def prepare_evaluation():
    print("--- 出力ディレクトリをクリーンアップ中 ---")
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    if os.path.exists(RECORDS_DIR):
        shutil.rmtree(RECORDS_DIR)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(RECORDS_DIR, exist_ok=True)
    print("--- 出力ディレクトリのクリーンアップと作成が完了しました ---")

if __name__ == "__main__":
    prepare_evaluation()
