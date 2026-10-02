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

export function effortLoad(total: number, limit: number): EffortLoad {
  if (total > limit) return 'over';
  // total > 70% of limit, in whole numbers so 7 of 10 is not tipped over by float error.
  if (total * 10 > limit * 7) return 'warn';
  return 'ok';
}
