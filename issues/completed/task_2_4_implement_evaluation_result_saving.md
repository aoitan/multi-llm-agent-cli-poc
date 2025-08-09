# タスク 2.4: 評価結果の保存ロジックの実装

## 概要

評価LLMから取得した評価結果を、指定されたディレクトリ構造に従ってファイルに保存するロジックを`ab_test_runner.py`に実装する。

## 目的

A/Bテストの評価結果を永続化し、後から分析できるようにする。

## 受け入れ条件

*   `eval/prompt_comparison/YYYYMMDDHHMM/`配下に、評価結果が`evaluation_N.md`として保存されること。

## 作業手順

1.  `ab_test_runner.py`内で、評価LLMから取得した評価結果をMarkdown形式でファイルに保存するロジックを実装する。
