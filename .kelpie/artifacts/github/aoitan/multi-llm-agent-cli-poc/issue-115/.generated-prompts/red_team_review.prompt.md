# Context

Issue Number: 115
Issue Source: github
GitHub Repo: aoitan/multi-llm-agent-cli-poc
Task Label: (not specified)
Artifact Directory: .kelpie/artifacts/github/aoitan/multi-llm-agent-cli-poc/issue-115
Working Directory: /workspace
Current Phase: red_team_review

# Issue

# GitHub Issue #115: タスク 7.3.2: generate_reports の出力整合性強化

- Repository: aoitan/multi-llm-agent-cli-poc
- URL: https://github.com/aoitan/multi-llm-agent-cli-poc/issues/115
- State: OPEN
- Author: aoitan
- Labels: task

## Body

Migrated from `issues/task_7_3_2_harden_generate_reports_output.md` on 2026-02-27.

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


# Instruction Files

- Runner: copilot
- Source template: /opt/kelpie/AGENTS.md
- `AGENTS.md`: existing file `AGENTS.md` already matches the kelpie template.
- `.github/copilot-instructions.md`: repository already has `.github/copilot-instructions.md`; kelpie copy staged at `.kelpie/instructions/.github/copilot-instructions.md`.
- If multiple instruction files exist, read all of them before acting.

# Instruction Precedence

1. User directives in the current conversation
2. Instruction files that already existed in the target repository
3. Additional kelpie-staged instruction files created for this run
4. The current phase prompt and phase skill

# AGENTS.md

# AGENTS.md

このリポジトリでは、CLIエージェントに「1工程ずつ」仕事をさせる。

目的は、単発の巨大プロンプトで全部やらせるのではなく、
以下の工程を順番に実行し、各工程の成果物を明示的に残すこと。

1. prototype planning
2. prototyping
3. red team review
4. planning
5. implementation
6. review/fix loop
7. pull request

---

## 基本ルール

- 常に **Issue** または **Manual Task** を起点に作業する。
- Issue がある場合、主ソースは **GitHub Issues** を優先する。
- 必要に応じて Issue コメントも入力に含める。Issue がない場合は手動タスク文脈、関連コード、既存ドキュメントを入力に含める。
- 1回の工程では **その工程の責務だけ** を実施する。
- 次工程に必要な情報は、必ず成果物として `.kelpie/artifacts/` に残す。
- 不明点があっても作業停止を最小化し、妥当な仮定を明示して前進する。
- 破壊的変更・依存追加・権限変更・外部送信を伴う場合は理由を成果物に記録する。
- 実装より前に、少なくとも一度は失敗条件・非目標・既知リスクを書く。
- 各工程では、対応する `skills/<phase>/SKILL.md` を必ず読む前提で行動する。
- 各工程終了時に、最低限以下を出力する:
  - 何をやったか
  - 何をやっていないか
  - 次工程への入力
  - リスク / 未解決事項

---

## ディレクトリ規約

```text
.kelpie/
  .gitignore
  instructions/
  artifacts/
    github/
      owner/
        repo/
          issue-xx/
            01-prototype-planning.md
            02-prototype-summary.md
            03-red-team-review.md
            04-plan.md
            05-implementation-notes.md
            06-review-fix-loop.md
            07-pr-draft.md
            .issue-cache/
              issue.json
              issue_comments.json
            intent-records/
            checks/
    manual/
      local/
        task-xxxx/
          01-prototype-planning.md
          02-prototype-summary.md
          03-red-team-review.md
          04-plan.md
          05-implementation-notes.md
          06-review-fix-loop.md
          07-pr-draft.md
          intent-records/
          checks/
```

`.kelpie/artifacts/.../issue-xx/` または `.kelpie/artifacts/.../task-xxxx/` 配下に工程ごとの成果物を残す。

---

## 工程ごとの責務

