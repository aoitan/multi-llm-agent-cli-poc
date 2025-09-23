# シナリオ識別機構の仕様

## 概要
ユーザープロンプトの内容に応じて適切なプロンプトセットとワークフローを切り替えるため、キーワードベースのシナリオ識別機構を提供する。`config/scenario_config.json` の設定に基づき、`src/utils/scenarioIdentifier.ts` がシナリオ選択を行う。

## 目的
- ユーザー入力のテーマに応じてプロンプトやワークフローを自動切り替えし、最適なエージェント構成を適用する。
- 設定ファイルのみで新しいシナリオを追加・調整できるようにする。

## 設定ファイル仕様 (`config/scenario_config.json`)
- `scenarios`: シナリオ定義の配列。
  - `id`: シナリオ識別子 (例: `social_issues`).
  - `name`: 表示名。
  - `description`: シナリオの説明。
  - `keywords`: ユーザープロンプトに含まれる場合、このシナリオがマッチするキーワードのリスト。
  - `default_workflow_id`: シナリオに対して推奨されるワークフロー ID。
  - `prompt_file_path`: 利用するプロンプト定義ファイルへのパス。
- `default_scenario_id`: 上記にマッチしなかった場合に利用する既定シナリオの ID。

## 実装概要 (`src/utils/scenarioIdentifier.ts`)
1. 設定ファイルの読み込み
   - 初回呼び出し時に `config/scenario_config.json` を読み込み、メモリにキャッシュする。
2. キーワードマッチング
   - ユーザープロンプトを小文字化し、各シナリオのキーワードと部分一致で照合する。
   - 最初にマッチしたシナリオを返す。
3. フォールバック
   - どのシナリオにも一致しない場合は `default_scenario_id` のシナリオを返す。

## 連携フロー
1. CLI (`src/index.ts`) でユーザープロンプトを受け取る。
2. `identifyScenario` によってシナリオを決定する。
3. `loadPromptSetByScenarioId` がシナリオに紐づくプロンプトファイルを読み込む。
4. シナリオまたは CLI パラメータに基づきワークフロー ID を決定し、`orchestrateWorkflow` に渡す。

## 拡張ポイント
- キーワード以外の判定ロジック (正規表現、外部サービス) を導入する際は、`identifyScenario` の実装または委譲関数を差し替える。
- シナリオ定義に追加情報 (例: モデル推奨、評価設定) を持たせる場合は、設定ファイルのスキーマを拡張して参照ユーティリティを追加する。

## テスト
- `src/__tests__/scenarioIdentifier.test.ts` で設定ファイルをモックし、キーワードマッチ・フォールバック・大文字小文字の扱いを検証する。
- 本番設定ファイルを書き換えないよう、一時ファイルやモックを用いること。

## 関連ドキュメント
- `doc/design/workflow_architecture_overview.md`
- `prompts/default_prompts.json` などのプロンプト定義
