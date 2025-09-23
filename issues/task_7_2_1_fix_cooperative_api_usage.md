# タスク 7.2.1: cooperativeAgentEval の API 整合性修正

## 概要
`src/cooperativeAgentEval.ts` が存在しない `conductConsultation` 関数を参照している問題を解消し、ビルドエラーなく CLI から呼び出せるようにする。

## 目的
CLI ツールが最新のワークフロー実装 (`orchestrateWorkflow` など) を正しく利用し、将来的な改善の基盤を整える。

## 受け入れ条件
- [ ] `npm run build` が成功し、`cooperativeAgentEval.ts` での import エラーが発生しない。
- [ ] 既存の協調評価用 CLI コマンドが、ワークフロー API を通じて同等以上の機能を提供する。
- [ ] 修正内容を示す回帰テスト (単体または統合) が追加されている。

## 作業手順
1. [ ] `cooperativeAgentEval.ts` の目的を確認し、最新 API に合わせたフローを設計する。
2. [ ] 必要であればワークフロー定義を再利用できるようリファクタする。
3. [ ] 新しい挙動を検証するテストケースを追加する。
4. [ ] `npm run build` および関連スクリプトを実行し、エラーが無いことを確認する。

## 検証 / テスト
- `npm run build`
- `npm test -- cooperativeAgentEval` (追加する場合)
- 手動での CLI 試験 (必要に応じて)

## アウトプット
- 更新された `src/cooperativeAgentEval.ts`
- 追加されたテストケース

## 関連情報
- `src/agent.ts` / 新規モジュール構成
- 既存の CLI 使用例 (README) 
