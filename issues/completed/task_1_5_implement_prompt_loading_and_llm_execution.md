# タスク 1.5: プロンプトのロードとLLM実行ロジックの実装

## 概要

現状プロンプトと実験プロンプトをロードし、それぞれを使用してLLM（`conductConsultation`）を実行するロジックを`ab_test_runner.py`に実装する。

## 目的

A/Bテストの核となる、異なるプロンプトでのLLMの振る舞いを比較できるようにする。

## 受け入れ条件

*   `ab_test_runner.py`が`prompts/default_prompts.json`をロードできること。
*   `ab_test_runner.py`が設定ファイルで指定された実験用プロンプトファイルをロードできること。
*   各プロンプトを使用して`conductConsultation`関数を呼び出し、その結果を取得できること。

## 作業手順

1.  `ab_test_runner.py`内で、`prompts/default_prompts.json`を読み込むロジックを実装する。
2.  `ab_test_runner.py`内で、設定ファイルから取得したパスに基づいて実験用プロンプトファイルを読み込むロジックを実装する。
3.  読み込んだプロンプトオブジェクトを`conductConsultation`関数に渡し、LLMを実行するロジックを実装する。
