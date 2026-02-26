/**
 * Prompt 生成器
 * 根据任务和上下文生成精确的 prompt
 */

import { Task } from '../types/index.js';

export class PromptGenerator {
  /**
   * 生成任务 prompt
   */
  async generate(task: Task): Promise<string> {
    // 基础 prompt
    let prompt = this.buildBasePrompt(task);

    // 添加上下文
    prompt += this.buildContextSection(task);

    // 添加具体要求
    prompt += this.buildRequirementsSection(task);

    // 添加约束和指导
    prompt += this.buildConstraintsSection(task);

    return prompt;
  }

  /**
   * 构建基础 prompt
   */
  private buildBasePrompt(task: Task): string {
    const taskTypeDesc = this.getTaskTypeDescription(task.type);

    return `
# 任务：${task.description}

**任务类型**：${taskTypeDesc}
**优先级**：${task.priority}

`;
  }

  /**
   * 构建上下文部分
   */
  private buildContextSection(task: Task): string {
    let section = '## 📚 背景上下文\n\n';

    if (task.context.customerNotes) {
      section += `**客户需求**：\n${task.context.customerNotes}\n\n`;
    }

    if (task.context.meetingNotes) {
      section += `**相关会议记录**：\n${task.context.meetingNotes.substring(0, 500)}...\n\n`;
    }

    if (task.context.previousDecisions && task.context.previousDecisions.length > 0) {
      section += `**相关决策**：\n`;
      task.context.previousDecisions.slice(0, 3).forEach((decision, i) => {
        section += `${i + 1}. ${decision}\n`;
      });
      section += '\n';
    }

    return section;
  }

  /**
   * 构建需求部分
   */
  private buildRequirementsSection(task: Task): string {
    let section = '## ✅ 具体要求\n\n';

    task.requirements.forEach((req, i) => {
      section += `${i + 1}. ${req}\n`;
    });

    section += '\n';

    return section;
  }

  /**
   * 构建约束部分
   */
  private buildConstraintsSection(task: Task): string {
    return `## 🎯 执行指南

1. **代码质量**
   - 遵循项目现有代码风格
   - 添加必要的注释和文档
   - 确保类型安全（使用 TypeScript）
   - 添加适当的错误处理

2. **测试要求**
   - 为新功能编写单元测试
   - 确保测试覆盖率 > 80%
   - 所有测试必须通过

3. **提交规范**
   - 使用有意义的提交信息
   - 遵循 Conventional Commits 规范
   - 例如：feat: 实现视频上传功能

4. **工作流程**
   - 在独立的 git worktree 中工作
   - 创建功能分支：feat/${task.id}
   - 完成后创建 Pull Request
   - 在 PR 描述中说明变更内容

5. **完成标准**
   - 所有测试通过
   - 代码已提交并推送
   - PR 已创建
   - 包含必要的文档更新

## 🚫 注意事项

- 不要修改生产数据库
- 不要暴露客户敏感信息
- 只使用完成任务所需的最小权限
- 遇到问题时及时报告

---
开始执行任务吧！完成任务后，请提供：
1. 变更的文件列表
2. PR 链接
3. 测试结果
`;
  }

  /**
   * 获取任务类型描述
   */
  private getTaskTypeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      'feature': '新功能开发',
      'bugfix': 'Bug 修复',
      'refactor': '代码重构',
      'design': '设计任务',
      'test': '测试开发',
      'docs': '文档编写',
    };

    return descriptions[type] || type;
  }

  /**
   * 根据学习记录改进 prompt
   */
  async improvePrompt(task: Task, learning: any): Promise<string> {
    let prompt = await this.generate(task);

    // 应用学习到的改进
    if (learning.promptImprovements && learning.promptImprovements.length > 0) {
      prompt += '\n\n## 📝 历史经验\n\n';
      learning.promptImprovements.forEach((improvement: string) => {
        prompt += `- ${improvement}\n`;
      });
      prompt += '\n';
    }

    return prompt;
  }
}
