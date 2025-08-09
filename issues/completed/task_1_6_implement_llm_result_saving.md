# タスク 1.6: LLM実行結果の保存ロジックの実装

## 概要

LLMの実行結果（回答）を、指定されたディレクトリ構造に従ってファイルに保存するロジックを`ab_test_runner.py`に実装する。

## 目的

A/Bテストの各実行結果を永続化し、後から分析できるようにする。

## 受け入れ条件

*   `eval/prompt_comparison/YYYYMMDDHHMM/`配下に、各LLMの回答が`base_output_N.md`および`exp_output_N.md`として保存されること。
*   テスト実行時の設定情報やメタデータが`metadata.json`として保存されること。

## 作業手順

1.  `ab_test_runner.py`内で、現在のタイムスタンプに基づいて`eval/prompt_comparison/YYYYMMDDHHMM/`形式のディレクトリを作成するロジックを実装する。
2.  `conductConsultation`から取得したLLMの回答を、対応するファイル名でMarkdown形式で保存する。
3.  テスト実行時のユーザープロンプト、使用モデル、実行回数などのメタデータを`metadata.json`として保存する。
