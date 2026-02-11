#!/usr/bin/env bash
set -euo pipefail

# Scan local Ollama models and estimate tool-calling readiness from `ollama show`.
# Optional --probe runs a lightweight JSON routing prompt to test structured output stability.
#
# Usage:
#   scripts/check_ollama_tool_capability.sh
#   scripts/check_ollama_tool_capability.sh --probe
#   scripts/check_ollama_tool_capability.sh --models "llama3.1:8b,qwen3:8b"

PROBE=0
MODELS_CSV=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --probe)
      PROBE=1
      shift
      ;;
    --models)
      MODELS_CSV="${2:-}"
      shift 2
      ;;
    *)
      echo "unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama not found in PATH" >&2
  exit 1
fi

if [[ -n "$MODELS_CSV" ]]; then
  IFS=',' read -r -a MODELS <<<"$MODELS_CSV"
else
  while IFS= read -r line; do
    model_name="$(awk '{print $1}' <<<"$line")"
    if [[ -n "$model_name" ]]; then
      MODELS+=("$model_name")
    fi
  done < <(ollama list | tail -n +2)
fi

if [[ ${#MODELS[@]} -eq 0 ]]; then
  echo "no models found"
  exit 0
fi

printf "%-30s %-8s %-8s %-8s %-8s %-8s %s\n" \
  "MODEL" "TOOLS" "TEMPLATE" "SYSTEM" "FORMAT" "PROBE" "NOTES"

run_probe() {
  local model="$1"
  local prompt
  prompt='Return JSON only: {"tool":"web_search|calculator|none","query":"...","confidence":0-1}
User: 2+2'
  local out
  if ! out="$(ollama run "$model" "$prompt" --format json 2>/dev/null)"; then
    echo "ERR"
    return
  fi
  if grep -q '"tool"' <<<"$out" && grep -q '"query"' <<<"$out"; then
    echo "OK"
  else
    echo "WEAK"
  fi
}

for model in "${MODELS[@]}"; do
  show_text="$(ollama show "$model" 2>/dev/null || true)"
  modelfile_text="$(ollama show "$model" --modelfile 2>/dev/null || true)"
  merged="${show_text}"$'\n'"${modelfile_text}"

  tools_flag="NO"
  template_flag="NO"
  system_flag="NO"
  format_flag="NO"
  notes=""

  if grep -Eiq 'tool|function[_ -]?call|parallel[_ -]?tool|tool_use' <<<"$merged"; then
    tools_flag="YES"
    notes="${notes}tool-keyword;"
  fi
  if grep -Eiq 'template|chat_template|prompt template' <<<"$merged"; then
    template_flag="YES"
  fi
  if grep -Eiq 'system' <<<"$merged"; then
    system_flag="YES"
  fi
  if grep -Eiq 'json|format' <<<"$merged"; then
    format_flag="YES"
  fi

  probe_flag="-"
  if [[ $PROBE -eq 1 ]]; then
    probe_flag="$(run_probe "$model")"
  fi

  if [[ -z "$notes" ]]; then
    notes="-"
  fi

  printf "%-30s %-8s %-8s %-8s %-8s %-8s %s\n" \
    "$model" "$tools_flag" "$template_flag" "$system_flag" "$format_flag" "$probe_flag" "$notes"
done
