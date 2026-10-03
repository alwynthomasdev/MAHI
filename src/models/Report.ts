import { isOpenTask } from './Filter';
import { EFFORT_POINTS, type Task } from './Task';

/**
 * Where effort goes, by label. Only tasks with an effort count. A task with
 * several labels adds its full effort to each, so the rows can add up to more
 * than `total`; a task with no label lands in the unlabelled row.
 */

export type ReportScope = 'done' | 'planned';

export interface LabelEffort {
  /** The label as first spelled; `''` for the unlabelled row. */
  label: string;
  points: number;
  tasks: number;
}

export interface EffortReport {
  /** Most effort first, the unlabelled row last. */
  rows: LabelEffort[];
  /** Real effort: each task counted once. */
  total: number;
  /** Tasks with an effort. */
  taskCount: number;
}

/** Done = Done / Archive; planned = everything still open (On Hold included). */
export function inScope(task: Task, scope: ReportScope): boolean {
  return isOpenTask(task) === (scope === 'planned');
}

/** Labels match case-insensitively, as everywhere else. */
export function labelKey(label: string): string {
  return label.toLowerCase();
}

export function effortByLabel(tasks: Task[]): EffortReport {
  const rows = new Map<string, LabelEffort>();
  let total = 0;
  let taskCount = 0;
  for (const t of tasks) {
    const points = EFFORT_POINTS[t.effort];
    if (!points) continue;
    total += points;
    taskCount++;
    for (const label of t.labels.length ? t.labels : ['']) {
      const key = labelKey(label);
      const row = rows.get(key);
      if (row) {
        row.points += points;
        row.tasks++;
      } else rows.set(key, { label, points, tasks: 1 });
    }
  }
  return {
    rows: [...rows.values()].sort(
      (a, b) =>
        Number(!a.label) - Number(!b.label) ||
        b.points - a.points ||
        a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
    ),
    total,
    taskCount,
  };
}
