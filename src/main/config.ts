import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { app } from 'electron';
import type { AppConfig } from '@shared/ipc';

/**
 * Reads/writes `userData/config.json`: the data directory and theme. Tasks
 * themselves live in the data directory.
 */

export function configPath(): string {
  return path.join(app.getPath('userData'), 'config.json');
}

export function defaultDataDir(): string {
  return path.join(os.homedir(), 'MAHI');
}

export function defaultConfig(): AppConfig {
  return { dataDir: defaultDataDir(), theme: 'system' };
}

export function parseConfig(raw: unknown): AppConfig {
  const base = defaultConfig();
  const p = (raw && typeof raw === 'object' ? raw : {}) as Partial<AppConfig>;
  return {
    dataDir: typeof p.dataDir === 'string' && p.dataDir ? p.dataDir : base.dataDir,
    theme: p.theme === 'light' || p.theme === 'dark' || p.theme === 'system' ? p.theme : base.theme,
  };
}

export async function loadConfig(): Promise<AppConfig> {
  try {
    return parseConfig(JSON.parse(await fs.readFile(configPath(), 'utf8')));
  } catch {
    return defaultConfig();
  }
}

export async function saveConfig(config: AppConfig): Promise<AppConfig> {
  await fs.mkdir(path.dirname(configPath()), { recursive: true });
  await fs.writeFile(configPath(), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return config;
}
