import { describe, expect, it } from 'vitest';
import { effortByLabel, inScope } from '@models/Report';
import { createTask, type Task } from '@models/Task';

function task(id: string, over: Partial<Task>): Task {
  return { ...createTask({ title: id }, id, new Date(2026, 0, 1)), ...over };
}

describe('effortByLabel', () => {
  it('leaves out tasks with no effort', () => {
    const r = effortByLabel([task('a', { labels: ['work'] })]);
    expect(r).toEqual({ rows: [], total: 0, taskCount: 0 });
  });

  it('counts a task in full towards each of its labels, once in the total', () => {
    const r = effortByLabel([
      task('a', { effort: 'Hard', labels: ['work', 'admin'] }),
      task('b', { effort: 'Easy', labels: ['work'] }),
    ]);
    expect(r.rows).toEqual([
      { label: 'work', points: 4, tasks: 2 },
      { label: 'admin', points: 3, tasks: 1 },
    ]);
    expect(r.total).toBe(4);
    expect(r.taskCount).toBe(2);
  });

  it('merges labels case-insensitively, first spelling wins', () => {
    const r = effortByLabel([
      task('a', { effort: 'Easy', labels: ['Work'] }),
      task('b', { effort: 'Moderate', labels: ['work'] }),
    ]);
    expect(r.rows).toEqual([{ label: 'Work', points: 3, tasks: 2 }]);
  });

  it('puts unlabelled effort in its own row, last', () => {
    const r = effortByLabel([
      task('a', { effort: 'Hard' }),
      task('b', { effort: 'Easy', labels: ['home'] }),
    ]);
    expect(r.rows).toEqual([
      { label: 'home', points: 1, tasks: 1 },
      { label: '', points: 3, tasks: 1 },
    ]);
  });
});

describe('inScope', () => {
  it('done is Done and Archive; planned is everything else', () => {
    const scope = (status: Task['status']) =>
      inScope(task('a', { status }), 'done') ? 'done' : 'planned';
    expect(scope('Done')).toBe('done');
    expect(scope('Archive')).toBe('done');
    expect(scope('Scheduled')).toBe('planned');
    expect(scope('WIP')).toBe('planned');
    expect(scope('On Hold')).toBe('planned');
    expect(inScope(task('a', { status: 'On Hold' }), 'planned')).toBe(true);
  });
});
