/**
 * AI 提供商管理器
 *
 * 功能：
 * 1. 加载多个 AI 提供商配置
 * 2. 根据任务类型自动选择最合适的 Provider
 * 3. 处理备选方案和失败重试
 * 4. 成本优化和统计
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  AIProvider,
  TaskCategory,
  TaskCapabilityMapping,
  ProviderSelectionConfig,
  ProviderSelectionResult,
  TaskExecutionConfig,
  CapabilityType,
  ProviderUsageStats,
  SelectionStrategy,
} from '../types/multi-provider.js';

export class AIProviderManager {
  private providers: Map<string, AIProvider>;
  private taskMappings: Map<TaskCategory, TaskCapabilityMapping>;
  private selectionConfig: ProviderSelectionConfig;
  private usageStats: Map<string, ProviderUsageStats>;
  private configPath: string;

  constructor(configPath: string = './ai-providers.config.json') {
    this.configPath = configPath;
    this.providers = new Map();
    this.taskMappings = new Map();
    this.usageStats = new Map();
    this.selectionConfig = {
      strategy: 'highest_score',
      maxRetries: 3,
      fallbackEnabled: true,
      costThreshold: 50,
      reliabilityThreshold: 70,
    };
  }

  /**
   * 加载配置
   */
  async loadConfig(): Promise<void> {
    console.log('📦 加载 AI 提供商配置...');

    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(content);

      // 加载 Providers
      for (const provider of config.providers) {
        this.providers.set(provider.id, provider);
      }

      // 加载任务映射
      for (const mapping of config.taskMappings) {
        this.taskMappings.set(mapping.taskType, mapping);
      }

      // 加载选择配置
      if (config.selectionConfig) {
        this.selectionConfig = config.selectionConfig;
      }

      console.log(`✅ 已加载 ${this.providers.size} 个 AI 提供商`);
      console.log(`✅ 已配置 ${this.taskMappings.size} 种任务类型映射`);
      this.printProviders();
    } catch (error) {
      console.error('❌ 加载配置失败:', error);
      throw error;
    }
  }

  /**
   * 打印所有 Provider 信息
   */
  private printProviders(): void {
    console.log('\n📋 可用的 AI 提供商:\n');

    const providers = Array.from(this.providers.values());

    for (const provider of providers) {
      const status = provider.enabled ? '✅' : '❌';
      const capabilities = provider.capabilities
        .map(c => `${c.type}(${c.strength})`)
        .join(', ');

      console.log(`${status} ${provider.name} (${provider.id})`);
      console.log(`   模型: ${provider.model}`);
      console.log(`   优先级: ${provider.priority}`);
      console.log(`   成本: $${provider.costPer1kTokens}/1k tokens`);
      console.log(`   能力: ${capabilities}`);
      console.log('');
    }
  }

  /**
   * 获取所有启用的 Provider
   */
  getEnabledProviders(): AIProvider[] {
    return Array.from(this.providers.values())
      .filter(p => p.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取指定任务类型的最佳 Provider
   */
  async selectBestProvider(
    taskType: TaskCategory,
    config?: Partial<TaskExecutionConfig>
  ): Promise<ProviderSelectionResult> {
    console.log(`\n🎯 为任务类型 "${taskType}" 选择最佳 Provider...`);

    // 获取任务能力映射
    const mapping = this.taskMappings.get(taskType);
    if (!mapping) {
      throw new Error(`未找到任务类型 "${taskType}" 的能力映射`);
    }

    const requiredCapabilities: CapabilityType[] = [
      mapping.primaryCapability,
      ...mapping.secondaryCapabilities,
    ];

    console.log(`   主要能力: ${mapping.primaryCapability}`);
    console.log(`   次要能力: ${mapping.secondaryCapabilities.join(', ')}`);

    // 获取候选 Provider（排除被禁用的和指定的）
    let candidates = this.getEnabledProviders();

    if (config?.excludeProviderIds) {
      candidates = candidates.filter(p => !config.excludeProviderIds?.includes(p.id));
    }

    if (config?.preferredProviderId) {
      const preferred = candidates.find(p => p.id === config.preferredProviderId);
      if (preferred) {
        // 将优先 Provider 排在最前面
        candidates = [preferred, ...candidates.filter(p => p.id !== config.preferredProviderId)];
      }
    }

    console.log(`   候选 Provider: ${candidates.length} 个`);

    // 根据策略评分
    const results: ProviderSelectionResult[] = candidates.map(provider => ({
      provider,
      score: this.calculateScore(provider, requiredCapabilities, taskType),
      reasoning: this.getReasoning(provider, requiredCapabilities, taskType),
      fallbackProviders: [],
    }));

    // 根据策略选择
    let selected: ProviderSelectionResult;

    switch (this.selectionConfig.strategy) {
      case 'highest_score':
        selected = results.sort((a, b) => b.score - a.score)[0];
        break;
      case 'lowest_cost':
        selected = results.sort((a, b) => a.provider.costPer1kTokens - b.provider.costPer1kTokens)[0];
        break;
      case 'most_reliable':
        selected = results.sort((a, b) => {
          const aRel = this.getAverageCapability(a.provider, requiredCapabilities, 'reliability');
          const bRel = this.getAverageCapability(b.provider, requiredCapabilities, 'reliability');
          return bRel - aRel;
        })[0];
        break;
      default:
        selected = results.sort((a, b) => b.score - a.score)[0];
    }

    // 设置备选方案
    selected.fallbackProviders = results
      .filter(r => r.provider.id !== selected.provider.id)
      .slice(0, 2)
      .map(r => r.provider);

    console.log(`\n✅ 选择结果:`);
    console.log(`   Provider: ${selected.provider.name}`);
    console.log(`   评分: ${selected.score.toFixed(2)}`);
    console.log(`   原因: ${selected.reasoning}`);

    if (selected.fallbackProviders.length > 0) {
      console.log(`   备选: ${selected.fallbackProviders.map(p => p.name).join(', ')}`);
    }

    return selected;
  }

  /**
   * 计算 Provider 综合评分
   */
  private calculateScore(
    provider: AIProvider,
    requiredCapabilities: CapabilityType[],
    taskType: TaskCategory
  ): number {
    let score = 0;

    // 1. 能力匹配度（权重 50%）
    const capabilityScore = this.getCapabilityMatchScore(provider, requiredCapabilities);
    score += capabilityScore * 0.5;

    // 2. 可靠性（权重 20%）
    const reliabilityScore = this.getAverageCapability(provider, requiredCapabilities, 'reliability');
    score += reliabilityScore * 0.2;

    // 3. 成本效益（权重 15%）- 成本越低分数越高
    const costScore = Math.max(0, 100 - provider.costPer1kTokens * 1000);
    score += costScore * 0.15;

    // 4. 优先级（权重 15%）
    score += provider.priority * 0.15;

    return score;
  }

  /**
   * 获取能力匹配分数
   */
  private getCapabilityMatchScore(
    provider: AIProvider,
    requiredCapabilities: CapabilityType[]
  ): number {
    let totalScore = 0;
    let foundCount = 0;

    for (const capType of requiredCapabilities) {
      const capability = provider.capabilities.find(c => c.type === capType);
      if (capability) {
        totalScore += capability.strength;
        foundCount++;
      } else {
        // 如果没有该能力，给最低分
        totalScore += 0;
      }
    }

    // 计算平均分
    return totalScore / requiredCapabilities.length;
  }

  /**
   * 获取某个属性的平均值
   */
  private getAverageCapability(
    provider: AIProvider,
    requiredCapabilities: CapabilityType[],
    property: 'strength' | 'cost' | 'reliability'
  ): number {
    let total = 0;
    let count = 0;

    for (const capType of requiredCapabilities) {
      const capability = provider.capabilities.find(c => c.type === capType);
      if (capability) {
        total += capability[property];
        count++;
      }
    }

    return count > 0 ? total / count : 0;
  }

  /**
   * 获取选择原因
   */
  private getReasoning(
    provider: AIProvider,
    requiredCapabilities: CapabilityType[],
    taskType: TaskCategory
  ): string {
    const reasons: string[] = [];

    // 能力匹配
    const capabilityScore = this.getCapabilityMatchScore(provider, requiredCapabilities);
    reasons.push(`能力匹配度 ${capabilityScore.toFixed(0)}`);

    // 主要能力
    const primaryCap = provider.capabilities.find(c => c.type === requiredCapabilities[0]);
    if (primaryCap) {
      reasons.push(`${requiredCapabilities[0]} 能力 ${primaryCap.strength}`);
    }

    // 成本
    reasons.push(`成本 $${provider.costPer1kTokens}/1k tokens`);

    // 优先级
    reasons.push(`优先级 ${provider.priority}`);

    return reasons.join(', ');
  }

  /**
   * 获取 Provider
   */
  getProvider(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * 获取所有 Provider
   */
  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * 启用/禁用 Provider
   */
  async toggleProvider(providerId: string, enabled: boolean): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider "${providerId}" 不存在`);
    }

    provider.enabled = enabled;
    await this.saveConfig();

    console.log(`${enabled ? '✅' : '❌'} ${provider.name} 已${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 保存配置
   */
  async saveConfig(): Promise<void> {
    const config = {
      providers: Array.from(this.providers.values()),
      taskMappings: Array.from(this.taskMappings.values()),
      selectionConfig: this.selectionConfig,
    };

    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * 记录使用统计
   */
  recordUsage(
    providerId: string,
    success: boolean,
    tokens: number,
    cost: number,
    responseTime: number
  ): void {
    let stats = this.usageStats.get(providerId);

    if (!stats) {
      stats = {
        providerId,
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        totalTokens: 0,
        totalCost: 0,
        averageResponseTime: 0,
        lastUsed: 0,
      };
    }

    stats.totalTasks++;
    if (success) {
      stats.successfulTasks++;
    } else {
      stats.failedTasks++;
    }
    stats.totalTokens += tokens;
    stats.totalCost += cost;

    // 更新平均响应时间
    stats.averageResponseTime =
      (stats.averageResponseTime * (stats.totalTasks - 1) + responseTime) / stats.totalTasks;

    stats.lastUsed = Date.now();

    this.usageStats.set(providerId, stats);
  }

  /**
   * 获取使用统计
   */
  getUsageStats(): ProviderUsageStats[] {
    return Array.from(this.usageStats.values());
  }

  /**
   * 打印使用统计
   */
  printUsageStats(): void {
    console.log('\n📊 Provider 使用统计:\n');

    const stats = this.getUsageStats();

    if (stats.length === 0) {
      console.log('暂无统计数据\n');
      return;
    }

    for (const stat of stats) {
      const provider = this.providers.get(stat.providerId);
      const providerName = provider?.name || stat.providerId;

      console.log(`${providerName}:`);
      console.log(`   总任务: ${stat.totalTasks}`);
      console.log(`   成功: ${stat.successfulTasks} | 失败: ${stat.failedTasks}`);
      console.log(`   成功率: ${((stat.successfulTasks / stat.totalTasks) * 100).toFixed(1)}%`);
      console.log(`   总 Token: ${stat.totalTokens.toLocaleString()}`);
      console.log(`   总成本: $${stat.totalCost.toFixed(4)}`);
      console.log(`   平均响应: ${stat.averageResponseTime.toFixed(0)}ms`);
      console.log('');
    }
  }
}

// 导出单例
let providerManagerInstance: AIProviderManager | null = null;

export function getAIProviderManager(configPath?: string): AIProviderManager {
  if (!providerManagerInstance) {
    providerManagerInstance = new AIProviderManager(configPath);
  }
  return providerManagerInstance;
}
