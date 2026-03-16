# multi-llm-agent-cli-poc

## プロジェクト概要

このプロジェクトは、Ollama API を利用して複数の大規模言語モデル (LLM) 間で協調的な対話（ワークフロー）を行う概念実証 (PoC) です。ユーザーが入力したプロンプトに対し、動的に選択されたエージェントとワークフローが連携し、最終的な結論や重要なポイントを要約して提示することを目指します。

## 機能

-   **Ollama API連携**: ローカルで動作するOllamaサーバーを通じてLLMと対話します。
-   **動的なエージェント協調ロジック**:
    -   **シナリオ識別**: ユーザープロンプトに基づいて最適なシナリオを自動的に識別します。
    -   **動的プロンプトロード**: 識別されたシナリオや指定されたプロンプトファイルに基づき、エージェントの役割定義やプロンプトを動的にロードします。
    -   **ワークフローオーケストレーション**: 定義されたワークフローに従い、複数のエージェントが順次または並行して対話を進めます。エージェントの役割、使用モデル、プロンプトは設定ファイルで柔軟に定義可能です。
-   **CLIインターフェース**: 豊富なオプション (`--workflow`, `--json`, `--prompt-file`など) を提供し、柔軟な実行を可能にします。
-   **会話の要約**: 全ての対話が終了した後、会話内容と最初のユーザープロンプトを基に、最終的な要約を生成します。

## セットアップ

1.  **前提条件**:
    - Node.js と npm がインストールされていること
    - Python 3.9 以上がインストールされていること
    - （A/B テスト機能を使う場合）ローカルで Ollama が利用可能で、使用したいモデルをプル済みであること

2.  **リポジトリのクローン**:
    ```bash
    git clone https://github.com/aoitan/multi-llm-agent-cli-poc.git
    cd multi-llm-agent-cli-poc
    ```

3.  **セットアップスクリプトの実行**:
    ```bash
    ./scripts/setup_environment.sh
    ```
    - `.venv/` に Python 仮想環境が作成され、`requirements.txt` に記載された依存関係がインストールされます。
    - Node.js の依存関係がインストールされ、`npm run build` が実行されて `dist/` が生成されます。
    - Jest の `ab_test_runner` 系テストは `scripts/ab_test_runner.py` を経由して `node dist/index.js` を呼び出すため、ビルドされていない状態では失敗します。セットアップスクリプトはこの手順を自動化しています。

4.  **仮想環境の有効化（任意）**:
    ```bash
    source .venv/bin/activate
    ```

5.  **Ollamaのセットアップ（任意機能）**:
    Ollamaをインストールし、ローカルで実行していることを確認してください。また、使用したいLLMモデルをプルしておいてください。
    例: `ollama pull llama3:8b`

### 手動セットアップを行う場合

セットアップスクリプトを利用できない環境では、以下を順番に実行してください。

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt  # 追加のPython依存がある場合

npm install
npm run build
```

TypeScript のビルド (`npm run build`) を忘れると、`npm test` で Python スクリプト経由のテストが失敗する点に注意してください。

## 使用方法

プロジェクトのルートディレクトリで以下のコマンドを実行します。

```bash
npm start -- --user-prompt "<あなたのプロンプト>" [--workflow <ワークフローID>] [--json] [--prompt-file <プロンプトファイルパス>]
```

-   `--user-prompt "<あなたのプロンプト>"`: LLMに議論させたい内容を入力します。
-   `--workflow <ワークフローID>`: 実行するワークフローのIDを指定します。`config/workflow_config.json`で定義されています。省略した場合、シナリオ識別結果またはデフォルトのワークフローが使用されます。
-   `--json`: 結果をJSON形式で出力します。
-   `--prompt-file <プロンプトファイルパス>`: シナリオ識別をスキップし、指定されたプロンプトファイルを直接ロードします。パスはプロジェクトルートからの相対パスです。

**例:**

```bash
# デフォルトのシナリオ識別とワークフローで実行
npm start -- --user-prompt "日本の少子高齢化問題について解決策を議論してください"

# 特定のワークフローを指定して実行
npm start -- --user-prompt "コードレビューをお願いします" --workflow code_review_and_refactor

# JSON形式で結果を出力
npm start -- --user-prompt "新しい機能のアイデアをください" --json

