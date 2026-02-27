/**
 * 进度追踪器 - 实时显示任务进度，支持断点续传
 *
 * 功能：
 * 1. 实时进度更新
 * 2. 任务清单展示
 * 3. 进度持久化（断点续传）
 * 4. 彩色终端输出
 */

import fs from 'fs/promises';
import path from 'path';

export interface TaskProgress {
  id: string; // 任务唯一标识
  taskId: string;
  description: string;
  status: 'pending' | 'started' | 'in-progress' | 'completed' | 'failed';
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
  progress?: number; // 0-100
  logs: string[];
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface ProgressSnapshot {
  tasks: TaskProgress[];
  overallProgress: number;
  lastUpdated: number;
}

export class ProgressTracker {
  private tasksDir: string;
  private progressFile: string;
  private activeTasks: Map<string, TaskProgress>;

  constructor(tasksDir: string) {
    this.tasksDir = tasksDir;
    this.progressFile = path.join(tasksDir, 'progress-snapshot.json');
    this.activeTasks = new Map();
  }

  /**
   * 初始化任务
   */
  async initTask(taskId: string, description: string, totalSteps: number = 10): Promise<void> {
    const progress: TaskProgress = {
      id: taskId,
      taskId,
      description,
      status: 'pending',
      totalSteps,
      completedSteps: 0,
      progress: 0,
      logs: [],
      startedAt: Date.now(),
    };

    this.activeTasks.set(taskId, progress);
    await this.saveSnapshot();

    this.printTaskProgress(taskId);
  }

  /**
   * 开始任务
   */
  async startTask(taskId: string): Promise<void> {
    const progress = this.activeTasks.get(taskId);
    if (!progress) return;

    progress.status = 'started';
    progress.startedAt = Date.now();
    progress.logs.push(`[${this.formatTime(Date.now())}] 🚀 任务开始`);
    await this.saveSnapshot();

    this.printTaskProgress(taskId);
  }

  /**
   * 更新任务进度
   */
  async updateProgress(
    taskId: string,
    currentStep: string,
    progressValue?: number,
    detail?: string
  ): Promise<void> {
    const taskProgress = this.activeTasks.get(taskId);
    if (!taskProgress) return;

    taskProgress.status = 'in-progress';
    taskProgress.currentStep = currentStep;

    if (progressValue !== undefined) {
      taskProgress.progress = progressValue;
    }

    if (detail) {
      taskProgress.logs.push(`[${this.formatTime(Date.now())}] ${currentStep}: ${detail}`);
    } else {
      taskProgress.logs.push(`[${this.formatTime(Date.now())}] ${currentStep}`);
    }

    await this.saveSnapshot();

    this.printTaskProgress(taskId);
  }

  /**
   * 完成一步
   */
  async completeStep(taskId: string, stepName: string, detail?: string): Promise<void> {
    const progress = this.activeTasks.get(taskId);
    if (!progress) return;

    progress.completedSteps = (progress.completedSteps || 0) + 1;

    if (progress.totalSteps) {
      progress.progress = Math.floor((progress.completedSteps / progress.totalSteps) * 100);
    }

    const message = detail ? `${stepName}: ${detail}` : stepName;
    progress.logs.push(`[${this.formatTime(Date.now())}] ✅ ${message}`);

    await this.saveSnapshot();

    this.printTaskProgress(taskId);
  }

  /**
   * 完成任务
   */
  async completeTask(taskId: string, summary?: string): Promise<void> {
    const progress = this.activeTasks.get(taskId);
    if (!progress) return;

    progress.status = 'completed';
    progress.completedAt = Date.now();
    progress.progress = 100;
    progress.currentStep = '完成';

    if (summary) {
      progress.logs.push(`[${this.formatTime(Date.now())}] 🎉 任务完成: ${summary}`);
    } else {
      progress.logs.push(`[${this.formatTime(Date.now())}] 🎉 任务完成`);
    }

    await this.saveSnapshot();

    this.printTaskProgress(taskId);
    this.printOverallSummary();
  }

  /**
   * 任务失败
   */
  async failTask(taskId: string, error: string): Promise<void> {
    const progress = this.activeTasks.get(taskId);
    if (!progress) return;

    progress.status = 'failed';
    progress.completedAt = Date.now();
    progress.error = error;
    progress.logs.push(`[${this.formatTime(Date.now())}] ❌ 失败: ${error}`);

    await this.saveSnapshot();

    this.printTaskProgress(taskId);
  }

  /**
   * 打印单个任务进度
   */
  private printTaskProgress(taskId: string): void {
    const progress = this.activeTasks.get(taskId);
    if (!progress) return;

    const statusIcon = this.getStatusIcon(progress.status);
    const progressBar = this.getProgressBar(progress.progress || 0);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`${statusIcon} 任务: ${taskId}`);
    console.log(`   ${progress.description}`);
    console.log(`   状态: ${this.colorize(progress.status, this.getStatusColor(progress.status))}`);
    console.log(`   进度: ${progressBar} ${progress.progress || 0}%`);
    console.log(`   步骤: ${progress.completedSteps || 0}/${progress.totalSteps || 10}`);
    if (progress.currentStep) {
      console.log(`   当前: ${progress.currentStep}`);
    }
    if (progress.error) {
      console.log(`   错误: ${this.colorize(progress.error, 'red')}`);
    }
    console.log(`${'='.repeat(60)}\n`);
  }

