# タスク 4.2: 設定ファイル構造の定義とサンプルファイルの作成

## 概要

設定ファイルのJSON構造を定義し、その定義に従ったサンプルファイル (`config/sample_config.json`) を作成する。

## 目的

プロンプトの選択と設定要件 (REQ-PM-008, REQ-PM-010) を満たすための準備。

## 受け入れ条件

*   `config/` ディレクトリ内に `sample_config.json` ファイルが作成されていること。
*   `sample_config.json` ファイルが以下のJSON構造に従っていること。
    *   `prompt_file_path` プロパティが存在し、文字列であること。
*   `sample_config.json` ファイルが適切に整形（インデントなど）されていること。

## 作業手順

1.  `config/sample_config.json` ファイルを作成する。
2.  以下の内容を `sample_config.json` に書き込む。

```json
{
  "prompt_file_path": "../prompts/sample_prompts.json"
}
```

## 備考

*   `prompt_file_path` は、設定ファイルからの相対パスで指定される。
*   このサンプルファイルは、後続の設定ファイル読み込み機能の実装時にテストデータとして使用される。
