#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${0}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"

usage() {
  echo "用法："
  echo "  $0 init <GITHUB_REPO_URL>"
  echo "  $0 check"
  echo "  $0 sync [提交说明]"
  exit 1
}

default_commit_message() {
  date +"update %Y-%m-%d %H:%M:%S"
}

OFFICIAL_SYNC_PATHS=(
  ".github/workflows"
  ".gitignore"
  ".firebaserc"
  "AGENTS.md"
  "README.md"
  "docs"
  "firebase-hosting.sh"
  "firebase.json"
  "github-sync.sh"
  "issue.md"
  "prototype"
)

is_path_within_scope() {
  local file_path="$1"
  local scope

  for scope in "${OFFICIAL_SYNC_PATHS[@]}"; do
    case "$file_path" in
      "$scope"|"$scope"/*)
        return 0
        ;;
    esac
  done

  return 1
}

is_local_only_path() {
  local file_path="$1"

  case "$file_path" in
    prototype-draft|prototype-draft/*|.tmp-*|.tmp-*/*|tmp|tmp/*|outputs|outputs/*)
      return 0
      ;;
  esac

  return 1
}

collect_changed_paths() {
  local line
  local file_path

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    file_path="${line:3}"
    echo "$file_path"
  done < <(git status --porcelain=v1 --untracked-files=all)
}

print_path_list() {
  local title="$1"
  shift || true

  echo "$title"

  if [ $# -eq 0 ]; then
    echo "  - 无"
    return
  fi

  local item
  for item in "$@"; do
    echo "  - $item"
  done
}

check_sync_scope() {
  local file_path
  local has_scope_issue=0
  local -a official_changes=()
  local -a local_only_changes=()
  local -a unexpected_changes=()

  while IFS= read -r file_path; do
    [[ -z "$file_path" ]] && continue

    if is_path_within_scope "$file_path"; then
      official_changes+=("$file_path")
    elif is_local_only_path "$file_path"; then
      local_only_changes+=("$file_path")
    else
      unexpected_changes+=("$file_path")
    fi
  done < <(collect_changed_paths)

  print_path_list "本次允许同步的正式改动：" "${official_changes[@]}"

  if [ ${#local_only_changes[@]} -gt 0 ]; then
    echo
    print_path_list "检测到本地草稿或临时改动，请先清理或继续保持忽略：" "${local_only_changes[@]}"
    has_scope_issue=1
  fi

  if [ ${#unexpected_changes[@]} -gt 0 ]; then
    echo
    print_path_list "检测到正式范围外的改动，请先处理后再同步：" "${unexpected_changes[@]}"
    has_scope_issue=1
  fi

  if [ $has_scope_issue -eq 1 ]; then
    echo
    echo "同步已中止：当前脚本只会处理正式范围内的文件。"
    echo "如果这些文件本来就应该发布，请先把它们移动到正式目录，或更新同步范围约定。"
    return 1
  fi

  return 0
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

    check_sync_scope

    COMMIT_MESSAGE="${1:-$(default_commit_message)}"

    git add -A
    if git diff --cached --quiet; then
      echo "没有新的正式改动需要同步。"
      exit 0
    fi

    echo
    echo "本次将提交以下正式文件："
    git diff --cached --name-only
    echo

    git commit -m "$COMMIT_MESSAGE"
    git push
    echo "同步完成。"
    ;;

  check)
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      echo "这个目录还不是 Git 仓库。"
      echo "请先运行：./github-sync.sh init <GITHUB_REPO_URL>"
      exit 1
    fi

    check_sync_scope
    ;;

  *)
    usage
    ;;
esac
