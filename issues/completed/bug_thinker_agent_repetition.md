## 課題名: 思考者エージェントがユーザープロンプトを繰り返す問題

### 説明:
A/Bテストの結果、思考者エージェントが最初の応答としてユーザープロンプトをそのまま繰り返す問題が継続して発生しています。この問題は、プロンプトに否定的な制約や特定の開始フレーズを追加しても解決されていません。

### 影響:
この問題により、エージェントの対話が非効率になり、ユーザーは期待する情報に到達するまでに余分なターンを必要とします。また、エージェントの知的な振る舞いを損ないます。

### 再現手順:
1. `scripts/generate_reports.py` を実行する。
2. 生成された `ab_test_report.json` の `test_results` 内の各プロンプトの `dynamic_prompt_group` の `discussionLog` を確認する。
3. `turn: "Step 1 (review_step)"` の `response_received` フィールドが、元の `user_input` と同一であることを確認する。

### 期待される動作:
思考者エージェントは、ユーザープロンプトを繰り返すことなく、直接的かつ実質的な回答を生成すべきです。

### 受け入れ条件:
- [ ] `scripts/generate_reports.py` を実行した際に生成される `ab_test_report.json` において、すべてのプロンプトの `dynamic_prompt_group` の `discussionLog` 内の `turn: "Step 1 (review_step)"` の `response_received` フィールドが、元の `user_input` と異なる内容であること。
- [ ] 思考者エージェントの最初の応答が、ユーザープロンプトの意図と要求に沿った、意味のある内容であること。
- [ ] 上記の条件が満たされた場合、このバグ票を `issues/completed/` ディレクトリに移動する。

### 進捗管理チェックリスト:
- [ ] 思考者エージェントのプロンプト (`THINKER_INITIAL_PROMPT_TEMPLATE`) を再検討し、より効果的な指示を考案する。
- [ ] 考案したプロンプトを `prompts/default_prompts.json` および `prompts/english_prompts.json` に適用する。
- [ ] 変更後、`scripts/generate_reports.py` を実行し、改善効果を評価する。
- [ ] 必要に応じて、さらなるプロンプトの調整を行う。
- [ ] 最終的な改善が確認されたら、このバグ票を `issues/completed/` ディレクトリに移動する。