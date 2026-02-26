/**
 * 上下文加载器
 * 负责加载业务上下文：迭代需求、会议记录、决策历史
 */

import fs from 'fs/promises';
import path from 'path';
import { Iteration, ContextSnapshot } from '../types/index.js';

export class ContextLoader {
  private contextDir: string;
  private iterationsDir: string;
  private decisionsDir: string;
  private meetingsDir: string;

  constructor(contextDir: string) {
    this.contextDir = contextDir;
    this.iterationsDir = path.join(contextDir, 'iterations');
    this.decisionsDir = path.join(contextDir, 'decisions');
    this.meetingsDir = path.join(contextDir, 'meetings');
  }

  /**
   * 加载所有迭代需求
   */
  async loadIterations(): Promise<Iteration[]> {
    await this.ensureDirs();

    try {
      const files = await fs.readdir(this.iterationsDir);
      const iterations: Iteration[] = [];

      for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.txt')) {
          const content = await fs.readFile(path.join(this.iterationsDir, file), 'utf-8');
          const id = path.basename(file, path.extname(file));

          iterations.push({
            id,
            content,
            type: 'text',
            timestamp: (await fs.stat(path.join(this.iterationsDir, file))).mtimeMs,
            processed: false,
          });
        }
      }

      return iterations.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('加载迭代需求失败:', error);
      return [];
    }
  }

  /**
   * 加载未处理的迭代需求
   */
  async loadUnprocessedIterations(): Promise<Iteration[]> {
    const all = await this.loadIterations();
    return all.filter(iter => !iter.processed);
  }

  /**
   * 标记迭代为已处理
   */
  async markIterationProcessed(iterationId: string): Promise<void> {
    const iterations = await this.loadIterations();
    const iteration = iterations.find(iter => iter.id === iterationId);

    if (iteration) {
      iteration.processed = true;
      // 可以添加一个标记文件
      const markerPath = path.join(this.iterationsDir, `${iterationId}.processed`);
      await fs.writeFile(markerPath, new Date().toISOString(), 'utf-8');
    }
  }

  /**
   * 加载决策记录
   */
  async loadDecisions(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.decisionsDir);
      const decisions: string[] = [];

      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fs.readFile(path.join(this.decisionsDir, file), 'utf-8');
          decisions.push(content);
        }
      }

      return decisions;
    } catch (error) {
      return [];
    }
  }

  /**
   * 加载会议记录
   */
  async loadMeetingNotes(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.meetingsDir);
      const notes: string[] = [];

      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fs.readFile(path.join(this.meetingsDir, file), 'utf-8');
          notes.push(content);
        }
      }

      return notes;
    } catch (error) {
      return [];
    }
  }

  /**
   * 构建上下文快照
   */
  async buildContext(iterationId: string): Promise<ContextSnapshot> {
    const [decisions, notes] = await Promise.all([
      this.loadDecisions(),
      this.loadMeetingNotes(),
    ]);

    return {
      iterationId,
      previousDecisions: decisions,
      meetingNotes: notes.join('\n\n'),
    };
  }

  /**
   * 确保目录存在
   */
  private async ensureDirs(): Promise<void> {
    await fs.mkdir(this.iterationsDir, { recursive: true });
    await fs.mkdir(this.decisionsDir, { recursive: true });
    await fs.mkdir(this.meetingsDir, { recursive: true });
  }
}
