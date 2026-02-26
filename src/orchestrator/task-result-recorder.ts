/**
 * 任务结果记录器
 * 记录每个任务的详细结果，用于后续任务学习和上下文传递
 */

import fs from 'fs/promises';
import path from 'path';
import { Task, TestResults } from '../types/index.js';

export interface TaskCompletionRecord {
  taskId: string;
  type: string;
  description: string;
  status: 'completed' | 'failed';

  // 代码变更
  filesChanged: string[];
  commitCount: number;
  prUrl: string;
  branchName: string;

  // 测试结果
  testResults: TestResults;
  testCoverage: number;

  // UI 变化
  uiChanges?: {
    beforeScreenshot?: string;
    afterScreenshot?: string;
    description: string;
  };

  // 代码审查
  codeReviews: {
    agent: string;
    status: 'approved' | 'changes_requested' | 'commented';
    comments: string[];
  }[];

  // 执行元数据
  agent: string;
  duration: number; // 毫秒
  retries: number;
  startedAt: number;
  completedAt: number;

  // 学习数据（重要！）
  learningData: {
    prompt: string;
    successfulPatterns: string[];
    failedPatterns: string[];
    contextUsed: string[];
    decisions: string[];
  };

  // 性能指标
  metrics: {
    codeQualityScore: number;
    testPassRate: number;
    reviewApprovalRate: number;
    timeEfficiency: number; // 基于任务复杂度和完成时间
  };
}

export class TaskResultRecorder {
  private resultsDir: string;
  private learningDataDir: string;

  constructor(resultsDir: string) {
    this.resultsDir = resultsDir;
    this.learningDataDir = path.join(resultsDir, 'learning-data');
  }

  /**
   * 记录任务完成
   */
  async recordCompletion(task: Task, result: any): Promise<TaskCompletionRecord> {
    const record: TaskCompletionRecord = {
      taskId: task.id,
      type: task.type,
      description: task.description,
      status: 'completed',

      filesChanged: result.filesChanged || [],
      commitCount: result.commitCount || 0,
      prUrl: result.prUrl || '',
      branchName: `feat/${task.id}`,

      testResults: result.testResults || {
        passed: 0,
        failed: 0,
        skipped: 0,
      },
      testCoverage: result.testCoverage || 0,

      uiChanges: result.uiChanges,

      codeReviews: result.codeReviews || [],

      agent: task.agent,
      duration: (task.completedAt || 0) - (task.startedAt || 0),
      retries: task.retries,
      startedAt: task.startedAt || task.createdAt,
      completedAt: task.completedAt || Date.now(),

      learningData: {
        prompt: result.prompt || '',
        successfulPatterns: result.successfulPatterns || [],
        failedPatterns: result.failedPatterns || [],
        contextUsed: this.extractContextUsed(task),
        decisions: this.extractDecisions(task),
      },

      metrics: this.calculateMetrics(task, result),
    };

    // 保存记录
    await this.saveRecord(record);

    // 更新学习数据（供后续任务使用）
    await this.updateLearningData(record);

    return record;
  }

