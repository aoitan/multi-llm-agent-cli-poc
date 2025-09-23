# ストーリー 7.3: CLI スクリプトの JSON 出力信頼性向上

## 概要
A/B テストおよびレポート生成スクリプトで JSON モード時に標準出力へ非 JSON 文字列が混入する問題を解消し、スクリプトを CI から安全に呼び出せるようにします。

## 受け入れ条件
- [ ] `scripts/ab_test_runner.py` のエラー/例外時でも JSON 形式の応答が保証され、標準出力に余分な文字列が混入しない。
- [ ] `scripts/generate_reports.py` が `ab_test_runner.py` の更新に追従し、JSON モードで機械可読な出力を維持する。
- [ ] 上記挙動を確認する Python テスト (単体または統合) が追加され、CI で自動実行できる。
- [ ] CLI テストの実行手順が `README` または `doc/` に明記されている。

## 進め方のガイド
- `logging` ユーティリティを拡張して JSON モード時は構造化レスポンスを返す仕組みに統一してください。
- 既存の `generate_reports.test.py` を拡張し、エラーケースや JSON モードの整合性も検証するのが望ましいです。
- Python テストを npm スクリプトまたは GitHub Actions に組み込めるよう、実行方法を整理してください。

## 関連タスク
* [ ] [タスク 7.3.1: ab_test_runner の JSON ロギング改善とテスト追加](task_7_3_1_fix_ab_test_runner_logging.md)
* [ ] [タスク 7.3.2: generate_reports の出力整合性強化](task_7_3_2_harden_generate_reports_output.md)

## 依存関係 / リスク
- Python ランタイムや依存パッケージが CI に無い場合は準備が必要。
- JSON 仕様の変更が既存利用者に影響する可能性があるため、互換性を調整する。
