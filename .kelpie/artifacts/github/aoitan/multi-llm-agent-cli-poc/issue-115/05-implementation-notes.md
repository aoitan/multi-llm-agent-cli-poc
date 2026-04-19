# Issue #115 Implementation Notes

## 1. 実装した項目
- `scripts/generate_reports.py` に runner 応答正規化レイヤを追加し、`error` envelope / malformed JSON / malformed success payload を fail-fast にした。
- JSON モードの失敗経路を `{"error": {"message": ...}}` + exit code 1 に統一し、config 不在や runner subprocess failure でも空 stdout 成功にならないようにした。
- `finalOutput` が JSON 文字列のときは 1 段 decode した値を Markdown / `test_results` の両方へ使うようにした。
- `scripts/test_generate_reports.py` を更新し、成功系、runner error envelope、invalid JSON、config missing、malformed success shape、subprocess failure をカバーした。
- README の個別テストコマンドと `generate_reports.py --json` の成功/失敗例を更新した。

## 2. 変更ファイル
- `scripts/generate_reports.py`
- `scripts/test_generate_reports.py`
- `README.md`

## 3. 計画との差分
- `test_results` の `finalOutput` は raw 値保持用の別フィールドを追加せず、plan の既定方針どおり normalized 値を正とした。
- group 参照の安全化は config の `test_groups` 2 件を前提に検証する形で実装した。任意件数 group の汎化は計画どおりスコープ外に留めた。
- `doc/cli_output_mode_requirements.md` は historical note と見なし、Issue #115 と既存 `ab_test_runner` テスト契約を優先したため今回は更新していない。

## 4. 未対応項目
- 実環境の Ollama / `node dist/index.js` を使った成功系 CLI 実行は、この工程では行っていない。
- 任意件数 group のレポート表示汎化は未対応。

## 5. ローカル確認内容
- `python3 -m unittest scripts.test_generate_reports scripts.test_ab_test_runner`
- `python3 scripts/generate_reports.py --json --config does-not-exist.json`

## 6. 次工程に見てほしい点
- `generate_reports.py` の normalized `finalOutput` 契約で下流利用に不足がないか。
- config 上の group 順序を表出ラベル順に使う実装で問題ないか。
- 実環境依存の成功系 CLI を review/fix loop で追加確認すべきか。
