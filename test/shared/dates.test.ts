import { describe, expect, it } from 'vitest';
import { addToDate, daysUntil, formatDue, isDateString, nextMonday } from '@shared/dates';

describe('dates', () => {
  it('validates YYYY-MM-DD strictly', () => {
    expect(isDateString('2026-09-27')).toBe(true);
    expect(isDateString('2026-02-29')).toBe(false);
    expect(isDateString('2026-9-27')).toBe(false);
    expect(isDateString(undefined)).toBe(false);
  });

  it('adds days across month and year boundaries', () => {
    expect(addToDate('2026-12-30', { days: 3 })).toBe('2027-01-02');
    expect(addToDate('2026-09-27', { months: 1 })).toBe('2026-10-27');
  });

  it('nextMonday is strictly in the future', () => {
    expect(nextMonday(new Date(2026, 8, 27))).toBe('2026-09-28'); // Sunday -> Monday
    expect(nextMonday(new Date(2026, 8, 28))).toBe('2026-10-05'); // Monday -> next Monday
    expect(nextMonday(new Date(2026, 8, 30))).toBe('2026-10-05'); // Wednesday
  });

  it('formats relative due dates', () => {
    const now = new Date(2026, 8, 27, 23, 30);
    expect(daysUntil('2026-09-28', now)).toBe(1);
    expect(formatDue('2026-09-27', now)).toEqual({ text: 'Today', tone: 'today' });
    expect(formatDue('2026-09-28', now)).toEqual({ text: 'Tomorrow', tone: 'soon' });
    expect(formatDue('2026-09-24', now)).toEqual({ text: '3 days overdue', tone: 'overdue' });
  });
});
