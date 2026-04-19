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
