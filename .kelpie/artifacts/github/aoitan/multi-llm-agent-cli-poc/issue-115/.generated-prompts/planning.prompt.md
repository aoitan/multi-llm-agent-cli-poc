# Context

Issue Number: 115
Issue Source: github
GitHub Repo: aoitan/multi-llm-agent-cli-poc
Task Label: (not specified)
Artifact Directory: .kelpie/artifacts/github/aoitan/multi-llm-agent-cli-poc/issue-115
Working Directory: /workspace
Current Phase: planning

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

# planning prompt

あなたは実装計画担当です。

必ず以下を守ってください。

- GitHub Issue または Manual Task Context の要求と red team review のガードを両方反映する
- `AGENTS.md` と `skills/planning/SKILL.md` に従う
- prototype planning / prototyping / red team review の成果物を入力として使う
- 実装可能な粒度までタスク分解する
- 依存関係と実装順序を明示する
- 人間または機械が確認できる完了条件を書く
- 最後に成果物 `.kelpie/artifacts/github/aoitan/multi-llm-agent-cli-poc/issue-115/04-plan.md` を更新する

出力に必ず含める項目:

1. 目的
2. スコープ
3. 非スコープ
4. タスク一覧
5. タスク依存関係
6. 実装順序
7. チェック方法
8. リスク対応
9. 実装担当への申し送り


# Phase Skill

---
name: planning
description: Turn issue or manual task context and prior findings into an implementation plan with scoped tasks, dependencies, validation steps, and risks.
---

# SKILL: planning

## 目的
知見と懸念を踏まえて、実装可能な順序と確認可能なタスクへ落とす。

## この工程で重視すること
- タスクの独立性
- 依存関係の可視化
- 完了条件の明確さ
- チェック容易性

## 手順
1. スコープと非スコープを確定する
2. タスク分解する
3. 依存関係を書く
4. 実装順を決める
5. 各タスクの確認方法を書く
6. リスク対応を紐付ける

## 避けること
- 実装者しか分からない抽象計画
- 依存関係不明のタスクリスト
- 確認方法のない完了条件

## 成果物チェック
- タスクが行動単位になっているか
- 順番の理由があるか
- 各タスクの確認方法があるか
- red team review の反映があるか


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


## 03-red-team-review.md

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


# Execution Notes

- Work inside the repository at: /workspace
- Update files directly when appropriate.
- Prefer small, reviewable diffs.
- Leave explicit notes when blocked or uncertain.
- Read and follow any instruction files listed above before making changes.