# 特定のプロンプトファイルを使用して実行
npm start -- --user-prompt "技術的な質問です" --prompt-file prompts/technology_prompts.json
```

## テスト

- `npm test` : Jest による TypeScript テストと、A/B テスト関連の Python スクリプトを併用した統合テストを実行します。`npm run build` 済みであることに加え、テスト実行前に `source .venv/bin/activate` で Python 仮想環境を有効化する必要があります。
- `python3 scripts/generate_reports.test.py` : Python のユニットテストを個別に実行する場合に利用します。
- テストで一時ファイルが必要な場合は `src/testHelpers/testTempDir.ts` の `createTestTempDir` / `cleanupTestTempDir` を利用し、`afterEach` などで必ず `cleanupTestTempDir` を明示的に呼んでください（詳細: `doc/testing.md`）。

## プロジェクト構造

-   `src/index.ts`: CLIのエントリーポイント。ユーザーの入力を受け取り、シナリオ識別、プロンプトの動的ロード、ワークフローのオーケストレーションを調整します。
-   `src/agent.ts`: ワークフローオーケストレーションのエントリーポイント。`orchestrateWorkflow`, `runEnsemble`, `fillTemplate` をエクスポートします。各機能は以下のモジュールに委譲されています。
-   `src/agents/`: **エージェントモジュール**
    -   `Agent.ts`: LLMエージェントクラス (`Agent`)、メッセージ型 (`Message`, `DiscussionTurn`) を定義します。
    -   `index.ts`: `Agent`, `Message`, `DiscussionTurn` を re-export します。
-   `src/guards/`: **入出力ガードモジュール**
    -   `languageGuard.ts`: 言語ガード設定 (`LANGUAGE_GUARD_CONFIGS`)、日本語出力判定 (`requiresJapaneseOutput`)、リライトプロンプト生成 (`buildJapaneseRewritePrompt`) を提供します。
-   `src/ollamaApi.ts`: Ollama APIとの通信を行うためのラッパー関数を提供します。
-   `src/cooperativeAgentEval.ts`: 協調エージェント評価用CLIスクリプト。`orchestrateWorkflow` を使って指定ワークフローを実行します。
-   `src/singleAgentEval.ts`: 単一エージェント評価用CLIスクリプト。`runEnsemble` を使います。
-   `src/utils/`:
    -   `configLoader.ts`: 設定ファイルをロードします。
    -   `errorUtils.ts`: エラーハンドリングユーティリティ。
    -   `promptLoader.ts`: プロンプトファイル、エージェントロール、プロンプトセットをロードします。
    -   `scenarioConfig.ts`: **シナリオ設定の共通ローダー**。`loadScenarioConfig()` と `clearScenarioConfigCache()` を提供します。`SCENARIO_CONFIG_PATH` 環境変数でパスを上書き可能です。
    -   `scenarioIdentifier.ts`: ユーザープロンプトに基づいてシナリオを識別します。内部で `scenarioConfig.ts` を使用します。
    -   `templateUtils.ts`: テンプレート文字列のプレースホルダ置換 (`fillTemplate`) を提供します。
    -   `workflowLoader.ts`: ワークフロー定義ファイルをロードします。
-   `config/`:
    -   `ab_test_config.json`: A/Bテストの設定ファイル。
    -   `sample_config.json`: サンプルの設定ファイル。
    -   `scenario_config.json`: シナリオ識別とそれに対応するプロンプトセット、デフォルトワークフローの定義。
    -   `workflow_config.json`: ワークフローの定義。各ステップでのエージェントの役割、プロンプト、次のステップなどを定義します。
-   `prompts/`:
    -   `default_prompts.json`: デフォルトのプロンプト定義。
    -   `english_prompts.json`: 英語プロンプトの定義。
    -   `evaluation_prompt_template.md`: 評価用プロンプトのテンプレート。
    -   `sample_prompts.json`: サンプルのプロンプト定義。
    -   `social_issues_prompts.json`: 社会問題に関するプロンプト定義。
    -   `technology_prompts.json`: 技術に関するプロンプト定義。
-   `doc/development_plan.md`: 開発計画が記載されています。
-   `doc/design_talk/`: LLMとの議論の要約が格納されています。
-   `doc/design/`: 各機能の設計書が格納されます。

### 主要エクスポート一覧

| モジュール | エクスポート | 説明 |
|---|---|---|
| `src/agent.ts` | `orchestrateWorkflow` | ワークフロー定義に従いエージェントを順次実行する |
| `src/agent.ts` | `runEnsemble` | 複数モデルに同一プロンプトを並列送信する |
| `src/agent.ts` | `fillTemplate` | `templateUtils` からの re-export |
| `src/agents` | `Agent` | LLMエージェントクラス |
| `src/agents` | `Message`, `DiscussionTurn` | エージェント通信の型定義 |
| `src/guards/languageGuard` | `requiresJapaneseOutput` | 日本語出力が必要かを判定する |
| `src/guards/languageGuard` | `buildJapaneseRewritePrompt` | 日本語リライト指示プロンプトを生成する |
| `src/utils/scenarioConfig` | `loadScenarioConfig` | シナリオ設定をキャッシュ付きでロードする |
| `src/utils/scenarioConfig` | `clearScenarioConfigCache` | キャッシュをクリアする（主にテスト用途） |
| `src/utils/templateUtils` | `fillTemplate` | `${key}` 形式のプレースホルダを置換する |


## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細については`LICENSE`ファイルを参照してください。
