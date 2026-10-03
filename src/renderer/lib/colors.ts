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

/**
 * Effort chart: one colour per label, handed out in this fixed order (the order
 * keeps neighbouring slices apart for colour-blind readers). Labels beyond
 * these share `OTHER_COLOR`; tasks with no label take `NO_LABEL_COLOR`.
 */
export const LABEL_COLORS = [
  'var(--cat-1)',
  'var(--cat-2)',
  'var(--cat-3)',
  'var(--cat-4)',
  'var(--cat-5)',
  'var(--cat-6)',
];
export const OTHER_COLOR = 'var(--text-dim)';
export const NO_LABEL_COLOR = 'var(--text-faint)';

export const EFFORT_COLOR: Record<Effort, string> = {
  None: 'var(--text-faint)',
  Easy: 'var(--ok)',
  Moderate: 'var(--warn)',
  Hard: 'var(--danger)',
};
