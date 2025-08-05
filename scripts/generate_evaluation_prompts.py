# -*- coding: utf-8 -*-
import os
import json
import random
from prompts_config import SCENARIOS

OUTPUT_DIR = "doc/blind_evaluation/outputs/"
RECORDS_DIR = "doc/blind_evaluation/records/"
MAPPING_FILE = os.path.join(RECORDS_DIR, "mapping.json")

# Scenario prompts (from prompts_config.py)
PROMPTS = {s_num: data["prompt"] for s_num, data in SCENARIOS.items()}

EVALUATION_PROMPT_TEMPLATES = {
    "1": """
## レポート評価指示プロンプト - シナリオ1

あなたは、与えられたプロンプトに対する2つの異なるレポートを評価する役割を担います。どちらのレポートがどのAIによって生成されたかは伏せられています。以下の評価観点に基づき、各レポートを詳細に評価し、最終的にどちらが優れているかを判断してください。

### 評価対象プロンプト
"{prompt}"

### 評価対象レポート

#### レポートA
```
{report_a_content}
```

#### レポートB
```
{report_b_content}
```

### 評価観点

以下の各観点について、5段階評価（1: 非常に悪い, 2: 悪い, 3: 普通, 4: 良い, 5: 非常に良い）を行い、その理由を具体的に記述してください。

1.  **網羅性**: プロンプトの要求事項（交通システムの課題と解決策）をどの程度網羅的に議論しているか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

2.  **論理性**: 内容の構成や議論の展開に論理的な飛躍がなく、一貫性があるか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

3.  **具体性**: 抽象的な議論だけでなく、具体的な課題の例や解決策の提案が含まれているか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

4.  **分かりやすさ**: 専門知識がない読者にも理解しやすいように、平易な言葉で説明されているか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

5.  **構成**: レポート全体の構成（導入、課題、解決策、結論など）が適切で、読みやすいか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

6.  **創造性/深掘り**: 単なる情報羅列ではなく、独自の視点や深い洞察、あるいは一般的な解決策に加えて革新的な提案があるか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

### 総合評価

上記の評価を踏まえ、レポートAとレポートBのどちらが優れているか、その理由とともに結論を述べてください。

*   優れているレポート: [レポートA / レポートB]
*   理由:
""",
    "2": """
## レポート評価指示プロンプト - シナリオ2

あなたは、与えられたプロンプトに対する2つの異なるレポートを評価する役割を担います。どちらのレポートがどのAIによって生成されたかは伏せられています。以下の評価観点に基づき、各レポートを詳細に評価し、最終的にどちらが優れているかを判断してください。

### 評価対象プロンプト
"{prompt}"

### 評価対象レポート

#### レポートA
```
{report_a_content}
```

#### レポートB
```
{report_b_content}
```

### 評価観点

以下の各観点について、5段階評価（1: 非常に悪い, 2: 悪い, 3: 普通, 4: 良い, 5: 非常に良い）を行い、その理由を具体的に記述してください。

1.  **網羅性**: プロンプトの要求事項（必要な機能）をどの程度網羅的に議論しているか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

2.  **論理性**: 機能の分類や説明に論理的な飛躍がなく、一貫性があるか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

3.  **具体性**: 抽象的な機能名だけでなく、具体的な機能内容やユーザー体験の例が含まれているか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

4.  **分かりやすさ**: 専門知識がない読者にも理解しやすいように、平易な言葉で説明されているか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

5.  **構成**: レポート全体の構成（機能カテゴリ、詳細説明など）が適切で、読みやすいか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

6.  **創造性/実用性**: 一般的な機能だけでなく、ユニークな提案や、プラットフォームの差別化に繋がりそうな実用的な機能が含まれているか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

### 総合評価

上記の評価を踏まえ、レポートAとレポートBのどちらが優れているか、その理由とともに結論を述べてください。

*   優れているレポート: [レポートA / レポートB]
*   理由:
""",
    "3": """
## レポート評価指示プロンプト - シナリオ3

あなたは、与えられたプロンプトに対する2つの異なるレポートを評価する役割を担います。どちらのレポートがどのAIによって生成されたかは伏せられています。以下の評価観点に基づき、各レポートを詳細に評価し、最終的にどちらが優れているかを判断してください。

### 評価対象プロンプト
"{prompt}"

### 評価対象レポート

#### レポートA
```
{report_a_content}
```

#### レポートB
```
{report_b_content}
```

### 評価観点

以下の各観点について、5段階評価（1: 非常に悪い, 2: 悪い, 3: 普通, 4: 良い, 5: 非常に良い）を行い、その理由を具体的に記述してください。

1.  **網羅性**: プロンプトの要求事項（高速な拡大縮小アルゴリズムの選定、設計、設計書作成、拡大率に応じた効率の良いアルゴリズム選択）をどの程度網羅的に議論しているか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

2.  **論理性**: アルゴリズムの選定理由、設計の妥当性、説明の論理的な一貫性があるか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

3.  **具体性**: 抽象的な説明だけでなく、具体的なアルゴリズム名、その特性、設計上の考慮点、あるいは擬似コードや図解などが含まれているか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

4.  **分かりやすさ**: 専門知識がない読者にも理解しやすいように、平易な言葉で説明されているか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

5.  **構成**: 設計書としての体裁が整っており、導入、アルゴリズム選定、設計、結論などが適切に構成され、読みやすいか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

6.  **専門性/深掘り**: 画像処理アルゴリズムに関する深い知識が示されており、拡大率に応じた効率性や変形結果への影響に関する詳細な考察が含まれているか。
    *   レポートA:
        *   評価: [1-5]
        *   理由:
    *   レポートB:
        *   評価: [1-5]
        *   理由:

### 総合評価

上記の評価を踏まえ、レポートAとレポートBのどちらが優れているか、その理由とともに結論を述べてください。

*   優れているレポート: [レポートA / レポートB]
*   理由:
"""
}

