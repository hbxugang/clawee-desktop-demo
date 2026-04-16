#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT_DIR="$ROOT_DIR/dist/desktop/web"
STANDALONE_DIR="$ROOT_DIR/apps/web/.next/standalone"

pnpm --dir "$ROOT_DIR/apps/web" build:desktop
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/apps/web/.next"
cp -R "$STANDALONE_DIR"/. "$OUT_DIR"/
cp -R "$ROOT_DIR/apps/web/.next/static" "$OUT_DIR/apps/web/.next/static"
cat > "$OUT_DIR/server.cjs" <<'EOF'
const path = require("node:path");

process.chdir(__dirname);
require(path.join(__dirname, "apps", "web", "server.js"));
EOF
