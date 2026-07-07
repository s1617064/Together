#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${0}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
FIREBASE_PROJECT_ID="together-b80a9"
RUNTIME_BIN="${HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin"
PNPM_BIN="$RUNTIME_BIN/pnpm"
NODE_BIN_DIR="${HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
DEFAULT_SERVICE_ACCOUNT="$ROOT_DIR/.firebase-service-account.json"
FALLBACK_SERVICE_ACCOUNT=""

if [ ! -x "$PNPM_BIN" ]; then
  echo "找不到内置 pnpm：$PNPM_BIN"
  exit 1
fi

if [ ! -x "$NODE_BIN_DIR/node" ]; then
  echo "找不到内置 node：$NODE_BIN_DIR/node"
  exit 1
fi

if [ $# -lt 1 ]; then
  echo "用法："
  echo "  $0 login"
  echo "  $0 token"
  echo "  $0 deploy"
  echo "  $0 deploy --token YOUR_FIREBASE_TOKEN"
  echo "  $0 deploy --service-account /path/to/service-account.json"
  exit 1
fi

ACTION="$1"
shift || true

cd "$ROOT_DIR"
export PATH="$NODE_BIN_DIR:$RUNTIME_BIN:$PATH"
export GCLOUD_PROJECT="$FIREBASE_PROJECT_ID"
export GOOGLE_CLOUD_PROJECT="$FIREBASE_PROJECT_ID"

if [ -f "$DEFAULT_SERVICE_ACCOUNT" ]; then
  export GOOGLE_APPLICATION_CREDENTIALS="$DEFAULT_SERVICE_ACCOUNT"
else
  for candidate in "$ROOT_DIR"/*firebase-adminsdk*.json; do
    if [ -f "$candidate" ]; then
      FALLBACK_SERVICE_ACCOUNT="$candidate"
      export GOOGLE_APPLICATION_CREDENTIALS="$candidate"
      break
    fi
  done
fi

case "$ACTION" in
  login)
    "$PNPM_BIN" dlx firebase-tools login "$@"
    ;;
  token)
    "$PNPM_BIN" dlx firebase-tools login:ci "$@"
    ;;
  deploy)
    if [ "${1:-}" = "--service-account" ]; then
      if [ $# -lt 2 ]; then
        echo "请在 --service-account 后面跟上 JSON 路径"
        exit 1
      fi
      export GOOGLE_APPLICATION_CREDENTIALS="$2"
      shift 2
    fi
    if [ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
      echo "没有找到可用的 Firebase 服务账号 JSON。"
      echo "你可以二选一："
      echo "1. 把 JSON 放到：$DEFAULT_SERVICE_ACCOUNT"
      echo "2. 或者运行：$0 deploy --service-account /path/to/service-account.json"
      exit 1
    fi
    if [ -n "$FALLBACK_SERVICE_ACCOUNT" ] && [ "${GOOGLE_APPLICATION_CREDENTIALS:-}" = "$FALLBACK_SERVICE_ACCOUNT" ]; then
      echo "已自动使用服务账号：$FALLBACK_SERVICE_ACCOUNT"
    fi
    "$PNPM_BIN" dlx firebase-tools deploy --project "$FIREBASE_PROJECT_ID" --only hosting "$@"
    ;;
  *)
    echo "不支持的命令：$ACTION"
    echo "可用命令：login / token / deploy"
    exit 1
    ;;
esac
