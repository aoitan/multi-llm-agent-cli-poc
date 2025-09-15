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

## インストール

1.  **Node.jsとnpmのインストール**:
    お使いのシステムにNode.jsとnpmがインストールされていることを確認してください。

2.  **リポジトリのクローン**:
    ```bash
    git clone https://github.com/aoitan/multi-llm-agent-cli-poc.git
    cd multi-llm-agent-cli-poc
    ```

3.  **依存関係のインストール**:
    ```bash
    npm install
    ```

4.  **Ollamaのセットアップ**:
    Ollamaをインストールし、ローカルで実行していることを確認してください。また、使用したいLLMモデルをプルしておいてください。
    例: `ollama pull llama3:8b`

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

## プロジェクト構造

-   `src/index.ts`: CLIのエントリーポイント。ユーザーの入力を受け取り、シナリオ識別、プロンプトの動的ロード、ワークフローのオーケストレーションを調整します。
-   `src/agent.ts`: LLMとの対話ロジックと、ワークフローのオーケストレーション (`orchestrateWorkflow`関数) を定義します。
-   `src/ollamaApi.ts`: Ollama APIとの通信を行うためのラッパー関数を提供します。
-   `src/utils/`:
    -   `configLoader.ts`: 設定ファイルをロードします。
    -   `errorUtils.ts`: エラーハンドリングユーティリティ。
    -   `promptLoader.ts`: プロンプトファイル、エージェントロール、プロンプトセットをロードします。
    -   `scenarioIdentifier.ts`: ユーザープロンプトに基づいてシナリオを識別します。
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

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細については`LICENSE`ファイルを参照してください。