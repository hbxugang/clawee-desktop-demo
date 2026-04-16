#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT_DIR="$ROOT_DIR/dist/desktop/gateway"
GATEWAY_ROOT="$ROOT_DIR/apps/gateway"
BUILD_DIR="$ROOT_DIR/dist/desktop/.gateway-build"

rm -rf "$OUT_DIR"
rm -rf "$BUILD_DIR"
mkdir -p "$OUT_DIR"

(
  cd "$GATEWAY_ROOT"
  uv run \
    --project "$GATEWAY_ROOT" \
    --with pyinstaller==6.19.0 \
    pyinstaller \
    pyinstaller.spec \
    --distpath "$OUT_DIR" \
    --workpath "$BUILD_DIR" \
    --noconfirm \
    --clean
)

rm -f "$GATEWAY_ROOT/uv.lock"
rm -rf "$BUILD_DIR"
