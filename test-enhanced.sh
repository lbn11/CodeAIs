#!/bin/bash

# 增强版编排器测试脚本

echo "============================================================"
echo "🧪 增强版编排器测试"
echo "============================================================"
echo ""

# 1. 检查编译是否成功
echo "1️⃣ 检查编译状态..."
if [ -d "dist/orchestrator" ]; then
    echo "   ✅ 编译目录存在"
else
    echo "   ❌ 编译目录不存在，请先运行 npm run build"
    exit 1
fi

# 2. 检查增强版编排器文件
echo ""
echo "2️⃣ 检查增强版文件..."
if [ -f "dist/orchestrator/index-enhanced.js" ]; then
    echo "   ✅ 增强版编排器已编译"
else
    echo "   ❌ 增强版编排器未编译"
    exit 1
fi

if [ -f "dist/orchestrator/progress-tracker.js" ]; then
    echo "   ✅ 进度追踪器已编译"
else
    echo "   ❌ 进度追踪器未编译"
    exit 1
fi

# 3. 检查配置文件
echo ""
echo "3️⃣ 检查配置文件..."
if [ -f ".env" ]; then
    echo "   ✅ .env 配置文件存在"

    # 检查关键配置
    if grep -q "CLAUDE_API_KEY" .env; then
        echo "   ✅ CLAUDE_API_KEY 已配置"
    else
        echo "   ⚠️  CLAUDE_API_KEY 未配置"
    fi

    if grep -q "CLAUDE_API_URL" .env; then
        echo "   ✅ CLAUDE_API_URL 已配置"
    else
        echo "   ⚠️  CLAUDE_API_URL 未配置"
    fi

    if grep -q "GIT_REPO_URL" .env; then
        echo "   ✅ GIT_REPO_URL 已配置"
    else
        echo "   ⚠️  GIT_REPO_URL 未配置"
    fi
else
    echo "   ⚠️  .env 配置文件不存在"
    echo "   💡 运行: cp .env.example .env"
fi

# 4. 检查必要的目录
echo ""
echo "4️⃣ 检查必要目录..."

mkdir -p tasks/active
echo "   ✅ tasks/active 目录"

mkdir -p tasks/completed
echo "   ✅ tasks/completed 目录"

mkdir -p logs
echo "   ✅ logs 目录"

mkdir -p task-results
echo "   ✅ task-results 目录"

mkdir -p context/iterations
echo "   ✅ context/iterations 目录"

# 5. 检查示例迭代需求
echo ""
echo "5️⃣ 检查示例迭代需求..."
if [ -f "context/iterations/iteration-001.md" ]; then
    echo "   ✅ 示例迭代需求存在"
else
    echo "   ⚠️  示例迭代需求不存在"
fi

# 6. 显示进度快照状态
echo ""
echo "6️⃣ 检查进度快照..."
if [ -f "tasks/active/progress-snapshot.json" ]; then
    echo "   ✅ 进度快照文件存在"
    echo "   📊 进度快照内容:"
    cat tasks/active/progress-snapshot.json | head -20
else
    echo "   ℹ️  进度快照文件不存在（首次启动时创建）"
fi

# 7. 总结
echo ""
echo "============================================================"
echo "📊 测试总结"
echo "============================================================"
echo ""
echo "✅ 所有必要检查已完成"
echo ""
echo "📝 下一步:"
echo "   1. 确保 .env 文件配置正确"
echo "   2. 在 context/iterations/ 添加你的需求"
echo "   3. 运行: npm run orchestrator:enhanced"
echo ""
echo "💡 查看实时进度:"
echo "   - 终端输出：实时显示任务进度"
echo "   - 进度文件：tasks/active/progress-snapshot.json"
echo "   - 日志文件：logs/orchestrator.log"
echo ""
echo "============================================================"
echo "💩 爸爸，增强版编排器已就绪！启动试试吧！"
echo "============================================================"