### 1) prototype planning
目的:
- 問題の理解を揃える
- 最小プロトタイプの範囲を決める
- 成否判定を簡単に定義する

出力:
- `01-prototype-planning.md`

やること:
- GitHub Issue または Manual Task を要約
- 要件 / 非要件 / 仮定 / リスク整理
- 最小スパイク案を 1〜3 個提案
- 最初に作る試作品を 1 つに絞る
- 何を捨てるか明記

### 2) prototyping
目的:
- 捨てやすい実験で見通しを得る

出力:
- `02-prototype-summary.md`
- 必要なら試作コード

やること:
- 本実装前提にせず、最短で仮説検証
- 設計の美しさより学習速度を優先
- 試したこと / わかったこと / 無理だったことを記録

### 3) red team review
目的:
- 試作や計画の危険点を先に炙る

出力:
- `03-red-team-review.md`

やること:
- 想定破綻点、誤用、過信、見落としを列挙
- 仕様の穴、セキュリティ、運用事故、UX事故、保守性を点検
- 「このまま進めるなら最低限必要なガード」を提案

### 4) planning
目的:
- 実装可能な計画に落とす

出力:
- `04-plan.md`

やること:
- タスク分解
- 依存関係整理
- 実装順序決定
- 完了条件と確認方法の明記

### 5) implementation
目的:
- 計画に従って実装する

出力:
- コード変更
- `05-implementation-notes.md`

やること:
- 1回で全部盛りしない
- 計画との差分が出たら理由を書く
- 追加したファイル、主要変更点、未対応点を残す

### 6) review/fix loop
目的:
- 実装品質を上げる

出力:
- `06-review-fix-loop.md`

やること:
- レビュー
- 問題の優先度付け
- 修正
- 再確認
- ループを定義回数または収束条件まで回す

### 7) pull request
目的:
- 人間がレビューしやすいPR材料を揃える

出力:
- `07-pr-draft.md`

やること:
- 変更概要
- 背景
- 変更点
- テスト
- 残課題
- レビューポイント

---

## エージェントへの共通指示

- 大きく迷ったら、抽象議論を伸ばしすぎず、現時点で妥当な選択肢を1つ採る。
- 不確実性は消さずに記録する。
- できるだけ小さい差分を積む。
- GitHub Issue 本文とコメントがある場合は、そのうち実装判断に効く文脈を優先して使う。
- Issue がない、または Issue だけで足りない場合は、リポジトリ内の関連コード・既存ドキュメント・過去成果物で補完する。
- 自動チェック可能な点は常に意識する。
- 将来 `Intent Record` と `機械チェック` が差し込まれる前提で、判断理由を工程単位で残す。

---

## 各工程で参照する入力

- GitHub Issue 本文、または Manual Task Context
- 必要に応じて GitHub Issue コメント
- `AGENTS.md`
- 対応工程の `skills/<phase>/SKILL.md`
- 対応工程の `prompts/*.md`
- それ以前の工程で生成された `.kelpie/artifacts/.../issue-xx/*` または `.kelpie/artifacts/.../task-xxxx/*`

---

## 失敗時の扱い

- 失敗を隠さない。
- 途中で詰まった場合も、
  - どこまで進んだか
  - 何が障害か
  - 次に人間が判断すべき点
  を成果物に残して終了する。


# Phase Prompt

# red team review prompt

あなたはレッドチームレビュー担当です。

必ず以下を守ってください。

- GitHub Issue または Manual Task Context に書かれた期待と実際の試作内容のズレも点検する
- `AGENTS.md` と `skills/red-team-review/SKILL.md` に従う
- 実装を褒めるのではなく壊す観点で見る
- 見つけた懸念は重大度と起こり方を書く
- 不確実でも、事故になりうるものは候補として挙げる
- 最後に成果物 `.kelpie/artifacts/github/aoitan/multi-llm-agent-cli-poc/issue-115/03-red-team-review.md` を更新する