  /**
   * 记录任务失败
   */
  async recordFailure(task: Task, reason: string, error?: string): Promise<void> {
    const record = {
      taskId: task.id,
      type: task.type,
      description: task.description,
      status: 'failed' as const,
      reason,
      error,
      agent: task.agent,
      retries: task.retries,
      timestamp: Date.now(),
    };

    // 保存失败记录
    const failuresDir = path.join(this.resultsDir, 'failures');
    await fs.mkdir(failuresDir, { recursive: true });
    const filePath = path.join(failuresDir, `${task.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf-8');

    console.log(`   ✓ 记录失败: ${task.id}`);
  }

  /**
   * 获取任务的历史记录（用于后续任务）
   */
  async getHistory(taskType?: string, limit: number = 10): Promise<TaskCompletionRecord[]> {
    await fs.mkdir(this.resultsDir, { recursive: true });

    const files = await fs.readdir(this.resultsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const records: TaskCompletionRecord[] = [];

    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(this.resultsDir, file), 'utf-8');
        const record = JSON.parse(content) as TaskCompletionRecord;

        // 过滤任务类型
        if (!taskType || record.type === taskType) {
          records.push(record);
        }
      } catch (error) {
        console.error(`读取记录失败: ${file}`, error);
      }
    }

    // 按完成时间排序，返回最近的
    return records
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, limit);
  }

  /**
   * 获取成功的模式（用于 prompt 生成）
   */
  async getSuccessfulPatterns(taskType: string): Promise<string[]> {
    const history = await this.getHistory(taskType, 20);
    const patterns = new Set<string>();

    history.forEach(record => {
      record.learningData.successfulPatterns.forEach(pattern => {
        patterns.add(pattern);
      });
    });

    return Array.from(patterns);
  }

  /**
   * 获取失败的模式（用于避免）
   */
  async getFailedPatterns(taskType: string): Promise<string[]> {
    const history = await this.getHistory(taskType, 20);
    const patterns = new Set<string>();

    history.forEach(record => {
      record.learningData.failedPatterns.forEach(pattern => {
        patterns.add(pattern);
      });
    });

    return Array.from(patterns);
  }

  /**
   * 保存记录
   */
  private async saveRecord(record: TaskCompletionRecord): Promise<void> {
    await fs.mkdir(this.resultsDir, { recursive: true });
    const filePath = path.join(this.resultsDir, `${record.taskId}.json`);
    await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf-8');

    console.log(`   ✓ 记录任务完成: ${record.taskId}`);
  }

  /**
   * 更新学习数据
   */
  private async updateLearningData(record: TaskCompletionRecord): Promise<void> {
    await fs.mkdir(this.learningDataDir, { recursive: true });

    const typeFile = path.join(this.learningDataDir, `${record.type}.json`);

    let learningData: any = {};
    try {
      const content = await fs.readFile(typeFile, 'utf-8');
      learningData = JSON.parse(content);
    } catch (error) {
      // 文件不存在，创建新的
      learningData = {
        type: record.type,
        patterns: [],
        lastUpdated: 0,
      };
    }

    // 添加成功的模式
    if (record.learningData.successfulPatterns.length > 0) {
      record.learningData.successfulPatterns.forEach(pattern => {
        if (!learningData.patterns.includes(pattern)) {
          learningData.patterns.push(pattern);
        }
      });
    }

    // 添加指标数据
    if (!learningData.metrics) {
      learningData.metrics = [];
    }
    learningData.metrics.push(record.metrics);

    // 只保留最近 100 条指标
    if (learningData.metrics.length > 100) {
      learningData.metrics = learningData.metrics.slice(-100);
    }

    learningData.lastUpdated = Date.now();

    await fs.writeFile(typeFile, JSON.stringify(learningData, null, 2), 'utf-8');
  }

  /**
   * 提取使用的上下文
   */
  private extractContextUsed(task: Task): string[] {
    const contexts: string[] = [];

    if (task.context.customerNotes) {
      contexts.push('customerNotes');
    }

    if (task.context.meetingNotes) {
      contexts.push('meetingNotes');
    }

    if (task.context.previousDecisions && task.context.previousDecisions.length > 0) {
      contexts.push(`previousDecisions(${task.context.previousDecisions.length})`);
    }

    if (task.context.codeContext) {
      contexts.push('codeContext');
    }

    return contexts;
  }

  /**
   * 提取决策
   */
  private extractDecisions(task: Task): string[] {
    return task.context.previousDecisions || [];
  }

  /**
   * 计算性能指标
   */
  private calculateMetrics(task: Task, result: any): any {
    const testResults = result.testResults || { passed: 0, failed: 0, skipped: 0 };
    const totalTests = testResults.passed + testResults.failed + testResults.skipped;
    const testPassRate = totalTests > 0 ? testResults.passed / totalTests : 1;

    const codeReviews = result.codeReviews || [];
    const approvedReviews = codeReviews.filter((r: any) => r.status === 'approved').length;
    const reviewApprovalRate = codeReviews.length > 0 ? approvedReviews / codeReviews.length : 1;

    // 代码质量分数（0-100）
    const codeQualityScore =
      testPassRate * 40 +
      reviewApprovalRate * 30 +
      (result.testCoverage || 0) * 0.3;

    // 时间效率（基于任务复杂度，简单计算）
    const duration = (task.completedAt || Date.now()) - (task.startedAt || task.createdAt);
    const timeEfficiency = Math.max(0, 1 - duration / (60 * 60 * 1000)); // 1小时为基准

    return {
      codeQualityScore: Math.round(codeQualityScore * 100) / 100,
      testPassRate: Math.round(testPassRate * 100) / 100,
      reviewApprovalRate: Math.round(reviewApprovalRate * 100) / 100,
      timeEfficiency: Math.round(timeEfficiency * 100) / 100,
    };
  }
}
