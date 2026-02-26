/**
 * 健康检查脚本
 * 检查系统各组件的健康状态
 */

import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
}

async function checkGit(): Promise<HealthCheckResult> {
  try {
    const { stdout } = await execAsync('git status');
    return {
      component: 'Git',
      status: 'healthy',
      message: 'Git 仓库正常',
    };
  } catch (error) {
    return {
      component: 'Git',
      status: 'unhealthy',
      message: 'Git 仓库异常',
    };
  }
}

async function checkGitHubCLI(): Promise<HealthCheckResult> {
  try {
    const { stdout } = await execAsync('gh auth status');
    if (stdout.includes('Logged in')) {
      return {
        component: 'GitHub CLI',
        status: 'healthy',
        message: 'GitHub CLI 已认证',
      };
    } else {
      return {
        component: 'GitHub CLI',
        status: 'degraded',
        message: 'GitHub CLI 未认证',
      };
    }
  } catch (error) {
    return {
      component: 'GitHub CLI',
      status: 'unhealthy',
      message: 'GitHub CLI 未安装',
    };
  }
}

async function checkTmux(): Promise<HealthCheckResult> {
  try {
    const { stdout } = await execAsync('tmux -V');
    return {
      component: 'Tmux',
      status: 'healthy',
      message: `Tmux 已安装 (${stdout.trim()})`,
    };
  } catch (error) {
    return {
      component: 'Tmux',
      status: 'unhealthy',
      message: 'Tmux 未安装',
    };
  }
}

async function checkNodeModules(): Promise<HealthCheckResult> {
  try {
    await fs.access('node_modules');
    return {
      component: 'Node.js 依赖',
      status: 'healthy',
      message: '依赖已安装',
    };
  } catch (error) {
    return {
      component: 'Node.js 依赖',
      status: 'unhealthy',
      message: '依赖未安装，运行 npm install',
    };
  }
}

async function checkDirectories(): Promise<HealthCheckResult> {
  const requiredDirs = [
    'context/iterations',
    'context/decisions',
    'context/learnings',
    'tasks/active',
    'worktrees',
    'logs',
  ];

  const missing: string[] = [];

  for (const dir of requiredDirs) {
    try {
      await fs.access(dir);
    } catch (error) {
      missing.push(dir);
    }
  }

  if (missing.length === 0) {
    return {
      component: '目录结构',
      status: 'healthy',
      message: '所有目录已创建',
    };
  } else {
    return {
      component: '目录结构',
      status: 'unhealthy',
      message: `缺少目录: ${missing.join(', ')}`,
    };
  }
}

async function checkEnvironment(): Promise<HealthCheckResult> {
  try {
    await fs.access('.env');
    const content = await fs.readFile('.env', 'utf-8');

    if (content.includes('your_api_key_here') || content.includes('your-username')) {
      return {
        component: '环境配置',
        status: 'degraded',
        message: '.env 文件存在，但配置不完整',
      };
    } else {
      return {
        component: '环境配置',
        status: 'healthy',
        message: '环境配置完整',
      };
    }
  } catch (error) {
    return {
      component: '环境配置',
      status: 'unhealthy',
      message: '.env 文件不存在',
    };
  }
}

async function checkActiveTasks(): Promise<HealthCheckResult> {
  try {
    const files = await fs.readdir('tasks/active');
    const taskFiles = files.filter(f => f.endsWith('.json'));

    return {
      component: '活跃任务',
      status: 'healthy',
      message: `${taskFiles.length} 个活跃任务`,
    };
  } catch (error) {
    return {
      component: '活跃任务',
      status: 'degraded',
      message: '无任务目录',
    };
  }
}

async function checkWorktrees(): Promise<HealthCheckResult> {
  try {
    const { stdout } = await execAsync('git worktree list');
    const lines = stdout.trim().split('\n');

    // 排除主仓库
    const worktrees = lines.slice(1).length;

    return {
      component: 'Worktrees',
      status: 'healthy',
      message: `${worktrees} 个 worktree`,
    };
  } catch (error) {
    return {
      component: 'Worktrees',
      status: 'degraded',
      message: '无法检查 worktrees',
    };
  }
}

async function main() {
  console.log('🏥 系统健康检查\n');
  console.log('='.repeat(60));

  const checks = [
    checkGit(),
    checkGitHubCLI(),
    checkTmux(),
    checkNodeModules(),
    checkDirectories(),
    checkEnvironment(),
    checkActiveTasks(),
    checkWorktrees(),
  ];

  const results = await Promise.all(checks);

  console.log('\n检查结果:\n');

  let healthyCount = 0;
  let degradedCount = 0;
  let unhealthyCount = 0;

  results.forEach(result => {
    const icon = result.status === 'healthy' ? '✅' : result.status === 'degraded' ? '⚠️' : '❌';
    console.log(`${icon} ${result.component.padEnd(20)} ${result.message}`);

    if (result.status === 'healthy') healthyCount++;
    else if (result.status === 'degraded') degradedCount++;
    else unhealthyCount++;
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 总结:`);
  console.log(`   ✅ 健康: ${healthyCount}`);
  console.log(`   ⚠️  降级: ${degradedCount}`);
  console.log(`   ❌ 不健康: ${unhealthyCount}`);

  if (unhealthyCount > 0) {
    console.log(`\n⚠️  发现 ${unhealthyCount} 个问题，请修复后再使用系统`);
    process.exit(1);
  } else if (degradedCount > 0) {
    console.log(`\n⚠️  发现 ${degradedCount} 个警告，建议修复`);
    process.exit(0);
  } else {
    console.log(`\n✅ 系统健康，可以正常使用！`);
    process.exit(0);
  }
}

main().catch(error => {
  console.error('健康检查失败:', error);
  process.exit(1);
});
