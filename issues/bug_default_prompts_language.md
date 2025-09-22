## 課題名: `prompts/default_prompts.json` に英語プロンプトが含まれている問題

### 説明:
A/Bテストのコントロールグループとして使用される `prompts/default_prompts.json` に、意図せず英語のプロンプトが含まれています。このファイルは本来、日本語のプロンプトのみを含むべきです。

### 影響:
この問題により、A/Bテストの「Control Group (日本語)」の評価が不正確になり、日本語プロンプトと英語プロンプトの性能差を正確に測定できません。テスト結果の信頼性が損なわれます。

### 再現手順:
1. `prompts/default_prompts.json` を開く。
2. `content` フィールドに英語のテキストが含まれていることを確認する。

### 期待される動作:
`prompts/default_prompts.json` は、すべての `content` フィールドに日本語のプロンプトのみを含むべきです。

### 受け入れ条件:
- [ ] `prompts/default_prompts.json` のすべての `prompt` エントリの `content` フィールドが日本語であること。
- [ ] `scripts/generate_reports.py` を実行した際に、`ab_test_report.json` の `Control Group (日本語)` の `LLM応答比較` が適切に日本語で応答していること。
- [ ] 上記の条件が満たされた場合、このバグ票を `issues/completed/` ディレクトリに移動する。

### 進捗管理チェックリスト:
- [ ] `prompts/default_prompts.json` 内の英語プロンプトを適切な日本語プロンプトに修正する。
- [ ] 修正後、`jq` または Python の `json` モジュールでJSON形式の妥当性を確認する。
- [ ] `scripts/generate_reports.py` を実行し、A/Bテストの結果が意図通りに日本語で出力されていることを確認する。
- [ ] 最終的な改善が確認されたら、このバグ票を `issues/completed/` ディレクトリに移動する。