def generate_prompts():
    print("--- 評価プロンプトを生成中 ---")
    try:
        with open(MAPPING_FILE, 'r') as f:
            mapping = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"Error: {MAPPING_FILE} not found or invalid. Please run prepare_evaluation.sh and generate_reports.sh first.")
        return

    # Group files by scenario
    scenario_reports = {"1": {}, "2": {}, "3": {}}
    for filename, data in mapping.items():
        scenario = data.get("scenario")
        report_type = data.get("type")
        if scenario and report_type:
            scenario_reports[scenario][report_type] = filename

    for scenario_num, reports in scenario_reports.items():
        if "coop" not in reports or "single" not in reports:
            print(f"Warning: Not enough reports for scenario {scenario_num}. Skipping prompt generation.")
            continue

        # Read contents of the two reports for the current scenario
        coop_report_content = ""
        single_report_content = ""
        
        coop_filename = reports["coop"]
        single_filename = reports["single"]

        if os.path.exists(os.path.join(OUTPUT_DIR, coop_filename)):
            with open(os.path.join(OUTPUT_DIR, coop_filename), 'r') as f:
                coop_report_content = f.read()
        else:
            print(f"Warning: {coop_filename} not found.")

        if os.path.exists(os.path.join(OUTPUT_DIR, single_filename)):
            with open(os.path.join(OUTPUT_DIR, single_filename), 'r') as f:
                single_report_content = f.read()
        else:
            print(f"Warning: {single_filename} not found.")
        
        # Randomly assign to Report A and Report B
        if random.random() < 0.5:
            report_a_content = coop_report_content
            report_b_content = single_report_content
        else:
            report_a_content = single_report_content
            report_b_content = coop_report_content

        # Get the scenario prompt
        scenario_prompt = PROMPTS.get(scenario_num, "")

        # Format the evaluation prompt
        evaluation_prompt = EVALUATION_PROMPT_TEMPLATES[scenario_num].format(
            prompt=scenario_prompt,
            report_a_content=report_a_content,
            report_b_content=report_b_content
        )

        # Write to file
        output_filepath = os.path.join(RECORDS_DIR, f"scenario{scenario_num}_prompts.md")
        with open(output_filepath, 'w') as f:
            f.write(evaluation_prompt)
        print(f"Generated evaluation prompt for scenario {scenario_num} at {output_filepath}")

if __name__ == "__main__":
    generate_prompts()