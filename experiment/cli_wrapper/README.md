# CLI Wrapper (experiments/cli_wrapper)

## 目的

本ディレクトリは、CLI ツールのラッパー機能に関する実験・検証を目的とした PoC 用スペースである。
具体的なゴール：
- 既存 CLI ツールの呼び出しパターンを調査・整理する。
- ラッパーの実装方針（構文解析、エラー処理、出力フォーマット等）を検証する。
- 後続の本番実装（`src/` へ移行）のためのプロトタイプを構築する。

## 非目標（Non-Goals）

- 本番環境向けの実装を行うこと（本番実装は `src/` 以下で実施）。
- 実験範囲外の CLI ツールを網羅すること（対象外 CLI は別途定義）。
- 複雑なテストスイートや CI/CD 連携（PoC 段階のため簡易検証のみ）。

## Phase 1 の完了条件

- [ ] CLI ラッパーの基本的な呼び出しパターンが確認できる。
- [ ] エラー処理、引数パース、出力取得の処理例が実装されている。
- [ ] 対象 CLI ごとに簡単な検証スクリプトまたはテストが用意されている。
- [ ] 本番実装への移行方針が README または別ドキュメントに明記されている。

## 対象 CLI

Phase 1 で対象とする CLI ツール：
- GitHub Copilot CLI
  - 選定記録: `experiment/cli_wrapper/target_cli_copilot.md`

## ディレクトリ責務

- `experiments/cli_wrapper/`：本ディレクトリ。CLI ラッパーの実験用 PoC 領域。
- `src/`：本番実装領域。PoC で得られた知見を反映したコードを配置。
- `scripts/`：共通ユーティリティや CI 用スクリプト。
- 他の `experiments/*/`：他実験領域とは責務を明確に分離。

## 関連 Issue

- CW-1 (#133)：CLI Wrapper に関する Issue
- #141：experiments/cli_wrapper/ ディレクトリ作成と README 記述
