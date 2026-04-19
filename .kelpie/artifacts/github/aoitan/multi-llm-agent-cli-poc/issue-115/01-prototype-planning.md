# Issue #115 Prototype Planning

## 1. Issue / Task 理解の要約
`scripts/generate_reports.py` は `scripts/ab_test_runner.py --json` の結果を読み込んで Markdown レポートと JSON 出力を組み立てるが、現状は runner 側の JSON 仕様変更とエラー系の扱いに十分追従できていない。特に JSON モードでの失敗応答、config 不備時の終了経路、runner 出力のデシリアライズ前提を揃え直し、CI や他サービスから安全に再利用できる構造化出力へ寄せる必要がある。

## 2. 目的
- `generate_reports.py` が現行 `ab_test_runner.py` の JSON 形状を前提に、成功系と代表的失敗系で一貫した出力を返せるようにする。
- 次工程で実装すべき最小変更面を絞り込み、最初に確かめるべき不確実性を固定する。
- テストと CLI ドキュメントの更新対象を先に明文化する。

## 3. 非目的
- この工程で本実装やテスト修正は行わない。
- `ab_test_runner.py` 側の仕様再設計までは広げない。
- Markdown レポートの見た目改善やメトリクス定義の全面見直しは扱わない。
- 代表例を超える全異常系の洗い出しまでは行わない。

## 4. 仮定
- `ab_test_runner.py` の現在の JSON 成功レスポンスは、`{prompt_id -> group_id -> run_n -> {finalOutput, discussionLog}}` の入れ子構造を維持する。
- JSON モードの失敗レスポンスは少なくとも `{"error": {"message": ...}}` を返す方向で合わせる。
- `generate_reports.py` の利用者は JSON モード時に「常に JSON が返る」ことを優先し、非 JSON モードのログ詳細は副次的とみなす。
- `skills/prototype-planning/SKILL.md` は実ファイルとしては見当たらなかったため、Issue に埋め込まれた phase skill を正とする。

## 5. リスク
- `generate_reports.py` は現在 runner 成功 JSON だけを直接 `json.loads` しており、runner のエラー JSON を通常データとして誤解釈するリスクがある。
- config 不在時は `emit_error` を使わず plain log のみで return しており、JSON モードでも非 0 終了や構造化エラーが保証されない。
- runner 側の `finalOutput` は JSON 文字列化された summary を含むため、Markdown 出力と JSON 出力で二重エンコードや表現揺れが起きる可能性がある。
- テスト名・README 記載が古く、実行手順のドキュメント更新漏れが起こりやすい。

## 6. 候補プロトタイプ案

### 案A: fixture 駆動の入出力正規化スパイク
- `generate_reports.py` に渡る runner 成功 JSON / runner エラー JSON / 不正 JSON を小さな fixture として整理する。
- まず「どの入力を成功扱いし、どの入力を JSON エラー扱いするか」の境界だけを確定する。
- 学べること: 実装修正前に必要な判定分岐と JSON 応答契約。

### 案B: subprocess モック中心の CLI スパイク
- `subprocess.run` をモックし、`generate_reports.main()` を JSON / 非 JSON で呼んで stdout と exit code のみ観察する。
- 学べること: 呼び出し側視点の契約と、不要な print 混入箇所。

### 案C: ドキュメント先行の出力スキーマ整理
- README か `doc/` に想定 JSON 出力例を先に書き、コードはそれに合わせて後追いする。
- 学べること: 利用者視点の期待値。
- 弱み: 現行コードとの差分確認が遅れ、実装前の不確実性解消としては弱い。

## 7. 採用する案と理由
**採用案: 案A（fixture 駆動の入出力正規化スパイク）**

理由:
- このタスクの一番大きい不確実性は「runner の新フォーマットと失敗レスポンスを `generate_reports.py` がどう識別・正規化すべきか」であり、まずそこを最短で切り出すべきだから。
- subprocess や CLI 全体を先に触るより、成功 JSON / エラー JSON / 壊れた JSON の 3 パターンを固定したほうが、次工程の試作で学習量が大きく実装差分も小さい。
- その後に案B相当の軽い CLI 観察を重ねれば、stdout 純度と終了経路も確認できる。

## 8. 成否判定
- 最小試作で以下が明文化されること。
  1. runner 成功 JSON を `generate_reports.py` が受け入れる条件
  2. runner エラー JSON をレポート本体ではなくエラーとして扱う条件
  3. 壊れた JSON や config 不備時に、JSON モードではどの形で失敗応答を返すか
  4. 次工程で追加・更新する代表テストケース一覧
- 試作結果から、実装タスクが「パース正規化」「JSON エラー統一」「テスト拡張」「CLI ドキュメント更新」の 4 つに整理できること。

## 9. 次工程への入力
- 対象コード:
  - `scripts/generate_reports.py`
  - `scripts/ab_test_runner.py`
  - `scripts/test_generate_reports.py`
  - `scripts/test_ab_test_runner.py`
- 参照ドキュメント:
  - `README.md`
  - `doc/cli_output_mode_requirements.md`
  - `issues/task_7_3_1_fix_ab_test_runner_logging.md`
- 次工程で最初に用意する観察対象:
  - runner 成功 JSON 例
  - runner エラー JSON 例
  - runner 不正 JSON 例
  - config 欠落 / `test_prompts` 欠落時の期待応答

## この工程でやったこと
- Issue #115 と関連タスク 7.3.1、現行 `generate_reports.py` / `ab_test_runner.py` / 既存 Python テスト / CLI ドキュメントを確認した。
- 現時点の主要な不整合候補（config 不在時の非 JSON return、runner エラー JSON の誤解釈余地、ドキュメントの古さ）を整理した。
- 最初に試すべき最小プロトタイプを 1 つに絞った。

## この工程でやっていないこと
- コード変更
- テスト追加・更新
- CLI 実行による挙動確認
- ドキュメント修正

## リスク / 未解決事項
- runner の「新フォーマット」が issue 文面以上には明文化されておらず、実装時に成功 JSON とエラー JSON の最終契約を再確認する必要がある。
- `generate_reports.py` の JSON 成功レスポンスに何を最低限含めるべきか（Markdown を内包し続けるか）は次工程で判断が必要。
- README のテストコマンド表記は実ファイル名とズレているため、どこまで整理するかを implementation 前に決める必要がある。
