import type { NewTaskInput, Status, Task, TaskPatch } from '@models/Task';
import type { Result } from './result';

/**
 * The renderer <-> main boundary. `src/preload/index.ts` and `src/main/ipc.ts`
 * both implement against this file — change all three together.
 */
export const IPC = {
  configGet: 'config:get',
  configSetTheme: 'config:setTheme',
  configSetEffortLimit: 'config:setEffortLimit',
  configPickDataDir: 'config:pickDataDir',
  configResetDataDir: 'config:resetDataDir',
  configOpenDataDir: 'config:openDataDir',

  tasksList: 'tasks:list',
  tasksCreate: 'tasks:create',
  tasksUpdate: 'tasks:update',
  tasksDelete: 'tasks:delete',

  binList: 'bin:list',
  binRestore: 'bin:restore',
  binPurge: 'bin:purge',
  binEmpty: 'bin:empty',

  ioExport: 'io:export',
  ioImport: 'io:import',

  updatesCheck: 'updates:check',
  updatesDownload: 'updates:download',
  updatesInstall: 'updates:install',

  appVersion: 'app:version',
  windowOpenQuickAdd: 'window:openQuickAdd',
  windowCloseQuickAdd: 'window:closeQuickAdd',

  /** main -> renderer broadcast after any task / bin mutation. */
  tasksChanged: 'tasks:changed',
} as const;

export type Theme = 'light' | 'dark' | 'system';

export interface AppConfig {
  dataDir: string;
  theme: Theme;
  /** Effort points a day can carry before it is flagged as over the limit. */
  effortLimit: number;
}

export interface UpdateInfo {
  version: string;
  releaseNotes?: string;
}

export interface ImportSummary {
  imported: number;
  /** Tasks whose id was already in use, so they were given a fresh id. */
  renamed: number;
  /** Entries that could not be read as a task (e.g. no title). */
  skipped: number;
}

export interface MahiApi {
  config: {
    get(): Promise<Result<AppConfig>>;
    setTheme(theme: Theme): Promise<Result<AppConfig>>;
    setEffortLimit(limit: number): Promise<Result<AppConfig>>;
    /** Shows a folder picker; resolves `null` when cancelled. */
    pickDataDir(): Promise<Result<AppConfig | null>>;
    resetDataDir(): Promise<Result<AppConfig>>;
    openDataDir(): Promise<Result<void>>;
  };
  tasks: {
    list(): Promise<Result<Task[]>>;
    create(input: NewTaskInput): Promise<Result<Task>>;
    update(id: string, patch: TaskPatch): Promise<Result<Task>>;
    delete(id: string): Promise<Result<void>>;
  };
  bin: {
    list(): Promise<Result<Task[]>>;
    restore(id: string): Promise<Result<Task>>;
    purge(id: string): Promise<Result<void>>;
    empty(): Promise<Result<number>>;
  };
  io: {
    /** Shows a save dialog; resolves the task count, or `null` when cancelled. */
    export(statuses: Status[]): Promise<Result<number | null>>;
    /** Shows an open dialog; resolves `null` when cancelled. */
    import(): Promise<Result<ImportSummary | null>>;
  };
  updates: {
    check(): Promise<Result<UpdateInfo | null>>;
    download(): Promise<Result<void>>;
    install(): Promise<Result<void>>;
  };
  app: {
    version(): Promise<Result<string>>;
  };
  window: {
    openQuickAdd(): Promise<Result<void>>;
    closeQuickAdd(): Promise<Result<void>>;
  };
  events: {
    /** Subscribe to task changes from any window; returns an unsubscribe fn. */
    onTasksChanged(listener: () => void): () => void;
  };
}
