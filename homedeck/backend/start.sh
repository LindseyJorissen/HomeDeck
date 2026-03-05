#!/usr/bin/env bash
# HomeDeck Backend -> Start Script
# Starts the FastAPI server on port 8000
# Usage: bash backend/start.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Install dependencies if needed
if ! python3 -c "import fastapi" 2>/dev/null; then
  echo "[HomeDeck] Installing Python dependencies…"
  pip3 install -r requirements.txt
fi

echo "[HomeDeck] Starting server on http://0.0.0.0:8000"
exec python3 -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
