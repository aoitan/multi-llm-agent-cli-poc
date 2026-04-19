# Issue #115 Plan

## 1. 目的
- `scripts/generate_reports.py` を `scripts/ab_test_runner.py --json` の現行契約に追従させ、成功時は再利用しやすい構造化 JSON、失敗時は常に parse 可能な error JSON を返せるようにする。
- `generate_reports --json` の stdout 契約を安定化し、CI / 他サービスが「偽成功」「空 stdout 成功」「quoted な `finalOutput` 混入」を踏まない状態にする。
- 代表的な成功/失敗ケースを Python テストと CLI 手順の両方で確認可能にする。

## 2. スコープ
- `scripts/generate_reports.py` の runner 応答デシリアライズ、shape 検証、`finalOutput` 正規化、JSON モードの失敗経路統一。
- Markdown レポート生成時の group 参照の安全化。
- `scripts/test_generate_reports.py` を中心とした成功/失敗ケースの追加・更新。
- README の `generate_reports` 実行手順、JSON 成功/失敗例、個別テスト実行コマンドの更新。

## 3. 非スコープ
- `scripts/ab_test_runner.py` 側の出力仕様再設計。
- Markdown レポートの大幅な見た目改善や指標定義変更。
- 任意件数の group を汎用表として完全対応する大きな UI リファクタ。
- pytest へのテスト基盤移行。現行 repo 実態に合わせて unittest を前提にする。

## 4. タスク一覧

### T1. runner 応答契約を固定する
- 内容:
  - `generate_reports.py` が成功として受け入れる shape と、失敗として扱う shape を先に明文化する。
  - `finalOutput` は「runner 生値をそのまま素通ししない」「JSON 文字列なら 1 段 decode した値を `generate_reports` の成功 JSON/Markdown に使う」方針を採る。
  - top-level `error` envelope は return code に関わらず失敗扱いにする。
- 完了条件:
  - implementation 着手前に、成功 shape / error shape / malformed shape の判定条件がコードコメントまたは implementation notes で追える。
  - `test_results` に載せる値が raw か normalized か曖昧でない。
- 確認方法:
  - `scripts/generate_reports.py` の新規正規化関数または同等の単一責務コードで判定が集約されていることをレビューで確認する。

### T2. runner 応答の正規化レイヤを追加する
- 内容:
  - `subprocess.run(...).stdout` の JSON decode、top-level `error` 検出、最小 shape 検証を 1 箇所に寄せる。
  - 少なくとも `prompt_id -> group_id -> run_n -> {finalOutput, discussionLog}` の最小成立条件を見て、壊れた成功 payload は fail-fast にする。
  - `finalOutput` が JSON 文字列の場合は decode し、Markdown と成功 JSON の双方で同じ正規化済み値を使う。
- 完了条件:
  - runner error JSON が偽成功にならない。
  - malformed JSON / malformed success payload が Markdown 生成まで進まず失敗になる。
  - quoted な `finalOutput` が Markdown に露出しない。
- 確認方法:
  - `scripts/test_generate_reports.py` の追加ケースで success / error envelope / malformed JSON / malformed shape / `finalOutput` decode を確認する。

### T3. JSON モードの失敗経路を統一する
- 内容:
  - config 不在、config shape 不備、runner subprocess failure、runner error JSON、runner malformed JSON / malformed success payload をすべて `emit_error(...)` + 非 0 終了へ統一する。
  - JSON モードでは不要な plain `print` や途中ログを stdout に混ぜない。
- 完了条件:
  - `--json` 時の失敗 stdout は常に 1 個の parse 可能 JSON。
  - `--json` 時の失敗は常に非 0 終了。
  - non-JSON モードの既存 human-readable 出力は不要に壊さない。
- 確認方法:
  - 単体テストで config missing / config invalid / runner failure を確認する。
  - 手動 CLI で失敗時 stdout が JSON のみであることを確認する。

