# 非Tool UseネイティブなローカルLLMにおけるツール利用戦略

Tool Use（Function Calling）に対応していない、あるいはチャットテンプレートにその機能が含まれていないオープンモデル（特に1B〜7Bクラスの軽量モデル）において、安定してツールを利用させるためのアーキテクチャ案と仮説。

## 1. Split Router Architecture (1Bモデルによる判断分業)

推論リソースを最適化しつつ、メインモデルのコンテキスト汚染を防ぐアプローチ。

### 概要
- **Router (1B - 3B):** ユーザーの入力に対して「ツールを使うべきか否か」と「使うならどのツールか」だけを判断させる。
- **Executor / Main Model:** Routerの判断に基づき、引数抽出や最終回答の生成を行う。

### メリット
- メインモデル（RP用や特定タスク用）がツール定義で混乱しない。
- 常にツール定義を読み込ませる必要がないため、VRAMとトークンを節約できる。
- Qwen-2.5-1.5B や Llama-3.2-3B などの軽量・高知能モデルがルーターとして極めて優秀。

### フロー例
1. **Input:** User Prompt
2. **Router (Small LLM):** 分類タスクとして実行
   - Prompt: `Classify if the user input requires a tool. Options: [SEARCH, CALCULATOR, NONE]`
   - Output: `SEARCH`
3. **If Tool Required:**
   - **Argument Extractor:** 対象ツールのスキーマを提示し、引数（JSON）を生成させる（※後述のConstrained Generation推奨）。
   - **Execution:** ツール実行。
4. **Final Generation:**
   - Prompt: `User Input + Tool Result`
   - Model: 任意のメインモデル（DeepSeek-R1 Distill, Mistral, etc.）

---

## 2. Grammar / Logits Constraining (推論時制約)

モデルの「賢さ」に依存せず、強制的に構造化データを出力させる最強の安定化策。`llama.cpp`, `vLLM` 等のバックエンド機能を利用する。

### 概要
次に出力されるトークンの確率分布を操作し、JSONスキーマや特定の文法（BNF）に従わないトークンの生成確率を `0` にする。

### 実装アプローチ
* **llama.cpp (`.gbnf`):** 文法ファイルでJSON構造を定義。
* **Outlines / Instructor / Guidance:** Pythonコード（Pydantic等）でスキーマを定義し、推論エンジンに強制適用。

### プロンプト戦略
モデルには「JSONで出力して」と頼むだけでなく、エンジン側で「JSON以外出力不可」にする。
```python
# (概念コード: outlines等のイメージ)
schema = {
    "type": "object",
    "properties": {
        "tool_name": {"type": "string", "enum": ["web_search", "python_repl"]},
        "arguments": {"type": "object", ...}
    }
}
# このgeneratorはschemaに合致するトークンしか吐けない
response = generator(prompt, json_schema=schema)
```

---

## 3. XML Tagging Strategy (脱JSON)

7B以下のモデルにおいて、JSONの厳密な構文（括弧の対応やエスケープ）は難易度が高い場合がある。Anthropic方式に近いXMLタグを利用する。

### 概要
JSONの代わりに、モデルが学習データ（HTML/XML）で馴染みのあるタグ構造を使わせる。

### プロンプト例
```text
ツールを使用する場合は、以下のフォーマットで出力してください：
<tool_use>
  <name>web_search</name>
  <query>今日の東京の天気</query>
</tool_use>
```

### メリット
- JSONよりも構文エラー（Parse Error）率が低い傾向がある。
- 正規表現での抽出が容易（`<tool_use>(.*?)</tool_use>`）。
- 終了タグ `</tool_use>` をStop Tokenとして設定しやすい。

---

## 4. ReAct / Thought-Action Prompting

Chain of Thought (CoT) を強制的に誘発し、推論精度を高める古典的だが強力な手法。

### 概要
いきなりツールを呼ばせず、「思考（Thought）」→「行動（Action）」のプロセスを踏ませる。

### テンプレート例
```markdown
Question: {input}

以下のフォーマットで回答すること:
Thought: ユーザーの要求を満たすために何をすべきか考える
Action: 使用するツール名 (なければ NONE)
Action Input: ツールへの入力
Observation: (ここで生成を停止し、システムがツール実行結果を挿入)
```

### 運用
- **Stop Sequence:** `Observation:` をストップワードに設定。
- これを1Bモデルにやらせると冗長なので、前述の **Router** がこの役割を兼ねるか、あるいはRouterは直感で判断させ、ExecutorがReActするなど使い分けが可能。

---

## 推奨構成（aoitan/multi-llm-agent-cli 向け）

既存の構成を活かしつつ、小型モデルを活用する場合の推奨スタック。

| Role | Model Criteria | Technique |
| :--- | :--- | :--- |
| **Router** | **Qwen-2.5-1.5B** or **Llama-3.2-3B** | **Logits Constraining** (Enum選択)<br>プロンプトでツール定義を与えず、単にカテゴリ分類させる。 |
| **Arg Parser** | **同上** or **Qwen-2.5-7B** | **Schema Enforcement** (Pydantic等)<br>Routerが選んだツールの定義のみを注入して引数を抽出。 |
| **Responder** | **任意の高性能モデル** | ツール実行結果を含めたコンテキストを入力し、最終的な自然言語回答を生成。 |
