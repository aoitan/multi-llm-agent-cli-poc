# タスク 2.2: 評価LLMのモデル指定機能の実装

## 概要

A/Bテストスクリプトが、評価に使用するLLMモデルを外部設定から指定できるようにする。

## 目的

評価LLMのモデルを柔軟に切り替えられるようにし、様々なLLMでの評価を可能にする。

## 受け入れ条件

*   `config/ab_test_config.json`のようなJSON設定ファイルで、評価LLMのモデルを指定できること。
*   `ab_test_runner.py`がこの設定を読み込み、評価LLMのインスタンス化に使用できること。

## 作業手順

1.  `scripts/ab_test_config.py`を作成し、評価LLMのモデル名（例: `evaluation_model`）を定義する。
2.  `ab_test_runner.py`内で、この設定を読み込むロジックを実装する。
