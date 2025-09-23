# ストーリー 9.2: A/B テスト設定とレポート生成の統合

## 概要
単体LLM制御群を含む新しいテストグループを `config/ab_test_config.json` に追加し、`generate_reports.py`・`generate_mapping.py` がすべてのグループ出力を扱えるように改修する。レポートフォーマットを統一し、後続処理が欠落しない状態を整える。

## 受け入れ条件
- [ ] `config/ab_test_config.json` に単体LLM制御群、固定/動的プロンプト比較、ブースティング/バギング比較などが設定できるよう拡張されている。
- [ ] `generate_reports.py` が新しいグループ構成に対応し、全グループの結果を Markdown/JSON で出力できる。
- [ ] `generate_mapping.py` が新出力命名規則に追従し、制御群・対照群を識別するマッピングを生成する。
- [ ] 代表的なケースをカバーするテスト (Python) が追加され、CI で実行可能。

## 進め方のガイド
- 出力ファイル名にグループIDやテストIDを含めるなど、一意性を担保する命名規則を整理してください。
- レポート生成時に単体LLMと協調LLMを比較表形式でまとめると評価しやすくなります。
- テストは `pytest` ベースで、モック結果を使った軽量な検証を推奨します。

## 関連タスク
* [ ] [タスク 9.2.1: ab_test_config.json のグループ拡張](task_9_2_1_expand_ab_test_config.md)
* [ ] [タスク 9.2.2: generate_reports.py / generate_mapping.py の改修とテスト](task_9_2_2_update_reports_and_mapping.md)

## 依存関係 / リスク
- ストーリー 9.1 の単体LLM実行が利用可能であることが前提。
- 出力ファイルの命名規則変更により既存評価資産との互換性が崩れる可能性があるため、移行手順を検討する。
