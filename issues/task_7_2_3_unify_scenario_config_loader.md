# タスク 7.2.3: シナリオ設定ローダーの共通化

## 概要
`promptLoader` と `scenarioIdentifier` で重複実装されているシナリオ設定ローダーを統合し、単一のキャッシュとパス解決規約を提供する。

## 目的
DRY 原則を満たし、CLI やスクリプトからの利用時にパスが食い違う不具合を防ぐ。

## 受け入れ条件
- [ ] シナリオ設定の読み込みが 1 箇所に集約され、他モジュールはそのユーティリティを利用する。
- [ ] キャッシュ戦略が明示され、テストで検証されている。
- [ ] `process.cwd()` と `__dirname` の差異を吸収する共通 API が整備されている。
- [ ] 既存テストを更新または追加し、統合後も挙動が変わらないことを確認する。

## 作業手順
1. [ ] 現行実装の差分 (パス解決、キャッシュ方法) を比較し、統合案をまとめる。
2. [ ] 共通ユーティリティ (例: `src/utils/scenarioConfig.ts`) を実装し、既存コードを置き換える。
3. [ ] 新ユーティリティを利用するよう `promptLoader` と `scenarioIdentifier` を更新する。
4. [ ] テストを更新し、`npm test -- scenarioIdentifier` などを実行して動作を確認する。

## 検証 / テスト
- `npm test -- scenarioIdentifier`
- `npm test -- promptLoader`
- 必要に応じて全体テスト `npm test`

## アウトプット
- 新規ユーティリティファイル (例: `src/utils/scenarioConfig.ts`)
- 更新された `promptLoader.ts` / `scenarioIdentifier.ts`
- テスト更新内容

## 関連情報
- ストーリー 7.2 の受け入れ条件
- 現行のシナリオ設定 JSON (`config/scenario_config.json`)
