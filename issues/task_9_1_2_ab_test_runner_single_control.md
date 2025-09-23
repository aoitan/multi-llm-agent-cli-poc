# タスク 9.1.2: ab_test_runner 制御群ロジック拡張

## 概要
`scripts/ab_test_runner.py` に単体LLM制御群を実行する分岐を追加し、TypeScript ユーティリティを呼び出すか直接 Ollama API を叩く処理を実装する。

## 目的
A/B テストで制御群として単体LLMを選べるようにし、協調ワークフローと同様の出力を得る。

## 受け入れ条件
- [ ] `test_groups` の設定に `type: "single_llm"` (仮) を追加すると単体LLM実行が選択される。
- [ ] 単体LLM実行時は協調LLM用 CLI を呼ばず、新しいユーティリティ or 直接 API で結果を取得する。
- [ ] 出力フォーマットが協調LLMの結果と互換であり、`generate_reports.py` がそのまま扱える。
- [ ] Python テストで新しいグループタイプの挙動を検証する。

## 作業手順
1. [ ] 既存の `run_llm_consultation` 関数を拡張し、制御群用の処理を追加する。
2. [ ] TypeScript 側の新ユーティリティ呼び出し (または subprocess) を実装する。
3. [ ] テスト (モック) を追加し、単体LLMグループで期待する JSON が得られることを確認する。
4. [ ] `python3 scripts/ab_test_runner.py --json ...` で実行テストを行う。

## 検証 / テスト
- `python3 -m pytest` (新テスト含む)
- 手動での JSON モード実行確認

## アウトプット
- 更新された `scripts/ab_test_runner.py`
- 新規または更新されたテスト (`scripts/ab_test_runner.test.py` など)

## 関連情報
- タスク 9.1.1 の TypeScript ユーティリティ
- `config/ab_test_config.json`
