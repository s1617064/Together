#!/bin/zsh
set -euo pipefail

ROOT_DIR="/Users/luna/Documents/Together/prototype"
BUNDLED_NODE="/Users/luna/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"

if [ -x "$BUNDLED_NODE" ]; then
  "$BUNDLED_NODE" "$ROOT_DIR/dev-server.mjs"
else
  node "$ROOT_DIR/dev-server.mjs"
fi
