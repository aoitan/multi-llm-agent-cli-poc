# タスク: TC-WF-002 動的ワークフロー選択の検証 (technology)

## 概要
ユーザープロンプト「AIの最新動向について教えてください」に対して、`technology`シナリオが識別され、`parallel_qa_and_summarize`ワークフローが選択・実行されることを確認する。

## 目的
Epic 4で実装された動的ワークフロー選択ロジックが期待通りに動作することを検証する。

## 受け入れ条件
*   CLIの出力（デバッグログ）で、`parallel_qa_and_summarize`ワークフローが実行されたことを示すログ（例: `## Step 1: parallel_qa_step (multi_agent_interaction)`）が含まれていること。
*   LLMの応答内容が、並列QAと要約のプロセスに沿っていること（手動確認またはログ解析）。

## 作業手順
1.  以下のコマンドを実行する。
    `npm start --user-prompt "AIの最新動向について教えてください"`
2.  CLIの標準出力に、`parallel_qa_and_summarize`ワークフローのステップを示すログが含まれていることを確認する。
3.  LLMの応答内容が、並列QAと要約のプロセスに沿ったものであることを確認する。

## 関連情報
*   テストケースID: TC-WF-002
*   関連ファイル:
    *   `src/index.ts`
    *   `src/utils/scenarioIdentifier.ts`
    *   `src/utils/workflowLoader.ts`
    *   `config/scenario_config.json`
    *   `config/workflow_config.json`