出力に必ず含める項目:

1. 対象
2. 前提
3. 主要な懸念点一覧
4. 各懸念の重大度 / 発生条件 / 影響
5. 進行を止めるべき論点
6. 最低限必要なガード
7. planning工程へ反映すべき修正


# Phase Skill

---
name: red-team-review
description: Review a design, prototype, or plan from a failure-focused perspective and surface concrete risks, impacts, and minimum safeguards.
---

# SKILL: red team review

## 目的
設計・試作・計画の危険点を事前に洗い出し、事故コストを下げる。

## この工程で重視すること
- 悪用可能性
- 想定外入力
- 誤解を生むUX
- セキュリティ / 安定性 / 運用性
- 保守性

## 手順
1. 何が壊れると痛いか考える
2. どう壊れるかを具体化する
3. 影響範囲を見積もる
4. 最低限必要なガードを提案する
5. planning に反映すべき項目へ落とす

## 避けること
- 表面的な褒めレビュー
- 重大度の区別がない列挙
- 対策なしの不安喚起

## 成果物チェック
- 懸念ごとに発生条件があるか
- 重大度が書かれているか
- 最低限のガードが提案されているか
- 次工程へ反映可能な粒度か



# Previous Artifacts

## 01-prototype-planning.md

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


## 02-prototype-summary.md

# Issue #115 Prototype Summary

## 1. 実験したこと
- 既存コード (`scripts/generate_reports.py`, `scripts/ab_test_runner.py`) と既存テスト (`scripts/test_generate_reports.py`, `scripts/test_ab_test_runner.py`) を読み、JSON モードの成功/失敗分岐を確認した。
- 既存 Python テストを `python3 -m unittest scripts.test_generate_reports scripts.test_ab_test_runner` で実行し、現行の期待値を固定した。
- `generate_reports.main()` を `--json` でモック実行し、以下 4 ケースを観測した。
  1. current runner 互換の成功 JSON
  2. runner が `{"error": {...}}` を stdout に返すケース
  3. runner が不正 JSON を返すケース
  4. config ファイル欠落ケース

## 2. 実装または検証内容
- 成功ケースでは、`ab_test_runner.py` が現在返している `finalOutput: json.dumps(summary)` 形状をそのまま `generate_reports.py` に渡した。
- 失敗ケースでは、`subprocess.run(..., check=True)` が例外化するパスだけでなく、exit code 0 のまま error JSON を返すパスも試した。
- config 欠落時は `os.path.exists(args.config) == False` を作り、JSON モードでの stdout と終了コードを確認した。

## 3. 観測結果
- **成功 JSON は読めるが、`finalOutput` が二重エンコードのまま通る。**
  - `test_results.*.*.run_1.finalOutput` は `"\"control summary\""` のような文字列になる。
  - `report_content_markdown` にも `\"control summary\"` のような quoted text がそのまま埋め込まれる。
- **runner の error JSON を成功データとして誤解釈する。**
  - `{"error": {"message": "runner failed"}}` を受けると exit 0 のまま `test_results.error` を持つ成功 JSON を返し、Markdown も `### プロンプト: error` / `N/A` で生成される。
  - つまり「error envelope 判定」が `generate_reports.py` 側に必要。
- **不正 JSON は JSON エラーとして返せている。**
  - JSON モードでは `{"error": {"message": "Failed to parse A/B test results as JSON."}}` を返し、exit 1 になる。
- **config 欠落は JSON モードで壊れている。**
  - stdout は空、exit code は 0。
  - `emit_error()` が使われず、JSON モードでも構造化エラーも非 0 終了も保証されていない。
- **既存テストは通るが、今回の境界は未カバー。**
  - 既存テストは `test_prompts` 不備や不正 JSON は見ているが、`runner error JSON` と `finalOutput 正規化` は見ていない。
