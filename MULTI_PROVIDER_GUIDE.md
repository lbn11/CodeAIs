# 多 AI 提供商系统 - 使用指南

## 🎯 系统概述

这个系统允许你配置多个 AI 提供商（OpenAI、Gemini、智谱等），并根据任务类型自动选择最合适的 AI。

### 核心优势

1. **智能分配** - 不同任务用最擅长的 AI
2. **成本优化** - 常规任务用便宜的 AI，复杂任务用强大的 AI
3. **自动备选** - 主 Provider 失败时自动切换
4. **使用统计** - 跟踪每个 Provider 的使用情况和成本

## 📋 配置文件结构

### AI 提供商配置（ai-providers.config.json）

```json
{
  "providers": [
    {
      "id": "openai-gpt4",
      "name": "OpenAI GPT-4",
      "apiKey": "${OPENAI_API_KEY}",
      "apiURL": "https://api.openai.com/v1",
      "model": "gpt-4",
      "provider": "openai",
      "capabilities": [
        {
          "type": "logic",
          "strength": 95,
          "cost": 100,
          "reliability": 95
        }
      ],
      "maxTokens": 4096,
      "temperature": 0.7,
      "priority": 90,
      "enabled": true,
      "rateLimit": {
        "requestsPerMinute": 500,
        "tokensPerMinute": 90000
      },
      "costPer1kTokens": 0.03,
      "description": "最强大的通用 AI"
    }
  ]
}
```

### 能力类型说明

| 能力类型 | 说明 | 典型任务 | 推荐 Provider |
|---------|------|---------|-------------|
| **logic** | 逻辑推理 | 需求分析、任务拆解、架构设计 | GPT-4 |
| **code** | 代码编写 | 功能开发、Bug 修复 | GPT-4、GPT-3.5 |
| **design** | 系统设计 | 架构设计、技术选型 | GPT-4 |
| **ui** | UI/UX 设计 | 界面设计、组件开发 | Gemini Pro |
| **image** | 图像处理 | 图片生成、图像识别 | Gemini Flash |
| **test** | 测试编写 | 单元测试、E2E 测试 | GPT-3.5、智谱 |
| **refactor** | 代码重构 | 代码优化、重构 | GPT-3.5、智谱 |
| **docs** | 文档编写 | API 文档、注释 | GPT-3.5、智谱 |
| **review** | Code Review | 代码审查 | GPT-4 |

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install uuid
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# OpenAI
OPENAI_API_KEY=sk-xxxxx

# Google Gemini
GEMINI_API_KEY=AIzaSyxxxxx

# 智谱
ZHIPU_API_KEY=xxxxxxxxxxxx
```

### 3. 配置 AI Providers

编辑 `ai-providers.config.json`，添加你的 API Keys：

```json
{
  "providers": [
    {
      "id": "openai-gpt4",
      "name": "OpenAI GPT-4",
      "apiKey": "${OPENAI_API_KEY}",  // 会从环境变量读取
      "apiURL": "https://api.openai.com/v1",
      "model": "gpt-4",
      ...
    }
  ]
}
```

### 4. 在编排器中使用

```typescript
import { getAIProviderManager } from './ai-provider-manager.js';
import { getAgentSelectorEnhanced } from './agent-selector-enhanced.js';

// 初始化 Provider Manager
const providerManager = getAIProviderManager();
await providerManager.loadConfig();

// 为任务选择 Provider
const agentSelector = getAgentSelectorEnhanced();
await agentSelector.initialize();

const providerId = await agentSelector.selectProvider(task);
console.log(`选择 Provider: ${providerId}`);
```

## 💡 使用场景

### 场景 1: UI 设计任务

**任务描述**: "设计一个儿童视频平台的登录界面"

**系统自动选择**: Gemini Pro（UI 能力 85）

**原因**: UI 任务需要视觉设计能力，Gemini 在这方面更强

```typescript
const task = {
  id: 'task-001',
  type: 'design',
  description: '设计一个儿童视频平台的登录界面',
  priority: 'high'
};

const providerId = await agentSelector.selectProvider(task);
// 结果: gemini-pro
```

### 场景 2: 图像处理任务

**任务描述**: "生成儿童小汽车的卡通插图"

**系统自动选择**: Gemini Flash（图像能力 95）

**原因**: 图像生成任务，使用专门的视觉模型

```typescript
const task = {
  id: 'task-002',
  type: 'design',
  description: '生成儿童小汽车的卡通插图',
  priority: 'medium'
};

const providerId = await agentSelector.selectProvider(task);
// 结果: gemini-flash
```

### 场景 3: 复杂架构设计

**任务描述**: "设计高并发的视频流媒体系统架构"

**系统自动选择**: OpenAI GPT-4（逻辑能力 95）

**原因**: 复杂逻辑推理任务，使用最强的模型

```typescript
const task = {
  id: 'task-003',
  type: 'design',
  description: '设计高并发的视频流媒体系统架构',
  priority: 'high'
};

