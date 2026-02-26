/**
 * Code Reviewer - 自动化代码审查
 * 使用 3 个 Agent 审查 PR：Codex、Gemini、Claude Code
 */

import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PRReview {
  prNumber: number;
  prUrl: string;
  changes: {
    files: string[];
    additions: number;
    deletions: number;
  };

  reviews: {
    agent: 'codex' | 'gemini' | 'claude-code';
    status: 'approved' | 'changes_requested' | 'commented';
    score: number; // 0-100
    comments: PRComment[];
    summary: string;
  }[];

  overall: {
    approved: boolean;
    score: number;
    consensus: boolean;
  };
}

export interface PRComment {
  file?: string;
  line?: number;
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  message: string;
  code?: string;
  suggestion?: string;
}

export interface ReviewerConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export class CodeReviewer {
  private configs: {
    codex: ReviewerConfig;
    gemini: ReviewerConfig;
    'claude-code': ReviewerConfig;
  };

  constructor() {
    // 从环境变量读取配置
    this.configs = {
      codex: {
        apiUrl: process.env.CODEX_API_URL || 'https://api.openai.com/v1',
        apiKey: process.env.CODEX_API_KEY || '',
        model: 'gpt-5.3-codex',
      },
      gemini: {
        apiUrl: process.env.GEMINI_API_URL || 'https://zenmux.ai/api/anthropic',
        apiKey: process.env.GEMINI_API_KEY || 'sk-ai-v1-b5a0a74a3f859a4ecc18bd9aee713713c14971403a7fec64d09debd956ef931c',
        model: 'gemini-2.5-pro',
      },
      'claude-code': {
        apiUrl: process.env.CLAUDE_API_URL || 'https://zenmux.ai/api/anthropic',
        apiKey: process.env.CLAUDE_API_KEY || 'sk-ai-v1-b5a0a74a3f859a4ecc18bd9aee713713c14971403a7fec64d09debd956ef931c',
        model: 'claude-opus-4.5',
      },
    };
  }

  /**
   * 审查 PR
   */
  async reviewPR(prNumber: number, worktreePath: string): Promise<PRReview> {
    console.log('\n🔍 开始 Code Review...');

    // 1. 获取 PR 信息
    const prInfo = await this.getPRInfo(prNumber);
    console.log(`   PR #${prNumber}: ${prInfo.title}`);

    // 2. 获取代码变更
    const changes = await this.getPRChanges(prNumber, worktreePath);
    console.log(`   变更: ${changes.files.length} files, +${changes.additions}, -${changes.deletions}`);

    // 3. 并行审查（3 个 Agent）
    const reviews = await Promise.all([
      this.reviewWithAgent('codex', prInfo, changes, worktreePath),
      this.reviewWithAgent('gemini', prInfo, changes, worktreePath),
      this.reviewWithAgent('claude-code', prInfo, changes, worktreePath),
    ]);

    // 4. 统计结果
    const overall = this.calculateOverall(reviews);

    // 5. 发送评论到 PR
    await this.postReviewToPR(prNumber, reviews, overall);

    console.log(`\n✅ Code Review 完成`);
    console.log(`   总分: ${overall.score}/100`);
    console.log(`   状态: ${overall.approved ? '✅ 通过' : '❌ 需要修改'}`);

    return {
      prNumber,
      prUrl: prInfo.url,
      changes,
      reviews,
      overall,
    };
  }

