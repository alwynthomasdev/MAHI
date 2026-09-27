import path from 'node:path';
import { app, BrowserWindow, nativeTheme, screen } from 'electron';
import { BG_DARK, BG_LIGHT } from './theme';

// dist-electron/main -> project root (or app.asar root when packaged)
const ROOT = path.join(__dirname, '../..');
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// Content-box size, tuned to the quick-add form. `useContentSize` keeps it
// honest regardless of the OS frame.
const WIDTH = 400;
const HEIGHT = 150;
const MARGIN = 16;

/**
 * The Add Task window is a singleton: a small always-on-top window parked in
 * the bottom-right corner. It loads the same renderer bundle at `#/quick-add`
 * and stays open after each add until the user closes it.
 */
let win: BrowserWindow | null = null;

function bottomRight(): { x: number; y: number } {
  const { workArea } = screen.getPrimaryDisplay();
  return {
    x: workArea.x + workArea.width - WIDTH - MARGIN,
    y: workArea.y + workArea.height - HEIGHT - MARGIN,
  };
}

/** Open the Add Task window, or focus it if it is already open. */
export function openQuickAddWindow(): void {
  if (win && !win.isDestroyed()) {
    win.show();
    win.focus();
    return;
  }

  const { x, y } = bottomRight();
  win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    x,
    y,
    useContentSize: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    title: 'Add task',
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? BG_DARK : BG_LIGHT,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.setAlwaysOnTop(true, 'floating');
  win.once('ready-to-show', () => win?.show());
  win.on('closed', () => {
    win = null;
  });

  if (!app.isPackaged && DEV_SERVER_URL) {
    void win.loadURL(new URL('#/quick-add', DEV_SERVER_URL).toString());
  } else {
    void win.loadFile(path.join(ROOT, 'dist/index.html'), { hash: '/quick-add' });
  }
}

export function closeQuickAddWindow(): void {
  win?.close();
}
