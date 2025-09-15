# タスク 5.1.2: 英語プロンプトファイルの準備

## 概要

翻訳された英語プロンプトを、既存のプロンプトファイル構造と互換性のある形式で新しいファイルに格納する。

## 目的

A/Bテストフレームワークが英語プロンプトを正しくロードし、LLMに渡せるようにする。

## 受け入れ条件

*   [x] `prompts/` ディレクトリ内に、翻訳された英語プロンプトを格納するための新しいJSONファイル（例：`prompts/english_prompts.json`）が作成されること。
*   [x] `english_prompts.json` の構造は、`default_prompts.json` と同じ形式であり、`promptLoader.ts` でロード可能であること。
*   [x] 英語プロンプトファイルには、テスト対象となる全ての翻訳済みプロンプトが含まれていること。

## 作業手順

1.  [x] `prompts/english_prompts.json` ファイルを作成する。
2.  [x] `task_5_1_1` で翻訳された英語プロンプトを、`default_prompts.json` の構造に合わせて `english_prompts.json` に記述する。
3.  [x] `promptLoader.ts` を使用して `english_prompts.json` が正しくロードできることを確認する簡単なテストを行う。
