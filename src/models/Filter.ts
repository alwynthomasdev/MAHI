import type { Priority, Status, Task } from './Task';
import { PRIORITY_RANK } from './Task';

/** All fields are ANDed; each multi-select matches any of its values. */
export interface TaskFilter {
  /** Case-insensitive substring match against the title. */
  text?: string;
  statuses?: Status[];
  priorities?: Priority[];
  /** Task must carry at least one of these labels (case-insensitive). */
  labels?: string[];
}

export type SortKey = 'due' | 'priority' | 'title' | 'created' | 'updated';
export type SortDir = 'asc' | 'desc';
export interface TaskSort {
  key: SortKey;
  dir: SortDir;
}

export const SORT_KEYS: { key: SortKey; label: string }[] = [
  { key: 'due', label: 'Due date' },
  { key: 'priority', label: 'Priority' },
  { key: 'title', label: 'Title' },
  { key: 'created', label: 'Created' },
  { key: 'updated', label: 'Updated' },
];

export const DEFAULT_SORT: TaskSort = { key: 'due', dir: 'asc' };

export function matchesFilter(task: Task, filter: TaskFilter): boolean {
  const text = filter.text?.trim().toLowerCase();
  if (text && !task.title.toLowerCase().includes(text)) return false;
  if (filter.statuses?.length && !filter.statuses.includes(task.status)) return false;
  if (filter.priorities?.length && !filter.priorities.includes(task.priority)) return false;
  if (filter.labels?.length) {
    const have = new Set(task.labels.map((l) => l.toLowerCase()));
    if (!filter.labels.some((l) => have.has(l.toLowerCase()))) return false;
  }
  return true;
}

function compare(a: Task, b: Task, key: SortKey): number {
  switch (key) {
    case 'priority':
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    case 'title':
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    case 'due':
      return a.due.localeCompare(b.due);
    case 'created':
      return a.created.localeCompare(b.created);
    case 'updated':
      return a.updated.localeCompare(b.updated);
  }
}

/**
 * Sorted copy. Ties fall back to priority (highest first), then due date,
 * then created, so equal keys still come out in a predictable order.
 */
export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  const f = sort.dir === 'asc' ? 1 : -1;
  return [...tasks].sort(
    (a, b) =>
      compare(a, b, sort.key) * f ||
      compare(b, a, 'priority') ||
      compare(a, b, 'due') ||
      compare(a, b, 'created'),
  );
}

export function filterAndSort(tasks: Task[], filter: TaskFilter, sort: TaskSort): Task[] {
  return sortTasks(
    tasks.filter((t) => matchesFilter(t, filter)),
    sort,
  );
}

/** Still to do: not Done / Archive. */
export function isOpenTask(task: Task): boolean {
  return task.status !== 'Done' && task.status !== 'Archive';
}

/** Today view: due today or earlier, and not Done / Archive. */
export function isTodayTask(task: Task, today: string): boolean {
  return task.due <= today && isOpenTask(task);
}

/** Tasks bucketed by due date (`YYYY-MM-DD`), input order kept within a day. */
export function groupByDue(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    const day = map.get(t.due);
    if (day) day.push(t);
    else map.set(t.due, [t]);
  }
  return map;
}

/** Every distinct label across tasks (case-insensitive de-dupe), sorted. */
export function allLabels(tasks: Task[]): string[] {
  const map = new Map<string, string>();
  for (const t of tasks) {
    for (const l of t.labels) if (!map.has(l.toLowerCase())) map.set(l.toLowerCase(), l);
  }
  return [...map.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}