const providerId = await agentSelector.selectProvider(task);
// 结果: openai-gpt4
```

### 场景 4: 常规文档编写

**任务描述**: "为登录功能编写 API 文档"

**系统自动选择**: 智谱 GLM-4（成本低）

**原因**: 常规任务，使用成本更低的国产模型

```typescript
const task = {
  id: 'task-004',
  type: 'docs',
  description: '为登录功能编写 API 文档',
  priority: 'low'
};

const providerId = await agentSelector.selectProvider(task);
// 结果: zhipu-glm4
```

### 场景 5: 测试编写

**任务描述**: "编写用户登录功能的单元测试"

**系统自动选择**: 智谱 GLM-4 或 GPT-3.5

**原因**: 测试编写相对简单，不需要最强模型

```typescript
const task = {
  id: 'task-005',
  type: 'test',
  description: '编写用户登录功能的单元测试',
  priority: 'medium'
};

const providerId = await agentSelector.selectProvider(task);
// 结果: zhipu-glm4 (成本更低)
```

## 🎛️ 高级配置

### 指定优先 Provider

有时候你想强制使用某个 Provider：

```typescript
const providerId = await agentSelector.selectProvider(task, 'openai-gpt4');
// 强制使用 GPT-4
```

### 排除某些 Provider

```typescript
const result = await providerManager.selectBestProvider('feature', {
  excludeProviderIds: ['openai-gpt4']  // 排除 GPT-4
});
```

### 调整选择策略

在 `ai-providers.config.json` 中修改：

```json
{
  "selectionConfig": {
    "strategy": "lowest_cost",  // 改为成本优先
    "maxRetries": 3,
    "fallbackEnabled": true,
    "costThreshold": 50
  }
}
```

可选策略：
- `highest_score` - 综合评分最高（默认）
- `lowest_cost` - 成本最低
- `most_reliable` - 最可靠
- `round_robin` - 轮询

### 自定义任务映射

```json
{
  "taskMappings": [
    {
      "taskType": "feature",
      "primaryCapability": "code",
      "secondaryCapabilities": ["logic", "design"]
    }
  ]
}
```

## 📊 使用统计

系统会自动记录每个 Provider 的使用情况：

```typescript
// 记录使用
providerManager.recordUsage(
  'openai-gpt4',
  true,      // 成功
  1500,      // tokens
  0.045,     // 成本
  2340       // 响应时间 ms
);

// 查看统计
providerManager.printUsageStats();
```

输出示例：
```
📊 Provider 使用统计:

OpenAI GPT-4:
   总任务: 45
   成功: 42 | 失败: 3
   成功率: 93.3%
   总 Token: 67,500
   总成本: $2.0250
   平均响应: 2100ms

智谱 GLM-4:
   总任务: 128
   成功: 120 | 失败: 8
   成功率: 93.8%
   总 Token: 256,000
   总成本: $0.2560
   平均响应: 1500ms
```

## 🔧 故障排查

### 问题：Provider 选择错误

**原因**: 能力评分不准确

**解决**: 调整 Provider 的能力评分

```json
{
  "capabilities": [
    {
      "type": "code",
      "strength": 95,  // 调整这个值
      "cost": 100,
      "reliability": 95
    }
  ]
}
```

### 问题：总是使用最贵的 Provider

**原因**: 选择策略是 `highest_score`

**解决**: 改为 `lowest_cost` 或调整优先级

```json
{
  "selectionConfig": {
    "strategy": "lowest_cost"
  }
}
```

### 问题：环境变量没有生效

**原因**: 配置文件中的 API Key 格式不对

**解决**: 使用 `${VARIABLE_NAME}` 格式

```json
{
  "apiKey": "${OPENAI_API_KEY}"  // 正确
  // "apiKey": "sk-xxxxx"        // 不推荐（硬编码）
}
```

## 💡 最佳实践

### 1. 合理设置能力评分

- GPT-4: logic 95, code 90
- GPT-3.5: logic 80, code 75
- Gemini: ui 85, image 90
- 智谱: code 75, test 70

### 2. 成本优化策略

- 高优先级 + 复杂任务 → GPT-4
- 常规任务 → GPT-3.5 或智谱
- UI/图像 → Gemini
- 测试/文档 → 智谱

### 3. 定期查看统计

```bash
# 查看使用统计
providerManager.printUsageStats();
```

根据统计调整配置，优化成本和效果。

### 4. 启用备选方案

```json
{
  "selectionConfig": {
    "fallbackEnabled": true  // 确保启用
  }
}
```

这样主 Provider 失败时会自动切换到备选。

## 🎉 总结

通过这个多 AI 提供商系统，你可以：

1. ✅ 智能分配任务给最合适的 AI
2. ✅ 优化成本，用便宜的 AI 处理常规任务
3. ✅ 确保质量，用强大的 AI 处理复杂任务
4. ✅ 自动备选，避免单点故障
5. ✅ 跟踪统计，持续优化

---

**💩 爸爸，这样你就可以灵活配置多个 AI，让每个 AI 都做自己最擅长的事了！**
