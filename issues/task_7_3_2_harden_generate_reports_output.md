# タスク 7.3.2: generate_reports の出力整合性強化

## 概要
`ab_test_runner` の JSON 出力仕様変更に合わせて `scripts/generate_reports.py` を更新し、JSON モードでの出力整合性とエラーハンドリングを強化する。

## 目的
レポート生成スクリプトが A/B テスト結果を正しく解釈し、CI や他サービスで再利用可能な構造化データを提供する。

## 受け入れ条件
- [ ] `generate_reports.py` が `ab_test_runner.py` の新フォーマットに適切に対応し、失敗時も JSON 形式で結果を返す。
- [ ] 成功パスと代表的な失敗パスを検証する Python テストが追加または更新されている。
- [ ] CLI 実行手順と期待される出力例がドキュメント化されている。

## 作業手順
1. [ ] `ab_test_runner` の更新仕様を確認し、`generate_reports.py` のデシリアライズ・ロギング処理を見直す。
2. [ ] JSON モード時のエラー処理を統一し、不要な `print` 呼び出しを排除する。
3. [ ] 既存の `generate_reports.test.py` を拡張し、成功/失敗ケースをカバーする。
4. [ ] `python3 scripts/generate_reports.py --json` を実行して期待通りの出力であることを確認する。

## 検証 / テスト
- `python3 -m pytest scripts/generate_reports.test.py`
- 手動での CLI 試験 (JSON / 非 JSON モード)

## アウトプット
- 更新された `scripts/generate_reports.py`
- テスト更新 (`scripts/generate_reports.test.py` 等)
- ドキュメント更新 (CLI 手順)

## 関連情報
- タスク 7.3.1 の成果物
- `config/ab_test_config.json` のサンプル
