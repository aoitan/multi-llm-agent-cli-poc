# タスク: A/Bテストによる効果検証

## 概要
動的プロンプト/ワークフロー選択が、静的プロンプトと比較してLLMの応答品質に与える影響を定量的に評価する。

## 目的
Epic 4で実装された動的プロンプト/ワークフロー選択機能が、LLMの応答品質向上に寄与していることを定量的に検証する。

## 受け入れ条件
*   `config/ab_test_config.json`が、`dynamic_prompt_ab_test_enabled: true`であり、`control`グループ（静的）と`dynamic_prompt_group`（動的）が正しく設定されていること。
*   `scripts/generate_reports.py`の実行により、`control`グループと`dynamic_prompt_group`の評価指標（応答の長さ、キーワード出現率など）が比較可能であること。

## 作業手順
1.  `config/ab_test_config.json`が、`dynamic_prompt_ab_test_enabled: true`であり、`control`グループ（静的）と`dynamic_prompt_group`（動的）が正しく設定されていることを確認する。
2.  以下のコマンドを実行する。
    `python scripts/generate_reports.py`
3.  生成されたレポート（標準出力）を確認し、`control`グループと`dynamic_prompt_group`の評価指標（応答の長さ、キーワード出現率など）を比較する。

## 関連情報
*   テストケースID: N/A (A/Bテスト全体)
*   関連ファイル:
    *   `config/ab_test_config.json`
    *   `scripts/generate_reports.py`
    *   `scripts/ab_test_runner.py`
    *   `src/index.ts`
    *   `src/utils/scenarioIdentifier.ts`
    *   `src/utils/promptLoader.ts`
    *   `src/utils/workflowLoader.ts`