- **README の個別テスト手順が現実とズレている。**
  - README は `python3 scripts/generate_reports.test.py` と書いているが、実ファイルは `scripts/test_generate_reports.py`。

## 4. 使えそうな方針
- `generate_reports.py` に **runner 応答の正規化関数** を 1 つ置き、以下を一括判定する。
  1. JSON デコード失敗
  2. top-level に `error` を持つ error envelope
  3. 正常な `prompt_id -> group_id -> run_n` 形状
- `finalOutput` は **JSON 文字列なら一段 decode** してから Markdown 用と JSON 出力用の双方に使う。
  - 文字列以外や decode 不能な値は明示的に異常扱いするか、少なくとも方針を固定する。
- JSON モードの失敗はすべて `emit_error(...) + sys.exit(1)` に寄せる。
  - config 不在
  - config shape 不備
  - runner subprocess failure
  - runner error JSON
  - runner invalid JSON
- 次工程の代表テストは少なくとも以下が必要。
  1. runner success JSON（`finalOutput` が JSON 文字列）
  2. runner error JSON（exit 0 でも error 扱い）
  3. runner invalid JSON
  4. config missing in JSON mode

## 5. 捨てる方針
- `runner 側が非 0 終了するケースだけ見れば十分` という前提は捨てる。
  - 新仕様では stdout の error JSON も契約に入るため、return code だけでは判定できない。
- `generate_reports.py` 側で top-level structure を見ずに素通しする方針は捨てる。
- `finalOutput` の quoted 表示を現状仕様として受け入れる方針は捨てる。
  - Markdown と JSON の再利用性を考えると、少なくとも正規化方針の明文化が必要。

## 6. 本実装へ持ち込むべき知見
- 実装修正の中心は **「subprocess 呼び出し」ではなく「runner 応答の正規化レイヤ」**。
- `emit_error()` はすでにあるので、新規仕組みより **JSON モード失敗経路の統一** が効果的。
- 既存テストは `main()` のモック実行パターンが揃っているため、同じ流儀でケース追加すれば差分は小さい。
- README / CLI 手順の更新は、実ファイル名と実行コマンドのズレ修正が最小かつ必要十分。

## 7. 未解決事項
- `generate_reports.py` の成功 JSON において、`test_results` の `finalOutput` を
  - 正規化済み文字列へ置き換えるか
  - runner 生データを残しつつ別フィールドを足すか
  の最終契約は implementation で決める必要がある。
- runner error JSON を `generate_reports.py` がそのまま透過するか、`generate_reports` 文脈のメッセージに包み直すかは未確定。
- `test_groups` / `run_n` の shape 検証をどこまで厳密にやるかは未確定。

## この工程でやったこと
- 既存コード・既存テスト・README・関連 Issue を確認した。
- 自動テストの現状を把握し、4 ケースの試作観測を実施した。
- 次工程で必要な分岐条件と追加テスト候補を具体化した。

## この工程でやっていないこと
- 本実装のコード変更
- テストファイル更新
- README / ドキュメント修正
- Ollama / `node dist/index.js` を使った実環境 E2E 実行

## 次工程への入力
- `scripts/generate_reports.py` に runner 応答正規化を追加する。
- `scripts/test_generate_reports.py` に `runner error JSON` / `config missing JSON mode` / `finalOutput decode` ケースを追加する。
- README の個別テスト手順と `generate_reports --json` の期待出力例を更新する。

## リスク / 未解決事項
- `finalOutput` の正規化方針を曖昧にしたまま実装すると、JSON 出力互換性を別方向で壊す可能性がある。
- success shape の厳密検証を入れすぎると既存データとの互換性を落とす可能性があるため、最低限どこまで validate するかを planning で決める必要がある。


# Execution Notes

- Work inside the repository at: /workspace
- Update files directly when appropriate.
- Prefer small, reviewable diffs.
- Leave explicit notes when blocked or uncertain.
- Read and follow any instruction files listed above before making changes.
