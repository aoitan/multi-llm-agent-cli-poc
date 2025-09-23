# エピック: Ollama 複数ホスト接続サポート

## 概要
複数の Ollama サーバーを併用するニーズに対応し、モデルごとに接続先ホストを切り替えられるように CLI とワークフロー実装を拡張する。既存の `APP_OLLAMA_URL` をデフォルト接続先として利用しつつ、モデル指定にホスト情報を含めることで柔軟な構成を可能にする。

## 成功指標
- モデルごとのホスト指定が CLI から可能になり、ドキュメントに利用方法が明記されている。
- `APP_OLLAMA_URL` を未設定にしても `http://localhost:11434` へフォールバックし、従来通り単一ホストでも運用できる。
- テストでホスト解決ロジックがカバーされ、CI で問題なく実行される。

## 受け入れ条件
- [ ] ストーリー 8.1〜8.3 の完了により、機能・ドキュメント・テストが整う。
- [ ] モデル指定にホストを含めた場合と含めない場合の双方で CLI が正常に動作する。
- [ ] 主要スクリプト (Python 含む) からも新仕様が利用できる。

## スコープ
- TypeScript 側の Ollama 接続周り (`chatWithOllama`, `Agent`, CLI)
- Python 製スクリプト（`ab_test_runner.py` 等）のモデル指定方法の追従
- 要件・手順を記したドキュメント

## 非スコープ
- Ollama 側の認証方式変更
- モデルローディング方法の再設計 (既存仕様を前提とする)

## 関連ストーリー
* [ ] [ストーリー 8.1: モデルホスト指定要件の実装](story_8_1_model_host_selection.md)
* [ ] [ストーリー 8.2: CLI / スクリプトのインタフェース更新](story_8_2_cli_interface_updates.md)
* [ ] [ストーリー 8.3: ドキュメントと運用ガイド更新](story_8_3_documentation_and_supporting_guides.md)

## 関連資料
- `doc/ollama_multi_host_support_requirements.md`
- 現行 `src/ollamaApi.ts` 実装
- CLI/スクリプトの利用手順 (README, scripts/*.py)
