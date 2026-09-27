/**
 * Date-only helpers. Due dates are stored as local calendar dates in
 * `YYYY-MM-DD` form, so "today" means the user's local day and plain string
 * comparison orders them correctly.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Format a Date as a local `YYYY-MM-DD`. */
export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse `YYYY-MM-DD` as a local-midnight Date. Throws on bad input. */
export function parseDate(value: string): Date {
  if (!DATE_RE.test(value)) throw new Error(`Invalid date: "${value}".`);
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getMonth() !== m - 1 || date.getDate() !== d) {
    throw new Error(`Invalid date: "${value}".`);
  }
  return date;
}

export function isDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    parseDate(value);
    return true;
  } catch {
    return false;
  }
}

export function todayDate(now: Date = new Date()): string {
  return toDateString(now);
}

/** Shift a `YYYY-MM-DD` by whole days and/or months (months first; JS overflow rules). */
export function addToDate(
  value: string,
  { days = 0, months = 0 }: { days?: number; months?: number },
): string {
  const d = parseDate(value);
  if (months) d.setMonth(d.getMonth() + months);
  if (days) d.setDate(d.getDate() + days);
  return toDateString(d);
}

/** The next Monday strictly after today (on a Monday, returns the following Monday). */
export function nextMonday(now: Date = new Date()): string {
  const delta = (1 - now.getDay() + 7) % 7 || 7;
  return addToDate(todayDate(now), { days: delta });
}

/** Whole days from today to `value` (negative = in the past). */
export function daysUntil(value: string, now: Date = new Date()): number {
  const to = parseDate(value);
  const from = parseDate(todayDate(now));
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export type DueTone = 'normal' | 'soon' | 'today' | 'overdue';

/** "Today", "Tomorrow", "In 3 days", "2 days overdue", or a short absolute date. */
export function formatDue(value: string, now: Date = new Date()): { text: string; tone: DueTone } {
  let diff: number;
  try {
    diff = daysUntil(value, now);
  } catch {
    return { text: value, tone: 'normal' };
  }
  const tone: DueTone = diff < 0 ? 'overdue' : diff === 0 ? 'today' : diff <= 3 ? 'soon' : 'normal';
  let text: string;
  if (diff === 0) text = 'Today';
  else if (diff === 1) text = 'Tomorrow';
  else if (diff === -1) text = 'Yesterday';
  else if (diff > 1 && diff <= 14) text = `In ${diff} days`;
  else if (diff < -1 && diff >= -14) text = `${-diff} days overdue`;
  else {
    text = parseDate(value).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return { text, tone };
}
