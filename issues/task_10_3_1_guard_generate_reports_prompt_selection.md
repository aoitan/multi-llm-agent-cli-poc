# タスク 10.3.1: generate_reports のプロンプト選択とエラーハンドリング強化

## 概要
`scripts/generate_reports.py` が `test_prompts` の先頭要素を前提にしており、設定が空の場合 `IndexError` で停止します。入力検証を追加し、ユーザーフレンドリーなメッセージを返すよう改善します。

## 目的
A/B テスト設定が部分的でも CLI が安全に失敗し、後続処理を巻き込まないようにする。

## 受け入れ条件
- [ ] `test_prompts` が空または欠落している場合でもスクリプトがクラッシュせず、明確なエラーを JSON / テキスト両モードで返す。
- [ ] 既存テスト (`scripts/generate_reports.test.py`) に欠損ケースが追加され、期待するエラーメッセージを検証している。
- [ ] README か関連ドキュメントに新しいエラーメッセージと対処法が記載されている。

## 作業手順
1. [ ] `generate_reports.py` の入力処理を見直し、バリデーションとガード節を追加する。
2. [ ] JSON モードでは構造化エラーを返し、非 JSON モードでは人間向けメッセージを出力するよう統一する。
3. [ ] テストを拡張し、欠損設定シナリオをカバーする。

## 検証 / テスト
- `python3 -m pytest scripts/generate_reports.test.py`
- 手動で `python3 scripts/generate_reports.py --json --config ...` を実行し、動作を確認する。

## アウトプット
- 更新された `scripts/generate_reports.py`
- 追加されたテストケース
- ドキュメント追記

## 関連情報
- ストーリー 10.3
- `ab_test_runner.py` 出力仕様
