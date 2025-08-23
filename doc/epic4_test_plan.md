# Epic 4: 動的プロンプトによる応答改善機能のテスト計画

## 1. 目的

Epic 4で実装された動的プロンプト選択および動的ワークフロー適応機能が、期待通りに動作し、LLMの応答品質向上に寄与していることを検証する。

## 2. テスト対象

*   **シナリオ識別ロジック:** `src/utils/scenarioIdentifier.ts`
*   **動的プロンプトローダー:** `src/utils/promptLoader.ts`
*   **動的ワークフロー選択ロジック:** `src/index.ts`
*   **設定ファイル:** `config/scenario_config.json`, `config/ab_test_config.json`
*   **プロンプトファイル:** `prompts/default_prompts.json`, `prompts/social_issues_prompts.json`, `prompts/technology_prompts.json`

## 3. テストシナリオ

### 3.1. シナリオ識別とプロンプト選択の検証

ユーザープロンプトに応じて、適切なシナリオが識別され、対応するプロンプトセットがロードされることを確認する。

| テストケースID | ユーザープロンプト | 期待されるシナリオID | 期待されるプロンプトファイル |
|---|---|---|---|
| TC-DP-001 | 「日本の少子高齢化問題について議論してください」 | `social_issues` | `prompts/social_issues_prompts.json` |
| TC-DP-002 | 「AIの最新動向について教えてください」 | `technology` | `prompts/technology_prompts.json` |
| TC-DP-003 | 「今日の天気について」 | `general` | `prompts/default_prompts.json` |

**テスト手順:**
1.  各テストケースの「ユーザープロンプト」を使用してCLIを実行する。
    `npm start --user-prompt "..."`
2.  CLIの出力（デバッグログ）で「Identified scenario: [期待されるシナリオID]」が表示されることを確認する。
3.  LLMの応答内容が、期待されるプロンプトファイルの内容に基づいていることを確認する（手動確認またはログ解析）。

### 3.2. 動的ワークフロー選択の検証

識別されたシナリオに応じて、適切なワークフローが選択され実行されることを確認する。

| テストケースID | ユーザープロンプト | 期待されるシナリオID | 期待されるワークフローID |
|---|---|---|---|
| TC-WF-001 | 「日本の少子高齢化問題について議論してください」 | `social_issues` | `code_review_and_refactor` |
| TC-WF-002 | 「AIの最新動向について教えてください」 | `technology` | `parallel_qa_and_summarize` |
| TC-WF-003 | 「今日の天気について」 | `general` | `code_review_and_refactor` |

**テスト手順:**
1.  各テストケースの「ユーザープロンプト」を使用してCLIを実行する。
    `npm start --user-prompt "..."`
2.  CLIの出力（デバッグログ）で、実行されたワークフローが「期待されるワークフローID」と一致することを確認する。
3.  LLMの応答内容が、選択されたワークフローの挙動（例: `code_review_and_refactor`ならレビューとリファクタリングのプロセス、`parallel_qa_and_summarize`なら並列QAと要約のプロセス）に沿っていることを確認する（手動確認またはログ解析）。

### 3.3. A/Bテストによる効果検証

動的プロンプト/ワークフロー選択が、静的プロンプトと比較してLLMの応答品質に与える影響を定量的に評価する。

**テスト手順:**
1.  `config/ab_test_config.json`が、`dynamic_prompt_ab_test_enabled: true`であり、`control`グループ（静的）と`dynamic_prompt_group`（動的）が正しく設定されていることを確認する。
2.  `scripts/generate_reports.py`を実行する。
    `python scripts/generate_reports.py`
3.  生成されたレポート（標準出力）を確認し、`control`グループと`dynamic_prompt_group`の評価指標（応答の長さ、キーワード出現率など）を比較する。

## 4. 評価指標

*   **応答の長さ:** LLMの最終応答の文字数。
*   **キーワード出現率:** ユーザープロンプト内のキーワードがLLMの応答にどの程度含まれているか。
*   **タスク完了の適切性:** LLMの応答がユーザーの意図したタスクを適切に完了しているか（手動評価）。
*   **ワークフローの実行パス:** 期待されるワークフローのステップが正しく実行されたか（ログ解析）。

## 5. 結果の記録

*   各テストケースのCLI実行結果（標準出力）をログファイルとして保存する。
*   A/Bテストの結果は`scripts/generate_reports.py`によって標準出力に表示されるため、必要に応じてリダイレクトしてファイルに保存する。
*   手動評価の結果は、別途スプレッドシートなどに記録する。

## 6. 補足事項

*   LLMの応答は非決定的な要素を含むため、複数回実行して結果の傾向を評価することが望ましい。
*   評価指標は、テストの目的に応じて追加・調整する。
*   `prompts/social_issues_prompts.json`と`prompts/technology_prompts.json`には、各シナリオに特化したプロンプト内容を事前に定義しておく必要がある。
