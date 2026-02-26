#!/bin/bash

# Git worktree 管理脚本

set -e

ACTION=${1:-"list"}
WORKTREES_DIR="./worktrees"

case "$ACTION" in
  list)
    echo "📋 当前 worktrees:"
    git worktree list
    ;;

  create)
    if [ -z "$2" ]; then
        echo "用法: $0 create <branch-name> [worktree-path]"
        exit 1
    fi

    BRANCH_NAME=$2
    WORKTREE_PATH=${3:-"$WORKTREES_DIR/$BRANCH_NAME"}

    echo "🔧 创建 worktree..."
    git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"
    echo "✓ worktree 创建成功: $WORKTREE_PATH"
    ;;

  remove)
    if [ -z "$2" ]; then
        echo "用法: $0 remove <worktree-path>"
        exit 1
    fi

    WORKTREE_PATH=$2

    echo "🗑️  删除 worktree..."
    git worktree remove "$WORKTREE_PATH"
    echo "✓ worktree 删除成功"
    ;;

  clean)
    echo "🧹 清理所有孤立的 worktrees..."

    # 清理已删除分支的 worktree
    git worktree prune

    # 删除 worktrees 目录下的所有 worktree
    if [ -d "$WORKTREES_DIR" ]; then
        for worktree in "$WORKTREES_DIR"/*; do
            if [ -d "$worktree" ]; then
                echo "删除: $worktree"
                git worktree remove "$worktree" 2>/dev/null || rm -rf "$worktree"
            fi
        done
    fi

    echo "✓ 清理完成"
    ;;

  *)
    echo "用法: $0 <action>"
    echo ""
    echo "Actions:"
    echo "  list              - 列出所有 worktrees"
    echo "  create <branch>   - 创建新 worktree"
    echo "  remove <path>     - 删除指定 worktree"
    echo "  clean             - 清理所有 worktrees"
    exit 1
    ;;
esac
