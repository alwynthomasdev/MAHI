import { EFFORT_POINTS, type Task } from './Task';

/**
 * Daily effort load: the effort points of a day's tasks against a configurable
 * limit. A guide, not a restriction — nothing is ever blocked.
 */

export const DEFAULT_EFFORT_LIMIT = 12;
export const MAX_EFFORT_LIMIT = 999;

/** `ok` (green), `warn` (amber: over 70% of the limit), `over` (red: over the limit). */
export type EffortLoad = 'ok' | 'warn' | 'over';

/** A whole number from 1 to `MAX_EFFORT_LIMIT`. */
export function isEffortLimit(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= MAX_EFFORT_LIMIT;
}

export function totalEffort(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + EFFORT_POINTS[t.effort], 0);
}

/**
 * Whether a task adds to its day's load. Done counts — the work was still
 * done that day. On Hold (parked) and Archive do not.
 */
export function countsForEffort(task: Task): boolean {
  return task.status !== 'On Hold' && task.status !== 'Archive';
}

/** Each due date's load (`YYYY-MM-DD` -> points); days with nothing counted are absent. */
export function effortByDue(tasks: Task[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of tasks) {
    if (countsForEffort(t)) map.set(t.due, (map.get(t.due) ?? 0) + EFFORT_POINTS[t.effort]);
  }
  return map;
}

/**
 * Today's load: everything counted that is due today, plus overdue work still
 * to do. Overdue tasks already Done stay on the day they were due.
 */
export function todayEffort(tasks: Task[], today: string): number {
  return totalEffort(
    tasks.filter(
      (t) => countsForEffort(t) && (t.due === today || (t.due < today && t.status !== 'Done')),
    ),
  );
}

export function effortLoad(total: number, limit: number): EffortLoad {
  if (total > limit) return 'over';
  // total > 70% of limit, in whole numbers so 7 of 10 is not tipped over by float error.
  if (total * 10 > limit * 7) return 'warn';
  return 'ok';
}
