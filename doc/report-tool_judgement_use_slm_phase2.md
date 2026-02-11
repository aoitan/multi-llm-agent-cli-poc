# Tool Judgement 実験レポート (Phase 2)

実験日: 2026-02-12

## 1. 目的
- ツール判定対象を `web_search/calculator/none` から拡張し、`file_*` と `mcp_*` を含む実運用に近いルーター精度を確認する。
- 8B常用を避け、一般的なPCで動作するSLM中心構成で精度とレイテンシを両立できるか評価する。

## 2. 対象ツールと評価セット
- ツールカテゴリ:
  - `file_list`, `file_read`, `file_search`, `file_write`
  - `mcp_list_resources`, `mcp_read_resource`
  - `web_search`, `calculator`, `none`
- スイート:
  - `basic`: 6ケース
  - `file_mcp`: 38ケース

## 3. 評価モデル
- SLM帯:
  - `gemma3:1b`
  - `qwen2.5-coder:1.5b-base`
  - `llama3.2:3b`
  - `phi3:3.8b`
  - `gemma3:4b`
- 比較用:
  - `llama3.1:8b`
  - `qwen3:8b`

## 4. 主な結果

### 4.1 basic スイート
- `gemma3:4b` 単体: `acc=1.00`, `avg_time=1.10s`
- `gemma3:1b` 単体: `acc=1.00`, `avg_time=0.94s`
- `llama3.2:3b` 単体: `acc=1.00`, `avg_time=1.09s`
- `qwen2.5-coder:1.5b-base` 単体: `acc=0.50`
- 3段パイプライン (`gemma3:4b -> llama3.2:3b -> qwen3:8b`): `acc=1.00`, `secondary_rate=0.00`, `fallback_rate=0.00`

### 4.2 file_mcp スイート
- `gemma3:4b` 単体: `acc=1.00`, `avg_time=1.22s`, `p95=1.42s`
- `llama3.2:3b` 単体: `acc=0.95`, 誤り傾向は `web_search -> file_search`
- `phi3:3.8b` 単体: `acc=0.82`, 誤り傾向は `none -> file_list/file_read`
- `qwen2.5-coder:1.5b-base` 単体: `acc=0.58`, MCP系へ誤吸収が多い
- 3段パイプライン: `acc=1.00`, ただし `avg_time=2.17s`, `secondary_rate=0.32`, `fallback_rate=0.29`

## 5. 反復安定性評価 (gemma3:4b, file_mcp, repeat=30)

### 5.1 ローカル実行 (MBA)
- `avg_acc=1.000`, `min_acc=1.000`
- `avg_time=1.45s`, `avg_p95=1.72s`
- 後半ランで遅延増加があり、サーマル要因の可能性あり

### 5.2 リモート実行 (同セグメント Wi-Fi, RTX4080 Laptop)
- `avg_acc=1.000`, `min_acc=1.000`
- `avg_time=0.84s`, `avg_p95=0.96s`
- ローカルより高速かつ安定

## 6. 考察
- 本実験条件では、`gemma3:4b` 単体ルーターが精度・速度のバランスで最良。
- 多段合議/フォールバックは精度向上がほぼない一方、レイテンシを増やす。
- `qwen3:8b` は高信頼だが、常用ではなくハードエラー時の最終フォールバックが妥当。

## 7. 推奨運用方針
- デフォルト:
  - ルーター: `gemma3:4b` 単体
  - 実行先: RTX4080 Laptop (リモート)
- 例外時のみ:
  - `bad_tool` / `parse_error` / 出力破損時に `qwen3:8b` へフォールバック
- フォールバック抑制:
  - `rule_mismatch` と `empty_query` は警告扱いに留め、即フォールバックしない

## 8. 次アクション
- 本番ルーターを `gemma3:4b` に固定し、1週間の実トラフィックで以下を監視:
  - `acc` (オンライン評価)
  - `p95 latency`
  - `hard_error_rate` (`bad_tool`, `parse_error`)
- 時間帯別 (混雑時) の `repeat=30` を追加取得し、レイテンシしきい値を確定する。
