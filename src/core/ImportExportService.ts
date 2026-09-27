import { randomUUID } from 'node:crypto';
import { normalizeTask, type Status, type Task } from '@models/Task';
import type { ImportSummary } from '@shared/ipc';
import type { TaskRepository } from '@storage/TaskRepository';

/** The export file shape; import accepts the same (or a bare array of tasks). */
export interface ExportFile {
  app: 'MAHI';
  version: 1;
  exportedAt: string;
  tasks: Task[];
}

export class ImportExportService {
  constructor(private readonly repo: TaskRepository) {}

  /** Build the export document for tasks in the given statuses (all when empty). */
  async buildExport(statuses: Status[], now: Date = new Date()): Promise<ExportFile> {
    const all = await this.repo.list();
    const tasks = statuses.length ? all.filter((t) => statuses.includes(t.status)) : all;
    tasks.sort((a, b) => a.created.localeCompare(b.created));
    return { app: 'MAHI', version: 1, exportedAt: now.toISOString(), tasks };
  }

  /**
   * Import from a parsed export document. Never overwrites: a task whose id
   * is already in use (or is missing / not file-safe) gets a new id.
   */
  async importData(data: unknown, now: Date = new Date()): Promise<ImportSummary> {
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && Array.isArray((data as ExportFile).tasks)
        ? (data as ExportFile).tasks
        : null;
    if (!list) throw new Error('Not a MAHI export: expected a "tasks" array.');

    const summary: ImportSummary = { imported: 0, renamed: 0, skipped: 0 };
    for (const raw of list) {
      let task: Task;
      try {
        task = normalizeTask(raw, randomUUID(), now);
      } catch {
        summary.skipped++;
        continue;
      }
      delete task.deletedAt;
      if (!/^[A-Za-z0-9_-]+$/.test(task.id) || (await this.repo.exists(task.id))) {
        task.id = randomUUID();
        summary.renamed++;
      }
      await this.repo.save(task);
      summary.imported++;
    }
    return summary;
  }
}
