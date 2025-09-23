# タスク 8.2.2: Python スクリプトのモデル指定対応とテスト

## 概要
`scripts/ab_test_runner.py` や `generate_reports.py` などの Python スクリプトから、ホスト付きモデル指定を TypeScript CLI に渡せるようにし、必要に応じてパース・バリデーションを実装する。

## 目的
A/B テストやレポート生成など支援ツールからも複数ホスト構成を利用できるようにする。

## 受け入れ条件
- [ ] Python スクリプトの CLI オプションにホスト付きモデル指定例が含まれる。
- [ ] モデル文字列のバリデーション (必要に応じて) を実装し、不正形式のエラーメッセージを改善する。
- [ ] Python テスト (`generate_reports.test.py` など) がホスト付きモデル指定のケースをカバーする。
- [ ] 後方互換性を保ち、従来のモデル指定でも動作する。

## 作業手順
1. [ ] スクリプト内でモデル指定オプションの説明を更新する。
2. [ ] 必要であれば文字列パーサーを実装し、TypeScript 側へ渡す前に検証する。
3. [ ] テストを追加し、CI での実行手順を更新する (必要に応じて)。
4. [ ] `python3 scripts/ab_test_runner.py` などをホスト付きモデルで実行し、動作確認する。

## 検証 / テスト
- `python3 -m pytest scripts/generate_reports.test.py`
- 手動での A/B テストスクリプト実行

## アウトプット
- 更新された Python スクリプトとテスト

## 関連情報
- ストーリー 8.1, タスク 8.1.1/8.1.2
- `doc/ollama_multi_host_support_requirements.md`
