import os
import json
import re

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
MAPPING_FILE = os.path.join(RECORDS_DIR, "mapping.json")

def generate_mapping():
    print("--- マッピング情報を生成中 ---")
    mapping = {}
    for filename in os.listdir(OUTPUT_DIR):
        match = re.match(r'(scenario(\d+)_reporter[12])\.md', filename)
        if filename.endswith(".md") and match:
            file_type = ""
            if "reporter1" in filename:
                file_type = "coop"
            elif "reporter2" in filename:
                file_type = "single"
            
            scenario = match.group(2)

            mapping[filename] = {
                "type": file_type,
                "scenario": scenario
            }
    
    with open(MAPPING_FILE, "w") as f:
        json.dump(mapping, f, indent=4)
    print(f"Mapping saved to {MAPPING_FILE}")

if __name__ == "__main__":
    generate_mapping()
