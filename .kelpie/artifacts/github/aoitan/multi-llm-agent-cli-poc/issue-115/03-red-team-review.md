# Issue #115 Red Team Review

## 1. 対象
- GitHub Issue #115「タスク 7.3.2: generate_reports の出力整合性強化」
- 前工程成果物
  - `01-prototype-planning.md`
  - `02-prototype-summary.md`
- 現行実装 / テスト / ドキュメント
  - `scripts/generate_reports.py`
  - `scripts/ab_test_runner.py`
  - `scripts/test_generate_reports.py`
  - `scripts/test_ab_test_runner.py`
  - `README.md`
  - `doc/cli_output_mode_requirements.md`

## 2. 前提
- Issue コメントは確認できず、Issue 本文と既存成果物を主入力とした。
- `scripts/test_ab_test_runner.py` では、`ab_test_runner.py` の JSON モード失敗時に **stdout へ `{"error": ...}` を出し、非 0 終了する** 契約が既にテストされている。
- `02-prototype-summary.md` で、`generate_reports.py` は runner の error envelope を成功データとして誤解釈しうること、config 欠落時に JSON モードで空 stdout / exit 0 になりうることが観測済みである。
- `skills/red-team-review/SKILL.md` はリポジトリ上に見当たらなかったため、Issue に埋め込まれた phase prompt / skill を正として扱う。

## 3. 主要な懸念点一覧

| ID | 懸念 | 重大度 |
|---|---|---|
| R1 | runner の error JSON を成功結果として通してしまう | Critical |
| R2 | JSON モードでも設定不備で空 stdout / exit 0 になる経路がある | Critical |
| R3 | 成功レスポンス shape の検証不足で壊れた入力を「成功レポート」に変換する | High |
| R4 | `finalOutput` の正規化契約が曖昧で二重エンコードや下流互換破壊が起きる | High |
| R5 | レポート生成が `control` / `dynamic_prompt_group` に固定されており設定変更に弱い | Medium |
| R6 | テストと CLI ドキュメントの境界が不足し、修正後も回帰を取り逃がす | Medium |

## 4. 各懸念の重大度 / 発生条件 / 影響

### R1. runner の error JSON を成功結果として通してしまう
- **重大度**: Critical
- **発生条件**:
  - `ab_test_runner.py --json` が exit code 0 のまま `{"error": {...}}` を stdout に返す
  - `generate_reports.py` が top-level `error` を異常系として判定しない
- **影響**:
  - CI や他サービスが「成功 JSON」と誤認する
  - `report_content_markdown` に `### プロンプト: error` のような偽レポートが出る
  - 本来停止すべき失敗が監視をすり抜け、後段で誤配信・誤集計を起こす

### R2. JSON モードでも設定不備で空 stdout / exit 0 になる経路がある
- **重大度**: Critical
- **発生条件**:
  - config ファイル欠落など、`emit_error()` を通らず `return` する経路が残る
  - 呼び出し側が stdout JSON の存在と終了コードを前提にしている
- **影響**:
  - 機械可読契約が崩れ、呼び出し側は「何も返ってこない成功」を受け取る
  - リトライ、通知、失敗判定の実装が壊れる
  - Issue 受け入れ条件の「失敗時も JSON 形式で結果を返す」を満たせない

### R3. 成功レスポンス shape の検証不足で壊れた入力を「成功レポート」に変換する
- **重大度**: High
- **発生条件**:
  - `all_results` が `prompt_id -> group_id -> run_n -> {finalOutput, discussionLog}` から外れる
  - group 欠落、`run_1` 欠落、`discussionLog` 非 list、`finalOutput` 非文字列などが混入する
- **影響**:
  - `N/A` やゼロ値を含むもっともらしい Markdown が生成される
  - 障害がデータ欠損として埋もれ、原因追跡が遅れる
  - 「壊れているが parse できる JSON」が最も検知しづらい失敗になる

### R4. `finalOutput` の正規化契約が曖昧で二重エンコードや下流互換破壊が起きる
- **重大度**: High
- **発生条件**:
  - runner が `json.dumps(summary)` 済みの文字列を返す
  - `generate_reports.py` がそのまま再利用する、または正規化後の保存先を定義しない
- **影響**:
  - Markdown に quoted text が露出し、人間可読性が落ちる
  - `test_results` の値を使う下流が raw / normalized のどちらを期待すべきか分からない
  - 実装時に安易に上書きすると、既存利用者の JSON 契約を別方向で壊す

### R5. レポート生成が `control` / `dynamic_prompt_group` に固定されており設定変更に弱い
- **重大度**: Medium
- **発生条件**:
  - config の `test_groups` ID が変わる、順序が変わる、比較対象が 2 つ以外になる
  - runner 出力自体は正しくても report 側が固定 ID 参照を続ける
