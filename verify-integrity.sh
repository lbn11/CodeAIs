#!/bin/bash

# 完整性验证脚本

echo "============================================================"
echo "🔍 Agent 集群系统 - 完整性验证"
echo "============================================================"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

check_pass() {
    echo "   ✅ $1"
    ((PASS_COUNT++))
}

check_fail() {
    echo "   ❌ $1"
    ((FAIL_COUNT++))
}

# 1. 检查核心配置文件
echo "1️⃣  检查核心配置文件..."
if [ -f "package.json" ]; then check_pass "package.json 存在"; else check_fail "package.json 缺失"; fi
if [ -f "tsconfig.json" ]; then check_pass "tsconfig.json 存在"; else check_fail "tsconfig.json 缺失"; fi
if [ -f ".env.example" ]; then check_pass ".env.example 存在"; else check_fail ".env.example 缺失"; fi

# 2. 检查源文件
echo ""
echo "2️⃣  检查源文件..."
if [ -f "src/orchestrator/index.ts" ]; then check_pass "主编排器存在"; else check_fail "主编排器缺失"; fi
if [ -f "src/orchestrator/index-enhanced.ts" ]; then check_pass "增强版编排器存在"; else check_fail "增强版编排器缺失"; fi
if [ -f "src/orchestrator/progress-tracker.ts" ]; then check_pass "进度追踪器存在"; else check_fail "进度追踪器缺失"; fi
if [ -f "src/orchestrator/task-manager.ts" ]; then check_pass "任务管理器存在"; else check_fail "任务管理器缺失"; fi
if [ -f "src/orchestrator/context-loader.ts" ]; then check_pass "上下文加载器存在"; else check_fail "上下文加载器缺失"; fi
if [ -f "src/orchestrator/agent-selector.ts" ]; then check_pass "Agent 选择器存在"; else check_fail "Agent 选择器缺失"; fi
if [ -f "src/orchestrator/prompt-generator.ts" ]; then check_pass "Prompt 生成器存在"; else check_fail "Prompt 生成器缺失"; fi
if [ -f "src/orchestrator/task-agent-spawner.ts" ]; then check_pass "Agent 启动器存在"; else check_fail "Agent 启动器缺失"; fi
if [ -f "src/orchestrator/learning-engine.ts" ]; then check_pass "学习引擎存在"; else check_fail "学习引擎缺失"; fi
if [ -f "src/orchestrator/test-runner.ts" ]; then check_pass "测试运行器存在"; else check_fail "测试运行器缺失"; fi
if [ -f "src/orchestrator/task-result-recorder.ts" ]; then check_pass "结果记录器存在"; else check_fail "结果记录器缺失"; fi
if [ -f "src/orchestrator/notification-manager.ts" ]; then check_pass "通知管理器存在"; else check_fail "通知管理器缺失"; fi
if [ -f "src/orchestrator/code-reviewer.ts" ]; then check_pass "Code Reviewer 存在"; else check_fail "Code Reviewer 缺失"; fi

# 3. 检查监控脚本
echo ""
echo "3️⃣  检查监控脚本..."
if [ -f "src/monitors/task-monitor.js" ]; then check_pass "任务监控器存在"; else check_fail "任务监控器缺失"; fi
if [ -f "src/monitors/health-check.js" ]; then check_pass "健康检查存在"; else check_fail "健康检查缺失"; fi

# 4. 检查类型定义
echo ""
echo "4️⃣  检查类型定义..."
if [ -f "src/types/index.ts" ]; then check_pass "类型定义存在"; else check_fail "类型定义缺失"; fi

# 5. 检查 Shell 脚本
echo ""
echo "5️⃣  检查 Shell 脚本..."
if [ -f "scripts/setup.sh" ]; then check_pass "初始化脚本存在"; else check_fail "初始化脚本缺失"; fi
if [ -f "scripts/start-agent.sh" ]; then check_pass "Agent 启动脚本存在"; else check_fail "Agent 启动脚本缺失"; fi
if [ -f "scripts/worktree-manager.sh" ]; then check_pass "Worktree 管理脚本存在"; else check_fail "Worktree 管理脚本缺失"; fi
if [ -f "test-enhanced.sh" ]; then check_pass "增强版测试脚本存在"; else check_fail "增强版测试脚本缺失"; fi

