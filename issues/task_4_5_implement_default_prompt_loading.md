# タスク 4.5: デフォルトプロンプトファイルのロードロジックの実装

## 概要

CLIで設定ファイルが指定されない場合、または設定ファイルに `prompt_file_path` が含まれない場合に、デフォルトのプロンプトファイル (`prompts/default_prompts.json`) をロードするロジックを実装する。

## 目的

デフォルトプロンプトのロード要件 (REQ-PM-011) を満たす。

## 受け入れ条件

*   CLIで設定ファイルが指定されない場合、`prompts/default_prompts.json` が自動的にロードされること。
*   ロードされたデフォルトプロンプトが、エージェントの対話で使用されること。
*   `prompts/default_prompts.json` が存在しない場合に、適切なエラーメッセージが表示され、処理が中断されること。

## 作業手順

1.  `src/index.ts` (CLIのエントリーポイント) を修正する。
2.  `task_4_4_implement_cli_config_loading.md` で実装したロジックに加えて、CLI引数で設定ファイルが指定されなかった場合の処理を追加する。
3.  その場合、`prompts/default_prompts.json` のパスを `task_3_1_implement_prompt_loader.md` で実装したプロンプト読み込み関数に渡す。
4.  ロードされたプロンプトを、エージェントの対話ロジックに渡すように修正する。
5.  エラーハンドリングを実装する。

## 備考

*   このタスクは、`task_3_1_implement_prompt_loader.md` と `task_4_4_implement_cli_config_loading.md` が完了していることを前提とする。
