#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${0}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"

usage() {
  echo "用法："
  echo "  $0 init <GITHUB_REPO_URL>"
  echo "  $0 sync [提交说明]"
  exit 1
}

default_commit_message() {
  date +"update %Y-%m-%d %H:%M:%S"
}

cd "$ROOT_DIR"

if [ $# -lt 1 ]; then
  usage
fi

ACTION="$1"
shift || true

case "$ACTION" in
  init)
    if [ $# -lt 1 ]; then
      echo "请在 init 后面带上 GitHub 仓库地址。"
      usage
    fi

    REPO_URL="$1"

    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      echo "这个目录已经是 Git 仓库了，跳过初始化。"
    else
      git init -b main
    fi

    if git remote get-url origin >/dev/null 2>&1; then
      echo "检测到已存在 origin，保留当前远程仓库。"
    else
      git remote add origin "$REPO_URL"
    fi

    git add -A
    if git diff --cached --quiet; then
      echo "没有可提交的初始化内容。"
    else
      git commit -m "initial sync"
    fi

    git push -u origin main
    echo "初始化完成。以后只需要运行：./github-sync.sh sync"
    ;;

  sync)
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      echo "这个目录还不是 Git 仓库。"
      echo "请先运行：./github-sync.sh init <GITHUB_REPO_URL>"
      exit 1
    fi

    COMMIT_MESSAGE="${1:-$(default_commit_message)}"

    git add -A
    if git diff --cached --quiet; then
      echo "没有新的改动需要同步。"
      exit 0
    fi

    git commit -m "$COMMIT_MESSAGE"
    git push
    echo "同步完成。"
    ;;

  *)
    usage
    ;;
esac
