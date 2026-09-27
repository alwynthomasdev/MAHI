# CLAUDE.md

Guidance for Claude Code in this repository.

## What this is

MAHI is a cross-platform Electron desktop app (Vue 3 renderer) for personal
task tracking, a simplified version of Ptah (`C:\repositories\Ptah`). Every
task is a JSON file on disk (`~/MAHI/tasks/<id>.json` by default). See
`README.md` for features and the on-disk format, and `spec.md` for the
original brief.

## Git, CHANGELOG, releases

All git work goes through the **`git-manager`** subagent
(`.claude/agents/git-manager.md`). Do not commit or edit `CHANGELOG.md` from
the main loop. It never commits, tags or pushes without explicit user approval.
A release = version bump + dated CHANGELOG section + `Release vX.Y.Z` commit +
`vX.Y.Z` tag pushed to GitHub, which triggers `.github/workflows/release.yml`
to draft the GitHub Release and attach installers. Single linear history on `main`.

## Commands

```bash
npm run dev          # Vite dev server; auto-launches Electron with hot reload
npm test             # Vitest, single run
npx vitest run test/core/services.test.ts   # one file
npm run typecheck    # vue-tsc (app) + tsc (node)
npm run lint
npm run build        # typecheck renderer + build renderer/main/preload
npm run dist         # build + electron-builder installer into release/<version>/
npm run icon         # regenerate build/icon.png
```

## Architecture

### Process split

The renderer **never** touches the filesystem or Node. All persistence runs in
the main process. The only channel is the typed `window.mahi` object exposed by
`src/preload/index.ts`.

Data flow: **renderer store → `window.mahi.*` → IPC → `src/main/ipc.ts` →
core service → `TaskRepository` → `FileStore` → disk**.

- `src/shared/ipc.ts` is the contract: `IPC` channel names + the `MahiApi`
  interface. `src/preload/index.ts` and `src/main/ipc.ts` implement it — change
  all three together.
- Every IPC call resolves to a `Result<T>` (`src/shared/result.ts`); the
  renderer's `call()` (`src/renderer/api.ts`) unwraps it into a throw.
- Every mutation broadcasts `tasks:changed` to all windows, so the main window
  refreshes when the Add Task window creates a task.

### Layers

| Dir | Runs in | Rule |
| --- | --- | --- |
| `src/models` | both | `Task.ts` (enums, defaults, `createTask`/`applyPatch`/`normalizeTask`), `Filter.ts` (filter/sort/`isTodayTask`). **No Node imports.** |
| `src/shared` | both | dates, Result, IPC contract. **No Node imports.** |
| `src/storage` | main | `FileStore` (paths + atomic JSON writes), `TaskRepository` (live or bin folder). |
| `src/core` | main | `TaskService`, `RecycleBinService`, `ImportExportService`, wired by `AppContext` per data dir. |
| `src/main`, `src/preload` | main | windows, config, IPC, updater, bridge. |
| `src/renderer` | renderer | Vue 3 + Pinia + vue-router (hash). Stores call `window.mahi`; components use stores. |

Aliases `@models`/`@shared` resolve everywhere; `@main`/`@core`/`@storage` only
main-side and in tests.

### Key mechanics

- **Dates**: `due` is a local calendar date `YYYY-MM-DD` (string compare
  works). Timestamps (`created`/`updated`/`deletedAt`) are ISO.
- **Ids** are UUIDs and double as file names; `safeId` in `FileStore` rejects
  anything path-like.
- **Tolerant reads**: `normalizeTask` falls back to defaults for bad fields;
  unreadable files are skipped and logged, never fatal.
- **Import never overwrites**: clashing ids get a fresh UUID.
- **Changing the data dir** rebuilds `AppContext` in `src/main/ipc.ts`.
- **Add Task window** (`src/main/quickAddWindow.ts`) loads the same bundle at
  `#/quick-add`; `App.vue` renders only that view there.
- **Edit dialog** is rendered once by `App.vue`, driven by `tasks.editing`.
- **Updates**: `src/main/updater.ts` wraps electron-updater with
  `autoDownload` off. The renderer checks on launch; `UpdateDialog.vue` asks
  before downloading, then restarts to install. Checks are no-ops in dev.

### Build specifics

- Main and preload are bundled to **CommonJS** (no `"type": "module"` in
  `package.json`) — importing `electron` from an ESM main bundle crashes.
- `vite.config.ts` main/preload sub-configs each need their own `resolve.alias`.
- Theme: light tokens on `:root`, dark under `:root[data-theme='dark']`
  (`src/renderer/styles/tokens.css`); `public/theme-boot.js` applies the saved
  theme before first paint. `src/main/theme.ts` mirrors `--bg` by hand.

## Tests

Vitest, `node` environment (`test/renderer/**` uses jsdom). Service tests use a
real temp dir via `test/helpers/tmp.ts::makeTmpDir` — prefer that to mocking `fs`.
