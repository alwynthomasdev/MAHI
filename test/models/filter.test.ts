import { describe, expect, it } from 'vitest';
import {
  allLabels,
  filterAndSort,
  groupByDue,
  isOpenTask,
  isTodayTask,
  sortTasks,
} from '@models/Filter';
import { createTask, type Task } from '@models/Task';

function task(id: string, over: Partial<Task>): Task {
  return { ...createTask({ title: id }, id, new Date(2026, 0, 1)), ...over };
}

const tasks = [
  task('alpha', { priority: 'Low', due: '2026-09-30', labels: ['work'] }),
  task('Bravo report', { priority: 'Highest', due: '2026-09-25', status: 'WIP', labels: ['Home'] }),
  task('charlie', { priority: 'Medium', due: '2026-09-27', status: 'Done' }),
  task('delta', { priority: 'High', due: '2026-09-27', status: 'Archive', labels: ['work'] }),
];

describe('filterAndSort', () => {
  it('matches title text case-insensitively', () => {
    const r = filterAndSort(tasks, { text: 'REPORT' }, { key: 'due', dir: 'asc' });
    expect(r.map((t) => t.id)).toEqual(['Bravo report']);
  });

  it('ANDs status, priority and label filters', () => {
    const r = filterAndSort(
      tasks,
      { labels: ['WORK'], priorities: ['Low', 'High'], statuses: ['Scheduled'] },
      { key: 'due', dir: 'asc' },
    );
    expect(r.map((t) => t.id)).toEqual(['alpha']);
  });

  it('sorts by priority descending', () => {
    const r = sortTasks(tasks, { key: 'priority', dir: 'desc' });
    expect(r.map((t) => t.priority)).toEqual(['Highest', 'High', 'Medium', 'Low']);
  });

  it('breaks due-date ties by priority, highest first', () => {
    const r = sortTasks(tasks, { key: 'due', dir: 'asc' });
    expect(r.map((t) => t.id)).toEqual(['Bravo report', 'delta', 'charlie', 'alpha']);
  });
});

describe('isTodayTask', () => {
  it('includes due-today and overdue, excludes done / archived / future', () => {
    const today = '2026-09-27';
    expect(tasks.filter((t) => isTodayTask(t, today)).map((t) => t.id)).toEqual(['Bravo report']);
    expect(isTodayTask(task('x', { due: today }), today)).toBe(true);
  });
});

describe('isOpenTask / groupByDue', () => {
  it('buckets open tasks by due date', () => {
    const byDay = groupByDue(tasks.filter(isOpenTask));
    expect([...byDay.keys()]).toEqual(['2026-09-30', '2026-09-25']);
    expect(byDay.get('2026-09-27')).toBeUndefined();
    expect(groupByDue(tasks).get('2026-09-27')?.map((t) => t.id)).toEqual(['charlie', 'delta']);
  });
});

describe('allLabels', () => {
  it('de-duplicates case-insensitively and sorts', () => {
    expect(allLabels(tasks)).toEqual(['Home', 'work']);
  });
});
