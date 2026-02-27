#!/bin/bash

# 多 AI 提供商系统演示脚本

echo "============================================================"
echo "🤖 多 AI 提供商系统 - 演示"
echo "============================================================"
echo ""

# 检查是否编译
if [ ! -f "dist/orchestrator/ai-provider-manager.js" ]; then
    echo "❌ 请先运行 npm run build 编译文件"
    exit 1
fi

# 创建临时演示脚本
cat > demo-multi-provider.mjs << 'EOF'
import { getAIProviderManager } from './dist/orchestrator/ai-provider-manager.js';
import { getAgentSelectorEnhanced } from './dist/orchestrator/agent-selector-enhanced.js';

console.log('\n🎯 演示 1: 加载 Provider 配置\n');
console.log('='.repeat(60));

const providerManager = getAIProviderManager();
await providerManager.loadConfig();

console.log('\n🎯 演示 2: 打印所有可用 Provider\n');
console.log('='.repeat(60));

const providers = providerManager.getEnabledProviders();
console.log(`\n找到 ${providers.length} 个启用的 Provider:\n`);

for (const provider of providers) {
    const status = provider.enabled ? '✅' : '❌';
    const capabilities = provider.capabilities
        .map(c => `${c.type}(${c.strength})`)
        .join(', ');

    console.log(`${status} ${provider.name}`);
    console.log(`   ID: ${provider.id}`);
    console.log(`   模型: ${provider.model}`);
    console.log(`   优先级: ${provider.priority}`);
    console.log(`   成本: $${provider.costPer1kTokens}/1k tokens`);
    console.log(`   能力: ${capabilities}`);
    console.log('');
}

console.log('\n🎯 演示 3: 为不同任务类型选择 Provider\n');
console.log('='.repeat(60));

const agentSelector = getAgentSelectorEnhanced();
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
];

console.log(`\n测试 ${demoTasks.length} 个不同类型的任务:\n`);

for (const task of demoTasks) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📦 任务: ${task.id}`);
    console.log(`   类型: ${task.type}`);
    console.log(`   描述: ${task.description}`);
    console.log(`   优先级: ${task.priority}`);

    // 获取建议
    const { special, reason } = agentSelector.needsSpecialHandling(task);
    if (special && reason) {
        console.log(`   💡 建议: ${reason}`);
    }

    // 选择 Provider
    const providerId = await agentSelector.selectProvider(task);
    const provider = providerManager.getProvider(providerId);

    console.log(`   ✅ 选择: ${provider?.name} (${provider?.id})`);
}

console.log('\n\n🎯 演示 4: 强制指定 Provider\n');
console.log('='.repeat(60));

const task = {
    id: 'task-006',
    type: 'feature',
    description: '实现用户注册功能',
    priority: 'medium',
};

console.log(`\n📦 任务: ${task.id}`);
console.log(`   描述: ${task.description}`);
console.log(`   强制使用: OpenAI GPT-4\n`);

const providerId = await agentSelector.selectProvider(task, 'openai-gpt4');
const provider = providerManager.getProvider(providerId);

console.log(`✅ 选择: ${provider?.name} (${provider?.id})`);

console.log('\n\n🎯 演示 5: Provider 使用统计（空）\n');
console.log('='.repeat(60));

providerManager.printUsageStats();

console.log('\n\n============================================================');
console.log('🎉 演示完成！');
console.log('============================================================');
console.log('');
console.log('💡 说明:');
console.log('   - UI/设计任务自动选择 Gemini');
console.log('   - 图像处理任务选择 Gemini Flash');
console.log('   - 复杂架构任务选择 GPT-4');
console.log('   - 常规任务选择智谱（成本低）');
console.log('   - 可以强制指定 Provider');
console.log('');
console.log('📝 完整使用指南: MULTI_PROVIDER_GUIDE.md');
console.log('============================================================\n');
EOF

# 运行演示
node demo-multi-provider.mjs

# 清理
rm -f demo-multi-provider.mjs
