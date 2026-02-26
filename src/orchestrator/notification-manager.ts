/**
 * 通知管理器
 * 发送 Telegram 通知，包括任务完成信息和 UI 截图
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export interface NotificationConfig {
  telegramBotToken?: string;
  telegramChatId?: string;
  enabled?: boolean;
}

export interface TaskCompletionNotification {
  taskId: string;
  description: string;
  status: 'completed' | 'failed';
  prUrl?: string;
  testResults: any;
  screenshot?: string;
  metrics: any;
}

export class NotificationManager {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  /**
   * 发送任务完成通知
   */
  async sendTaskCompletion(notification: TaskCompletionNotification): Promise<void> {
    if (!this.config.enabled || !this.config.telegramBotToken || !this.config.telegramChatId) {
      console.log('   ⚠️  通知未配置');
      return;
    }

    console.log('\n📱 发送 Telegram 通知...');

    try {
      // 构建消息
      const message = this.buildMessage(notification);

      // 发送文本消息
      await this.sendMessage(message);

      // 如果有截图，发送截图
      if (notification.screenshot) {
        await this.sendPhoto(notification.screenshot);
      }

      console.log('   ✅ 通知已发送');
    } catch (error) {
      console.error('   ❌ 发送通知失败:', error);
    }
  }

  /**
   * 发送消息
   */
  private async sendMessage(message: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`;

    await axios.post(url, {
      chat_id: this.config.telegramChatId,
      text: message,
      parse_mode: 'Markdown',
    });
  }

  /**
   * 发送照片
   */
  private async sendPhoto(photoPath: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendPhoto`;

    // 读取图片文件
    const photoBuffer = await fs.readFile(photoPath);

    // 创建 FormData（使用 axios 的 FormData）
    const FormData = (await import('form-data')).default;
    const form = new FormData();

    form.append('chat_id', this.config.telegramChatId);
    form.append('photo', photoBuffer, { filename: 'ui-screenshot.png' });
    form.append('caption', 'UI 变化截图');

    await axios.post(url, form, {
      headers: form.getHeaders(),
    });
  }

  /**
   * 构建通知消息
   */
  private buildMessage(notification: TaskCompletionNotification): string {
    const statusEmoji = notification.status === 'completed' ? '✅' : '❌';
    const score = notification.metrics?.codeQualityScore || 0;

    let message = `
${statusEmoji} *任务完成*

任务: \`${notification.taskId}\`
描述: ${notification.description}

`;

    if (notification.prUrl) {
      message += `PR: ${notification.prUrl}\n`;
    }

    message += `
📊 测试结果:
`;

    const testResults = notification.testResults || {};
    if (testResults.unitTests) {
      message += `   单元测试: ${testResults.unitTests.passed}/${testResults.unitTests.passed + testResults.unitTests.failed} 通过\n`;
    }

    if (testResults.unitTests?.coverage) {
      message += `   覆盖率: ${testResults.unitTests.coverage}%\n`;
    }

    message += `
🎯 质量指标:
   代码质量: ${score}/100
   测试通过率: ${notification.metrics?.testPassRate ? (notification.metrics.testPassRate * 100).toFixed(0) : 0}%
   审批通过率: ${notification.metrics?.reviewApprovalRate ? (notification.metrics.reviewApprovalRate * 100).toFixed(0) : 0}%

`;

    if (notification.status === 'completed' && score >= 80) {
      message += `👀 请 review 并决定是否合并 PR。\n`;
    } else if (notification.status === 'failed') {
      message += `⚠️  任务失败，请检查错误。\n`;
    }

    return message.trim();
  }

  /**
   * 发送任务失败通知
   */
  async sendTaskFailure(taskId: string, description: string, error: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const message = `
❌ *任务失败*

任务: \`${taskId}\`
描述: ${description}

错误:
\`\`\`
${error}
\`\`\`

请检查日志并决定是否重试。
`;

    await this.sendMessage(message);
  }

  /**
   * 发送任务开始通知
   */
  async sendTaskStart(taskId: string, description: string, agent: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const message = `
🚀 *任务开始*

任务: \`${taskId}\`
描述: ${description}
Agent: ${agent}

正在处理中...
`;

    await this.sendMessage(message);
  }
}
