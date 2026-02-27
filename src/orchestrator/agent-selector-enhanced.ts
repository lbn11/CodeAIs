/**
 * Agent 选择器（增强版）- 支持多 AI 提供商
 *
 * 功能：
 * 1. 根据任务类型自动选择最合适的 AI Provider
 * 2. 支持指定优先 Provider
 * 3. 处理备选方案
 * 4. 记录使用统计
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
 * Agent 选择器（增强版）
 */
export class AgentSelectorEnhanced {
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
   * 为任务选择最佳 Provider
   */
  async selectProvider(
    task: Task,
    preferredProviderId?: string
  ): Promise<string> {
    console.log(`\n🎯 为任务 "${task.id}" 选择 Provider...`);

    // 映射任务类型
    const taskCategory = TASK_TYPE_MAPPING[task.type] || 'feature';

    // 选择最佳 Provider
    const result = await this.providerManager.selectBestProvider(taskCategory, {
      taskId: task.id,
      taskCategory,
      description: task.description,
      requirements: task.requirements,
      preferredProviderId,
    });

    return result.provider.id;
  }

  /**
   * 检查任务是否需要特殊处理
   */
  needsSpecialHandling(task: Task): { special: boolean; reason?: string } {
    // UI 任务 - 需要 Gemini
    if (task.description.toLowerCase().includes('ui') ||
        task.description.toLowerCase().includes('界面') ||
        task.description.toLowerCase().includes('设计')) {
      return { special: true, reason: 'UI/设计任务，建议使用 Gemini' };
    }

    // 图像任务 - 需要 Gemini Vision
    if (task.description.toLowerCase().includes('image') ||
        task.description.toLowerCase().includes('图片') ||
        task.description.toLowerCase().includes('视觉')) {
      return { special: true, reason: '图像处理任务，建议使用 Gemini Vision' };
    }

    // 复杂逻辑任务 - 需要 OpenAI GPT-4
    if (task.priority === 'high' &&
        (task.type === 'design' || task.type === 'feature')) {
      return { special: true, reason: '高优先级复杂任务，建议使用 GPT-4' };
    }

    // 常规任务 - 可以用智谱
    if (task.priority === 'low' || task.type === 'test' || task.type === 'docs') {
      return { special: true, reason: '常规任务，可以使用智谱降低成本' };
    }

    return { special: false };
  }

  /**
   * 获取建议的 Provider ID
   */
  async getRecommendedProvider(task: Task): Promise<string> {
    const { special, reason } = this.needsSpecialHandling(task);

    if (special && reason) {
      console.log(`💡 ${reason}`);

      // 根据建议选择
      if (reason.includes('UI') || reason.includes('设计')) {
        return 'gemini-pro'; // 或 'gemini-flash'
      }

      if (reason.includes('图像')) {
        return 'gemini-flash';
      }

      if (reason.includes('GPT-4')) {
        return 'openai-gpt4';
      }

      if (reason.includes('智谱')) {
        return 'zhipu-glm4';
      }
    }

    // 默认：让系统自动选择
    return await this.selectProvider(task);
  }

  /**
   * 打印所有可用的 Provider
   */
  printAvailableProviders(): void {
    const providers = this.providerManager.getEnabledProviders();

    console.log('\n📋 可用的 AI 提供商:\n');

    for (const provider of providers) {
      console.log(`✅ ${provider.name} (${provider.id})`);
      console.log(`   模型: ${provider.model}`);
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
let agentSelectorEnhancedInstance: AgentSelectorEnhanced | null = null;

export function getAgentSelectorEnhanced(): AgentSelectorEnhanced {
  if (!agentSelectorEnhancedInstance) {
    agentSelectorEnhancedInstance = new AgentSelectorEnhanced();
  }
  return agentSelectorEnhancedInstance;
}
