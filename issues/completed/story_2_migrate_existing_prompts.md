# ストーリー 2: 既存プロンプトの外部ファイルへの移行

## 概要

現在 `src/prompts.ts` にハードコードされているプロンプトを、外部化されたプロンプトファイル (`prompts/default_prompts.json`) へ移行する。

## 関連タスク

*   [タスク 2.1: `src/prompts.ts` からデフォルトプロンプトの抽出](task_2_1_extract_default_prompts.md)
*   [タスク 2.2: 抽出したプロンプトの `prompts/default_prompts.json` への書き込み](task_2_2_write_default_prompts_json.md)
*   [タスク 2.3: `src/prompts.ts` からハードコードされたプロンプトの削除](task_2_3_remove_hardcoded_prompts.md)
