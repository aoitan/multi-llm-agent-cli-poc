# タスク 10.1.1: 協調 CLI の欠落 API を補完

## 概要
`src/cooperativeAgentEval.ts` から呼び出される `conductConsultation` が削除されているため CLI が即時に失敗しています。現行のワークフローモジュールを利用する形で CLI を復旧します。

## 目的
協調エージェント評価を再び利用可能にし、今後の改善作業の足場とする。

## 受け入れ条件
- [ ] `npm run build` がエラーなく通過する。
- [ ] `ts-node src/cooperativeAgentEval.ts "<prompt>"` 実行で協調フローが完走し、JSON/テキスト両モードを確認する。
- [ ] 回帰テスト (TypeScript) が追加され、CLI の主要パスを検証する。

## 作業手順
1. [ ] CLI の要求仕様を整理し、`orchestrateWorkflow` など再利用可能な API にマッピングする。
2. [ ] 必要なデータロード処理を追加し、`finalSummary` と `discussionLog` を生成する。
3. [ ] 回帰テストを整備し、CI で動作するようモックを導入する。

## 検証 / テスト
- `npm run build`
- `npm test -- cooperativeAgentEval`
- 必要に応じて手動 CLI 実行

## アウトプット
- 更新された `src/cooperativeAgentEval.ts`
- 追加されたテストコード

## 関連情報
- `src/agent.ts`
- `config/workflow_config.json`
