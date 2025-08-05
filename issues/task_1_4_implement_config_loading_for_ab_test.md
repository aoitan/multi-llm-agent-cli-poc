# タスク 1.4: 設定ファイルの読み込み機能の実装

## 概要

A/Bテストの設定を記述する`config/ab_test_config.json`を定義し、スクリプトから読み込む機能を実装する。

## 目的

A/Bテストの実行設定（実験用プロンプトファイルのパスなど）を外部から柔軟に指定できるようにする。

## 受け入れ条件

*   `config/ab_test_config.json`ファイルが存在し、実験用プロンプトファイルのパスを指定する項目が含まれていること。
*   `ab_test_runner.py`が`ab_test_config.json`を正しく読み込み、設定値にアクセスできること。

## 作業手順

1.  `config/ab_test_config.json`を作成し、実験用プロンプトファイルのパス（例: `experimental_prompt_file_path`）を含む基本的な構造を定義する。
2.  `ab_test_runner.py`内で、指定された設定ファイルパスからJSONファイルを読み込むロジックを実装する。
