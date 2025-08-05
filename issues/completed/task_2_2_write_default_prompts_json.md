# タスク 2.2: 抽出したプロンプトの `prompts/default_prompts.json` への書き込み

## 概要

`task_2_1_extract_default_prompts.md` で抽出したプロンプトテキストを、要件定義されたJSON形式 (`prompts/default_prompts.json`) で書き込む。

## 目的

既存プロンプトを外部ファイルへ移行する要件 (REQ-PM-001, REQ-PM-002, REQ-PM-003, REQ-PM-004, REQ-PM-005, REQ-PM-006, REQ-PM-007) を満たす。

## 受け入れ条件

*   `prompts/` ディレクトリ内に `default_prompts.json` ファイルが作成されていること。
*   `default_prompts.json` ファイルが以下のJSON構造に従っていること。
    *   `format_version` プロパティが存在し、文字列 "1.0" であること。
    *   `prompts` プロパティが存在し、配列であること。
    *   `prompts` 配列に以下の3つのプロンプト定義が含まれていること。
        *   `id`: `thought_agent_default`, `description`: "思考者エージェント用デフォルトプロンプト", `content`: 抽出された思考者プロンプトテキスト
        *   `id`: `critic_agent_default`, `description`: "批判的レビュアーエージェント用デフォルトプロンプト", `content`: 抽出された批判的レビュアープロンプトテキスト
        *   `id`: `improver_agent_default`, `description`: "指摘改善者エージェント用デフォルトプロンプト", `content`: 抽出された指摘改善者プロンプトテキスト
*   `default_prompts.json` ファイルが適切に整形（インデントなど）されていること。

## 作業手順

1.  `task_2_1_extract_default_prompts.md` で抽出したプロンプトテキストを変数に格納する。
2.  以下のJSON構造を構築する。

```json
{
  "format_version": "1.0",
  "prompts": [
    {
      "id": "thought_agent_default",
      "description": "思考者エージェント用デフォルトプロンプト",
      "content": "<抽出された思考者プロンプトテキスト>"
    },
    {
      "id": "critic_agent_default",
      "description": "批判的レビュアーエージェント用デフォルトプロンプト",
      "content": "<抽出された批判的レビュアープロンプトテキスト>"
    },
    {
      "id": "improver_agent_default",
      "description": "指摘改善者エージェント用デフォルトプロンプト",
      "content": "<抽出された指摘改善者プロンプトテキスト>"
    }
  ]
}
```

3.  構築したJSONデータを `prompts/default_prompts.json` として書き込む。

## 備考

*   このファイルは、設定ファイルでプロンプトファイルが指定されない場合のデフォルトとして使用される (REQ-PM-011)。
