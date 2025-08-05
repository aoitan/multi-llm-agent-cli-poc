# タスク 2.1: `src/prompts.ts` からデフォルトプロンプトの抽出

## 概要

現在 `src/prompts.ts` にハードコードされている思考者、批判的レビュアー、指摘改善者のプロンプトテキストを抽出する。

## 目的

既存プロンプトを外部ファイルへ移行するための準備。

## 受け入れ条件

*   `src/prompts.ts` ファイルの内容が読み込まれ、以下のプロンプトテキストが特定されていること。
    *   思考者 (`THINKER_PROMPT`)
    *   批判的レビュアー (`CRITIC_PROMPT`)
    *   指摘改善者 (`IMPROVER_PROMPT`)
*   抽出されたプロンプトテキストが、後続のタスクで利用可能な形式（例: 変数に格納）で準備されていること。

## 作業手順

1.  `src/prompts.ts` の内容を読み込む。
2.  ファイル内の `THINKER_PROMPT`, `CRITIC_PROMPT`, `IMPROVER_PROMPT` の定義を探し、それぞれの文字列値を抽出する。

## 備考

*   抽出されたプロンプトテキストは、次のタスク (`task_2_2_write_default_prompts_json.md`) で `prompts/default_prompts.json` に書き込まれる。
