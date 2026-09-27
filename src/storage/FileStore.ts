import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Every filesystem primitive and the on-disk layout for one data directory:
 *
 *   <dataDir>/tasks/<id>.json         live tasks
 *   <dataDir>/.recyclebin/<id>.json   soft-deleted tasks
 */
export class FileStore {
  constructor(readonly dataDir: string) {}

  tasksDir(): string {
    return path.join(this.dataDir, 'tasks');
  }

  binDir(): string {
    return path.join(this.dataDir, '.recyclebin');
  }

  taskFile(id: string): string {
    return path.join(this.tasksDir(), `${safeId(id)}.json`);
  }

  binFile(id: string): string {
    return path.join(this.binDir(), `${safeId(id)}.json`);
  }

  async ensureLayout(): Promise<void> {
    await fs.mkdir(this.tasksDir(), { recursive: true });
    await fs.mkdir(this.binDir(), { recursive: true });
  }

  async exists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  /** Names of `.json` files in `dir` (empty when the dir is missing). */
  async listJson(dir: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      return entries.filter((e) => e.isFile() && e.name.endsWith('.json')).map((e) => e.name);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw e;
    }
  }

  async readJson(p: string): Promise<unknown> {
    return JSON.parse(await fs.readFile(p, 'utf8'));
  }

  /** Atomic write: temp file in the same dir, then rename over the target. */
  async writeJson(p: string, value: unknown): Promise<void> {
    await fs.mkdir(path.dirname(p), { recursive: true });
    const tmp = `${p}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await fs.rename(tmp, p);
  }

  async remove(p: string): Promise<void> {
    await fs.rm(p, { force: true });
  }
}

/** Ids become file names — refuse anything that could escape the folder. */
export function safeId(id: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error(`Invalid task id "${id}".`);
  return id;
}
