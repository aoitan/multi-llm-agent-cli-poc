# タスク 2.3: `src/prompts.ts` からハードコードされたプロンプトの削除

## 概要

`prompts/default_prompts.json` へのプロンプト移行が完了した後、`src/prompts.ts` からハードコードされたプロンプト定義を削除する。

## 目的

プロンプトの外部化要件 (REQ-PM-001) を完全に満たす。

## 受け入れ条件

*   `src/prompts.ts` ファイルから `THINKER_PROMPT`, `CRITIC_PROMPT`, `IMPROVER_PROMPT` の定義が削除されていること。
*   `src/prompts.ts` ファイルが、これらの定数を使用している箇所でエラーにならないよう、適切に修正されていること（例: 外部ファイルからプロンプトを読み込むように変更）。

## 作業手順

1.  `src/prompts.ts` を開く。
2.  `export const THINKER_PROMPT = ...;`, `export const CRITIC_PROMPT = ...;`, `export const IMPROVER_PROMPT = ...;` の行を削除する。
3.  これらの定数を使用している箇所があれば、新しいプロンプト読み込みロジックからの値を使用するように修正する。

## 備考

*   このタスクは、プロンプト読み込み機能の実装後に行う必要がある。
