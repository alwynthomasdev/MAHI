import { defineStore } from 'pinia';
import { effortByDue, todayEffort } from '@models/Effort';
import {
  DEFAULT_SORT,
  allLabels,
  filterAndSort,
  groupByDue,
  isOpenTask,
  isTodayTask,
  sortTasks,
  type TaskFilter,
  type TaskSort,
} from '@models/Filter';
import type { NewTaskInput, Task, TaskPatch } from '@models/Task';
import { todayDate } from '@shared/dates';
import { call, mahi } from '../api';

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    items: [] as Task[],
    loaded: false,
    /** List view filter / sort. */
    filter: {} as TaskFilter,
    sort: { ...DEFAULT_SORT } as TaskSort,
    /** Swimlane view: every task, or only those due today or earlier. */
    swimlaneScope: 'all' as 'all' | 'today',
    /** Calendar view: which layout, and the day it is centred on. */
    calendarMode: 'month' as 'month' | 'week' | 'day',
    calendarDate: todayDate(),
    /** Bumped by `refreshToday` so `today` re-evaluates across midnight. */
    today: todayDate(),
    /** The task open in the edit dialog (rendered once, by App.vue). */
    editing: null as Task | null,
  }),
  getters: {
    /** Due today or overdue, not Done/Archive — overdue first, then priority. */
    todayTasks(state): Task[] {
      return sortTasks(
        state.items.filter((t) => isTodayTask(t, state.today)),
        { key: 'due', dir: 'asc' },
      );
    },
    overdueCount(): number {
      return this.todayTasks.filter((t) => t.due < this.today).length;
    },
    /** List view: everything not archived, filtered + sorted. */
    listTasks(state): Task[] {
      return filterAndSort(
        state.items.filter((t) => t.status !== 'Archive'),
        state.filter,
        state.sort,
      );
    },
    /** Calendar: open (not Done/Archive) tasks by due date, each day sorted by priority. */
    openByDue(state): Map<string, Task[]> {
      return groupByDue(sortTasks(state.items.filter(isOpenTask), { key: 'priority', dir: 'desc' }));
    },
    /** Effort points per due date; On Hold and Archive are left out, Done counts. */
    effortByDue(state): Map<string, number> {
      return effortByDue(state.items);
    },
    /** Today's effort, including overdue work still to do. */
    todayEffort(state): number {
      return todayEffort(state.items, state.today);
    },
    archived(state): Task[] {
      return sortTasks(
        state.items.filter((t) => t.status === 'Archive'),
        { key: 'updated', dir: 'desc' },
      );
    },
    labels(state): string[] {
      return allLabels(state.items);
    },
  },
  actions: {
    open(task: Task) {
      this.editing = task;
    },
    closeEditor() {
      this.editing = null;
    },
    refreshToday() {
      this.today = todayDate();
    },
    async load() {
      this.items = await call(mahi.tasks.list());
      this.loaded = true;
      this.refreshToday();
    },
    /** Replace one task in place (keeps the list stable while the broadcast reloads). */
    upsert(task: Task) {
      const i = this.items.findIndex((t) => t.id === task.id);
      if (i >= 0) this.items.splice(i, 1, task);
      else this.items.push(task);
    },
    async create(input: NewTaskInput): Promise<Task> {
      const task = await call(mahi.tasks.create(input));
      this.upsert(task);
      return task;
    },
    async update(id: string, patch: TaskPatch): Promise<Task> {
      const task = await call(mahi.tasks.update(id, patch));
      this.upsert(task);
      return task;
    },
    async remove(id: string) {
      await call(mahi.tasks.delete(id));
      this.items = this.items.filter((t) => t.id !== id);
    },
    setFilter(patch: Partial<TaskFilter>) {
      this.filter = { ...this.filter, ...patch };
    },
    clearFilter() {
      this.filter = {};
    },
  },
});
