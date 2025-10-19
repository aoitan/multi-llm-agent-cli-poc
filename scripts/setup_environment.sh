#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PATH="$PROJECT_ROOT/.venv"
PYTHON_BIN="${PYTHON:-python3}"

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "Error: $PYTHON_BIN is required but was not found on PATH." >&2
  exit 1
fi

echo "[1/3] Setting up Python virtual environment at $VENV_PATH"
if [[ ! -d "$VENV_PATH" ]]; then
  "$PYTHON_BIN" -m venv "$VENV_PATH"
fi
# shellcheck disable=SC1090
source "$VENV_PATH/bin/activate"
python -m pip install --upgrade pip
if [[ -f "$PROJECT_ROOT/requirements.txt" ]]; then
  echo "Installing Python dependencies from requirements.txt"
  python -m pip install -r "$PROJECT_ROOT/requirements.txt"
else
  echo "No requirements.txt found; skipping Python dependency installation"
fi

deactivate

echo "[2/3] Installing Node.js dependencies"
cd "$PROJECT_ROOT"
npm install

echo "[3/3] Building TypeScript sources"
npm run build

echo "Setup complete. Activate the virtual environment with:"
echo "  source $VENV_PATH/bin/activate"
