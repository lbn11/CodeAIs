/**
 * 增强版主编排器 - 实时进度显示 + 断点续传
 *
 * 改进：
 * 1. 实时进度显示 - 每个步骤都有清晰的输出
 * 2. 任务清单 - 随时查看所有任务状态
 * 3. 断点续传 - 网络中断后可以继续
 * 4. 彩色终端输出 - 更直观的视觉反馈
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { TaskManager } from './task-manager.js';
import { ContextLoader } from './context-loader.js';
import { AgentSelector } from './agent-selector.js';
import { PromptGenerator } from './prompt-generator.js';
import { TaskAgentSpawner } from './task-agent-spawner.js';
import { LearningEngine } from './learning-engine.js';
import { TestRunner } from './test-runner.js';
import { TaskResultRecorder } from './task-result-recorder.js';
import { NotificationManager } from './notification-manager.js';
import { CodeReviewer } from './code-reviewer.js';
import { getProgressTracker, TaskProgress } from './progress-tracker.js';
import { OrchestratorConfig, Task } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

class EnhancedOrchestrator {
  private config: OrchestratorConfig;
  private taskManager: TaskManager;
  private contextLoader: ContextLoader;
  private agentSelector: AgentSelector;
  private promptGenerator: PromptGenerator;
  private agentSpawner: TaskAgentSpawner;
  private learningEngine: LearningEngine;
  private testRunner: TestRunner;
  private resultRecorder: TaskResultRecorder;
  private notificationManager: NotificationManager;
  private codeReviewer: CodeReviewer;
  private progressTracker: any; // ProgressTracker

  constructor() {
    this.config = {
      repoPath: process.env.OPENCLAW_REPO || process.cwd(),
      worktreesDir: process.env.WORKTREES_DIR || './worktrees',
      tasksDir: './tasks/active',
      contextDir: './context',
      monitorInterval: parseInt(process.env.MONITOR_INTERVAL_MINUTES || '10') * 60 * 1000,
      maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
      defaultAgent: (process.env.DEFAULT_AGENT as any) || 'claude-code',
    };

    this.progressTracker = getProgressTracker(this.config.tasksDir);

    console.log(this.colorize('='.repeat(60), 'cyan'));
    console.log(this.colorize('🤖 Agent 集群系统 - 增强版', 'cyan'));
    console.log(this.colorize('='.repeat(60), 'cyan'));
    console.log(`   仓库路径: ${this.config.repoPath}`);
    console.log(`   Worktrees: ${this.config.worktreesDir}`);
    console.log(`   监控间隔: ${this.config.monitorInterval / 60000} 分钟`);
    console.log(`   断点续传: ${this.colorize('✅ 启用', 'green')}`);
    console.log(`   实时进度: ${this.colorize('✅ 启用', 'green')}`);
    console.log(this.colorize('='.repeat(60), 'cyan'));
    console.log('');

    // 初始化各模块
    this.contextLoader = new ContextLoader(this.config.contextDir);
    this.agentSelector = new AgentSelector();
    this.promptGenerator = new PromptGenerator();
    this.taskManager = new TaskManager(this.config.tasksDir);
    this.agentSpawner = new TaskAgentSpawner(this.config.repoPath, this.config.worktreesDir);
    this.learningEngine = new LearningEngine(this.config.contextDir);
    this.testRunner = new TestRunner('');
    this.resultRecorder = new TaskResultRecorder('./task-results');
    this.notificationManager = new NotificationManager({
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
      telegramChatId: process.env.TELEGRAM_CHAT_ID,
      enabled: process.env.TELEGRAM_ENABLED === 'true',
    });
    this.codeReviewer = new CodeReviewer();
  }

  /**
   * 启动编排器（支持断点续传）
   */
  async start(): Promise<void> {
    console.log('');

    // 加载进度快照（断点续传）
    await this.progressTracker.loadSnapshot();

    console.log(this.colorize('🚀 编排器启动', 'green'));
    console.log('');

    // 首次加载上下文
    await this.loadContext();

    // 启动监控循环
    setInterval(async () => {
      await this.monitorAndProcess();
    }, this.config.monitorInterval);

    // 立即执行一次
    await this.monitorAndProcess();
  }

  /**
   * 监控和处理循环
   */
  private async monitorAndProcess(): Promise<void> {
    try {
      const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
      console.log(this.colorize(`\n${'='.repeat(60)}`, 'cyan'));
      console.log(this.colorize(`⏰ ${timestamp} - 开始监控周期`, 'cyan'));
      console.log(this.colorize('='.repeat(60), 'cyan'));

      // 显示当前任务清单
      this.progressTracker.printTaskList();

      // 1. 检查新的迭代需求
      console.log(this.colorize('\n📝 检查新的迭代需求...', 'yellow'));
      await this.processNewIterations();

      // 2. 检查正在运行的任务
      console.log(this.colorize('\n🔍 监控运行中的任务...', 'yellow'));
      await this.monitorRunningTasks();

      // 3. 检查失败的任务，尝试重试
      console.log(this.colorize('\n🔄 检查失败任务并重试...', 'yellow'));
      await this.retryFailedTasks();

      // 4. 学习和改进
      console.log(this.colorize('\n🧠 学习和优化...', 'yellow'));
      await this.learnFromResults();

      console.log(this.colorize('\n✅ 监控周期完成\n', 'green'));
    } catch (error) {
      console.error(this.colorize(`❌ 监控错误: ${error}`, 'red'));
    }
  }

  /**
   * 加载业务上下文
   */
  private async loadContext(): Promise<void> {
    console.log(this.colorize('📚 加载业务上下文...', 'blue'));

    const iterations = await this.contextLoader.loadIterations();
    console.log(`   找到 ${iterations.length} 个迭代需求`);

    const decisions = await this.contextLoader.loadDecisions();
    console.log(`   加载 ${decisions.length} 个历史决策`);

    const learnings = await this.learningEngine.loadLearnings();
    console.log(`   加载 ${learnings.length} 条学习记录`);

    const history = await this.resultRecorder.getHistory();
    console.log(`   加载 ${history.length} 条任务历史`);

    console.log(this.colorize('✅ 上下文加载完成\n', 'green'));
  }

  /**
   * 处理新的迭代需求
   */
  private async processNewIterations(): Promise<void> {
    const iterations = await this.contextLoader.loadUnprocessedIterations();

    if (iterations.length === 0) {
      console.log('   没有新的迭代需求');
      return;
    }

    console.log(`   找到 ${iterations.length} 个新的迭代需求`);

    for (const iteration of iterations) {
      console.log(`\n   ${'─'.repeat(50)}`);
      console.log(`   📄 迭代需求: ${iteration.id}`);
      console.log(`   内容: ${iteration.content.substring(0, 80)}...`);

      // 初始化进度追踪
      await this.progressTracker.initTask(
        iteration.id,
        `处理迭代: ${iteration.content.substring(0, 50)}...`,
        10
      );

      await this.progressTracker.startTask(iteration.id);
      await this.progressTracker.updateProgress(iteration.id, '拆解任务');

      // 拆解任务
      const tasks = await this.decomposeIteration(iteration);
      console.log(`   拆解为 ${tasks.length} 个子任务`);

      await this.progressTracker.completeStep(iteration.id, '任务拆解', `共 ${tasks.length} 个任务`);

      // 为每个任务选择 Agent 并启动
      let taskIndex = 0;
      for (const task of tasks) {
        taskIndex++;
        console.log(`\n   ${'─'.repeat(40)}`);
        console.log(`   📦 任务 ${taskIndex}/${tasks.length}: ${task.description}`);

        // 初始化子任务进度
        const subTaskId = task.id;
        await this.progressTracker.initTask(
          subTaskId,
          task.description,
          8
        );

        await this.progressTracker.startTask(subTaskId);
        await this.progressTracker.updateProgress(subTaskId, '选择 Agent');

        // 生成 prompt（应用学习）
        const prompt = await this.promptGenerator.generate(task);

        // 选择 Agent
        const agentType = this.agentSelector.select(task);
        console.log(`   选择 Agent: ${this.colorize(agentType, 'yellow')}`);

        await this.progressTracker.completeStep(subTaskId, 'Agent 选择', agentType);
        await this.progressTracker.updateProgress(subTaskId, '生成 Prompt');

        // 启动 Agent
        const taskWithAgent = { ...task, agent: agentType };
        await this.taskManager.save(taskWithAgent);

        await this.progressTracker.completeStep(subTaskId, 'Prompt 生成');
        await this.progressTracker.updateProgress(subTaskId, '启动 Agent');

        const result = await this.agentSpawner.spawn(taskWithAgent, prompt);

        if (result.success) {
          await this.progressTracker.completeStep(subTaskId, 'Agent 启动');
          await this.progressTracker.completeTask(subTaskId, 'Agent 已启动并开始工作');

          await this.contextLoader.markIterationProcessed(iteration.id);
          console.log(`   ${this.colorize('✅', 'green')} 任务启动成功`);
        } else {
          const error = result.error || result.errors?.join(', ') || 'Unknown error';
          await this.progressTracker.failTask(subTaskId, error);
          console.log(`   ${this.colorize('❌', 'red')} 任务启动失败: ${error}`);
        }
      }

      await this.progressTracker.completeTask(iteration.id, `完成 ${tasks.length} 个任务的拆解和启动`);
      console.log(`\n   ${this.colorize('✅', 'green')} 迭代处理完成`);
    }
  }

  /**
   * 拆解迭代需求为任务
   */
  private async decomposeIteration(iteration: any): Promise<Task[]> {
    const baseTask: Partial<Task> = {
      iterationId: iteration.id,
      createdAt: Date.now(),
      retries: 0,
      status: 'pending',
    };

    const tasks: Task[] = [];

    // 简单的任务拆解逻辑
    const content = iteration.content.toLowerCase();

    if (content.includes('平台') || content.includes('系统')) {
      tasks.push({
        id: `task-${Date.now()}-1`,
        type: 'feature',
        priority: 'high',
        description: '设计系统架构',
        requirements: ['考虑可扩展性', '支持多种媒体类型'],
        context: {
          iterationId: iteration.id,
          customerNotes: iteration.content,
        },
        agent: 'claude-code',
        ...baseTask,
      } as Task);

      tasks.push({
        id: `task-${Date.now()}-2`,
        type: 'feature',
        priority: 'high',
        description: '实现核心功能',
        requirements: ['用户认证', '基础CRUD操作'],
        context: {
          iterationId: iteration.id,
        },
        agent: 'claude-code',
        ...baseTask,
      } as Task);
    }

    if (content.includes('评论') || content.includes('互动')) {
      tasks.push({
        id: `task-${Date.now()}-3`,
        type: 'feature',
        priority: 'medium',
        description: '实现评论系统',
        requirements: ['实时更新', '点赞/回复', '内容审核'],
        context: {
          iterationId: iteration.id,
        },
        agent: 'claude-code',
        ...baseTask,
      } as Task);
    }

    return tasks;
  }

  /**
   * 监控正在运行的任务
   */
  private async monitorRunningTasks(): Promise<void> {
    const runningTasks = await this.taskManager.getRunningTasks();

    if (runningTasks.length === 0) {
      console.log('   没有运行中的任务');
      return;
    }

    console.log(`   监控 ${runningTasks.length} 个运行中的任务\n`);

    for (const task of runningTasks) {
      const progress = this.progressTracker.getTaskProgress(task.id);

      console.log(`   ${'─'.repeat(50)}`);
      console.log(`   🔍 任务: ${task.id}`);
      console.log(`   描述: ${task.description}`);

      await this.progressTracker.updateProgress(task.id, '检查任务状态');

      const status = await this.agentSpawner.checkStatus(task);

      if (status.completed) {
        console.log(`   ${this.colorize('✅', 'green')} 任务完成`);

        await this.progressTracker.completeStep(task.id, '任务完成');
        await this.progressTracker.updateProgress(task.id, '运行测试');

        // 运行完整测试流程
        await this.runTestAndRecord(task, status);

        task.status = 'completed';
        task.completedAt = Date.now();
        task.prUrl = status.prUrl;
        await this.taskManager.update(task);

        await this.progressTracker.completeTask(task.id, `PR: ${status.prUrl}`);
      } else if (status.failed) {
        console.log(`   ${this.colorize('❌', 'red')} 任务失败`);

        const error = status.error || 'Unknown error';
        await this.progressTracker.failTask(task.id, error);

        // 记录失败
        await this.resultRecorder.recordFailure(task, error);

        // 发送失败通知
        await this.notificationManager.sendTaskFailure(
          task.id,
          task.description,
          error
        );

        task.status = 'failed';
        await this.taskManager.update(task);
      } else {
        const commitCount = status.commits || 0;
        console.log(`   ${this.colorize('⏳', 'yellow')} 运行中 (${commitCount} commits)`);
        await this.progressTracker.updateProgress(task.id, `开发中 (${commitCount} commits)`);
      }
    }
  }

  /**
   * 运行测试并记录结果
   */
  private async runTestAndRecord(task: Task, status: any): Promise<void> {
    if (!task.worktree) {
      console.log(`   ${this.colorize('⚠️', 'yellow')} 没有 worktree，跳过测试`);
      return;
    }

    await this.progressTracker.updateProgress(task.id, '准备测试环境');

    console.log(`   ${this.colorize('🧪', 'blue')} 运行测试流程...`);

    try {
      (this.testRunner as any).worktreePath = task.worktree;

      await this.progressTracker.completeStep(task.id, '测试环境准备');
      await this.progressTracker.updateProgress(task.id, '运行 Lint');

      // 运行完整测试流程
      const testResults = await this.testRunner.runFullTestSuite();

      console.log(`   测试得分: ${this.colorize(`${testResults.overall.score}/100`, this.getScoreColor(testResults.overall.score))}`);

      if (testResults.overall.passed) {
        await this.progressTracker.completeStep(task.id, 'Lint/TS/单元测试');
        await this.progressTracker.updateProgress(task.id, '运行 Code Review');

        // 运行 Code Review
        console.log(`   ${this.colorize('🔍', 'blue')} 运行 Code Review...`);
        let reviewResults: any = null;

        if (status.prUrl && process.env.ENABLE_CODE_REVIEW === 'true') {
          try {
            const prNumber = parseInt(status.prUrl.split('/').pop() || '0');

            if (prNumber > 0) {
              reviewResults = await this.codeReviewer.reviewPR(prNumber, task.worktree);
            }
          } catch (error) {
            console.log(`   ${this.colorize('⚠️', 'yellow')} Code Review 失败: ${error}`);
          }
        }

        await this.progressTracker.completeStep(task.id, 'Code Review');
        await this.progressTracker.updateProgress(task.id, '记录结果');

        // 记录任务完成
        const record = await this.resultRecorder.recordCompletion(task, {
          prUrl: status.prUrl,
          testResults,
          uiScreenshot: testResults.uiScreenshot.path,
          codeReviews: reviewResults?.reviews,
        });

        // 发送完成通知
        await this.notificationManager.sendTaskCompletion({
          taskId: task.id,
          description: task.description,
          status: 'completed',
          prUrl: status.prUrl,
          testResults,
          screenshot: testResults.uiScreenshot.path,
          metrics: record.metrics,
        });

        await this.progressTracker.completeStep(task.id, '结果记录', `质量评分: ${record.metrics.codeQualityScore}`);
      } else {
        await this.progressTracker.updateProgress(task.id, '测试未通过，需要人工审查');

        console.log(`   ${this.colorize('⚠️', 'yellow')} 测试未通过，需要人工 review`);

        const record = await this.resultRecorder.recordCompletion(task, {
          prUrl: status.prUrl,
          testResults,
          uiScreenshot: testResults.uiScreenshot.path,
        });

        await this.notificationManager.sendTaskCompletion({
          taskId: task.id,
          description: task.description,
          status: 'completed',
          prUrl: status.prUrl,
          testResults,
          screenshot: testResults.uiScreenshot.path,
          metrics: record.metrics,
        });

        await this.progressTracker.completeStep(task.id, '记录结果', '测试未通过');
      }
    } catch (error) {
      console.log(`   ${this.colorize('❌', 'red')} 测试流程失败: ${error}`);
      await this.progressTracker.failTask(task.id, `测试失败: ${error}`);
    }
  }

  /**
   * 重试失败的任务
   */
  private async retryFailedTasks(): Promise<void> {
    const failedTasks = await this.taskManager.getFailedTasks();

    if (failedTasks.length === 0) {
      console.log('   没有需要重试的任务');
      return;
    }

    console.log(`   检查 ${failedTasks.length} 个失败的任务\n`);

    for (const task of failedTasks) {
      if (task.retries >= this.config.maxRetries) {
        console.log(`   ${this.colorize('⚠️', 'yellow')} 任务 ${task.id} 达到最大重试次数，放弃`);
        continue;
      }

      console.log(`   ${'─'.repeat(50)}`);
      console.log(`   🔄 重试任务 ${task.id} (第 ${task.retries + 1}/${this.config.maxRetries} 次)`);
      console.log(`   描述: ${task.description}`);

      await this.progressTracker.initTask(
        `${task.id}-retry-${task.retries + 1}`,
        `重试: ${task.description}`,
        5
      );

      await this.progressTracker.startTask(`${task.id}-retry-${task.retries + 1}`);
      await this.progressTracker.updateProgress(`${task.id}-retry-${task.retries + 1}`, '应用学习');

      // 从失败中学习，调整 prompt
      const improvedPrompt = await this.learningEngine.improvePrompt(task);

      await this.progressTracker.completeStep(`${task.id}-retry-${task.retries + 1}`, '应用学习');
      await this.progressTracker.updateProgress(`${task.id}-retry-${task.retries + 1}`, '重试启动');

      // 重试
      const result = await this.agentSpawner.spawn(task, improvedPrompt);

      task.retries++;

      if (result.success) {
        task.status = 'running';
        await this.taskManager.update(task);
        console.log(`   ${this.colorize('✅', 'green')} 重试成功`);

        await this.progressTracker.completeTask(`${task.id}-retry-${task.retries + 1}`, '重试成功，任务继续运行');
      } else {
        const error = result.error || result.errors?.join(', ') || 'Unknown error';
        await this.taskManager.update(task);
        console.log(`   ${this.colorize('❌', 'red')} 重试失败: ${error}`);

        await this.progressTracker.failTask(`${task.id}-retry-${task.retries + 1}`, error);
      }
    }
  }

  /**
   * 从结果中学习
   */
  private async learnFromResults(): Promise<void> {
    const completedTasks = await this.taskManager.getCompletedTasks();

    if (completedTasks.length === 0) {
      console.log('   没有新的学习数据');
      return;
    }

    console.log(`   从 ${completedTasks.length} 个已完成任务中学习...`);

    let learningCount = 0;
    for (const task of completedTasks) {
      await this.learningEngine.recordSuccess(task);
      learningCount++;
    }

    await this.learningEngine.saveLearnings();

    console.log(`   ${this.colorize(`✅ 记录了 ${learningCount} 条学习数据`, 'green')}`);
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
   * 根据分数获取颜色
   */
  private getScoreColor(score: number): string {
    if (score >= 90) return 'green';
    if (score >= 80) return 'yellow';
    return 'red';
  }
}

// 启动增强版编排器
const orchestrator = new EnhancedOrchestrator();
orchestrator.start().catch(console.error);
