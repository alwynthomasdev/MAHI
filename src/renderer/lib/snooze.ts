import type { Task } from '@models/Task';
import { addToDate, nextMonday, parseDate } from '@shared/dates';

/**
 * Quick postpone presets. "Today" is absolute; every other preset is measured
 * from the day the task is being moved from (`base`), not from today — so a
 * task on Thursday postponed by a day lands on Friday. `label` reads right
 * when moving from today, `laterLabel` from any other day.
 */
export interface Snooze {
  label: string;
  laterLabel: string;
  to: (base: string, today: string) => string;
}

export const SNOOZE: Snooze[] = [
  { label: 'Today', laterLabel: 'Today', to: (_base, today) => today },
  { label: 'Tomorrow', laterLabel: 'Next day', to: (base) => addToDate(base, { days: 1 }) },
  { label: 'In 3 days', laterLabel: '3 days later', to: (base) => addToDate(base, { days: 3 }) },
  {
    label: 'Next Monday',
    laterLabel: 'Following Monday',
    to: (base) => nextMonday(parseDate(base)),
  },
  { label: 'In 1 week', laterLabel: '1 week later', to: (base) => addToDate(base, { days: 7 }) },
  {
    label: 'In 1 month',
    laterLabel: '1 month later',
    to: (base) => addToDate(base, { months: 1 }),
  },
];

/** The day a task is moved from: its due date, or today when it is overdue. */
export function snoozeBase(task: Pick<Task, 'due'>, today: string): string {
  return task.due < today ? today : task.due;
}
