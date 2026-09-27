import { FileStore } from '@storage/FileStore';
import { TaskRepository } from '@storage/TaskRepository';
import { ImportExportService } from './ImportExportService';
import { RecycleBinService } from './RecycleBinService';
import { TaskService } from './TaskService';

/** One wired set of services for a data directory. Rebuilt when it changes. */
export class AppContext {
  readonly store: FileStore;
  readonly tasks: TaskService;
  readonly bin: RecycleBinService;
  readonly io: ImportExportService;

  private constructor(dataDir: string) {
    this.store = new FileStore(dataDir);
    const live = new TaskRepository(this.store, 'tasks');
    const binned = new TaskRepository(this.store, 'bin');
    this.bin = new RecycleBinService(live, binned);
    this.tasks = new TaskService(live, this.bin);
    this.io = new ImportExportService(live);
  }

  static async open(dataDir: string): Promise<AppContext> {
    const ctx = new AppContext(dataDir);
    await ctx.store.ensureLayout();
    return ctx;
  }
}
