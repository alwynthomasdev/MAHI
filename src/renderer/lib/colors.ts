import type { Effort, Priority, Status } from '@models/Task';

export const STATUS_COLOR: Record<Status, string> = {
  Scheduled: 'var(--scheduled)',
  WIP: 'var(--wip)',
  'On Hold': 'var(--onhold)',
  Done: 'var(--done)',
  Archive: 'var(--archive)',
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  Lowest: 'var(--p-lowest)',
  Low: 'var(--p-low)',
  Medium: 'var(--p-medium)',
  High: 'var(--p-high)',
  Highest: 'var(--p-highest)',
};

export const EFFORT_COLOR: Record<Effort, string> = {
  None: 'var(--text-faint)',
  Easy: 'var(--ok)',
  Moderate: 'var(--warn)',
  Hard: 'var(--danger)',
};
