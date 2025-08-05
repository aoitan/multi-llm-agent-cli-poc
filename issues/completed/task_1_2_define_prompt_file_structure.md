# タスク 1.2: プロンプトファイル構造の定義とサンプルファイルの作成

## 概要

プロンプトファイルのJSON構造を定義し、その定義に従ったサンプルファイル (`prompts/sample_prompts.json`) を作成する。

## 目的

プロンプトの外部化要件 (REQ-PM-001, REQ-PM-002, REQ-PM-004) およびプロンプトファイル構造要件 (REQ-PM-005, REQ-PM-006, REQ-PM-007) を満たすための準備。

## 受け入れ条件

*   `prompts/` ディレクトリ内に `sample_prompts.json` ファイルが作成されていること。
*   `sample_prompts.json` ファイルが以下のJSON構造に従っていること。
    *   `format_version` プロパティが存在し、文字列 "1.0" であること。
    *   `prompts` プロパティが存在し、配列であること。
    *   `prompts` 配列の各要素が `id` (文字列), `description` (文字列), `content` (文字列) プロパティを持つこと。
*   `sample_prompts.json` ファイルが適切に整形（インデントなど）されていること。

## 作業手順

1.  `prompts/sample_prompts.json` ファイルを作成する。
2.  以下の内容を `sample_prompts.json` に書き込む。

```json
{
  "format_version": "1.0",
  "prompts": [
    {
      "id": "sample_thought_agent",
      "description": "サンプル思考者エージェント用プロンプト",
      "content": "あなたは思考者です。ユーザーのプロンプトに対して素の思考で回答してください。これはサンプルプロンプトです。"
    },
    {
      "id": "sample_reviewer_agent",
      "description": "サンプル批判的レビュアーエージェント用プロンプト",
      "content": "あなたは批判的レビュアーです。思考者の回答を批判的にレビューし、改善点を見つけてください。これはサンプルプロンプトです。"
    }
  ]
}
```

## 備考

*   このサンプルファイルは、後続のプロンプト読み込み機能の実装時にテストデータとして使用される。