### T4. Markdown / JSON 出力組み立てを安全化する
- 内容:
  - レポート生成時に config の `test_groups` と runner 結果の整合を確認し、固定 group ID に依存する場合も「欠落時は N/A で黙って続行」ではなく明示的に失敗させる。
  - 現スコープでは 2 group 比較の表示は維持しつつ、参照元は config / 正規化済み結果に基づいて決定する。
  - 成功 JSON の `report_content_markdown` と `test_results` が同じ正規化済み内容を指す状態にする。
- 完了条件:
  - group mismatch が silent degradation にならない。
  - success JSON と Markdown で `finalOutput` 表現が食い違わない。
- 確認方法:
  - group 欠落や shape 崩れの失敗ケースをテストで確認する。
  - 成功ケースで Markdown 内の本文と JSON 内の `test_results` が一致することを確認する。

### T5. テストを拡張する
- 内容:
  - `scripts/test_generate_reports.py` に以下を追加/更新する。
    1. runner success JSON（`finalOutput` が JSON 文字列）
    2. runner error JSON（exit 0 でも失敗扱い）
    3. runner malformed JSON
    4. config missing in JSON mode
    5. malformed success shape
    6. 必要なら runner subprocess failure
  - 既存 `scripts/test_ab_test_runner.py` は契約参照用として維持し、必要があれば expectation の整合だけ確認する。
- 完了条件:
  - 今回の受け入れ条件に対応する成功/失敗ケースが自動テストで落ちる/通る形になっている。
  - 回帰しやすい境界（error envelope, empty stdout success, quoted finalOutput）がテストで塞がれている。
- 確認方法:
  - `python3 -m unittest scripts.test_generate_reports scripts.test_ab_test_runner`

### T6. CLI 手順と出力例を更新する
- 内容:
  - README の個別テストコマンドを実ファイル名・実行方法に合わせる。
  - `python3 scripts/generate_reports.py --json` の成功例と失敗例を README に追加する。
  - Issue 本文の pytest 記載と repo 実態がズレるため、README では unittest ベースの実行手順を source of truth として明示する。
- 完了条件:
  - `generate_reports` の JSON / 非 JSON 実行手順が README から追える。
  - 開発者が誤ったファイル名や旧コマンドで確認しない。
- 確認方法:
  - README の記載コマンドと実ファイル名が一致していることをレビューで確認する。

## 5. タスク依存関係
- T2 は T1 に依存する。
- T3 は T1 に依存し、実装上は T2 と同じ変更面で進める。
- T4 は T2 に依存する。
- T5 は T2〜T4 に依存する。
- T6 は T1〜T5 の方針確定後に行う。

依存関係の要点:
- 先に契約を固定しないと、`test_results` の互換性と `finalOutput` の扱いがぶれる。
- テストは出力契約が固まった後でないと期待値を安定化できない。
- ドキュメントは最後に更新しないと、実装途中の仮仕様を書き込むリスクがある。

## 6. 実装順序
1. T1: runner 応答契約と `finalOutput` 正規化方針を固定する。
2. T2: 正規化レイヤを追加し、error envelope / malformed payload を fail-fast にする。
3. T3: JSON モードの失敗経路を統一し、stdout 純度と非 0 終了を揃える。
4. T4: Markdown / JSON 組み立てを正規化済み結果ベースへ寄せ、group mismatch を明示エラー化する。
5. T5: 自動テストを拡張し、成功/失敗境界を固定する。
6. T6: README の CLI 手順と出力例を更新する。

## 7. チェック方法

### 自動チェック
- `python3 -m unittest scripts.test_generate_reports scripts.test_ab_test_runner`

### 手動チェック
- 成功系:
  - `python3 scripts/generate_reports.py --json --config config/ab_test_config.json`
  - 期待:
    - stdout が parse 可能な JSON 1 個のみ
    - `report_metadata`, `test_results`, `report_content_markdown` を含む
    - `test_results` と Markdown 内の `finalOutput` 表現が一致する
