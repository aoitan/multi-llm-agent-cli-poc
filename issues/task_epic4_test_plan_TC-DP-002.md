# タスク: TC-DP-002 シナリオ識別とプロンプト選択の検証 (technology)

## 概要
ユーザープロンプト「AIの最新動向について教えてください」に対して、`technology`シナリオが正しく識別され、`prompts/technology_prompts.json`がロードされることを確認する。

## 目的
Epic 4で実装されたシナリオ識別ロジックと動的プロンプトローダーが期待通りに動作することを検証する。

## 受け入れ条件
*   CLIの出力（デバッグログ）で「Identified scenario: technology」が表示されること。
*   LLMの応答内容が、`prompts/technology_prompts.json`の内容に基づいていること（手動確認またはログ解析）。

## 作業手順
1.  以下のコマンドを実行する。
    `npm start --user-prompt "AIの最新動向について教えてください"`
2.  CLIの標準出力に「Identified scenario: technology」という行が含まれていることを確認する。
3.  LLMの応答内容が、技術に関する議論に適した内容であることを確認する。

## 関連情報
*   テストケースID: TC-DP-002
*   関連ファイル:
    *   `src/utils/scenarioIdentifier.ts`
    *   `src/utils/promptLoader.ts`
    *   `src/index.ts`
    *   `config/scenario_config.json`
    *   `prompts/technology_prompts.json`