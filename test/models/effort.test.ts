import { describe, expect, it } from 'vitest';
import { effortLoad, isEffortLimit, totalEffort } from '@models/Effort';
import { createTask, type Effort } from '@models/Task';

const task = (effort?: Effort) => createTask({ title: 'T', effort }, 'id');

describe('totalEffort', () => {
  it('sums None 0, Easy 1, Moderate 2, Hard 3', () => {
    expect(totalEffort([])).toBe(0);
    expect(totalEffort([task(), task('None'), task('Easy'), task('Moderate'), task('Hard')])).toBe(
      6,
    );
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