- 失敗系 1（config 不在）:
  - `python3 scripts/generate_reports.py --json --config does-not-exist.json`
  - 期待:
    - stdout が `{"error": {...}}`
    - 終了コードが非 0
- 失敗系 2（runner error envelope / malformed payload）:
  - テストモックで再現し、`generate_reports` が偽成功にしないことを確認する

### 完了判定
- `--json` の成功/失敗で stdout 契約が一貫している。
- runner error envelope を `test_results.error` として成功 JSON に混入させない。
- config / payload 不備で空 stdout + exit 0 にならない。
- README のコマンドと repo 実態が一致している。

## 8. リスク対応
- **R1 / R2 対応**: error envelope 判定と `emit_error(...)` + 非 0 終了の統一を最優先にする。
- **R3 対応**: 成功 payload shape は最低限の必須項目に絞って fail-fast にし、「壊れたが parse できる JSON」を成功扱いしない。
- **R4 対応**: `finalOutput` の normalized 値を `generate_reports` の成功出力の正とし、raw 値を残す必要が出た場合のみ明示フィールド追加を検討する。今回の既定方針は「無言で raw を温存しない」。
- **R5 対応**: 任意件数 group の汎用化までは広げず、現行比較表示を維持しながら config / runner 整合が崩れたら明示的に落とす。
- **R6 対応**: テスト拡張と README 更新を同一タスク群として扱い、境界仕様をコードと文章の両方で固定する。
- **仕様差分リスク**: `doc/cli_output_mode_requirements.md` には JSON エラー仕様が未確定寄りに残っているが、本件では Issue #115 と既存 `ab_test_runner` テスト契約を優先する。差分は implementation notes に明記する。

## 9. 実装担当への申し送り
- `generate_reports.py` の中心変更点は subprocess 呼び出しではなく **runner 応答の正規化レイヤ**。ここを分散実装しないこと。
- `return` で静かに抜ける経路を残さず、JSON モード失敗は必ず機械可読 + 非 0 終了へ寄せること。
- `finalOutput` をそのまま文字列連結すると quoted text が再発するため、正規化後の値だけを Markdown/JSON の双方に使うこと。
- group 一致が怪しいときに `N/A` で通さないこと。fail-fast を優先する。
- README では `python3 scripts/generate_reports.test.py` のような旧表記を残さず、repo 実態に合う unittest コマンドへ更新すること。

## この工程でやったこと
- Issue #115、前工程 3 件、現行 `generate_reports.py`、既存 `scripts/test_generate_reports.py`、README、`doc/cli_output_mode_requirements.md` を確認した。
- planning に必要な論点を「契約固定」「正規化」「エラー統一」「出力整合」「テスト」「README」に分解した。
- 実装順、依存関係、完了判定、リスク対応を次工程でそのまま使える粒度に落とした。

## この工程でやっていないこと
- コード変更
- テスト追加・更新
- README 修正
- CLI 実行による挙動確認

## 次工程への入力
- この `04-plan.md`
- `01-prototype-planning.md`
- `02-prototype-summary.md`
- `03-red-team-review.md`
- 対象ファイル:
  - `scripts/generate_reports.py`
  - `scripts/test_generate_reports.py`
  - `scripts/test_ab_test_runner.py`
  - `README.md`

## リスク / 未解決事項
- 成功 JSON に raw runner 値を残す必要が本当にあるかは implementation で最終判断が必要。今回 plan の既定方針は normalized 値を正とする。
- group 参照の安全化は今回スコープ内だが、任意件数 group の完全汎化はスコープ外。必要なら別 Issue に切り出す。
- Issue 本文の pytest 記載は repo の unittest 実態とズレているため、実装時に README をどこまで source of truth とするかを notes に残すこと。
