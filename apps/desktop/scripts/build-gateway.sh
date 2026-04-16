#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT_DIR="$ROOT_DIR/dist/desktop/gateway"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
uv export \
  --project "$ROOT_DIR/apps/gateway" \
  --format requirements.txt \
  --no-dev \
  --no-header \
  --no-emit-project \
  > "$OUT_DIR/requirements.txt"
rm -f "$ROOT_DIR/apps/gateway/uv.lock"
cp -R "$ROOT_DIR/apps/gateway/app" "$OUT_DIR/app"