  /**
   * 获取 PR 信息
   */
  private async getPRInfo(prNumber: number): Promise<any> {
    try {
      const { stdout } = await execAsync(
        `gh pr view ${prNumber} --json title,url,body,author,state`,
        {
          timeout: 30000,
        }
      );

      return JSON.parse(stdout);
    } catch (error) {
      console.error('获取 PR 信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取 PR 代码变更
   */
  private async getPRChanges(
    prNumber: number,
    worktreePath: string
  ): Promise<{ files: string[]; additions: number; deletions: number }> {
    try {
      const { stdout } = await execAsync(
        `git diff origin/main...HEAD --stat`,
        {
          cwd: worktreePath,
          timeout: 30000,
        }
      );

      const lines = stdout.trim().split('\n');
      const files: string[] = [];
      let additions = 0;
      let deletions = 0;

      lines.forEach(line => {
        const match = line.match(/^(.+?)\s*\|\s*(\d+)\s*(\+*)(\s*\-*)/);
        if (match) {
          files.push(match[1].trim());
          const adds = match[3]?.length || 0;
          const dels = match[4]?.length || 0;
          additions += adds;
          deletions += dels;
        }
      });

      return { files, additions, deletions };
    } catch (error) {
      console.error('获取 PR 变更失败:', error);
      return { files: [], additions: 0, deletions: 0 };
    }
  }

  /**
   * 使用特定 Agent 审查
   */
  private async reviewWithAgent(
    agent: 'codex' | 'gemini' | 'claude-code',
    prInfo: any,
    changes: any,
    worktreePath: string
  ): Promise<PRReview['reviews'][0]> {
    console.log(`\n   🤖 ${agent} 审查中...`);

    const config = this.configs[agent];

    // 获取 diff
    const diff = await this.getDiff(worktreePath);

    // 构建审查 prompt
    const prompt = this.buildReviewPrompt(agent, prInfo, changes, diff);

    // 调用 API
    const response = await this.callAI(config, prompt);

    // 解析响应
    const review = this.parseReviewResponse(agent, response);

    console.log(`   ✅ ${agent} 完成: ${review.status} (${review.score}/100)`);

    return review;
  }

  /**
   * 获取 diff
   */
  private async getDiff(worktreePath: string): Promise<string> {
    try {
      const { stdout } = await execAsync(
        'git diff origin/main...HEAD',
        {
          cwd: worktreePath,
          timeout: 60000,
        }
      );

      return stdout;
    } catch (error) {
      console.error('获取 diff 失败:', error);
      return '';
    }
  }

  /**
   * 构建审查 prompt
   */
  private buildReviewPrompt(
    agent: 'codex' | 'gemini' | 'claude-code',
    prInfo: any,
    changes: any,
    diff: string
  ): string {
    const agentPrompts = {
      codex: {
        role: '你是 Codex，最靠谱的代码审查者。',
        focus: '重点关注：\n- 边界情况和边界条件\n- 逻辑错误和竞态条件\n- 缺失的错误处理\n- 性能问题\n- 安全漏洞',
      },
      gemini: {
        role: '你是 Gemini，专注于安全问题和扩展性。',
        focus: '重点关注：\n- 安全问题（SQL注入、XSS等）\n- 扩展性和可维护性\n- 设计模式\n- 代码质量',
      },
      'claude-code': {
        role: '你是 Claude Code，关注代码质量和最佳实践。',
        focus: '重点关注：\n- 代码风格和命名\n- TypeScript 类型安全\n- 测试覆盖率\n- 文档完整性',
      },
    };

    const config = agentPrompts[agent];

    return `
${config.role}

你正在审查一个 Pull Request。

## PR 信息
标题: ${prInfo.title}
描述: ${prInfo.body || '无描述'}
作者: ${prInfo.author?.login}

## 代码变更
文件数: ${changes.files.length}
新增: ${changes.additions} 行
删除: ${changes.deletions} 行

## 审查重点
${config.focus}

## 代码 Diff
\`\`\`diff
${diff.substring(0, 10000)}${diff.length > 10000 ? '\n... (diff 过长，已截断)' : ''}
\`\`\`

## 审查要求

请提供以下信息（JSON 格式）：

\`\`\`json
{
  "status": "approved" | "changes_requested" | "commented",
  "score": 0-100,
  "summary": "审查总结",
  "comments": [
    {
      "file": "文件路径",
      "line": 行号,
      "severity": "critical" | "major" | "minor" | "suggestion",
      "message": "问题描述",
      "code": "相关代码片段",
      "suggestion": "改进建议"
    }
  ]
}
\`\`\`

评分标准：
- 90-100: 优秀，可以直接合并
- 70-89: 良好，有小问题但不影响合并
- 50-69: 需要修复一些问题
- < 50: 有严重问题，必须修复

请只返回 JSON，不要有其他文字。
`;
  }

  /**
   * 调用 AI API
   */
  private async callAI(
    config: ReviewerConfig,
    prompt: string
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${config.apiUrl}/messages`,
        {
          model: config.model,
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
          },
          timeout: 120000, // 2 分钟超时
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error(`调用 ${config.model} 失败:`, error);
      throw error;
    }
  }

  /**
   * 解析审查响应
   */
  private parseReviewResponse(
    agent: 'codex' | 'gemini' | 'claude-code',
    response: string
  ): PRReview['reviews'][0] {
    try {
      // 提取 JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;

      const parsed = JSON.parse(jsonStr);

      return {
        agent,
        status: parsed.status || 'commented',
        score: parsed.score || 50,
        summary: parsed.summary || '无总结',
        comments: parsed.comments || [],
      };
    } catch (error) {
      console.error(`解析 ${agent} 响应失败:`, error);
      return {
        agent,
        status: 'commented',
        score: 50,
        summary: '解析失败',
        comments: [],
      };
    }
  }

  /**
   * 计算总体结果
   */
  private calculateOverall(
    reviews: PRReview['reviews'][0][]
  ): PRReview['overall'] {
    const avgScore = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;

    // 一致性检查：所有 Agent 都批准？
    const allApproved = reviews.every(r => r.status === 'approved');
    const consensus = reviews.every(r => r.status === reviews[0].status);

    return {
      approved: allApproved && avgScore >= 70,
      score: Math.round(avgScore),
      consensus,
    };
  }

  /**
   * 发送评论到 PR
   */
  private async postReviewToPR(
    prNumber: number,
    reviews: PRReview['reviews'][0][],
    overall: PRReview['overall']
  ): Promise<void> {
    // 构建评论消息
    const message = this.buildReviewMessage(reviews, overall);

    try {
      // 发送评论
      await execAsync(
        `gh pr comment ${prNumber} --body "${message.replace(/"/g, '\\"')}"`,
        {
          timeout: 30000,
        }
      );

      console.log('   ✅ 评论已发送到 PR');
    } catch (error) {
      console.error('发送评论失败:', error);
    }
  }

  /**
   * 构建审查消息
   */
  private buildReviewMessage(
    reviews: PRReview['reviews'][0][],
    overall: PRReview['overall']
  ): string {
    let message = `## 🔍 Code Review 结果\n\n`;
    message += `**总分**: ${overall.score}/100\n`;
    message += `**状态**: ${overall.approved ? '✅ 通过' : '❌ 需要修改'}\n`;
    message += `**一致性**: ${overall.consensus ? '✅ 一致' : '⚠️ 有分歧'}\n\n`;

    message += `### 🤖 审查详情\n\n`;

    const agentNames = {
      codex: '🔵 Codex',
      gemini: '🟢 Gemini',
      'claude-code': '🟣 Claude',
    };

    reviews.forEach(review => {
      message += `**${agentNames[review.agent]}**\n`;
      message += `- 状态: ${review.status}\n`;
      message += `- 分数: ${review.score}/100\n`;
      message += `- 总结: ${review.summary}\n`;

      if (review.comments.length > 0) {
        message += `- 评论:\n`;
        review.comments.forEach(comment => {
          const severityIcons = {
            critical: '🔴',
            major: '🟠',
            minor: '🟡',
            suggestion: '💡',
          };
          message += `  ${severityIcons[comment.severity]} ${comment.message}\n`;
        });
      }

      message += '\n';
    });

    return message;
  }
}
