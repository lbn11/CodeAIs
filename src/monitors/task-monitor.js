/**
 * 任务监控器
 * 定期检查正在运行的任务状态
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const TASKS_DIR = './tasks/active';
const LOG_FILE = './logs/monitor.log';

/**
 * 检查单个任务状态
 */
async function checkTask(taskId: string) {
  const taskPath = path.join(TASKS_DIR, `${taskId}.json`);

  try {
    const content = await fs.readFile(taskPath, 'utf-8');
    const task = JSON.parse(content);

    if (task.status !== 'running') {
      return { taskId, status: task.status };
    }

    // 检查 PR 是否创建
    const branchName = `feat/${taskId}`;
    try {
      const { stdout } = await execAsync(`gh pr list --head ${branchName} --json url,title,state`);

      if (stdout.trim()) {
        const prs = JSON.parse(stdout);
        if (prs.length > 0) {
          const pr = prs[0];

          // 更新任务状态
          task.status = 'completed';
          task.prUrl = pr.url;
          task.completedAt = Date.now();

          await fs.writeFile(taskPath, JSON.stringify(task, null, 2));

          await log(`✅ 任务完成: ${taskId}`);
          await log(`   PR: ${pr.title}`);
          await log(`   URL: ${pr.url}`);

          return { taskId, status: 'completed', pr };
        }
      }
    } catch (error) {
      // gh 命令失败或没有 PR
    }

    // 检查 worktree 是否有提交
    if (task.worktree) {
      try {
        const { stdout } = await execAsync('git rev-list --count HEAD', {
          cwd: task.worktree,
        });

        const commitCount = parseInt(stdout.trim());

        if (commitCount > 0) {
          await log(`⏳ 任务进行中: ${taskId} (${commitCount} commits)`);
          return { taskId, status: 'running', commits: commitCount };
        }
      } catch (error) {
        // 无法检查提交数
      }
    }

    return { taskId, status: 'running' };
  } catch (error) {
    await log(`❌ 检查任务失败: ${taskId} - ${error}`);
    return { taskId, status: 'error', error };
  }
}

/**
 * 清理旧任务
 */
async function cleanupOldTasks() {
  try {
    const files = await fs.readdir(TASKS_DIR);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 小时

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(TASKS_DIR, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          const content = await fs.readFile(filePath, 'utf-8');
          const task = JSON.parse(content);

          if (task.status === 'completed' || task.status === 'failed') {
            // 移动到已完成任务目录
            await fs.rename(
              filePath,
              path.join('./tasks/completed', file)
            );

            await log(`🗑️  归档任务: ${task.id}`);
          }
        }
      }
    }
  } catch (error) {
    await log(`❌ 清理任务失败: ${error}`);
  }
}

/**
 * 写入日志
 */
async function log(message: string) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;

  console.log(logLine.trim());

  try {
    await fs.mkdir('./logs', { recursive: true });
    await fs.appendFile(LOG_FILE, logLine);
  } catch (error) {
    console.error('写入日志失败:', error);
  }
}

/**
 * 主监控循环
 */
async function monitor() {
  await log('\n' + '='.repeat(50));
  await log(`🔍 开始监控: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);

  try {
    // 读取所有任务
    const files = await fs.readdir(TASKS_DIR);
    const taskFiles = files.filter(f => f.endsWith('.json'));

    if (taskFiles.length === 0) {
      await log('ℹ️  没有运行中的任务');
    } else {
      await log(`📊 检查 ${taskFiles.length} 个任务`);

      // 检查每个任务
      const results = await Promise.all(
        taskFiles.map(file => {
          const taskId = path.basename(file, '.json');
          return checkTask(taskId);
        })
      );

      // 统计
      const running = results.filter(r => r.status === 'running').length;
      const completed = results.filter(r => r.status === 'completed').length;
      const failed = results.filter(r => r.status === 'failed' || r.status === 'error').length;

      await log(`📈 任务统计: 运行中 ${running}, 完成 ${completed}, 失败 ${failed}`);
    }

    // 清理旧任务
    await cleanupOldTasks();

    await log('✅ 监控完成\n');
  } catch (error) {
    await log(`❌ 监控错误: ${error}`);
  }
}

// 运行监控
monitor().catch(error => {
  console.error('监控失败:', error);
  process.exit(1);
});