# 6. 检查文档
echo ""
echo "6️⃣  检查文档文件..."
if [ -f "README.md" ]; then check_pass "README.md 存在"; else check_fail "README.md 缺失"; fi
if [ -f "QUICKSTART.md" ]; then check_pass "QUICKSTART.md 存在"; else check_fail "QUICKSTART.md 缺失"; fi
if [ -f "PROGRESS.md" ]; then check_pass "PROGRESS.md 存在"; else check_fail "PROGRESS.md 缺失"; fi
if [ -f "NEW_FEATURES.md" ]; then check_pass "NEW_FEATURES.md 存在"; else check_fail "NEW_FEATURES.md 缺失"; fi
if [ -f "SYSTEM_OVERVIEW.md" ]; then check_pass "SYSTEM_OVERVIEW.md 存在"; else check_fail "SYSTEM_OVERVIEW.md 缺失"; fi
if [ -f "ENHANCED_GUIDE.md" ]; then check_pass "ENHANCED_GUIDE.md 存在"; else check_fail "ENHANCED_GUIDE.md 缺失"; fi
if [ -f "ENHANCEMENT_SUMMARY.md" ]; then check_pass "ENHANCEMENT_SUMMARY.md 存在"; else check_fail "ENHANCEMENT_SUMMARY.md 缺失"; fi
if [ -f "QUICK_REFERENCE.md" ]; then check_pass "QUICK_REFERENCE.md 存在"; else check_fail "QUICK_REFERENCE.md 缺失"; fi

# 7. 检查编译输出
echo ""
echo "7️⃣  检查编译输出..."
if [ -d "dist" ]; then check_pass "编译目录存在"; else check_fail "编译目录缺失"; fi
if [ -f "dist/orchestrator/index.js" ]; then check_pass "主编排器已编译"; else check_fail "主编排器未编译"; fi
if [ -f "dist/orchestrator/index-enhanced.js" ]; then check_pass "增强版编排器已编译"; else check_fail "增强版编排器未编译"; fi
if [ -f "dist/orchestrator/progress-tracker.js" ]; then check_pass "进度追踪器已编译"; else check_fail "进度追踪器未编译"; fi

# 8. 检查必要目录
echo ""
echo "8️⃣  检查必要目录..."
if [ -d "context" ]; then check_pass "context 目录存在"; else check_fail "context 目录缺失"; fi
if [ -d "context/iterations" ]; then check_pass "context/iterations 目录存在"; else check_fail "context/iterations 目录缺失"; fi
if [ -d "tasks" ]; then check_pass "tasks 目录存在"; else check_fail "tasks 目录缺失"; fi
if [ -d "tasks/active" ]; then check_pass "tasks/active 目录存在"; else check_fail "tasks/active 目录缺失"; fi
if [ -d "tasks/completed" ]; then check_pass "tasks/completed 目录存在"; else check_fail "tasks/completed 目录缺失"; fi
if [ -d "logs" ]; then check_pass "logs 目录存在"; else check_fail "logs 目录缺失"; fi
if [ -d "task-results" ]; then check_pass "task-results 目录存在"; else check_fail "task-results 目录缺失"; fi
if [ -d "worktrees" ]; then check_pass "worktrees 目录存在"; else check_fail "worktrees 目录缺失"; fi
if [ -d "scripts" ]; then check_pass "scripts 目录存在"; else check_fail "scripts 目录缺失"; fi

# 9. 检查示例迭代需求
echo ""
echo "9️⃣  检查示例数据..."
if [ -f "context/iterations/iteration-001.md" ]; then check_pass "示例迭代需求存在"; else check_fail "示例迭代需求缺失"; fi

# 10. 检查依赖
echo ""
echo "🔟 检查依赖..."
if [ -d "node_modules" ]; then
    PACKAGE_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    check_pass "依赖已安装 ($((PACKAGE_COUNT-1)) 个包)"
else
    check_fail "依赖未安装"
fi

# 总结
echo ""
echo "============================================================"
echo "📊 验证结果"
echo "============================================================"
echo ""
echo "✅ 通过: $PASS_COUNT 项"
echo "❌ 失败: $FAIL_COUNT 项"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 完美！所有检查都通过了！"
    echo ""
    echo "📝 下一步:"
    echo "   1. 配置环境变量: cp .env.example .env && nano .env"
    echo "   2. 启动增强版编排器: npm run orchestrator:enhanced"
    echo ""
    echo "💩 爸爸，系统完全正常，可以放心使用！"
else
    echo "⚠️  发现 $FAIL_COUNT 个问题，请检查上述失败项"
    echo ""
    echo "💡 建议: 运行 npm install 安装依赖"
fi

echo ""
echo "============================================================"

# 返回码
if [ $FAIL_COUNT -eq 0 ]; then
    exit 0
else
    exit 1
fi
