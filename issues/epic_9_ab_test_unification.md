# エピック: A/B テスト基盤の統合と単体LLM比較対応

## 概要
既存の A/B テスト手順（`generate_reports.py` → `ab_test_runner.py`）を拡張し、単体LLMを制御群として扱えるようにするとともに、複数の比較シナリオを一貫した仕組みで実行できるように整備します。旧来の `main_evaluation.py` に依存せず、最新のスクリプト群で評価フローを完結させます。

## 成功指標
- 単体LLM vs 協調LLM、固定プロンプト vs 動的プロンプト、ブースティング vs バギングを同一パイプラインで実行できる。
- `generate_reports.py` が全テストグループの出力を生成し、`generate_mapping.py` など後続処理が正常に動作する。
- CI またはローカル手順で一連の評価フローが再現可能である。

## 受け入れ条件
- [ ] ストーリー 9.1〜9.3 が完了し、単体LLMを含む新しいテスト構成が `ab_test_runner.py` を通じて実行できる。
- [ ] `config/ab_test_config.json` が新しいテストグループ構成に対応し、各グループの設定がドキュメント化されている。
- [ ] 生成されたレポート・マッピングが完全で、従来の欠落ファイル問題が解消される。

## スコープ
- TypeScript CLI から呼び出される単体LLM実行モードの追加
- Python スクリプト (`ab_test_runner.py`, `generate_reports.py`, `generate_mapping.py`) の改修
- 設定ファイルとドキュメントの更新

## 非スコープ
- 新しい評価指標や解析ロジックの追加
- モデル提供基盤（Ollama 以外）への対応

## 関連ストーリー
* [ ] [ストーリー 9.1: 単体LLM制御群の実行パス整備](story_9_1_single_llm_control_group.md)
* [ ] [ストーリー 9.2: A/B テスト設定とレポート生成の統合](story_9_2_ab_test_configuration_unification.md)
* [ ] [ストーリー 9.3: 評価フローのドキュメント整備とテスト自動化](story_9_3_evaluation_flow_docs_and_ci.md)

## 関連資料
- `scripts/ab_test_runner.py`, `scripts/generate_reports.py`
- `config/ab_test_config.json`
- `doc/design/workflow_architecture_overview.md`
