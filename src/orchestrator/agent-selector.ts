/**
 * Agent 选择器
 * 根据任务类型自动选择最合适的 Agent
 */

import { Task, AgentType } from '../types/index.js';

export class AgentSelector {
  /**
   * 根据任务选择 Agent
   */
  select(task: Task): AgentType {
    // 如果任务指定了 Agent，使用指定的
    if (task.agent) {
      return task.agent;
    }

    // 根据任务类型选择
    switch (task.type) {
      case 'design':
        // UI 设计任务优先用 Gemini
        return 'gemini';

      case 'feature':
        // 新功能开发根据任务描述选择
        return this.selectForFeature(task);

      case 'bugfix':
        // Bug 修复用 Codex（更擅长复杂推理）
        return 'codex';

      case 'refactor':
        // 重构用 Codex
        return 'codex';

      case 'test':
        // 测试用 Claude Code（快速）
        return 'claude-code';

      case 'docs':
        // 文档用 Claude Code
        return 'claude-code';

      default:
        return 'claude-code';
    }
  }

  /**
   * 为功能开发任务选择 Agent
   */
  private selectForFeature(task: Task): AgentType {
    const desc = task.description.toLowerCase();

    // 前端相关
    if (desc.includes('ui') || desc.includes('界面') || desc.includes('前端') ||
        desc.includes('组件') || desc.includes('样式') || desc.includes('按钮')) {
      return 'claude-code';
    }

    // 后端相关
    if (desc.includes('api') || desc.includes('数据库') || desc.includes('服务') ||
        desc.includes('后端') || desc.includes('逻辑')) {
      return 'codex';
    }

    // 设计相关
    if (desc.includes('设计') || desc.includes('原型') || desc.includes('视觉')) {
      return 'gemini';
    }

    // 默认用 Codex
    return 'codex';
  }

  /**
   * 获取 Agent 配置
   */
  getAgentConfig(agentType: AgentType): any {
    const configs = {
      'claude-code': {
        type: 'claude-code',
        name: 'Claude Code',
        description: '快速型选手，擅长前端工作和快速迭代',
        strengths: [
          '前端开发',
          '快速原型',
          'UI 组件',
          '文档编写',
        ],
        weaknesses: [
          '复杂后端逻辑',
          '大规模重构',
        ],
        model: 'claude-opus-4.5',
        temperature: 0.7,
      },
      'codex': {
        type: 'codex',
        name: 'Codex',
        description: '主力选手，擅长复杂后端逻辑和多文件重构',
        strengths: [
          '后端逻辑',
          '复杂 bug 修复',
          '多文件重构',
          '跨代码库推理',
        ],
        weaknesses: [
          '速度较慢',
          '成本较高',
        ],
        model: 'gpt-5.3-codex',
        temperature: 0.5,
      },
      'gemini': {
        type: 'gemini',
        name: 'Gemini',
        description: '设计师，擅长 UI 设计和视觉工作',
        strengths: [
          'UI 设计',
          '视觉美观',
          'HTML/CSS 规范',
          '用户体验',
        ],
        weaknesses: [
          '复杂逻辑',
          '代码质量',
        ],
        model: 'gemini-2.5-pro',
        temperature: 0.8,
      },
    };

    return configs[agentType];
  }
}