  /**
   * 打印整体进度摘要
   */
  private printOverallSummary(): void {
    const tasks = Array.from(this.activeTasks.values());

    if (tasks.length === 0) {
      return;
    }

    const completed = tasks.filter(t => t.status === 'completed').length;
    const running = tasks.filter(t => t.status === 'in-progress' || t.status === 'started').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;

    const overallProgress = tasks.length > 0
      ? Math.floor(
        tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length
      )
      : 0;

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 整体进度摘要');
    console.log(`${'='.repeat(60)}`);
    console.log(`总任务数: ${tasks.length}`);
    console.log(`✅ 完成: ${this.colorize(completed.toString(), 'green')} | ` +
                `⏳ 运行中: ${this.colorize(running.toString(), 'yellow')} | ` +
                `❌ 失败: ${this.colorize(failed.toString(), 'red')} | ` +
                `⏸️  待定: ${pending}`);
    console.log(`整体进度: ${this.getProgressBar(overallProgress)} ${overallProgress}%`);
    console.log(`${'='.repeat(60)}\n`);
  }

  /**
   * 打印任务清单
   */
  printTaskList(): void {
    const tasks = Array.from(this.activeTasks.values());

    if (tasks.length === 0) {
      console.log('\n📋 没有任务');
      return;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📋 任务清单');
    console.log(`${'='.repeat(60)}\n`);

    tasks.forEach((task, index) => {
      const statusIcon = this.getStatusIcon(task.status);
      const statusColor = this.getStatusColor(task.status);
      const progressBar = this.getProgressBar(task.progress || 0);

      console.log(`${index + 1}. ${statusIcon} ${task.id}`);
      console.log(`   ${task.description}`);
      console.log(`   状态: ${this.colorize(task.status, statusColor)} ` +
                  `| 进度: ${progressBar} ${task.progress || 0}%`);
      if (task.currentStep) {
        console.log(`   当前: ${task.currentStep}`);
      }
      console.log('');
    });

    console.log(`${'='.repeat(60)}\n`);

    this.printOverallSummary();
  }

  /**
   * 从快照恢复进度（断点续传）
   */
  async loadSnapshot(): Promise<void> {
    try {
      const content = await fs.readFile(this.progressFile, 'utf-8');
      const snapshot: ProgressSnapshot = JSON.parse(content);

      console.log(`\n🔄 恢复进度快照...`);
      console.log(`   最后更新: ${new Date(snapshot.lastUpdated).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
      console.log(`   任务数量: ${snapshot.tasks.length}\n`);

      // 恢复所有任务
      for (const task of snapshot.tasks) {
        this.activeTasks.set(task.taskId, task);
      }

      // 打印恢复的任务清单
      this.printTaskList();

      console.log('✅ 进度恢复完成\n');
    } catch (error) {
      // 文件不存在或格式错误，初始化空的追踪器
      console.log('📝 没有找到进度快照，从空白开始\n');
      await this.saveSnapshot();
    }
  }

  /**
   * 保存进度快照
   */
  private async saveSnapshot(): Promise<void> {
    const tasks = Array.from(this.activeTasks.values());

    const overallProgress = tasks.length > 0
      ? Math.floor(
        tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length
      )
      : 0;

    const snapshot: ProgressSnapshot = {
      tasks,
      overallProgress,
      lastUpdated: Date.now(),
    };

    try {
      await fs.mkdir(this.tasksDir, { recursive: true });
      await fs.writeFile(
        this.progressFile,
        JSON.stringify(snapshot, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('❌ 保存进度快照失败:', error);
    }
  }

  /**
   * 获取任务进度
   */
  getTaskProgress(taskId: string): TaskProgress | undefined {
    return this.activeTasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): TaskProgress[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * 清理已完成的任务（从内存中移除，但保留在快照中）
   */
  async cleanupCompletedTasks(): Promise<void> {
    const completed = Array.from(this.activeTasks.entries())
      .filter(([_, t]) => t.status === 'completed' || t.status === 'failed')
      .map(([taskId, _]) => taskId);

    for (const taskId of completed) {
      this.activeTasks.delete(taskId);
    }

    await this.saveSnapshot();
  }

  /**
   * 获取状态图标
   */
  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'pending': '⏸️',
      'started': '🚀',
      'in-progress': '⏳',
      'completed': '✅',
      'failed': '❌',
    };
    return icons[status] || '❓';
  }

  /**
   * 获取状态颜色
   */
  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'gray',
      'started': 'blue',
      'in-progress': 'yellow',
      'completed': 'green',
      'failed': 'red',
    };
    return colors[status] || 'white';
  }

  /**
   * 获取进度条
   */
  private getProgressBar(progress: number): string {
    const width = 30;
    const filled = Math.floor((progress / 100) * width);
    const empty = width - filled;

    const filledBar = this.colorize('█'.repeat(filled), 'green');
    const emptyBar = '░'.repeat(empty);

    return `[${filledBar}${emptyBar}]`;
  }

  /**
   * 彩色输出
   */
  private colorize(text: string, color: string): string {
    const colors: Record<string, string> = {
      'black': '\x1b[30m',
      'red': '\x1b[31m',
      'green': '\x1b[32m',
      'yellow': '\x1b[33m',
      'blue': '\x1b[34m',
      'magenta': '\x1b[35m',
      'cyan': '\x1b[36m',
      'white': '\x1b[37m',
      'gray': '\x1b[90m',
      'reset': '\x1b[0m',
    };

    const colorCode = colors[color] || colors['reset'];
    return `${colorCode}${text}${colors['reset']}`;
  }

  /**
   * 格式化时间
   */
  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai' });
  }
}

// 导出单例
let progressTrackerInstance: ProgressTracker | null = null;

export function getProgressTracker(tasksDir: string = './tasks/active'): ProgressTracker {
  if (!progressTrackerInstance) {
    progressTrackerInstance = new ProgressTracker(tasksDir);
  }
  return progressTrackerInstance;
}
