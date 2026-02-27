/**
 * Agent 选择器（增强版 v2）- 支持多 AI 提供商
 *
 * 改进：
 * 1. 建议逻辑覆盖自动选择（成本优化）
 * 2. 更智能的任务识别
 * 3. 支持成本优先模式
 */

import { Task } from '../types/index.js';
import { AIProviderManager } from './ai-provider-manager.js';
import { TaskCategory } from '../types/multi-provider.js';

/**
 * 任务类型映射表
 */
const TASK_TYPE_MAPPING: Record<string, TaskCategory> = {
  'feature': 'feature',
  'bugfix': 'bugfix',
  'refactor': 'refactor',
  'design': 'design',
  'test': 'test',
  'docs': 'docs',
  'analysis': 'analysis',
  'planning': 'planning',
};

/**
 * Agent 选择器（增强版 v2）
 */
export class AgentSelectorEnhancedV2 {
  private providerManager: AIProviderManager;

  constructor() {
    this.providerManager = new AIProviderManager();
  }

  /**
   * 初始化
   */
  async initialize(): Promise<void> {
    await this.providerManager.loadConfig();
  }

  /**
   * 为任务选择最佳 Provider（改进版）
   */
  async selectProvider(
    task: Task,
    preferredProviderId?: string,
    costOptimized: boolean = true
  ): Promise<string> {
    console.log(`\n🎯 为任务 "${task.id}" 选择 Provider...`);

    // 映射任务类型
    const taskCategory = TASK_TYPE_MAPPING[task.type] || 'feature';

    // 1. 首先检查是否需要特殊处理
    const { special, reason, suggestedProviderId } = this.needsSpecialHandling(task);

    if (special && reason) {
      console.log(`💡 ${reason}`);

      // 如果启用了成本优化且有建议，使用建议的 Provider
      if (costOptimized && suggestedProviderId) {
        const suggested = this.providerManager.getProvider(suggestedProviderId);
        if (suggested && suggested.enabled) {
          console.log(`✅ 使用建议: ${suggested.name}`);
          return suggestedProviderId;
        }
      }
    }

    // 2. 如果指定了优先 Provider
    if (preferredProviderId) {
      const preferred = this.providerManager.getProvider(preferredProviderId);
      if (preferred && preferred.enabled) {
        console.log(`✅ 使用指定: ${preferred.name}`);
        return preferredProviderId;
      }
    }

    // 3. 自动选择最佳 Provider
    const result = await this.providerManager.selectBestProvider(taskCategory, {
      taskId: task.id,
      taskCategory,
      description: task.description,
      requirements: task.requirements,
    });

    return result.provider.id;
  }

  /**
   * 检查任务是否需要特殊处理（改进版）
   */
  needsSpecialHandling(task: Task): {
    special: boolean;
    reason?: string;
    suggestedProviderId?: string;
  } {
    const desc = task.description.toLowerCase();

    // UI/界面任务 → Gemini Pro
    if (desc.includes('ui') || desc.includes('界面') || desc.includes('用户界面')) {
      return {
        special: true,
        reason: 'UI/界面任务，使用 Gemini Pro（UI 能力强，成本低）',
        suggestedProviderId: 'gemini-pro'
      };
    }

    // 图像生成任务 → Gemini Flash
    if (desc.includes('生成') &&
        (desc.includes('图片') || desc.includes('图像') || desc.includes('插图') ||
         desc.includes('卡通') || desc.includes('icon') || desc.includes('图标'))) {
      return {
        special: true,
        reason: '图像生成任务，使用 Gemini Flash（图像能力最强）',
        suggestedProviderId: 'gemini-flash'
      };
    }

    // 图像识别/分析任务 → Gemini Flash
    if (desc.includes('识别') || desc.includes('分析') || desc.includes('视觉')) {
      return {
        special: true,
        reason: '视觉分析任务，使用 Gemini Flash',
        suggestedProviderId: 'gemini-flash'
      };
    }

    // 高优先级复杂任务（架构、设计） → GPT-4
    if (task.priority === 'high' &&
        (task.type === 'design' || task.type === 'feature')) {
      return {
        special: true,
        reason: '高优先级复杂任务，使用 GPT-4（逻辑推理能力最强）',
        suggestedProviderId: 'openai-gpt4'
      };
    }

    // 设计任务 → GPT-4（默认）
    if (task.type === 'design' && !desc.includes('ui') && !desc.includes('界面')) {
      return {
        special: true,
        reason: '系统设计任务，使用 GPT-4',
        suggestedProviderId: 'openai-gpt4'
      };
    }

    // 常规任务 → 智谱或 GPT-3.5
    if (task.priority === 'low' ||
        task.type === 'test' ||
        task.type === 'docs' ||
        task.type === 'refactor' ||
        task.type === 'bugfix') {
      return {
        special: true,
        reason: '常规任务，使用智谱 GLM-4（性价比最高）',
        suggestedProviderId: 'zhipu-glm4'
      };
    }

    // 中等优先级任务 → GPT-3.5
    if (task.priority === 'medium') {
      return {
        special: true,
        reason: '中等优先级任务，使用 GPT-3.5（性价比高）',
        suggestedProviderId: 'openai-gpt35'
      };
    }

    return { special: false };
  }

  /**
   * 打印所有可用的 Provider
   */
  printAvailableProviders(): void {
    const providers = this.providerManager.getEnabledProviders();

    console.log('\n📋 可用的 AI 提供商:\n');

    for (const provider of providers) {
      const status = provider.enabled ? '✅' : '❌';
      console.log(`${status} ${provider.name} (${provider.id})`);
      console.log(`   模型: ${provider.model}`);
      console.log(`   优先级: ${provider.priority}`);
      console.log(`   成本: $${provider.costPer1kTokens}/1k tokens`);
      console.log(`   能力:`);

      for (const cap of provider.capabilities) {
        const bars = '█'.repeat(Math.floor(cap.strength / 10));
        const empty = '░'.repeat(10 - Math.floor(cap.strength / 10));
        console.log(`     ${cap.type.padEnd(10)} [${bars}${empty}] ${cap.strength}`);
      }

      console.log('');
    }
  }

  /**
   * 打印使用统计
   */
  printUsageStats(): void {
    this.providerManager.printUsageStats();
  }
}

// 导出单例
let agentSelectorEnhancedV2Instance: AgentSelectorEnhancedV2 | null = null;

export function getAgentSelectorEnhancedV2(): AgentSelectorEnhancedV2 {
  if (!agentSelectorEnhancedV2Instance) {
    agentSelectorEnhancedV2Instance = new AgentSelectorEnhancedV2();
  }
  return agentSelectorEnhancedV2Instance;
}
