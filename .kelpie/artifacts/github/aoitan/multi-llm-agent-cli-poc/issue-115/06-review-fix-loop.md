# Issue #115 Review / Fix Loop

## ループ 1
1. **発見事項**  
   `scripts/generate_reports.py` は `ab_test_runner.py` が非 0 終了しつつ stdout に `{"error": {...}}` を返した場合、runner 側の具体的なエラー内容を捨てて単なる exit code メッセージに丸めていた。Issue #115 の「runner の JSON 出力仕様変更に合わせる」という観点では、失敗時の JSON 契約解釈が一段不足していた。
2. **重大度**  
   High
3. **対応内容**  
   `get_runner_failure_message()` を追加し、`subprocess.CalledProcessError` の `stdout` が error JSON のときは `A/B test runner reported an error: ...` として伝播するように修正した。あわせて `scripts/test_generate_reports.py` に、非 0 終了 + error JSON stdout のケースを追加した。
4. **再確認結果**  
   `python3 -m unittest scripts.test_generate_reports scripts.test_ab_test_runner` が成功。既存の JSON 失敗経路に加え、runner error JSON を伴う subprocess failure でも構造化エラーが返ることを確認した。
5. **残件**  
   機能要件に直接は影響しないが、`extract_metrics()` の戻り値型アノテーションと実値のずれが残っていた。
6. **収束判断**  
   追加修正が必要。次ループで型整合性のみ局所修正する。

## ループ 2
1. **発見事項**  
   `extract_metrics()` の戻り値型アノテーションが `dict[str, float]` だったが、実際には `num_llm_calls` は `int`、`avg_response_time_ms` のゼロ件時既定値も `int` になりうるため、型注釈と実装が一致していなかった。
2. **重大度**  
   Low
3. **対応内容**  
   戻り値型を `dict[str, float | int]` に修正し、`avg_response_time_ms` の既定値を `0.0` にそろえた。
4. **再確認結果**  
   `python3 -m unittest scripts.test_generate_reports scripts.test_ab_test_runner` が再度成功。コードレビューでも、受け入れ条件に影響する追加欠陥は確認されなかった。
5. **残件**  
   なし
6. **収束判断**  
   収束。Issue #115 の受け入れ条件に照らして、追加修正が必要な欠陥は残っていない。

## この工程でやったこと
- 実装差分を受け入れ条件ベースでレビューした。
- runner error JSON が非 0 終了経路で失われる問題を修正し、回帰テストを追加した。
- 型アノテーションの局所的不整合を修正した。
- Python テスト群で再確認した。

## この工程でやっていないこと
- `ab_test_runner.py` 自体の追加変更
- Ollama / `node dist/index.js` を使う実環境 E2E 成功確認
- PR 文面作成

## 次工程への入力
- 更新済みコード:
  - `scripts/generate_reports.py`
  - `scripts/test_generate_reports.py`
  - `README.md`
- 確認コマンド:
  - `python3 -m unittest scripts.test_generate_reports scripts.test_ab_test_runner`
- このレビュー結果を踏まえ、PR では「JSON モードの失敗経路が generate_reports / ab_test_runner 間で一貫した」点を重点的に説明する。

## リスク / 未解決事項
- 実環境の成功系 CLI は Ollama / Node ビルド依存のため、この工程ではモックベース確認を主とした。
- 任意件数 group の汎化は引き続きスコープ外で、現実装は 2 group 前提を明示的に検証する方針のまま。
