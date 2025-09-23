# タスク 9.1.1: TypeScript 単体LLM実行ユーティリティ実装

## 概要
Ollama へ単体リクエストを送り、`orchestrateWorkflow` と同形式の JSON を返すユーティリティを TypeScript 側に実装する。既存コードとの再利用性を高め、制御群から呼び出せるようにする。

## 目的
A/B テスト制御群が協調ワークフローと比較可能な構造化データを得られるようにする。

## 受け入れ条件
- [ ] `runSingleModelEvaluation` (仮称) がユーザープロンプトとモデルを受け取り、`finalOutput` と `discussionLog` を返す。
- [ ] JSON 出力フォーマットが `orchestrateWorkflow` の返り値と互換である (キー名、構造)。
- [ ] エラー時には `chatWithOllama` からの例外を補足し、わかりやすいメッセージを返す。
- [ ] ユニットテストで正常系 / エラー系をカバーする。

## 作業手順
1. [ ] 既存の `runEnsemble` などを参考に単体実行用のユーティリティを追加する。
2. [ ] 出力フォーマットを定義し、サマリーログを簡易生成する。
3. [ ] テストを追加し、モックした `chatWithOllama` で挙動を検証する。
4. [ ] `npm test -- single` などを実行し、グリーンであることを確認する。

## 検証 / テスト
- `npm test` (対象テスト含む)
- 必要に応じて ESLint / TypeScript ビルド

## アウトプット
- 新規ユーティリティファイル (例: `src/singleModelRunner.ts`)
- 追加されたテスト (`src/__tests__/singleModelRunner.test.ts` など)

## 関連情報
- `src/agent.ts` の `orchestrateWorkflow`
- `src/ollamaApi.ts`
