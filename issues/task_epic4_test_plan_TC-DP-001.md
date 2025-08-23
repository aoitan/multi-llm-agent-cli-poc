# タスク: TC-DP-001 シナリオ識別とプロンプト選択の検証 (social_issues)

## 概要
ユーザープロンプト「日本の少子高齢化問題について議論してください」に対して、`social_issues`シナリオが正しく識別され、`prompts/social_issues_prompts.json`がロードされることを確認する。

## 目的
Epic 4で実装されたシナリオ識別ロジックと動的プロンプトローダーが期待通りに動作することを検証する。

## 受け入れ条件
*   CLIの出力（デバッグログ）で「Identified scenario: social_issues」が表示されること。
*   LLMの応答内容が、`prompts/social_issues_prompts.json`の内容に基づいていること（手動確認またはログ解析）。

## 作業手順
1.  以下のコマンドを実行する。
    `npm start --user-prompt "日本の少子高齢化問題について議論してください"`
2.  CLIの標準出力に「Identified scenario: social_issues」という行が含まれていることを確認する。
3.  LLMの応答内容が、社会問題に関する議論に適した内容であることを確認する。

## 関連情報
*   テストケースID: TC-DP-001
*   関連ファイル:
    *   `src/utils/scenarioIdentifier.ts`
    *   `src/utils/promptLoader.ts`
    *   `src/index.ts`
    *   `config/scenario_config.json`
    *   `prompts/social_issues_prompts.json`