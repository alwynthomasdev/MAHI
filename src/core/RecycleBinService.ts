import type { Task } from '@models/Task';
import type { TaskRepository } from '@storage/TaskRepository';

/**
 * Soft delete. A deleted task's file moves from `tasks/` to `.recyclebin/`
 * stamped with `deletedAt`; restore moves it back, purge removes it for good.
 */
export class RecycleBinService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly bin: TaskRepository,
  ) {}

  /** Newest-deleted first. */
  async list(): Promise<Task[]> {
    const items = await this.bin.list();
    return items.sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? ''));
  }

  async moveToBin(task: Task, now: Date = new Date()): Promise<void> {
    await this.bin.save({ ...task, deletedAt: now.toISOString() });
    await this.tasks.remove(task.id);
  }

  async restore(id: string): Promise<Task> {
    const task = await this.bin.get(id);
    if (!task) throw new Error(`Task "${id}" is not in the recycle bin.`);
    const restored: Task = { ...task };
    delete restored.deletedAt;
    await this.tasks.save(restored);
    await this.bin.remove(id);
    return restored;
  }

  async purge(id: string): Promise<void> {
    await this.bin.remove(id);
  }

  async empty(): Promise<number> {
    const items = await this.bin.list();
    for (const t of items) await this.bin.remove(t.id);
    return items.length;
  }
}
