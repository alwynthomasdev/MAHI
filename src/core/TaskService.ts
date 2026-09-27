import { randomUUID } from 'node:crypto';
import { applyPatch, createTask, type NewTaskInput, type Task, type TaskPatch } from '@models/Task';
import type { TaskRepository } from '@storage/TaskRepository';
import type { RecycleBinService } from './RecycleBinService';

export class TaskService {
  constructor(
    private readonly repo: TaskRepository,
    private readonly bin: RecycleBinService,
  ) {}

  list(): Promise<Task[]> {
    return this.repo.list();
  }

  async get(id: string): Promise<Task> {
    const task = await this.repo.get(id);
    if (!task) throw new Error(`Task "${id}" not found.`);
    return task;
  }

  async create(input: NewTaskInput, now: Date = new Date()): Promise<Task> {
    const task = createTask(input, randomUUID(), now);
    await this.repo.save(task);
    return task;
  }

  async update(id: string, patch: TaskPatch, now: Date = new Date()): Promise<Task> {
    const next = applyPatch(await this.get(id), patch, now);
    await this.repo.save(next);
    return next;
  }

  /** Soft delete: moves the task into the recycle bin. */
  async delete(id: string, now: Date = new Date()): Promise<void> {
    await this.bin.moveToBin(await this.get(id), now);
  }
}
