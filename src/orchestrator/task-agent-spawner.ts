/**
 * Task Agent Spawner
 * 负责启动和管理 Agent 进程
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { Task, AgentResult } from '../types/index.js';

const execAsync = promisify(exec);

export class TaskAgentSpawner {
  private repoPath: string;
  private worktreesDir: string;

  constructor(repoPath: string, worktreesDir: string) {
    this.repoPath = repoPath;
    this.worktreesDir = worktreesDir;
  }

  /**
   * 启动 Agent
   */
  async spawn(task: Task, prompt: string): Promise<AgentResult> {
    try {
      console.log(`\n🚀 启动 Agent: ${task.agent}`);

      // 1. 创建 worktree
      const worktreePath = await this.createWorktree(task);
      task.worktree = worktreePath;

      // 2. 创建 tmux 会话（如果启用）
      if (process.env.USE_TMUX === 'true') {
        const sessionName = `agent-${task.id}`;
        task.tmuxSession = sessionName;
        await this.createTmuxSession(sessionName, worktreePath);
      }

      // 3. 执行 Agent
      await this.runAgent(task, prompt, worktreePath);

      return {
        taskId: task.id,
        success: true,
      };
    } catch (error) {
      console.error('Agent 启动失败:', error);
      return {
        taskId: task.id,
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * 创建 git worktree
   */
  private async createWorktree(task: Task): Promise<string> {
    await fs.mkdir(this.worktreesDir, { recursive: true });

    const branchName = `feat/${task.id}`;
    const worktreePath = path.join(this.worktreesDir, task.id);

    // 检查 worktree 是否已存在
    try {
      await fs.access(worktreePath);
      // 已存在，删除重建
      await execAsync(`git worktree remove ${worktreePath}`);
    } catch (error) {
      // 不存在，继续
    }

    // 创建新 worktree
    const command = `git worktree add ${worktreePath} -b ${branchName} origin/main`;
    await execAsync(command, { cwd: this.repoPath });

    console.log(`   ✓ 创建 worktree: ${worktreePath}`);

    return worktreePath;
  }

  /**
   * 创建 tmux 会话
   */
  private async createTmuxSession(sessionName: string, worktreePath: string): Promise<void> {
    const command = `tmux new-session -d -s ${sessionName} -c ${worktreePath}`;
    await execAsync(command);

    console.log(`   ✓ 创建 tmux 会话: ${sessionName}`);
  }

  /**
   * 运行 Agent
   */
  private async runAgent(task: Task, prompt: string, worktreePath: string): Promise<void> {
    const agentCommand = this.buildAgentCommand(task.agent, prompt);

    console.log(`   ✓ 执行命令: ${agentCommand.substring(0, 100)}...`);

    // 使用 pty 模式执行（通过 exec）
    const { stdout, stderr } = await execAsync(agentCommand, {
      cwd: worktreePath,
      timeout: 30 * 60 * 1000, // 30 分钟超时
    });

    if (stdout) {
      console.log(`   ✓ Agent 输出:\n${stdout.substring(0, 500)}...`);
    }

    if (stderr) {
      console.error(`   ⚠️ Agent 错误:\n${stderr.substring(0, 500)}...`);
    }
  }

  /**
   * 构建 Agent 命令
   */
  private buildAgentCommand(agentType: string, prompt: string): string {
    // 将 prompt 写入临时文件
    const promptFile = '/tmp/agent-prompt.txt';

    switch (agentType) {
      case 'claude-code':
        // 使用 Claude Code（通过 API 或 CLI）
        return `claude "${prompt.replace(/"/g, '\\"')}"`;

      case 'codex':
        // 使用 Codex
        return `codex exec --full-auto "${prompt.replace(/"/g, '\\"')}"`;

      case 'gemini':
        // 使用 Gemini
        return `gemini "${prompt.replace(/"/g, '\\"')}"`;

      default:
        throw new Error(`未知的 Agent 类型: ${agentType}`);
    }
  }

  /**
   * 检查任务状态
   */
  async checkStatus(task: Task): Promise<any> {
    try {
      // 检查 PR 是否存在
      const branchName = `feat/${task.id}`;

      try {
        const { stdout } = await execAsync(`gh pr list --head ${branchName}`, {
          cwd: this.repoPath,
        });

        if (stdout.trim()) {
          return {
            completed: true,
            prUrl: stdout.trim().split('\n')[0].split('\t')[0],
          };
        }
      } catch (error) {
        // PR 不存在或 gh 命令失败
      }

      // 检查 worktree 是否存在且有提交
      if (task.worktree) {
        try {
          const { stdout } = await execAsync('git rev-parse --short HEAD', {
            cwd: task.worktree,
          });

          if (stdout.trim()) {
            // 有提交，但还没有 PR
            return {
              completed: false,
              hasCommits: true,
            };
          }
        } catch (error) {
          // 无提交
        }
      }

      return {
        completed: false,
        failed: false,
      };
    } catch (error) {
      console.error('检查状态失败:', error);
      return {
        completed: false,
        failed: true,
      };
    }
  }

  /**
   * 清理 worktree
   */
  async cleanupWorktree(task: Task): Promise<void> {
    if (task.worktree) {
      try {
        await execAsync(`git worktree remove ${task.worktree}`);
        console.log(`   ✓ 清理 worktree: ${task.worktree}`);
      } catch (error) {
        console.error(`   ✗ 清理 worktree 失败:`, error);
      }
    }

    if (task.tmuxSession) {
      try {
        await execAsync(`tmux kill-session -t ${task.tmuxSession}`);
        console.log(`   ✓ 清理 tmux 会话: ${task.tmuxSession}`);
      } catch (error) {
        console.error(`   ✗ 清理 tmux 会话失败:`, error);
      }
    }
  }
}
