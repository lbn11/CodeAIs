/**
 * 学习引擎 - Ralph Loop (改进版)
 * 从成功和失败中学习，持续改进 prompt 和策略
 */

import fs from 'fs/promises';
import path from 'path';
import { Task, LearningRecord } from '../types/index.js';

export class LearningEngine {
  private contextDir: string;
  private learningsPath: string;

  constructor(contextDir: string) {
    this.contextDir = contextDir;
    this.learningsPath = path.join(contextDir, 'learnings');
  }

  /**
   * 记录成功
   */
  async recordSuccess(task: Task): Promise<void> {
    const learning = await this.loadLearning(task.type);

    // 记录成功的模式
    if (!learning.successPatterns) {
      learning.successPatterns = [];
    }

    learning.successPatterns.push(this.extractSuccessPattern(task));
    learning.lastUpdated = Date.now();

    await this.saveLearning(task.type, learning);
  }

  /**
   * 记录失败
   */
  async recordFailure(task: Task, reason: string): Promise<void> {
    const learning = await this.loadLearning(task.type);

    // 记录失败的模式
    if (!learning.failurePatterns) {
      learning.failurePatterns = [];
    }

    learning.failurePatterns.push(
      `Task: ${task.description} | Reason: ${reason} | Timestamp: ${Date.now()}`
    );

    learning.lastUpdated = Date.now();

    await this.saveLearning(task.type, learning);
  }

  /**
   * 改进 prompt
   */
  async improvePrompt(task: Task): Promise<string> {
    const learning = await this.loadLearning(task.type);

    // 分析失败原因，生成改进建议
    const improvements = this.generateImprovements(learning);

    // 应用改进到原始 prompt
    let improvedPrompt = this.buildPrompt(task);

    if (improvements.length > 0) {
      improvedPrompt += '\n\n## 📚 经验教训\n\n';
      improvements.forEach(improvement => {
        improvedPrompt += `- ${improvement}\n`;
      });
    }

    return improvedPrompt;
  }

  /**
   * 提取成功模式
   */
  private extractSuccessPattern(task: Task): string {
    // 根据任务的描述和要求，提取成功的模式
    return `任务类型: ${task.type} | 描述: ${task.description} | 成功因素: ${task.requirements.join(', ')}`;
  }

  /**
   * 生成改进建议
   */
  private generateImprovements(learning: LearningRecord): string[] {
    const improvements: string[] = [];

    // 从失败模式中学习
    if (learning.failurePatterns && learning.failurePatterns.length > 0) {
      const recentFailures = learning.failurePatterns.slice(-5);

      recentFailures.forEach(failure => {
        if (failure.includes('类型定义')) {
          improvements.push('总是包含相关的类型定义文件路径');
        }

        if (failure.includes('上下文不足')) {
          improvements.push('提供更多业务上下文和历史决策');
        }

        if (failure.includes('测试失败')) {
          improvements.push('在实现功能的同时编写测试');
        }
      });
    }

    // 从成功模式中提取最佳实践
    if (learning.successPatterns && learning.successPatterns.length > 0) {
      const bestPatterns = learning.successPatterns.slice(-3);

      bestPatterns.forEach(pattern => {
        if (pattern.includes('类型定义')) {
          improvements.push('确保使用 TypeScript 类型定义');
        }

        if (pattern.includes('测试')) {
          improvements.push('为所有新功能添加测试');
        }
      });
    }

    return improvements;
  }

  /**
   * 构建 prompt
   */
  private buildPrompt(task: Task): string {
    return `
# 任务：${task.description}

## 要求
${task.requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}

## 执行
- 在独立的 git worktree 中工作
- 创建功能分支：feat/${task.id}
- 编写测试
- 提交代码并创建 PR

`;
  }

  /**
   * 加载学习记录
   */
  async loadLearning(taskType: string): Promise<LearningRecord> {
    try {
      const filePath = path.join(this.learningsPath, `${taskType}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as LearningRecord;
    } catch (error) {
      // 返回空的学习记录
      return {
        successPatterns: [],
        failurePatterns: [],
        promptImprovements: [],
        lastUpdated: 0,
      };
    }
  }

  /**
   * 保存学习记录
   */
  async saveLearning(taskType: string, learning: LearningRecord): Promise<void> {
    await fs.mkdir(this.learningsPath, { recursive: true });
    const filePath = path.join(this.learningsPath, `${taskType}.json`);
    await fs.writeFile(filePath, JSON.stringify(learning, null, 2), 'utf-8');
  }

  /**
   * 加载所有学习记录
   */
  async loadLearnings(): Promise<LearningRecord[]> {
    try {
      await fs.mkdir(this.learningsPath, { recursive: true });
      const files = await fs.readdir(this.learningsPath);
      const learnings: LearningRecord[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.learningsPath, file), 'utf-8');
          learnings.push(JSON.parse(content) as LearningRecord);
        }
      }

      return learnings;
    } catch (error) {
      return [];
    }
  }

  /**
   * 保存所有学习记录
   */
  async saveLearnings(): Promise<void> {
    // 这个方法在具体 save 时调用，这里可以用于批量保存或备份
    console.log('📚 学习记录已保存');
  }
}
