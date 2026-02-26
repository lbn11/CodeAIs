#!/bin/bash

# Agent 启动脚本

set -e

# 参数
TASK_ID=${1:-"task-$(date +%s)"}
AGENT_TYPE=${2:-"claude-code"}
PRIORITY=${3:-"medium"}
PROMPT=${4:-"完成指定的开发任务"}

# 配置
WORKTREES_DIR="./worktrees"
BRANCH_NAME="feat/$TASK_ID"
WORKTREE_PATH="$WORKTREES_DIR/$TASK_ID"
TMUX_SESSION="agent-$TASK_ID"

echo "🚀 启动 Agent..."
echo "   任务 ID: $TASK_ID"
echo "   Agent 类型: $AGENT_TYPE"
echo "   优先级: $PRIORITY"
echo ""

# 1. 创建 worktree
echo "🔧 创建 git worktree..."
mkdir -p "$WORKTREES_DIR"
git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"
echo "✓ worktree 创建成功"

# 2. 创建 tmux 会话
echo "🖥️  创建 tmux 会话..."
tmux new-session -d -s "$TMUX_SESSION" -c "$WORKTREE_PATH"
echo "✓ tmux 会话创建成功"

# 3. 安装依赖（如果需要）
echo "📦 安装依赖..."
tmux send-keys -t "$TMUX_SESSION" "cd $WORKTREE_PATH" Enter
tmux send-keys -t "$TMUX_SESSION" "npm install" Enter

# 4. 启动 Agent
echo "🤖 启动 $AGENT_TYPE..."
case "$AGENT_TYPE" in
  claude-code)
    tmux send-keys -t "$TMUX_SESSION" "claude \"$PROMPT\"" Enter
    ;;
  codex)
    tmux send-keys -t "$TMUX_SESSION" "codex exec --full-auto \"$PROMPT\"" Enter
    ;;
  gemini)
    tmux send-keys -t "$TMUX_SESSION" "gemini \"$PROMPT\"" Enter
    ;;
  *)
    echo "❌ 未知的 Agent 类型: $AGENT_TYPE"
    exit 1
    ;;
esac

echo ""
echo "✅ Agent 已启动！"
echo ""
echo "📊 监控信息:"
echo "   tmux 会话: $TMUX_SESSION"
echo "   Worktree: $WORKTREE_PATH"
echo "   分支: $BRANCH_NAME"
echo ""
echo "🔍 查看日志:"
echo "   tmux attach -t $TMUX_SESSION"
echo ""
echo "🛑 停止 Agent:"
echo "   tmux kill-session -t $TMUX_SESSION"
echo "   git worktree remove $WORKTREE_PATH"
