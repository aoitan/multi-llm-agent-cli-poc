# タイトル案

`generate_reports` の JSON 出力整合性と失敗時エラーハンドリングを強化

## 背景

Issue #115 では、`ab_test_runner.py` の JSON 出力仕様変更に合わせて `scripts/generate_reports.py` の JSON モード契約を整えることが求められていた。従来は runner 側の `{"error": ...}` を成功結果として誤解釈しうること、config 不在時に JSON モードでも空 stdout / exit 0 になりうること、`finalOutput` の二重エンコードが Markdown / JSON の両方に混入しうることが課題だった。

## 変更概要

`generate_reports.py` に runner 応答の正規化レイヤを追加し、成功 payload・error envelope・不正 JSON を明示的に切り分けるようにした。あわせて `--json` 時の失敗経路を `{"error": {"message": ...}}` + 非 0 終了へ統一し、README と Python テストをその契約に合わせて更新した。

## 主な変更点

1. `scripts/generate_reports.py`
   - config 読み込み、`test_prompts` / `test_groups` 検証、runner 応答正規化を関数分離。
   - top-level `error` envelope、malformed JSON、malformed success payload を fail-fast に変更。
   - `subprocess.CalledProcessError` の stdout に error JSON がある場合は、その詳細メッセージを `generate_reports` 側の error JSON に反映。
   - `finalOutput` が JSON 文字列のときは 1 段 decode し、`test_results` と `report_content_markdown` の双方で同じ正規化済み値を使用。
   - レポート出力対象の group は config の `test_groups` 2 件を前提に検証し、欠落時は `N/A` で黙って続行せず明示エラーに変更。
2. `scripts/test_generate_reports.py`
   - JSON モード成功時の normalized `finalOutput` を検証するケースを追加。
   - runner error envelope、runner invalid JSON、config missing、malformed success shape、subprocess failure、subprocess failure + error JSON stdout を追加。
   - テスト実装を `sys.stdout` 捕捉ベースへ整理し、終了コードと JSON payload を直接検証。
3. `README.md`
   - Python 個別テスト手順を `python3 -m unittest scripts.test_generate_reports scripts.test_ab_test_runner` に更新。
   - `python3 scripts/generate_reports.py --json --config ...` の成功例と失敗例を追加。

## テスト / 確認

- `python3 -m unittest scripts.test_generate_reports scripts.test_ab_test_runner`
- `python3 scripts/generate_reports.py --json --config does-not-exist.json`

## 既知の制約

- 実環境の成功系 CLI は Ollama / `node dist/index.js` 依存のため、今回の確認はモックベースと失敗系 CLI 確認が中心。
- レポート表示は引き続き config 上の 2 group 比較を前提としており、任意件数 group の汎化はこの PR のスコープ外。
- `test_results` には runner の raw `finalOutput` は残さず、正規化済み値を正とする。

## レビューポイント

1. `normalize_runner_results()` 周辺で、success payload / error envelope / malformed payload の切り分けが Issue #115 の期待どおりか。
2. `subprocess.CalledProcessError` から runner の error JSON を拾うメッセージ伝播が十分か。
3. `finalOutput` を normalized 値へ置き換える方針で、下流利用側の想定とずれないか。
4. `test_groups` を 2 件必須とする fail-fast が現状運用に対して妥当か。

## ロールバック観点

- 失敗時 JSON 契約の変更が下流で問題になる場合は、まず `scripts/generate_reports.py` の runner 正規化レイヤ導入前の挙動との差分を切り戻す。
- `finalOutput` の normalized 化が互換性問題を起こす場合は、raw 値保持用フィールド追加で前方互換を取る案を次手として検討する。
- README / テスト更新はコード契約に従属するため、コードを戻す場合は併せて旧契約記述へ戻す必要がある。

## この工程でやったこと

- implementation / review-fix loop の成果物と実差分を突き合わせ、PR 用の背景・変更点・確認結果・制約・レビュー観点を整理した。
- Issue #115 の受け入れ条件との対応が人間レビューで追いやすいように、JSON 契約とテスト観点を中心に要約した。

## この工程でやっていないこと

- コード変更
- 追加テスト実行
- 実環境 Ollama を使った成功系 E2E 確認

## 次工程への入力

- この `07-pr-draft.md` を PR 本文の叩き台として利用する。
- レビュー時は `scripts/generate_reports.py` の正規化レイヤと `scripts/test_generate_reports.py` の失敗系ケースを優先確認する。

## リスク / 未解決事項

- normalized `finalOutput` を正とした契約が、raw 値前提の下流利用と競合しないかはレビューで要確認。
- 2 group 前提の fail-fast は今回のスコープ内判断だが、将来の group 増加要件にはそのままでは対応できない。
