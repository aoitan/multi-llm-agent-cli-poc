# 対象 CLI 選定メモ: GitHub Copilot CLI

## 対象

- CLI 名: GitHub Copilot CLI
- 実行コマンド: `copilot`（または `gh copilot`）

## 選定理由

- TypeScript/Node.js ベースで実装されており、CLI ラッパー PoC（TypeScript）と文脈が一致する。
- 対話実行と非対話オプションの両方を持ち、ラッパーの入出力制御実験に向いている。
- 実行時の PTY 依存挙動（対話プロンプト、ストリーミング、標準入出力の扱い）を観測しやすい。

## バージョン情報（初期観測）

- 観測日: 2026-03-17
- インストール確認:
  - `which copilot` -> `/Users/aoitan/.nvm/versions/node/v22.18.0/bin/copilot`
  - `npm list -g --depth=0` -> `@github/copilot@0.0.372`
- `copilot --version` の実行結果:
  - `ERROR: SecItemCopyMatching failed -50`
  - 現時点ではコマンド出力からバージョン文字列を直接取得できていない。

## 起動方法（PoC で使う候補）

- 通常起動（対話）:
  - `copilot`
  - `gh copilot`
- 引数付き起動（非対話寄りの観測）:
  - `gh copilot -p "Summarize this week's commits" --allow-tool 'shell(git)'`
  - `gh copilot -- --help`

## PTY 挙動の初期観測

- `copilot --help` / `copilot --version` / `gh copilot -- --version` は、いずれも即時終了し `SecItemCopyMatching failed -50` を返した。
- 上記失敗時は対話プロンプト表示やストリーミング出力は発生しなかった（初期化段階で停止している可能性）。
- `gh copilot --help` はヘルプを表示でき、`gh` 側のエントリポイントは利用可能。
- まずは keychain 依存の初期化失敗を考慮し、ラッパー設計では「起動直後の即時エラー終了」を正常系と分けて扱う。

## 備考

- 本メモは Issue #142 の初期記録。詳細な PTY 観測（逐次トークン出力、SIGINT/SIGTERM 応答、終了コード分類）は別タスクで拡張する。
