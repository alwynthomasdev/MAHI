import path from 'node:path';
import { app, BrowserWindow, nativeTheme } from 'electron';
import { loadConfig } from './config';
import { registerIpc } from './ipc';
import { closeQuickAddWindow } from './quickAddWindow';
import { BG_DARK, BG_LIGHT } from './theme';

// Bundled to CommonJS, so `__dirname` is available natively.
// dist-electron/main -> project root (or app.asar root when packaged)
const ROOT = path.join(__dirname, '../..');
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 820,
    minHeight: 560,
    title: 'MAHI',
    backgroundColor: nativeTheme.shouldUseDarkColors ? BG_DARK : BG_LIGHT,
    icon: app.isPackaged
      ? path.join(process.resourcesPath, 'icon.png')
      : path.join(ROOT, 'build/icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  mainWindow = win;

  // The Add Task window is an accessory (skipTaskbar) — never let it outlive the main window.
  win.on('closed', () => {
    mainWindow = null;
    closeQuickAddWindow();
  });

  if (!app.isPackaged && DEV_SERVER_URL) {
    void win.loadURL(DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    void win.loadFile(path.join(ROOT, 'dist/index.html'));
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    const config = await loadConfig();
    nativeTheme.themeSource = config.theme;
    await registerIpc(config);
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
