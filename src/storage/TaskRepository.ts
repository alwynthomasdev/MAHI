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

  /**
   * Read one task file. The file name is authoritative for the id. A file
   * with no usable `created` is written back with the one it was just given,
   * so the date is fixed from the first read on.
   */
  private async read(file: string, id: string): Promise<Task> {
    const raw = await this.store.readJson(file);
    const task = { ...normalizeTask(raw, id), id };
    if ((raw as { created?: unknown }).created !== task.created) {
      try {
        await this.save(task);
      } catch (e) {
        console.warn(`[mahi] could not record the created date of task ${id}:`, e);
      }
    }
    return task;
  }

  /** Every readable task. Unparseable files are skipped (and logged), never fatal. */
  async list(): Promise<Task[]> {
    const names = await this.store.listJson(this.dir());
    const tasks: Task[] = [];
    for (const name of names) {
      const id = name.replace(/\.json$/, '');
      try {
        tasks.push(await this.read(path.join(this.dir(), name), id));
      } catch (e) {
        console.warn(`[mahi] skipping unreadable task file ${name}:`, e);
      }
    }
    return tasks;
  }

  async get(id: string): Promise<Task | null> {
    const p = this.file(id);
    if (!(await this.store.exists(p))) return null;
    return this.read(p, id);
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
