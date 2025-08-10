import subprocess
import os
from prompts_config import SCENARIOS

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

def run_command(cmd, output_file, discussion_log_file=None):
    print(f"Running command: {' '.join(cmd)}")
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    
    final_summary_lines = []
    discussion_log_lines = []
    
    capturing_final_summary = False
    capturing_discussion_log = False

    for line in process.stdout:
        print(line, end='') # Always print to console for real-time display

        if "--- Cooperative Agent Result ---" in line:
            capturing_final_summary = True
            capturing_discussion_log = False # Ensure only one section is captured at a time
            continue
        elif "--- Cooperative Agent Discussion Log Start ---" in line:
            capturing_final_summary = False
            capturing_discussion_log = True
            continue
        elif "--- Cooperative Agent Discussion Log End ---" in line:
            capturing_discussion_log = False
            continue
        elif "--- Single Agent Result ---" in line:
            capturing_final_summary = True
            capturing_discussion_log = False
            continue

        if capturing_final_summary:
            final_summary_lines.append(line)
        elif capturing_discussion_log:
            discussion_log_lines.append(line)

    process.wait()
    if process.returncode != 0:
        print(f"Command failed with exit code {process.returncode}")

    # Write final summary to output_file
    with open(output_file, "w") as f:
        f.writelines(final_summary_lines)

    # Write discussion log to discussion_log_file if provided
    if discussion_log_file:
        with open(discussion_log_file, "w") as f:
            f.writelines(discussion_log_lines)

def generate_reports():
    print("--- レポート生成を開始します ---")
    for scenario_num, data in SCENARIOS.items():
        prompt = data["prompt"]
        coop_models = data["coop_models"]
        single_model = data["single_model"]

        # Cooperative LLM
        coop_output_file = os.path.join(OUTPUT_DIR, f"scenario{scenario_num}_reporter1.md")
        coop_discussion_log_file = os.path.join(RECORDS_DIR, f"scenario{scenario_num}_coop_discussion.json")
        coop_cmd = ["npm", "run", "coop-eval", prompt, coop_models[0], coop_models[1], "2"]
        print(f"--- シナリオ{scenario_num} 協調LLMレポート生成 ---")
        run_command(coop_cmd, coop_output_file, coop_discussion_log_file)

        # Single LLM
        single_output_file = os.path.join(OUTPUT_DIR, f"scenario{scenario_num}_reporter2.md")
        single_cmd = ["npm", "run", "single-eval", prompt, single_model]
        print(f"--- シナリオ{scenario_num} 単体LLMレポート生成 ---")
        run_command(single_cmd, single_output_file)
    print("--- レポート生成が完了しました ---")

if __name__ == "__main__":
    generate_reports()
