import { defineStore } from 'pinia';
import type { AppConfig, Theme } from '@shared/ipc';
import { call, mahi } from '../api';

/** localStorage key the pre-paint boot script (public/theme-boot.js) reads. */
const THEME_KEY = 'mahi-theme';

/** Resolve a theme choice to a concrete `light`/`dark`. Kept in sync with theme-boot.js. */
export function resolveTheme(theme: Theme, prefersDark: boolean): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') return theme;
  return prefersDark ? 'dark' : 'light';
}

function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', resolveTheme(theme, prefersDark()));
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage disabled — the boot script falls back to matchMedia */
  }
}

// Re-resolve when the OS theme flips and we're on `system`.
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const s = useSettingsStore();
    if (s.theme === 'system') applyTheme('system');
  });
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    dataDir: '',
    theme: 'system' as Theme,
    loaded: false,
  }),
  actions: {
    apply(cfg: AppConfig) {
      this.dataDir = cfg.dataDir;
      this.theme = cfg.theme;
      this.loaded = true;
      applyTheme(this.theme);
    },
    async load() {
      this.apply(await call(mahi.config.get()));
    },
    async setTheme(theme: Theme) {
      this.apply(await call(mahi.config.setTheme(theme)));
    },
    /** Resolves true when the folder changed. */
    async pickDataDir(): Promise<boolean> {
      const cfg = await call(mahi.config.pickDataDir());
      if (cfg) this.apply(cfg);
      return cfg !== null;
    },
    async resetDataDir() {
      this.apply(await call(mahi.config.resetDataDir()));
    },
  },
});
