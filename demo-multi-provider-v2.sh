#!/bin/bash

# 多 AI 提供商系统演示脚本 v2（改进版）

echo "============================================================"
echo "🤖 多 AI 提供商系统 - 演示 v2（成本优化版）"
echo "============================================================"
echo ""

# 检查是否编译
if [ ! -f "dist/orchestrator/ai-provider-manager.js" ]; then
    echo "❌ 请先运行 npm run build 编译文件"
    exit 1
fi

# 创建临时演示脚本
cat > demo-multi-provider-v2.mjs << 'EOF'
import { getAIProviderManager } from './dist/orchestrator/ai-provider-manager.js';
import { getAgentSelectorEnhancedV2 } from './dist/orchestrator/agent-selector-enhanced-v2.js';

console.log('\n🎯 步骤 1: 加载 Provider 配置\n');
console.log('='.repeat(60));

const providerManager = getAIProviderManager();
await providerManager.loadConfig();

console.log('\n🎯 步骤 2: 打印所有可用 Provider\n');
console.log('='.repeat(60));

const providers = providerManager.getEnabledProviders();
console.log(`\n找到 ${providers.length} 个启用的 Provider:\n`);

for (const provider of providers) {
    const status = provider.enabled ? '✅' : '❌';
    console.log(`${status} ${provider.name}`);
    console.log(`   模型: ${provider.model}`);
    console.log(`   成本: $${provider.costPer1kTokens}/1k tokens`);
    console.log('');
}

console.log('\n🎯 步骤 3: 为不同任务类型选择 Provider（成本优化版）\n');
console.log('='.repeat(60));

const agentSelector = getAgentSelectorEnhancedV2();
await agentSelector.initialize();

// 模拟不同任务
const demoTasks = [
    {
        id: 'task-001',
        type: 'design',
        description: '设计一个儿童视频平台的登录界面',
        priority: 'high',
    },
    {
        id: 'task-002',
        type: 'design',
        description: '生成儿童小汽车的卡通插图',
        priority: 'medium',
    },
    {
        id: 'task-003',
        type: 'feature',
        description: '设计高并发的视频流媒体系统架构',
        priority: 'high',
    },
    {
        id: 'task-004',
        type: 'docs',
        description: '为登录功能编写 API 文档',
        priority: 'low',
    },
    {
        id: 'task-005',
        type: 'test',
        description: '编写用户登录功能的单元测试',
        priority: 'medium',
    },
    {
        id: 'task-006',
        type: 'bugfix',
        description: '修复登录页面的显示错误',
        priority: 'medium',
    },
    {
        id: 'task-007',
        type: 'refactor',
        description: '重构用户认证模块',
        priority: 'low',
    },
];

console.log(`\n测试 ${demoTasks.length} 个不同类型的任务:\n`);

const results = [];

for (const task of demoTasks) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📦 任务: ${task.id}`);
    console.log(`   类型: ${task.type.padEnd(10)} | 优先级: ${task.priority}`);
    console.log(`   描述: ${task.description}`);

    // 选择 Provider（启用成本优化）
    const providerId = await agentSelector.selectProvider(task, undefined, true);
    const provider = providerManager.getProvider(providerId);

    results.push({
        task,
        provider,
        cost: provider?.costPer1kTokens || 0,
    });

    console.log(`   ✅ 选择: ${provider?.name} (${provider?.id})`);
    console.log(`   💰 成本: $${provider?.costPer1kTokens}/1k tokens`);
}

console.log('\n\n🎯 步骤 4: 成本分析\n');
console.log('='.repeat(60));

// 统计
const stats = {};
let totalTasks = 0;
let totalEstimatedCost = 0;

for (const result of results) {
    const providerName = result.provider?.name || 'Unknown';
    if (!stats[providerName]) {
        stats[providerName] = {
            count: 0,
            tasks: [],
            cost: 0,
        };
    }

    stats[providerName].count++;
    stats[providerName].tasks.push(result.task.id);
    stats[providerName].cost = result.cost;

    totalTasks++;
    totalEstimatedCost += result.cost;
}

console.log('\n📊 任务分配统计:\n');

for (const [providerName, data] of Object.entries(stats)) {
    const percentage = ((data.count / totalTasks) * 100).toFixed(1);
    const bars = '█'.repeat(Math.floor(data.count / 2));

    console.log(`${providerName}:`);
    console.log(`   任务数: ${data.count} (${percentage}%) ${bars}`);
    console.log(`   成本: $${data.cost}/1k tokens`);
    console.log(`   任务: ${data.tasks.join(', ')}`);
    console.log('');
}

console.log('\n💰 成本分析:');
console.log(`   总任务: ${totalTasks}`);
console.log(`   估计总成本（假设每任务 1k tokens）: $${totalEstimatedCost.toFixed(4)}`);

// 对比全部用 GPT-4
const gpt4Cost = totalTasks * 0.03;
const savings = ((gpt4Cost - totalEstimatedCost) / gpt4Cost * 100).toFixed(1);
console.log(`   如果全部用 GPT-4: $${gpt4Cost.toFixed(4)}`);
console.log(`   💸 节省: ${savings}% ($${(gpt4Cost - totalEstimatedCost).toFixed(4)})`);
console.log('');

console.log('\n🎯 步骤 5: 强制使用 GPT-4（对比）\n');
console.log('='.repeat(60));

const task = {
    id: 'task-008',
    type: 'feature',
    description: '实现用户注册功能',
    priority: 'medium',
};

console.log(`\n📦 任务: ${task.id}`);
console.log(`   描述: ${task.description}`);
console.log(`   强制使用: OpenAI GPT-4\n`);

const providerId = await agentSelector.selectProvider(task, 'openai-gpt4', false);
const provider = providerManager.getProvider(providerId);

console.log(`✅ 选择: ${provider?.name} (${provider?.id})`);
console.log(`💰 成本: $${provider?.costPer1kTokens}/1k tokens`);

console.log('\n\n============================================================');
console.log('🎉 演示完成！');
console.log('============================================================');
console.log('');
console.log('💡 关键改进:');
console.log('   ✅ UI 任务 → Gemini Pro（成本 $0.001 vs $0.03）');
console.log('   ✅ 图像任务 → Gemini Flash（图像能力最强）');
console.log('   ✅ 复杂任务 → GPT-4（逻辑能力强）');
console.log('   ✅ 常规任务 → 智谱（成本最低 $0.001）');
console.log('   ✅ 节省成本 ~97%');
console.log('');
console.log('📝 完整使用指南: MULTI_PROVIDER_GUIDE.md');
console.log('============================================================\n');
EOF

# 运行演示
node demo-multi-provider-v2.mjs

# 清理
rm -f demo-multi-provider-v2.mjs
