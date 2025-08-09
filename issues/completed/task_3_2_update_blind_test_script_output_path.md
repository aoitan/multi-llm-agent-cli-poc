# タスク 3.2: ブラインドテストスクリプトの出力パス変更

## 概要

既存のブラインドテストスクリプト（`scripts/prepare_evaluation.py`）の出力パスを`doc/blind_evaluation/`から`eval/model_comparison/`に変更する。

## 目的

モデル比較の結果を新しいディレクトリ構造に合わせ、一元的に管理する。

## 受け入れ条件

*   `scripts/prepare_evaluation.py`が`eval/model_comparison/`に出力するように修正されていること。
*   スクリプト実行後、`eval/model_comparison/`に結果が保存されること。

## 作業手順

1.  `scripts/prepare_evaluation.py`を開く。
2.  出力パスを`doc/blind_evaluation/`から`eval/model_comparison/`に変更する。
