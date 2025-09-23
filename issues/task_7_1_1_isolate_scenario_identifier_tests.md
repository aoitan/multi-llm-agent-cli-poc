# タスク 7.1.1: シナリオ識別テストのファイル分離と安全なクリーンアップ

## 概要
`src/__tests__/scenarioIdentifier.test.ts` が本番の `config/scenario_config.json` を削除してしまう問題を解消し、テストがリポジトリ状態に副作用を与えないようにする。

## 目的
テスト実行後も設定ファイルが維持されるよう一時ファイル/ディレクトリを用いたセットアップに置き換え、テスト駆動開発の安全性を確保する。

## 受け入れ条件
- [ ] テストは本番 `config/scenario_config.json` を参照せず、一時生成した設定ファイルを利用する。
- [ ] セットアップ/クリーンアップ処理が try/finally または Jest のライフサイクルフックで適切に管理される。
- [ ] テスト完了後に `git status` がクリーンであり、本番設定ファイルが削除・変更されていないことを手順で確認できる。

## 作業手順
1. [ ] 現行テストのファイル I/O パターンを洗い出し、副作用のある箇所を把握する。
2. [ ] `fs.mkdtemp` または `tmp` パッケージを活用し、一時ディレクトリへモック設定ファイルを書き込むように修正する。
3. [ ] クリーンアップ処理を `afterEach`/`afterAll` で実装し、テスト後に生成物を削除する。
4. [ ] `npm test -- scenarioIdentifier` を実行し、テスト通過と副作用が無いことを確認する。

## 検証 / テスト
- `npm test -- scenarioIdentifier`
- テスト後に `git status --short` を確認し、変更が無いことを確認

## アウトプット
- 更新された `src/__tests__/scenarioIdentifier.test.ts`
- 必要に応じて追加されるテストユーティリティ

## 関連情報
- Node.js 一時ディレクトリガイド: https://nodejs.org/api/fs.html#fsmkdtempprefix-options-callback