- **影響**:
  - 正常な結果でも `N/A` だらけの比較表になる
  - タスク 7.3.2 の「再利用可能な構造化データ」要求に対し、表示層が設定追従できない
  - planning でこの依存を見落とすと、今回の修正が将来の config 変更で即座に腐る

### R6. テストと CLI ドキュメントの境界が不足し、修正後も回帰を取り逃がす
- **重大度**: Medium
- **発生条件**:
  - テストが `runner error JSON` / `config missing in JSON mode` / malformed success shape / `finalOutput` 正規化を見ない
  - README の実行手順が古いまま残る
- **影響**:
  - 今回の修正が将来のリファクタで壊れても検知しづらい
  - 開発者が誤ったコマンドで確認し、正常/異常の判断を誤る
  - Issue 受け入れ条件のドキュメント項目が形式的対応で終わる

## 5. 進行を止めるべき論点
- **成功 JSON の最終契約が未定義なまま実装に入ること**
  - `test_results` に raw runner 値を残すのか、正規化済み値で置き換えるのかを決めずに着手すると、互換性事故になりやすい。
- **error envelope の扱いを曖昧なままにすること**
  - `generate_reports` が runner の `{"error": ...}` をそのまま透過するのか、文脈付きメッセージに包み直すのかを先に固定すべき。
- **shape 検証の厳しさを決めずに実装すること**
  - 緩すぎると偽成功、厳しすぎると既存データ非互換になる。最低限どこを fail-fast にするか planning で明文化が必要。

## 6. 最低限必要なガード
- `generate_reports.py` に **runner 応答正規化関数** を置き、少なくとも以下を一箇所で判定する。
  - JSON デコード失敗
  - top-level `error` envelope
  - top-level / prompt / group / run ごとの最小 shape 妥当性
- JSON モードの失敗経路を **すべて `emit_error(...)` + `sys.exit(1)`** に統一する。
  - config 不在
  - config shape 不備
  - runner subprocess failure
  - runner error JSON
  - runner malformed JSON / malformed success payload
- `finalOutput` の扱いを固定する。
  - 一段 decode した正規化値を成功 JSON に載せるなら raw 値の扱いも決める
  - decode 不能時に成功扱いしない
- Markdown 生成は固定 group ID 前提を減らし、少なくとも config / runner 結果との整合を検証してから出力する。
- テストを最低でも以下まで拡張する。
  1. runner success JSON（`finalOutput` が JSON 文字列）
  2. runner error JSON（exit 0 でも error 扱い）
  3. runner malformed JSON
  4. config missing in JSON mode
  5. malformed success shape
- README に **実コマンド** と **JSON 成功/失敗例** を載せ、現行ファイル名と一致させる。

## 7. planning工程へ反映すべき修正
1. 最初のタスクを「runner 応答契約の明文化」に置く。
   - 成功 shape
   - error shape
   - `finalOutput` raw / normalized の扱い
2. 実装順序を「正規化レイヤ → エラー統一 → Markdown/JSON 出力調整 → テスト → README」に固定する。
3. 完了条件に「JSON モード失敗時は stdout が必ず parse 可能 JSON で、終了コードが非 0」を追加する。
4. 完了条件に「runner error envelope を偽成功にしない」を明記する。
5. 完了条件に「設定変更時も group 参照が壊れない、または壊れるなら明示的に fail する」を追加する。
6. 確認方法として `python3 -m unittest scripts.test_generate_reports scripts.test_ab_test_runner` と `python3 scripts/generate_reports.py --json ...` の成功/失敗両方を含める。

## この工程でやったこと
- 前工程成果物と現行コード/テスト/README を突き合わせ、Issue #115 の期待と現在の破綻点のズレを確認した。
- 「成功に見える失敗」「静かな失敗」「shape 崩れの偽成功」を中心に重大度付きで整理した。
- planning に落とし込める最低限のガードと停止条件を定義した。

## この工程でやっていないこと
- コード変更
- テスト追加・更新
- README 修正
- 実環境 E2E 実行

## 次工程への入力
- runner 応答の成功/失敗スキーマを先に固定すること
- `finalOutput` の正規化方針を raw 値との関係込みで決めること
- JSON モード失敗経路の統一を最優先で実装計画に入れること
- テスト追加対象を `runner error JSON` / `config missing` / malformed shape / `finalOutput` decode に固定すること

## リスク / 未解決事項
- `doc/cli_output_mode_requirements.md` ではエラー JSON 仕様が未確定寄りの記述で、Issue #115 の期待と軽く緊張関係がある。今回どちらを正とするかを planning で明示すべき。
- `test_results` の互換性方針を誤ると、human-readable 改善のための修正が machine-readable 契約破壊になる。
- group ID の一般化を今回スコープ外にする場合でも、「固定 ID 以外は明示的エラー」にするかどうかは判断が必要。
