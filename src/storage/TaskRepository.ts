import path from 'node:path';
import { normalizeTask, type Task } from '@models/Task';
import type { FileStore } from './FileStore';

/** Task <-> JSON file, for either the live folder or the recycle bin. */
export class TaskRepository {
  constructor(
    private readonly store: FileStore,
    private readonly where: 'tasks' | 'bin' = 'tasks',
  ) {}

  private dir(): string {
    return this.where === 'tasks' ? this.store.tasksDir() : this.store.binDir();
  }

  private file(id: string): string {
    return this.where === 'tasks' ? this.store.taskFile(id) : this.store.binFile(id);
  }

  /** Every readable task. Unparseable files are skipped (and logged), never fatal. */
  async list(): Promise<Task[]> {
    const names = await this.store.listJson(this.dir());
    const tasks: Task[] = [];
    for (const name of names) {
      const id = name.replace(/\.json$/, '');
      try {
        const task = normalizeTask(await this.store.readJson(path.join(this.dir(), name)), id);
        // The file name is authoritative for the id.
        tasks.push({ ...task, id });
      } catch (e) {
        console.warn(`[mahi] skipping unreadable task file ${name}:`, e);
      }
    }
    return tasks;
  }

  async get(id: string): Promise<Task | null> {
    const p = this.file(id);
    if (!(await this.store.exists(p))) return null;
    return { ...normalizeTask(await this.store.readJson(p), id), id };
  }

  async exists(id: string): Promise<boolean> {
    return this.store.exists(this.file(id));
  }

  async save(task: Task): Promise<void> {
    await this.store.writeJson(this.file(task.id), task);
  }

  async remove(id: string): Promise<void> {
    await this.store.remove(this.file(id));
  }
}
