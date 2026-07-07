#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${0}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
BUNDLED_NODE="${HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"

if [ -x "$BUNDLED_NODE" ]; then
  "$BUNDLED_NODE" "$ROOT_DIR/dev-server.mjs"
else
  node "$ROOT_DIR/dev-server.mjs"
fi
