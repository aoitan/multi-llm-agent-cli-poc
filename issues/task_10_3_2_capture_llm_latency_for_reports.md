# タスク 10.3.2: discussionLog へのメトリクス記録と Python 側抽出改善

## 概要
`extract_metrics` が `discussionLog` から応答時間を取得する設計だが、実際にはログに記録されず平均時間が常に 0 になります。TypeScript 側で必要なメトリクスを記録し、Python 側で読み取る実装に更新します。

## 目的
レポートの定量指標を信頼できる形で提供し、A/B テストの効果測定に活用できるようにする。

## 受け入れ条件
- [ ] `orchestrateWorkflow` 実行時に、`discussionLog` または同等の構造に応答時間・呼び出し回数が記録される。
- [ ] `extract_metrics` が新しい構造を解析し、テストで平均応答時間と呼び出し回数が正しく算出される。
- [ ] 追加情報により JSON 出力仕様が変わる場合、ドキュメントと利用コードが更新されている。

## 作業手順
1. [ ] TypeScript 側で LLM コールの開始・終了時間を取得し、`discussionLog` に付帯情報として格納する。
2. [ ] `generate_reports.py` の `extract_metrics` を更新し、新メトリクスを解析できるようにする。
3. [ ] テスト (`generate_reports.test.py` など) を拡張し、メトリクスが 0 にならないケースを検証する。

## 検証 / テスト
- `npm test` (新しいメトリクスの回帰テスト)
- `python3 -m pytest scripts/generate_reports.test.py`

## アウトプット
- 更新された `src/agent.ts`（または新モジュール）
- 更新された `scripts/generate_reports.py`
- 追加されたテストケース

## 関連情報
- タスク 10.3.1
- `scripts/generate_reports.py` のメトリクス仕様
