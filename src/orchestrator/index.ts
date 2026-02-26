/**
 * 主编排器 - 双层 Agent 系统的核心（增强版）
 *
 * 职责：
 * 1. 读取和理解业务上下文（迭代需求、会议记录等）
 * 2. 拆解任务
 * 3. 选择合适的 Agent
 * 4. 监控任务进度
 * 5. 运行完整测试流程
 * 6. 记录任务结果（JSON）
 * 7. 发送通知（Telegram + 截图）
 * 8. 从失败中学习（Ralph Loop）
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
import { OrchestratorConfig, Task } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

class Orchestrator {
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

    console.log('🤖 初始化编排器...');
    console.log(`   仓库路径: ${this.config.repoPath}`);
    console.log(`   Worktrees: ${this.config.worktreesDir}`);
    console.log(`   监控间隔: ${this.config.monitorInterval / 60000} 分钟`);

    // 初始化各模块
    this.contextLoader = new ContextLoader(this.config.contextDir);
    this.agentSelector = new AgentSelector();
    this.promptGenerator = new PromptGenerator();
    this.taskManager = new TaskManager(this.config.tasksDir);
    this.agentSpawner = new TaskAgentSpawner(this.config.repoPath, this.config.worktreesDir);
    this.learningEngine = new LearningEngine(this.config.contextDir);
    this.testRunner = new TestRunner(''); // worktreePath 会在运行时设置
    this.resultRecorder = new TaskResultRecorder('./task-results');
    this.notificationManager = new NotificationManager({
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
      telegramChatId: process.env.TELEGRAM_CHAT_ID,
      enabled: process.env.TELEGRAM_ENABLED === 'true',
    });
    this.codeReviewer = new CodeReviewer();
  }

  /**
   * 主循环 - 持续监控和处理任务
   */
  async start(): Promise<void> {
    console.log('\n🚀 编排器启动，开始运行...\n');

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
      console.log('\n' + '='.repeat(50));
      console.log(`⏰ ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} - 开始监控`);

      // 1. 检查新的迭代需求
      await this.processNewIterations();

      // 2. 检查正在运行的任务
      await this.monitorRunningTasks();

      // 3. 检查失败的任务，尝试重试（应用学习）
      await this.retryFailedTasks();

      // 4. 学习和改进
      await this.learnFromResults();

      console.log('✅ 监控周期完成\n');
    } catch (error) {
      console.error('❌ 监控错误:', error);
    }
  }

  /**
   * 加载业务上下文
   */
  private async loadContext(): Promise<void> {
    console.log('\n📚 加载业务上下文...');

    const iterations = await this.contextLoader.loadIterations();
    console.log(`   找到 ${iterations.length} 个迭代需求`);

    const decisions = await this.contextLoader.loadDecisions();
    console.log(`   加载 ${decisions.length} 个历史决策`);

    const learnings = await this.learningEngine.loadLearnings();
    console.log(`   加载 ${learnings.length} 条学习记录`);

    // 加载任务历史
    const history = await this.resultRecorder.getHistory();
    console.log(`   加载 ${history.length} 条任务历史`);
  }

  /**
   * 处理新的迭代需求
   */
  private async processNewIterations(): Promise<void> {
    const iterations = await this.contextLoader.loadUnprocessedIterations();

    for (const iteration of iterations) {
      console.log(`\n📝 处理迭代需求: ${iteration.id}`);
      console.log(`   内容: ${iteration.content.substring(0, 100)}...`);

      // 拆解任务
      const tasks = await this.decomposeIteration(iteration);

      // 为每个任务选择 Agent 并启动
      for (const task of tasks) {
        console.log(`   拆解任务: ${task.description}`);

        // 生成 prompt（应用学习）
        const prompt = await this.promptGenerator.generate(task);

        // 选择 Agent
        const agentType = this.agentSelector.select(task);
        console.log(`   选择 Agent: ${agentType}`);

        // 启动 Agent
        const taskWithAgent = { ...task, agent: agentType };
        await this.taskManager.save(taskWithAgent);

        const result = await this.agentSpawner.spawn(taskWithAgent, prompt);

        if (result.success) {
          await this.contextLoader.markIterationProcessed(iteration.id);
          console.log(`   ✅ 任务启动成功`);
        } else {
          console.error(`   ❌ 任务启动失败: ${result.error || result.errors?.join(', ')}`);
        }
      }
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

    // 根据需求类型拆解
    if (iteration.content.includes('平台') || iteration.content.includes('系统')) {
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
        description: '实现视频上传功能',
        requirements: ['支持多种格式', '上传进度显示', '错误处理'],
        context: {
          iterationId: iteration.id,
        },
        agent: 'claude-code',
        ...baseTask,
      } as Task);
    }

    if (iteration.content.includes('评论')) {
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

    console.log(`\n🔍 监控 ${runningTasks.length} 个运行中的任务`);

    for (const task of runningTasks) {
      const status = await this.agentSpawner.checkStatus(task);

      if (status.completed) {
        console.log(`   ✅ 任务完成: ${task.id}`);

        // 运行完整测试流程
        await this.runTestAndRecord(task, status);

        task.status = 'completed';
        task.completedAt = Date.now();
        task.prUrl = status.prUrl;
        await this.taskManager.update(task);
      } else if (status.failed) {
        console.log(`   ❌ 任务失败: ${task.id}`);

        // 记录失败
        await this.resultRecorder.recordFailure(
          task,
          status.error || 'Unknown error'
        );

        // 发送失败通知
        await this.notificationManager.sendTaskFailure(
          task.id,
          task.description,
          status.error || 'Unknown error'
        );

        task.status = 'failed';
        await this.taskManager.update(task);
      } else {
        console.log(`   ⏳ 运行中: ${task.id}`);
      }
    }
  }

  /**
   * 运行测试并记录结果
   */
  private async runTestAndRecord(task: Task, status: any): Promise<void> {
    if (!task.worktree) {
      console.log('   ⚠️  没有 worktree，跳过测试');
      return;
    }

    console.log('   🧪 运行测试流程...');

    try {
      // 设置测试运行器的工作目录
      (this.testRunner as any).worktreePath = task.worktree;

      // 运行完整测试流程
      const testResults = await this.testRunner.runFullTestSuite();

      console.log(`   测试得分: ${testResults.overall.score}/100`);

      if (testResults.overall.passed) {
        // 测试通过，运行 Code Review
        console.log('   🔍 运行 Code Review...');
        let reviewResults: any = null;

        if (status.prUrl && process.env.ENABLE_CODE_REVIEW === 'true') {
          try {
            // 提取 PR 编号
            const prNumber = parseInt(status.prUrl.split('/').pop() || '0');

            if (prNumber > 0) {
              reviewResults = await this.codeReviewer.reviewPR(prNumber, task.worktree);
            }
          } catch (error) {
            console.error('   ⚠️  Code Review 失败:', error);
          }
        }

        // 记录任务完成（包含 review 结果）
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
          status: reviewResults?.overall.approved ? 'completed' : 'completed',
          prUrl: status.prUrl,
          testResults,
          screenshot: testResults.uiScreenshot.path,
          metrics: record.metrics,
        });
      } else {
        // 测试失败
        console.log('   ⚠️  测试未通过，需要人工 review');

        // 仍然记录任务，但标记需要人工审查
        const record = await this.resultRecorder.recordCompletion(task, {
          prUrl: status.prUrl,
          testResults,
          uiScreenshot: testResults.uiScreenshot.path,
        });

        // 发送通知，说明需要人工审查
        await this.notificationManager.sendTaskCompletion({
          taskId: task.id,
          description: task.description,
          status: 'completed',
          prUrl: status.prUrl,
          testResults,
          screenshot: testResults.uiScreenshot.path,
          metrics: record.metrics,
        });
      }
    } catch (error) {
      console.error('   ❌ 测试流程失败:', error);
    }
  }

  /**
   * 重试失败的任务（应用学习）
   */
  private async retryFailedTasks(): Promise<void> {
    const failedTasks = await this.taskManager.getFailedTasks();

    for (const task of failedTasks) {
      if (task.retries >= this.config.maxRetries) {
        console.log(`\n⚠️  任务 ${task.id} 达到最大重试次数，放弃`);
        continue;
      }

      console.log(`\n🔄 重试任务 ${task.id} (第 ${task.retries + 1} 次)`);

      // 从失败中学习，调整 prompt
      const improvedPrompt = await this.learningEngine.improvePrompt(task);

      // 重试
      const result = await this.agentSpawner.spawn(task, improvedPrompt);

      task.retries++;

      if (result.success) {
        task.status = 'running';
        await this.taskManager.update(task);
        console.log(`   ✅ 重试成功`);
      } else {
        await this.taskManager.update(task);
        console.log(`   ❌ 重试失败: ${result.error || result.errors?.join(', ')}`);
      }
    }
  }

  /**
   * 从结果中学习
   */
  private async learnFromResults(): Promise<void> {
    const completedTasks = await this.taskManager.getCompletedTasks();

    for (const task of completedTasks) {
      await this.learningEngine.recordSuccess(task);
    }

    await this.learningEngine.saveLearnings();
  }
}

// 启动编排器
const orchestrator = new Orchestrator();
orchestrator.start().catch(console.error);
