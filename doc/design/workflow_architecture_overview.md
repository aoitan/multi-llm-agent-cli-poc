# ワークフローアーキテクチャ概要

本ドキュメントは外部設定ファイル駆動のエージェント協調アーキテクチャを記述した最新の設計概要です。

## 1. 目的

LLMエージェント間の協調プロセスを、コードの変更なしに外部設定で柔軟に定義・変更できるようにする。特に、プロンプトセットの切り替えによる役割変更と、ブースティング型・バギング型のフロー実現に焦点を当てる。

## 2. スコープ

*   エージェントの役割定義の外部化（プロンプトセットの切り替えを含む）。
*   エージェント間の対話フローの外部化（逐次実行、複数エージェントによる独立処理と統合）。
*   `src/agent.ts` のプロセス知識からの分離。

## 3. 機能要件

### 3.1. ロール定義の外部化とプロンプトセットの切り替え

*   各エージェントの役割（システムプロンプト、IDなど）を**プロンプト定義ファイル**（例: `prompts/default_prompts.json`）で定義できること。
*   `src/agent.ts` は、定義されたロールIDに基づいてエージェントをインスタンス化できること。
*   フロー定義内で、エージェントが使用する**プロンプトID**を指定することで、エージェントの振る舞い（プロンプトセット）を切り替えられること。

### 3.2. 対話フローの外部化

エージェント間の対話の順序、各ステップで使用するプロンプトID、次のステップへの遷移などを、外部設定ファイル（例: `config/workflow_config.json`）で定義できること。

#### 3.2.1. ブースティング型フロー (逐次実行)

*   あるエージェントの出力が、次のエージェントの入力となるような逐次的な対話フローを定義できること。

#### 3.2.2. バギング型フロー (複数エージェントによる独立処理と統合)

*   同じ入力に対して複数のエージェントが独立して処理を行い、その結果を後続のステップで統合するフローを定義できること。

### 3.3. プロンプトの参照

*   フロー定義内で、**プロンプト定義ファイル**に定義されたプロンプトIDを参照できること。

## 4. 非機能要件

*   **柔軟性**: コードの変更なしに、新しいロールや対話フローを容易に追加・変更できること。
*   **保守性**: プロセスロジックとプロンプト定義が分離されることで、コードの保守性が向上すること。
*   **パフォーマンス**: 外部設定の読み込みによる顕著なパフォーマンス劣化がないこと。

## 5. 実装対象ファイル

*   `src/agent.ts` (コアロジックの変更)
*   `src/index.ts` (設定ファイルの読み込み、`src/agent.ts` への連携)
*   **プロンプト定義ファイル**（例: `prompts/default_prompts.json`）(ロール定義の追加)
*   新規設定ファイル（例: `config/workflow_config.json`）

## 6. フロー定義の簡易スキーマ案

### 6.1. `prompts/default_prompts.json` への追加要素

```json
{
  "agent_roles": {
    "agent_id_example": {
      "system_prompt": "エージェントのシステムプロンプト",
      "description": "エージェントの役割説明",
      "model": "ollama:llama3" // オプション: このエージェントが使用するLLMモデル
    }
  }
}
```

### 6.2. `config/workflow_config.json` のスキーマ案

```json
{
  "workflows": {
    "workflow_name_example": {
      "description": "ワークフローの説明",
      "initial_step": "step_id_start",
      "steps": [
        {
          "id": "step_id_start",
          "type": "agent_interaction", // 単一エージェントとの対話
          "agent_id": "agent_id_example",
          "prompt_id": "prompt_id_example",
          "input_variables": {
            "variable_name": "source_of_value" // "user_input" または 前のステップのoutput_variable
          },
          "output_variable": "output_variable_name",
          "next_step": "next_step_id" // または "end"
        },
        {
          "id": "multi_agent_example_step",
          "type": "multi_agent_interaction", // 複数エージェントによる独立処理
          "agents_to_run": [
            {
              "agent_id": "agent_A",
              "prompt_id": "prompt_for_A",
              "input_variables": { "data": "user_input" },
              "output_variable": "output_A"
            },
            {
              "agent_id": "agent_B",
              "prompt_id": "prompt_for_B",
              "input_variables": { "data": "user_input" },
              "output_variable": "output_B"
            }
          ],
          "next_step": "aggregation_step"
        },
        {
          "id": "aggregation_step",
          "type": "agent_interaction",
          "agent_id": "aggregator_agent",
          "prompt_id": "aggregation_prompt",
          "input_variables": {
            "result_A": "output_A",
            "result_B": "output_B"
          },
          "output_variable": "final_aggregated_result",
          "next_step": "end"
        }
      ]
    }
  }
}
