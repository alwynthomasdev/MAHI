import { describe, expect, it } from 'vitest';
import {
  effortByDue,
  effortLoad,
  isEffortLimit,
  todayEffort,
  totalEffort,
} from '@models/Effort';
import { createTask, type Effort, type Status } from '@models/Task';

const task = (effort?: Effort) => createTask({ title: 'T', effort }, 'id');

describe('totalEffort', () => {
  it('sums None 0, Easy 1, Moderate 2, Hard 3', () => {
    expect(totalEffort([])).toBe(0);
    expect(totalEffort([task(), task('None'), task('Easy'), task('Moderate'), task('Hard')])).toBe(
      6,
    );
  });
});

describe('which tasks count', () => {
  const on = (due: string, status: Status, effort: Effort = 'Hard') =>
    createTask({ title: 'T', due, status, effort }, 'id');

  it('counts Done but not On Hold or Archive', () => {
    const byDue = effortByDue([
      on('2026-10-02', 'Scheduled', 'Easy'),
      on('2026-10-02', 'WIP', 'Moderate'),
      on('2026-10-02', 'Done'),
      on('2026-10-02', 'On Hold'),
      on('2026-10-02', 'Archive'),
      on('2026-10-03', 'On Hold'),
    ]);
    expect(byDue.get('2026-10-02')).toBe(6);
    expect(byDue.has('2026-10-03')).toBe(false);
  });

  it('adds overdue work still to do to today, but not overdue Done or On Hold', () => {
    const tasks = [
      on('2026-10-02', 'Scheduled', 'Easy'),
      on('2026-10-02', 'Done', 'Moderate'),
      on('2026-10-02', 'On Hold'),
      on('2026-10-01', 'WIP'),
      on('2026-10-01', 'Done'),
      on('2026-10-01', 'On Hold'),
      on('2026-10-03', 'Scheduled'),
    ];
    expect(todayEffort(tasks, '2026-10-02')).toBe(6);
  });
});

describe('effortLoad', () => {
  it('is amber over 70% of the limit and red over the limit', () => {
    // 70% of 12 is 8.4
    expect(effortLoad(0, 12)).toBe('ok');
    expect(effortLoad(8, 12)).toBe('ok');
    expect(effortLoad(9, 12)).toBe('warn');
    expect(effortLoad(12, 12)).toBe('warn');
    expect(effortLoad(13, 12)).toBe('over');
  });

  it('treats exactly 70% as ok', () => {
    expect(effortLoad(7, 10)).toBe('ok');
    expect(effortLoad(8, 10)).toBe('warn');
    expect(effortLoad(77, 110)).toBe('ok');
  });
});

describe('isEffortLimit', () => {
  it('accepts whole numbers from 1 to 999 only', () => {
    expect(isEffortLimit(1)).toBe(true);
    expect(isEffortLimit(12)).toBe(true);
    expect(isEffortLimit(999)).toBe(true);
    expect(isEffortLimit(0)).toBe(false);
    expect(isEffortLimit(1000)).toBe(false);
    expect(isEffortLimit(2.5)).toBe(false);
    expect(isEffortLimit('12')).toBe(false);
    expect(isEffortLimit(NaN)).toBe(false);
  });
});
