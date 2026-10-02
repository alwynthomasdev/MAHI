# MAHI

*Mahi* is te reo Māori for work or task. MAHI is a small, local-first desktop
task tracker (Electron + Vue 3), a simplified sibling of
[Ptah](https://github.com/alwynthomasdev/Ptah).

## Features

- **Today**: tasks due today or overdue that aren't Done or Archived. Change
  priority and status inline, or push a task out with **Postpone** (Tomorrow,
  3 days, next Monday, 1 week, 1 month).
- **List**: everything not archived, with title search, status / priority /
  label filters, and order by due date, priority, title, created or updated.
- **Swimlanes**: Scheduled · WIP · On Hold · Done. Drag cards between lanes;
  Done cards have a one-click **Archive** button.
- **Archive** and **Recycle bin**: deleting is soft, so you can restore,
  delete forever or empty the bin.
- **Add task window**: the **+ Add task** button (top right, or Ctrl+N) opens a
  small always-on-top window. Type a title and press Enter; it stays open for
  the next one. Everything else takes its default (Medium, Scheduled, due today).
- **Effort**: give a task an effort of None (0), Easy (1), Moderate (2) or
  Hard (3). Today and every Calendar day show the total for their open tasks
  against a daily limit (12 by default): green, amber above 70% of the limit,
  red above it. It is a guide to whether a day is overloaded; nothing is blocked.
- **Settings**: light / dark / system theme, daily effort limit, data folder,
  import / export (choose which statuses to export), and **Check for updates**.

Click any task to edit its title, description, priority, status, effort, due date and labels.

## Data on disk

Tasks live in `~/MAHI` by default (change it in Settings):

```
~/MAHI/
  tasks/<id>.json        one file per task
  .recyclebin/<id>.json  deleted tasks (with deletedAt)
```

A task file:

```json
{
  "id": "7c0e6a4e-…",
  "title": "Renew passport",
  "description": "",
  "priority": "Medium",
  "status": "Scheduled",
  "effort": "None",
  "due": "2026-09-27",
  "labels": ["admin"],
  "created": "2026-09-27T09:00:00.000Z",
  "updated": "2026-09-27T09:00:00.000Z"
}
```

Exports are a single file, `{ "app": "MAHI", "version": 1, "exportedAt": "…",
"tasks": [ …task objects… ] }`. Import accepts the same shape (or a bare array
of tasks). Missing or invalid fields fall back to defaults, entries without a
title are skipped, and an id that already exists gets a new id, so importing
never overwrites a task.

## Development

```bash
npm install
npm run dev        # Vite + Electron with hot reload
npm test           # Vitest
npm run typecheck
npm run lint
npm run dist       # installer into release/<version>/
```

## Releases and updates

Pushing a `vX.Y.Z` tag runs `.github/workflows/release.yml`. It creates a
**draft** GitHub Release whose notes are the matching `CHANGELOG.md` section,
then builds Windows (NSIS), macOS (dmg) and Linux (AppImage) installers and
attaches them. Publish the draft to ship it. On launch, and from Settings,
installed copies check GitHub Releases for a newer version and offer to
download and install it. macOS builds are unsigned, so they don't self-update.

In Claude Code, the `git-manager` subagent (`.claude/agents/git-manager.md`)
drafts the release: it picks the version bump, writes the changelog section,
commits, tags and pushes, and asks for approval before each of those steps.
