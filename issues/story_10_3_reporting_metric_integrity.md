# ストーリー 10.3: レポート生成とメトリクス取得の堅牢化

## 概要
`generate_reports.py` が設定依存で失敗し、LLM メトリクスが常に 0 になる問題を解消します。A/B テスト一式の JSON 出力を安全に扱い、欠損設定時もユーザーに分かりやすいエラーを返します。

## 受け入れ条件
- [ ] `generate_reports.py` が `test_prompts` 欠落や空配列でも落ちず、明確なメッセージを返却する。
- [ ] `extract_metrics` が `discussionLog` に記録された新メトリクスを読み取り、平均応答時間が 0 以外で検証可能になる。
- [ ] `print(..., args.json)` のような誤った呼び出しが排除され、JSON モードの出力が壊れていないことをテストで保証する。

## 進め方のガイド
- 先に `discussionLog` へ必要なメトリクスを格納する変更を TypeScript 側で実施し、Python 側と同時にテストを整備してください。
- CLI スクリプトのログ制御は共通ヘルパーに寄せることで、将来のバグ再発を防げます。
- 失敗ケースの再現テストを優先的に追加し、CI で退行を検知できるようにしてください。

## 関連タスク
* [ ] [タスク 10.3.1: generate_reports のプロンプト選択とエラーハンドリング強化](task_10_3_1_guard_generate_reports_prompt_selection.md)
* [ ] [タスク 10.3.2: discussionLog へのメトリクス記録と Python 側抽出改善](task_10_3_2_capture_llm_latency_for_reports.md)
* [ ] [タスク 10.3.3: JSON モード出力のロギング統一](task_10_3_3_cleanup_cli_error_logging.md)

## 依存関係 / リスク
- `ab_test_runner.py` との出力契約を変更する場合、既存利用者への影響を確認する必要があります。
- メトリクスを `discussionLog` に追加すると JSON サイズが大きくなるため、必要に応じて圧縮やオプション化を検討してください。
