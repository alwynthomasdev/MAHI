import { contextBridge, ipcRenderer } from 'electron';
import { IPC, type MahiApi } from '@shared/ipc';

/**
 * The only bridge between renderer and main. Exposes a typed `window.mahi`;
 * the renderer never sees `ipcRenderer` or Node APIs directly.
 */
const api: MahiApi = {
  config: {
    get: () => ipcRenderer.invoke(IPC.configGet),
    setTheme: (theme) => ipcRenderer.invoke(IPC.configSetTheme, theme),
    pickDataDir: () => ipcRenderer.invoke(IPC.configPickDataDir),
    resetDataDir: () => ipcRenderer.invoke(IPC.configResetDataDir),
    openDataDir: () => ipcRenderer.invoke(IPC.configOpenDataDir),
  },
  tasks: {
    list: () => ipcRenderer.invoke(IPC.tasksList),
    create: (input) => ipcRenderer.invoke(IPC.tasksCreate, input),
    update: (id, patch) => ipcRenderer.invoke(IPC.tasksUpdate, id, patch),
    delete: (id) => ipcRenderer.invoke(IPC.tasksDelete, id),
  },
  bin: {
    list: () => ipcRenderer.invoke(IPC.binList),
    restore: (id) => ipcRenderer.invoke(IPC.binRestore, id),
    purge: (id) => ipcRenderer.invoke(IPC.binPurge, id),
    empty: () => ipcRenderer.invoke(IPC.binEmpty),
  },
  io: {
    export: (statuses) => ipcRenderer.invoke(IPC.ioExport, statuses),
    import: () => ipcRenderer.invoke(IPC.ioImport),
  },
  updates: {
    check: () => ipcRenderer.invoke(IPC.updatesCheck),
    download: () => ipcRenderer.invoke(IPC.updatesDownload),
    install: () => ipcRenderer.invoke(IPC.updatesInstall),
  },
  app: {
    version: () => ipcRenderer.invoke(IPC.appVersion),
  },
  window: {
    openQuickAdd: () => ipcRenderer.invoke(IPC.windowOpenQuickAdd),
    closeQuickAdd: () => ipcRenderer.invoke(IPC.windowCloseQuickAdd),
  },
  events: {
    onTasksChanged: (listener) => {
      const wrapped = () => listener();
      ipcRenderer.on(IPC.tasksChanged, wrapped);
      return () => ipcRenderer.removeListener(IPC.tasksChanged, wrapped);
    },
  },
};

contextBridge.exposeInMainWorld('mahi', api);
