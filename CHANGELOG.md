# Changelog

All notable changes to MAHI are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.2.0] - 2026-09-30

A new Calendar tab for seeing what's due and when.

### Added

- A Calendar tab (between Swimlanes and Archive) with Month, Week and Day
  views. Month is the default. It shows only open tasks, so Done and Archive
  are left out.
- Month view: a Monday-first grid with a task count on each day. Past days
  that still have open tasks are shown in red. Click a day to open it.
- Week view: a lane for each day, with swimlane-style cards where you can set
  priority and status inline. Drag a card to another day to change its due
  date.
- Day view: a Today-style task list with Postpone. When the day is today,
  overdue tasks are listed separately below.
- Prev / Today / Next navigation. The chosen view and date are kept when you
  switch tabs.

## [1.1.0] - 2026-09-28

### Added

- An "All / Today & overdue" toggle in the Swimlane header. Today & overdue
  narrows every lane to tasks due today or earlier. The board opens on All
  each time the app starts.

## [1.0.2] - 2026-09-27

### Added

- An Intel (x64) macOS installer alongside the Apple Silicon one.

### Fixed

- Releases no longer include the stray `builder-debug.yml` file.

## [1.0.1] - 2026-09-27

### Changed

- The On Hold swimlane now runs full width along the bottom of the board, with
  Scheduled, WIP and Done side by side above it.

## [1.0.0] - 2026-09-27

The first release of MAHI (te reo Māori for work or task): a simple,
local-first desktop task tracker and a slimmed-down sibling of Ptah. Every
task is a plain JSON file on your disk. There are no accounts and no cloud
service.

### Added

- Tasks with a required title, optional description, priority (Lowest–Highest,
  default Medium), status (Scheduled, WIP, On Hold, Done, Archive; default
  Scheduled), due date (default today) and labels.
- Today view of tasks due today or overdue, with a quick Postpone menu
  (Tomorrow, 3 days, next Monday, 1 week, 1 month).
- List view of every task that isn't archived, with title search, status /
  priority / label filters and order-by.
- Swimlane board (Scheduled, WIP, On Hold, Done) with drag and drop and a quick
  Archive button on Done tasks.
- Archive view and a recycle bin with restore, delete-forever and empty.
- Always-on-top Add Task window (top-right button or Ctrl+N) that stays open
  for the next task.
- Tasks stored as individual JSON files in `~/MAHI`, changeable in Settings.
- Import and export of tasks as JSON, choosing which statuses to export.
- Light, dark and system themes.
- Update check on launch and in Settings, with download and install from
  GitHub Releases.
