/**
 * 多 AI 提供商类型定义
 */

/**
 * 能力类型
 */
export type CapabilityType =
  | 'logic'          // 逻辑推理（任务拆解、需求分析）
  | 'code'           // 代码编写
  | 'design'         // 系统设计
  | 'ui'             // UI/UX 设计
  | 'image'          // 图像生成/处理
  | 'test'           // 测试编写
  | 'refactor'       // 代码重构
  | 'docs'           // 文档编写
  | 'review';        // Code Review

/**
 * 能力配置
 */
export interface Capability {
  type: CapabilityType;
  strength: number;      // 能力强度 0-100
  cost: number;          // 成本（相对值，越小越便宜）
  reliability: number;   // 可靠性 0-100
}

/**
 * AI 提供商配置
 */
export interface AIProvider {
  id: string;            // 唯一标识
  name: string;          // 显示名称
  apiKey: string;         // API Key
  apiURL: string;        // API 地址
  model: string;          // 模型名称
  provider: 'openai' | 'anthropic' | 'google' | 'zhipu' | 'custom';
  capabilities: Capability[]; // 能力列表
  maxTokens: number;      // 最大 token 数
  temperature: number;    // 温度参数
  priority: number;       // 优先级 0-100
  enabled: boolean;       // 是否启用
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  costPer1kTokens: number; // 成本（美元/1k tokens）
  description?: string;    // 描述
}

/**
 * 任务类型
 */
export type TaskCategory =
  | 'feature'        // 功能开发
  | 'bugfix'         // Bug 修复
  | 'refactor'       // 代码重构
  | 'design'         // 系统设计
  | 'ui'             // UI 开发
  | 'test'           // 测试
  | 'docs'           // 文档
  | 'review'         // Code Review
  | 'analysis'       // 需求分析
  | 'planning';      // 任务规划

/**
 * 任务类型到能力的映射
 */
export interface TaskCapabilityMapping {
  taskType: TaskCategory;
  primaryCapability: CapabilityType; // 主要需要的能力
  secondaryCapabilities: CapabilityType[]; // 次要能力（可选）
}

/**
 * Provider 选择策略
 */
export type SelectionStrategy =
  | 'highest_score'      // 综合评分最高
  | 'lowest_cost'        // 成本最低
  | 'most_reliable'      // 最可靠
  | 'fastest'            // 速度最快（假设）
  | 'round_robin'        // 轮询
  | 'custom';            // 自定义

/**
 * Provider 选择配置
 */
export interface ProviderSelectionConfig {
  strategy: SelectionStrategy;
  maxRetries: number;
  fallbackEnabled: boolean;     // 是否启用备选
  costThreshold?: number;       // 成本阈值
  reliabilityThreshold?: number; // 可靠性阈值
}

/**
 * Provider 选择结果
 */
export interface ProviderSelectionResult {
  provider: AIProvider;
  score: number;               // 综合评分
  reasoning: string;            // 选择原因
  fallbackProviders: AIProvider[]; // 备选方案
}

/**
 * 任务执行配置
 */
export interface TaskExecutionConfig {
  taskId: string;
  taskCategory: TaskCategory;
  description: string;
  requirements: string[];
  requiredCapabilities: CapabilityType[];
  preferredProviderId?: string; // 优先使用的 Provider
  excludeProviderIds?: string[]; // 排除的 Provider
}

/**
 * Provider 使用统计
 */
export interface ProviderUsageStats {
  providerId: string;
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  lastUsed: number;
}
