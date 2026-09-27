import { promises as fs } from 'node:fs';
import { app, BrowserWindow, dialog, ipcMain, nativeTheme, shell } from 'electron';
import { AppContext } from '@core/AppContext';
import { isStatus, type NewTaskInput, type Status, type TaskPatch } from '@models/Task';
import { todayDate } from '@shared/dates';
import { IPC, type AppConfig, type Theme } from '@shared/ipc';
import { tryResult } from '@shared/result';
import { defaultDataDir, saveConfig } from './config';
import { closeQuickAddWindow, openQuickAddWindow } from './quickAddWindow';
import { checkForUpdate, downloadUpdate, installUpdate } from './updater';

/**
 * Registers every IPC handler once. `context` is reassigned when the data
 * directory changes; handlers close over the binding, not the instance.
 */
let config: AppConfig;
let context: AppContext;

/** Tell every window (main + Add Task popup) that tasks changed on disk. */
function broadcastChanged(): void {
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send(IPC.tasksChanged);
}

/** Run a mutation, then broadcast. */
async function mutate<T>(fn: () => Promise<T>): Promise<T> {
  const out = await fn();
  broadcastChanged();
  return out;
}

async function switchDataDir(dir: string): Promise<AppConfig> {
  const next = await AppContext.open(dir);
  context = next;
  config = await saveConfig({ ...config, dataDir: dir });
  broadcastChanged();
  return config;
}

function focusedWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
}

export async function registerIpc(initial: AppConfig): Promise<void> {
  config = initial;
  context = await AppContext.open(config.dataDir);

  // --- config ---------------------------------------------------------------
  ipcMain.handle(IPC.configGet, () => tryResult(() => config));
  ipcMain.handle(IPC.configSetTheme, (_e, theme: Theme) =>
    tryResult(async () => {
      if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
        throw new Error(`Invalid theme "${theme}".`);
      }
      nativeTheme.themeSource = theme;
      config = await saveConfig({ ...config, theme });
      return config;
    }),
  );
  ipcMain.handle(IPC.configPickDataDir, () =>
    tryResult(async () => {
      const win = focusedWindow();
      const opts: Electron.OpenDialogOptions = {
        title: 'Choose MAHI data folder',
        defaultPath: config.dataDir,
        properties: ['openDirectory', 'createDirectory'],
      };
      const res = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
      if (res.canceled || !res.filePaths[0]) return null;
      return switchDataDir(res.filePaths[0]);
    }),
  );
  ipcMain.handle(IPC.configResetDataDir, () => tryResult(() => switchDataDir(defaultDataDir())));
  ipcMain.handle(IPC.configOpenDataDir, () =>
    tryResult(async () => {
      const error = await shell.openPath(config.dataDir);
      if (error) throw new Error(error);
    }),
  );

  // --- tasks ----------------------------------------------------------------
  ipcMain.handle(IPC.tasksList, () => tryResult(() => context.tasks.list()));
  ipcMain.handle(IPC.tasksCreate, (_e, input: NewTaskInput) =>
    tryResult(() => mutate(() => context.tasks.create(input))),
  );
  ipcMain.handle(IPC.tasksUpdate, (_e, id: string, patch: TaskPatch) =>
    tryResult(() => mutate(() => context.tasks.update(id, patch))),
  );
  ipcMain.handle(IPC.tasksDelete, (_e, id: string) =>
    tryResult(() => mutate(() => context.tasks.delete(id))),
  );

  // --- recycle bin ----------------------------------------------------------
  ipcMain.handle(IPC.binList, () => tryResult(() => context.bin.list()));
  ipcMain.handle(IPC.binRestore, (_e, id: string) =>
    tryResult(() => mutate(() => context.bin.restore(id))),
  );
  ipcMain.handle(IPC.binPurge, (_e, id: string) =>
    tryResult(() => mutate(() => context.bin.purge(id))),
  );
  ipcMain.handle(IPC.binEmpty, () => tryResult(() => mutate(() => context.bin.empty())));

  // --- import / export ------------------------------------------------------
  ipcMain.handle(IPC.ioExport, (_e, statuses: Status[]) =>
    tryResult(async () => {
      const wanted = (Array.isArray(statuses) ? statuses : []).filter(isStatus);
      const doc = await context.io.buildExport(wanted);
      const win = focusedWindow();
      const opts: Electron.SaveDialogOptions = {
        title: 'Export tasks',
        defaultPath: `mahi-export-${todayDate()}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      };
      const res = win ? await dialog.showSaveDialog(win, opts) : await dialog.showSaveDialog(opts);
      if (res.canceled || !res.filePath) return null;
      await fs.writeFile(res.filePath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
      return doc.tasks.length;
    }),
  );
  ipcMain.handle(IPC.ioImport, () =>
    tryResult(async () => {
      const win = focusedWindow();
      const opts: Electron.OpenDialogOptions = {
        title: 'Import tasks',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile'],
      };
      const res = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
      if (res.canceled || !res.filePaths[0]) return null;
      let data: unknown;
      try {
        data = JSON.parse(await fs.readFile(res.filePaths[0], 'utf8'));
      } catch {
        throw new Error('That file is not valid JSON.');
      }
      return mutate(() => context.io.importData(data));
    }),
  );

  // --- updates / app / windows ---------------------------------------------
  ipcMain.handle(IPC.updatesCheck, async () => {
    if (!app.isPackaged) return { ok: true, value: null };
    return checkForUpdate();
  });
  ipcMain.handle(IPC.updatesDownload, () => downloadUpdate());
  ipcMain.handle(IPC.updatesInstall, () => tryResult(() => installUpdate()));
  ipcMain.handle(IPC.appVersion, () => tryResult(() => app.getVersion()));
  ipcMain.handle(IPC.windowOpenQuickAdd, () => tryResult(() => openQuickAddWindow()));
  ipcMain.handle(IPC.windowCloseQuickAdd, () => tryResult(() => closeQuickAddWindow()));
}
