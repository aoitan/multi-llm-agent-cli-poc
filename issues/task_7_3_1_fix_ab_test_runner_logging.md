# タスク 7.3.1: ab_test_runner の JSON ロギング改善とテスト追加

## 概要
`scripts/ab_test_runner.py` の例外処理で `print(..., is_json)` が呼ばれ、JSON モードでも非 JSON の文字列が標準出力に混入するため、ロギングを改善しテストで保証する。

## 目的
A/B テストスクリプトを CI などの自動処理で安全に使用できるよう、JSON 出力を厳密に守る。

## 受け入れ条件
- [ ] JSON モード時のログ出力が `logging` 関数または新ユーティリティ経由に統一され、非 JSON 文字列が標準出力に出ない。
- [ ] 例外発生時は JSON 形式 (エラーコード、メッセージ等) で応答する仕様が整理され、ドキュメント化されている。
- [ ] 新仕様を検証する Python テストが追加され、エラーケースでも期待する JSON を出力することが確認される。

## 作業手順
1. [ ] 現状のエラーハンドリング実装を調査し、JSON モード用の出力フォーマットを設計する。
2. [ ] `logging` ユーティリティまたは新関数を導入し、`run_llm_consultation` からの例外処理を統一する。
3. [ ] 成功/失敗パターンを検証する Python テストを追加する。
4. [ ] `python3 scripts/ab_test_runner.py --json ...` を実行し、仕様通りの出力になることを確認する。

## 検証 / テスト
- `python3 -m pytest scripts/generate_reports.test.py` (必要に応じて新ファイル追加)
- 手動での JSON モード実行確認

## アウトプット
- 更新された `scripts/ab_test_runner.py`
- 追加された Python テストファイル (例: `scripts/ab_test_runner.test.py`)
- ドキュメント更新

## 関連情報
- `scripts/generate_reports.py` とのインターフェース
