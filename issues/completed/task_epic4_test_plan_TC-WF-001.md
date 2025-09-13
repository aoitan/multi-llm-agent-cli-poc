# タスク: TC-WF-001 動的ワークフロー選択の検証 (social_issues)

## 概要
ユーザープロンプト「日本の少子高齢化問題について議論してください」に対して、`social_issues`シナリオが識別され、`code_review_and_refactor`ワークフローが選択・実行されることを確認する。

## 目的
Epic 4で実装された動的ワークフロー選択ロジックが期待通りに動作することを検証する。

## 受け入れ条件
*   CLIの出力（デバッグログ）で、`code_review_and_refactor`ワークフローが実行されたことを示すログ（例: `## Step 1: review_step (agent_interaction)`）が含まれていること。
*   LLMの応答内容が、コードレビューとリファクタリングのプロセスに沿っていること（手動確認またはログ解析）。

## 作業手順
1.  以下のコマンドを実行する。
    `npm start --user-prompt "日本の少子高齢化問題について議論してください"`
2.  CLIの標準出力に、`code_review_and_refactor`ワークフローのステップを示すログが含まれていることを確認する。
3.  LLMの応答内容が、コードレビューとリファクタリングのプロセスに沿ったものであることを確認する。

## 関連情報
*   テストケースID: TC-WF-001
*   関連ファイル:
    *   `src/index.ts`
    *   `src/utils/scenarioIdentifier.ts`
    *   `src/utils/workflowLoader.ts`
    *   `config/scenario_config.json`
    *   `config/workflow_config.json`