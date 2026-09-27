# Changelog

All notable changes to MAHI are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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
