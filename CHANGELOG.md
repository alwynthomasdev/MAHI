# Changelog

All notable changes to MAHI are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- The Calendar now only looks forward. Overdue tasks fall into today in the
  Month, Week and Day views, and today's count and effort include them.
- Month view: days before today are dimmed, show no task count or effort, and
  can no longer be opened.
- Week view: lanes before today are dimmed and empty, their headers no longer
  open the day, and tasks cannot be dragged onto them.
- Day view: today's list includes overdue tasks as ordinary rows.
- The Previous button is disabled once the month, week or day on show contains
  today, and the selected date moves forward to today when it would otherwise
  be in the past, including when the day rolls over at midnight.

### Removed

- The separate "Overdue" list and the "N overdue" note in the Calendar Day
  view. Overdue tasks are now part of today's list.

## [1.3.1] - 2026-10-02

Effort on the Swimlanes board, and a change to which tasks count towards a
day's effort.

### Added

- The Swimlane header shows today's effort against the daily limit when the
  board is on "Today & overdue": green, amber above 70% of the limit, and red
  above the limit. It is hidden on "All".
- An inline effort pill on each swimlane card, next to priority, so effort can
  be seen and changed on the board.

### Changed

- Which tasks count towards a day's effort: Scheduled, WIP and Done count; On
  Hold and Archive do not. Previously only open tasks (Scheduled, WIP and On
  Hold) counted. This applies to Today, the Calendar Month, Week and Day
  views, and Swimlanes.
- Today's total is everything counted that is due today, Done included, plus
  overdue work still to do. Overdue tasks that are already Done stay on the
  day they were due.

## [1.3.0] - 2026-10-02

Effort levels for tasks, and a daily effort limit that shows when a day is
overloaded.

### Added

- An effort for each task: None (0), Easy (1), Moderate (2) or Hard (3). New
  tasks start at None, and existing tasks read as None.
- Set a task's effort in the edit dialog, inline in the task table (Today,
  List, Archive and Calendar Day) or on Calendar Week cards.
- A daily effort limit in Settings (12 by default, any whole number from 1 to
  999).
- Today and the Calendar Month, Week and Day views show each day's total
  effort against the limit: green, amber above 70% of the limit, and red above
  the limit. Only open tasks count. Today includes overdue tasks; a Calendar
  day counts only the tasks due on that date. It is a guide only, so nothing
  is blocked.

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
