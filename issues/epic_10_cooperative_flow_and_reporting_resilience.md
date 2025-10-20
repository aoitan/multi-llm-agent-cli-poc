# エピック: 協調ワークフロー復旧とレポート基盤強化

## 概要
協調エージェント評価 CLI が存在しない API を呼び出すなど、主要なワークフローが破綻した状態にあります。また、レポート生成系スクリプトは入力検証とメトリクス取得が不十分で、JSON 出力が壊れるリスクも残っています。本エピックでは、協調フローを再稼働させ、テストとレポート基盤を安全に再構築します。

## 背景 / きっかけ
- `src/cooperativeAgentEval.ts` が削除済みの `conductConsultation` を呼び出し、即時クラッシュする。
- `src/__tests__/agent.test.ts` の協調フローテストが skip されており、リグレッションを検知できない。
- `scripts/generate_reports.py` が設定依存で例外を出すほか、LLM レイテンシ指標を正しく取得できず、`print(..., is_json)` により JSON 出力が汚染される。
- `src/agent.ts` が 400 行規模で肥大化し、LLM 呼び出し層とワークフロー状態機械が密結合になっている。

## 成功指標
- 協調評価 CLI が再びビルド・実行可能で、テストスイートが主要分岐を網羅する。
- レポート生成スクリプトが欠落設定や JSON モードでも堅牢に動作し、CI で再利用できるメトリクスを提供する。
- `src/agent.ts` の責務が再分割され、エージェントラッパーとワークフロー実行が独立テスト可能になる。

## 受け入れ条件
- [ ] 関連ストーリー完了後、`npm run build` と `npm test`、`python3 -m pytest scripts` がエラーなく通過する。
- [ ] 協調フローの主要シナリオが CI で自動検証され、欠落 API による失敗が再発しない仕組みが導入されている。
- [ ] レポート生成時に JSON 以外の文字列が標準出力に混入せず、欠損設定でもユーザーフレンドリーなエラーメッセージが返る。

## スコープ
- `src/cooperativeAgentEval.ts` と関連 TypeScript ワークフローロジック
- `src/__tests__/agent.test.ts` など協調フローのテストスイート
- `scripts/ab_test_runner.py`, `scripts/generate_reports.py` および付随するテスト

## 非スコープ
- 新規ワークフローやプロンプトセットの追加
- モデル推論そのものの最適化

## 関連ストーリー
* [ ] [ストーリー 10.1: 協調ワークフローの再稼働と自動テスト復活](story_10_1_cooperative_workflow_restoration.md)
* [ ] [ストーリー 10.2: エージェント実装の責務分割と API 整合性確保](story_10_2_agent_core_modularization.md)
* [ ] [ストーリー 10.3: レポート生成とメトリクス取得の堅牢化](story_10_3_reporting_metric_integrity.md)

## 関連資料
- レビュー結果（2024-xx-xx）
- `src/agent.ts`, `src/cooperativeAgentEval.ts`
- `scripts/generate_reports.py`, `scripts/generate_reports.test.py`
