#!/bin/bash

# Agent 集群系统初始化脚本

set -e

echo "🚀 开始初始化 Agent 集群系统..."
echo ""

# 1. 安装依赖
echo "📦 安装 Node.js 依赖..."
npm install

# 2. 创建目录结构
echo "📁 创建目录结构..."
mkdir -p context/iterations
mkdir -p context/decisions
mkdir -p context/meetings
mkdir -p context/learnings
mkdir -p tasks/active
mkdir -p tasks/completed
mkdir -p worktrees
mkdir -p logs

# 3. 初始化 Git（如果还没有）
if [ ! -d ".git" ]; then
    echo "🔧 初始化 Git 仓库..."
    git init
    git add .
    git commit -m "chore: 初始化 Agent 集群系统"
else
    echo "✓ Git 仓库已存在"
fi

# 4. 创建配置文件
if [ ! -f ".env" ]; then
    echo "📝 创建配置文件..."
    cp .env.example .env
    echo "   请编辑 .env 文件，填写你的配置"
else
    echo "✓ 配置文件已存在"
fi

# 5. 创建示例迭代需求
echo "📝 创建示例迭代需求..."
cat > context/iterations/example-iteration.md << 'EOF'
# 示例迭代需求

我想开发一个儿童小汽车视频平台，支持以下功能：

1. **视频上传**
   - 支持多种视频格式
   - 显示上传进度
   - 自动转码和压缩

2. **视频播放**
   - 流畅的播放体验
   - 支持倍速播放
   - 全屏模式

3. **评论系统**
   - 实时评论更新
   - 点赞和回复功能
   - 评论内容审核

4. **用户系统**
   - 注册和登录
   - 个人资料管理
   - 收藏功能

目标用户：3-8 岁儿童及其家长
设计风格：童趣、友好、安全
EOF

# 6. 编译 TypeScript
echo "🔨 编译 TypeScript..."
npm run build

# 7. 安装 tmux（检查是否已安装）
if ! command -v tmux &> /dev/null; then
    echo "⚠️  tmux 未安装"
    echo "   在 macOS 上安装: brew install tmux"
    echo "   在 Ubuntu 上安装: sudo apt-get install tmux"
else
    echo "✓ tmux 已安装"
fi

# 8. 检查 gh CLI（用于创建 PR）
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI 未安装"
    echo "   在 macOS 上安装: brew install gh"
    echo "   安装后需要认证: gh auth login"
else
    echo "✓ GitHub CLI 已安装"
fi

echo ""
echo "✅ 初始化完成！"
echo ""
echo "📋 下一步："
echo "1. 编辑 .env 文件，填写你的配置"
echo "2. 在 context/iterations/ 目录下添加你的迭代需求"
echo "3. 运行编排器: npm run orchestrator"
echo "4. 设置监控 cron: */10 * * * * cd $(pwd) && npm run monitor"
echo ""
echo "🎉 开始你的 AI 自动化之旅吧！"
