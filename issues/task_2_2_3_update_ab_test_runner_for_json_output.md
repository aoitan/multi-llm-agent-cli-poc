# タスク 2.3: `ab_test_runner.py`でのJSON出力利用例の更新

## 概要

`scripts/ab_test_runner.py`がCLIのJSON出力モードを利用するように更新する。

## 目的

`ab_test_runner.py`がCLIの出力をプログラム的に利用できるようにし、堅牢性を高める。

## 受け入れ条件

*   `ab_test_runner.py`が`node dist/index.js`を実行する際に、JSON出力モードを有効にする引数を渡すこと。
*   `ab_test_runner.py`がCLIからのJSON出力を正しくパースし、必要な情報を取得できること。

## 作業手順

1.  `scripts/ab_test_runner.py`内の`run_llm_consultation`関数において、`node dist/index.js`の呼び出しにJSON出力モードを有効にする引数を追加する。
2.  `run_llm_consultation`関数内で、CLIからのJSON出力をパースするロジックを調整する。
