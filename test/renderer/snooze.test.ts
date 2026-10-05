import { describe, expect, it } from 'vitest';
import { SNOOZE, snoozeBase } from '../../src/renderer/lib/snooze';

const TODAY = '2026-10-05'; // a Monday

const to = (label: string, base: string) => SNOOZE.find((s) => s.label === label)!.to(base, TODAY);

describe('snooze', () => {
  it('measures from today when the task is on today', () => {
    expect(to('Tomorrow', TODAY)).toBe('2026-10-06');
    expect(to('In 3 days', TODAY)).toBe('2026-10-08');
    expect(to('Next Monday', TODAY)).toBe('2026-10-12');
    expect(to('In 1 week', TODAY)).toBe('2026-10-12');
    expect(to('In 1 month', TODAY)).toBe('2026-11-05');
  });

  it('measures from the day the task is on, not from today', () => {
    expect(to('Tomorrow', '2026-10-08')).toBe('2026-10-09');
    expect(to('In 3 days', '2026-10-30')).toBe('2026-11-02');
    expect(to('Next Monday', '2026-10-08')).toBe('2026-10-12');
    expect(to('In 1 week', '2026-10-08')).toBe('2026-10-15');
    expect(to('In 1 month', '2026-12-08')).toBe('2027-01-08');
  });

  it('Today is absolute', () => {
    expect(to('Today', '2026-10-08')).toBe(TODAY);
    expect(to('Today', TODAY)).toBe(TODAY);
  });

  it('an overdue task moves from today', () => {
    expect(snoozeBase({ due: '2026-09-28' }, TODAY)).toBe(TODAY);
    expect(snoozeBase({ due: TODAY }, TODAY)).toBe(TODAY);
    expect(snoozeBase({ due: '2026-10-08' }, TODAY)).toBe('2026-10-08');
  });
});
