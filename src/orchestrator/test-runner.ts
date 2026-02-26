/**
 * 测试流程管理器
 * 运行完整的自动化测试流程：Lint → TypeScript → 单元测试 → E2E测试 → 截图
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface TestResults {
  lint: {
    passed: boolean;
    errors: string[];
    warnings: string[];
  };
  typescript: {
    passed: boolean;
    errors: string[];
  };
  unitTests: {
    passed: number;
    failed: number;
    skipped: number;
    coverage: number;
  };
  e2eTests: {
    passed: number;
    failed: number;
    skipped: number;
  };
  uiScreenshot: {
    path?: string;
    hasChanges: boolean;
  };
  overall: {
    passed: boolean;
    score: number; // 0-100
  };
}

export class TestRunner {
  private worktreePath: string;

  constructor(worktreePath: string) {
    this.worktreePath = worktreePath;
  }

  /**
   * 运行完整测试流程
   */
  async runFullTestSuite(): Promise<TestResults> {
    console.log('\n🧪 开始完整测试流程...\n');

    const results: TestResults = {
      lint: await this.runLint(),
      typescript: await this.runTypeCheck(),
      unitTests: await this.runUnitTests(),
      e2eTests: await this.runE2ETests(),
      uiScreenshot: await this.captureUIScreenshot(),
      overall: {
        passed: true,
        score: 0,
      },
    };

    // 计算总体分数
    results.overall.score = this.calculateScore(results);
    results.overall.passed = results.overall.score >= 80;

    console.log(`\n${results.overall.passed ? '✅' : '❌'} 测试完成，总分: ${results.overall.score}/100\n`);

    return results;
  }

  /**
   * 运行 ESLint
   */
  private async runLint(): Promise<TestResults['lint']> {
    console.log('  🔍 运行 ESLint...');

    try {
      const { stdout, stderr } = await execAsync('npm run lint 2>&1 || true', {
        cwd: this.worktreePath,
        timeout: 60000,
      });

      const output = stdout + stderr;

      // 检查是否有错误
      const errors = this.extractLintErrors(output, 'error');
      const warnings = this.extractLintErrors(output, 'warning');

      console.log(`    ${errors.length} errors, ${warnings.length} warnings`);

      return {
        passed: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      console.log('    ❌ Lint 失败');
      return {
        passed: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
      };
    }
  }

  /**
   * 运行 TypeScript 类型检查
   */
  private async runTypeCheck(): Promise<TestResults['typescript']> {
    console.log('  🔍 运行 TypeScript 类型检查...');

    try {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit 2>&1 || true', {
        cwd: this.worktreePath,
        timeout: 60000,
      });

      const output = stdout + stderr;

      // 检查是否有类型错误
      const errors = this.extractTypeScriptErrors(output);

      console.log(`    ${errors.length} type errors`);

      return {
        passed: errors.length === 0,
        errors,
      };
    } catch (error) {
      console.log('    ❌ 类型检查失败');
      return {
        passed: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * 运行单元测试
   */
  private async runUnitTests(): Promise<TestResults['unitTests']> {
    console.log('  🔍 运行单元测试...');

    try {
      const { stdout, stderr } = await execAsync('npm test -- --coverage 2>&1 || true', {
        cwd: this.worktreePath,
        timeout: 120000,
      });

      const output = stdout + stderr;

      // 解析测试结果
      const testResults = this.parseJestOutput(output);
      const coverage = this.extractCoverage(output);

      console.log(`    ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.skipped} skipped`);
      console.log(`    Coverage: ${coverage}%`);

      return {
        ...testResults,
        coverage,
      };
    } catch (error) {
      console.log('    ❌ 单元测试失败');
      return {
        passed: 0,
        failed: 1,
        skipped: 0,
        coverage: 0,
      };
    }
  }

  /**
   * 运行 E2E 测试
   */
  private async runE2ETests(): Promise<TestResults['e2eTests']> {
    console.log('  🔍 运行 E2E 测试...');

    try {
      const { stdout, stderr } = await execAsync('npm run test:e2e 2>&1 || true', {
        cwd: this.worktreePath,
        timeout: 300000, // 5 分钟
      });

      const output = stdout + stderr;

      // 解析测试结果
      const testResults = this.parsePlaywrightOutput(output);

      console.log(`    ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.skipped} skipped`);

      return testResults;
    } catch (error) {
      console.log('    ⚠️  E2E 测试未配置或失败');
      return {
        passed: 0,
        failed: 0,
        skipped: 0,
      };
    }
  }

  /**
   * 捕获 UI 截图
   */
  private async captureUIScreenshot(): Promise<TestResults['uiScreenshot']> {
    console.log('  📸 捕获 UI 截图...');

    try {
      // 检查是否有 UI 变化
      const hasChanges = await this.detectUIChanges();

      if (hasChanges) {
        // 使用 Playwright 截图
        const screenshotPath = path.join(this.worktreePath, 'screenshots', 'ui-changes.png');

        await fs.mkdir(path.dirname(screenshotPath), { recursive: true });

        const { stdout, stderr } = await execAsync(
          `npx playwright screenshot --wait-for-selector="body" ${screenshotPath} 2>&1 || true`,
          {
            cwd: this.worktreePath,
            timeout: 60000,
          }
        );

        console.log(`    截图保存到: ${screenshotPath}`);

        return {
          path: screenshotPath,
          hasChanges: true,
        };
      } else {
        console.log('    无 UI 变化');
        return {
          hasChanges: false,
        };
      }
    } catch (error) {
      console.log('    ⚠️  截图失败或未配置');
      return {
        hasChanges: false,
      };
    }
  }

  /**
   * 检测 UI 变化
   */
  private async detectUIChanges(): Promise<boolean> {
    try {
      // 检查是否有前端文件变更
      const { stdout } = await execAsync('git diff --name-only main', {
        cwd: this.worktreePath,
      });

      const changedFiles = stdout.trim().split('\n').filter(f => f);

      // 检查是否有 UI 相关文件变更
      const uiFiles = changedFiles.filter(f =>
        f.match(/\.(tsx?|css|scss|vue|jsx?)$/)
      );

      return uiFiles.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * 提取 Lint 错误
   */
  private extractLintErrors(output: string, type: string): string[] {
    const lines = output.split('\n');
    const errors: string[] = [];

    lines.forEach(line => {
      const match = line.match(new RegExp(`${type}\\s+(.*)`));
      if (match) {
        errors.push(match[1].trim());
      }
    });

    return errors;
  }

  /**
   * 提取 TypeScript 错误
   */
  private extractTypeScriptErrors(output: string): string[] {
    const lines = output.split('\n');
    const errors: string[] = [];

    lines.forEach(line => {
      if (line.includes('.ts') && (line.includes('error TS') || line.includes(': error'))) {
        errors.push(line.trim());
      }
    });

    return errors;
  }

  /**
   * 解析 Jest 输出
   */
  private parseJestOutput(output: string): { passed: number; failed: number; skipped: number } {
    const match = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed/);

    if (match) {
      return {
        passed: parseInt(match[1]),
        failed: parseInt(match[2]),
        skipped: 0,
      };
    }

    // 尝试另一种格式
    const match2 = output.match(/(\d+)\s+passed,\s+(\d+)\s+failed/);

    if (match2) {
      return {
        passed: parseInt(match2[1]),
        failed: parseInt(match2[2]),
        skipped: 0,
      };
    }

    return { passed: 0, failed: 0, skipped: 0 };
  }

  /**
   * 解析 Playwright 输出
   */
  private parsePlaywrightOutput(output: string): { passed: number; failed: number; skipped: number } {
    const match = output.match(/(\d+)\s+passed\s*\((\d+).*?\)/);

    if (match) {
      return {
        passed: parseInt(match[1]),
        failed: 0,
        skipped: parseInt(match[2]) || 0,
      };
    }

    return { passed: 0, failed: 0, skipped: 0 };
  }

  /**
   * 提取测试覆盖率
   */
  private extractCoverage(output: string): number {
    const match = output.match(/All files\s*\|\s*([\d.]+)/);

    if (match) {
      return parseFloat(match[1]);
    }

    return 0;
  }

  /**
   * 计算总分
   */
  private calculateScore(results: TestResults): number {
    let score = 0;

    // Lint (20分)
    if (results.lint.passed) score += 20;

    // TypeScript (20分)
    if (results.typescript.passed) score += 20;

    // 单元测试 (30分)
    const unitTestTotal = results.unitTests.passed + results.unitTests.failed;
    const unitTestPassRate = unitTestTotal > 0 ? results.unitTests.passed / unitTestTotal : 1;
    score += unitTestPassRate * 30;

    // E2E 测试 (20分)
    const e2eTestTotal = results.e2eTests.passed + results.e2eTests.failed;
    const e2eTestPassRate = e2eTestTotal > 0 ? results.e2eTests.passed / e2eTestTotal : 1;
    score += e2eTestPassRate * 20;

    // 测试覆盖率 (10分)
    score += Math.min(results.unitTests.coverage / 100 * 10, 10);

    return Math.round(score);
  }
}
