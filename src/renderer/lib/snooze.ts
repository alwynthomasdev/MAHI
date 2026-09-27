import { addToDate, nextMonday, todayDate } from '@shared/dates';

/**
 * Quick postpone presets for the Today view. Each resolves lazily (on click)
 * and is measured from today, not the current due date.
 */
export const SNOOZE: { label: string; to: () => string }[] = [
  { label: 'Tomorrow', to: () => addToDate(todayDate(), { days: 1 }) },
  { label: 'In 3 days', to: () => addToDate(todayDate(), { days: 3 }) },
  { label: 'Next Monday', to: () => nextMonday() },
  { label: 'In 1 week', to: () => addToDate(todayDate(), { days: 7 }) },
  { label: 'In 1 month', to: () => addToDate(todayDate(), { months: 1 }) },
];
