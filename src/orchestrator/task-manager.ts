/**
 * 任务管理器
 * 负责任务的保存、加载、更新和查询
 */

import fs from 'fs/promises';
import path from 'path';
import { Task } from '../types/index.js';

export class TaskManager {
  private tasksDir: string;

  constructor(tasksDir: string) {
    this.tasksDir = tasksDir;
  }

  /**
   * 保存任务
   */
  async save(task: Task): Promise<void> {
    await fs.mkdir(this.tasksDir, { recursive: true });
    const filePath = path.join(this.tasksDir, `${task.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(task, null, 2), 'utf-8');
  }

  /**
   * 更新任务
   */
  async update(task: Task): Promise<void> {
    await this.save(task);
  }

  /**
   * 获取任务
   */
  async get(taskId: string): Promise<Task | null> {
    try {
      const filePath = path.join(this.tasksDir, `${taskId}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as Task;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取所有任务
   */
  async getAll(): Promise<Task[]> {
    try {
      const files = await fs.readdir(this.tasksDir);
      const tasks: Task[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.tasksDir, file), 'utf-8');
          tasks.push(JSON.parse(content) as Task);
        }
      }

      return tasks;
    } catch (error) {
      return [];
    }
  }

  /**
   * 获取运行中的任务
   */
  async getRunningTasks(): Promise<Task[]> {
    const allTasks = await this.getAll();
    return allTasks.filter(task => task.status === 'running');
  }

  /**
   * 获取失败的任务
   */
  async getFailedTasks(): Promise<Task[]> {
    const allTasks = await this.getAll();
    return allTasks.filter(task => task.status === 'failed');
  }

  /**
   * 获取已完成的任务
   */
  async getCompletedTasks(): Promise<Task[]> {
    const allTasks = await this.getAll();
    return allTasks.filter(task => task.status === 'completed');
  }

  /**
   * 删除任务
   */
  async delete(taskId: string): Promise<void> {
    const filePath = path.join(this.tasksDir, `${taskId}.json`);
    await fs.unlink(filePath);
  }
}
