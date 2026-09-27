import { describe, expect, it } from 'vitest';
import { applyPatch, createTask, normalizeLabels, normalizeTask } from '@models/Task';

const NOW = new Date(2026, 8, 27, 10, 0, 0); // 27 Sep 2026, local

describe('createTask', () => {
  it('applies defaults: Medium, Scheduled, due today', () => {
    const t = createTask({ title: '  Buy milk ' }, 'abc', NOW);
    expect(t).toMatchObject({
      id: 'abc',
      title: 'Buy milk',
      description: '',
      priority: 'Medium',
      status: 'Scheduled',
      due: '2026-09-27',
      labels: [],
    });
    expect(t.created).toBe(t.updated);
  });

  it('requires a title', () => {
    expect(() => createTask({ title: '   ' }, 'x', NOW)).toThrow(/Title is required/);
  });
});

describe('applyPatch', () => {
  const base = createTask({ title: 'A' }, 'a', NOW);

  it('validates enums and dates', () => {
    expect(() => applyPatch(base, { priority: 'Urgent' as never })).toThrow(/priority/);
    expect(() => applyPatch(base, { status: 'Nope' as never })).toThrow(/status/);
    expect(() => applyPatch(base, { due: '2026-02-30' })).toThrow(/due/);
  });

  it('stamps updated and normalizes labels', () => {
    const later = new Date(2026, 8, 28);
    const t = applyPatch(base, { labels: [' work', 'Work', 'home', ''] }, later);
    expect(t.labels).toEqual(['work', 'home']);
    expect(t.updated).toBe(later.toISOString());
    expect(t.created).toBe(base.created);
  });
});

describe('normalizeTask', () => {
  it('falls back to defaults on bad values', () => {
    const t = normalizeTask({ title: 'X', priority: 'bogus', status: 7, due: 'soon' }, 'fb', NOW);
    expect(t).toMatchObject({
      id: 'fb',
      priority: 'Medium',
      status: 'Scheduled',
      due: '2026-09-27',
    });
  });

  it('keeps a valid id and deletedAt', () => {
    const t = normalizeTask({ id: 'keep', title: 'X', deletedAt: NOW.toISOString() }, 'fb', NOW);
    expect(t.id).toBe('keep');
    expect(t.deletedAt).toBe(NOW.toISOString());
  });

  it('rejects entries without a title', () => {
    expect(() => normalizeTask({ priority: 'High' }, 'x')).toThrow();
    expect(() => normalizeTask(null, 'x')).toThrow();
  });
});

describe('normalizeLabels', () => {
  it('ignores non-strings', () => {
    expect(normalizeLabels(['a', 1, null, 'A', 'b'])).toEqual(['a', 'b']);
    expect(normalizeLabels('a')).toEqual([]);
  });
});
