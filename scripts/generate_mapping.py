import os
import json
import re

OUTPUT_DIR = "doc/blind_evaluation/outputs/"
RECORDS_DIR = "doc/blind_evaluation/records/"
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
