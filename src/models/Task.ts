import { isDateString, todayDate } from '@shared/dates';

export const PRIORITIES = ['Lowest', 'Low', 'Medium', 'High', 'Highest'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ['Scheduled', 'WIP', 'On Hold', 'Done', 'Archive'] as const;
export type Status = (typeof STATUSES)[number];

export const DEFAULT_PRIORITY: Priority = 'Medium';
export const DEFAULT_STATUS: Status = 'Scheduled';

export const PRIORITY_RANK: Record<Priority, number> = {
  Lowest: 0,
  Low: 1,
  Medium: 2,
  High: 3,
  Highest: 4,
};

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  /** Local calendar date, `YYYY-MM-DD`. */
  due: string;
  labels: string[];
  /** ISO timestamps. */
  created: string;
  updated: string;
  /** Set only while the task sits in the recycle bin. */
  deletedAt?: string;
}

export interface NewTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  due?: string;
  labels?: string[];
}

export type TaskPatch = Partial<Omit<Task, 'id' | 'created' | 'updated' | 'deletedAt'>>;

export function isPriority(v: unknown): v is Priority {
  return typeof v === 'string' && (PRIORITIES as readonly string[]).includes(v);
}

export function isStatus(v: unknown): v is Status {
  return typeof v === 'string' && (STATUSES as readonly string[]).includes(v);
}

/** Trim, drop empties, de-duplicate case-insensitively (first spelling wins). */
export function normalizeLabels(labels: unknown): string[] {
  if (!Array.isArray(labels)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of labels) {
    if (typeof raw !== 'string') continue;
    const l = raw.trim();
    if (!l || seen.has(l.toLowerCase())) continue;
    seen.add(l.toLowerCase());
    out.push(l);
  }
  return out;
}

export function requireTitle(title: unknown): string {
  const t = typeof title === 'string' ? title.trim() : '';
  if (!t) throw new Error('Title is required.');
  return t;
}

/** Build a new task, applying defaults (Medium, Scheduled, due today). */
export function createTask(input: NewTaskInput, id: string, now: Date = new Date()): Task {
  const ts = now.toISOString();
  return {
    id,
    title: requireTitle(input.title),
    description: input.description ?? '',
    priority: isPriority(input.priority) ? input.priority : DEFAULT_PRIORITY,
    status: isStatus(input.status) ? input.status : DEFAULT_STATUS,
    due: isDateString(input.due) ? input.due : todayDate(now),
    labels: normalizeLabels(input.labels),
    created: ts,
    updated: ts,
  };
}

/** Apply a patch, validating each field that is present. */
export function applyPatch(task: Task, patch: TaskPatch, now: Date = new Date()): Task {
  const next: Task = { ...task };
  if (patch.title !== undefined) next.title = requireTitle(patch.title);
  if (patch.description !== undefined) next.description = String(patch.description);
  if (patch.priority !== undefined) {
    if (!isPriority(patch.priority)) throw new Error(`Invalid priority "${patch.priority}".`);
    next.priority = patch.priority;
  }
  if (patch.status !== undefined) {
    if (!isStatus(patch.status)) throw new Error(`Invalid status "${patch.status}".`);
    next.status = patch.status;
  }
  if (patch.due !== undefined) {
    if (!isDateString(patch.due)) throw new Error(`Invalid due date "${patch.due}".`);
    next.due = patch.due;
  }
  if (patch.labels !== undefined) next.labels = normalizeLabels(patch.labels);
  next.updated = now.toISOString();
  return next;
}

function isTimestamp(v: unknown): v is string {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v));
}

/**
 * Coerce an untrusted object (a file on disk, an import) into a Task. Bad or
 * missing fields fall back to defaults rather than throwing; only a missing
 * title is fatal. `id` comes from the object when it is a non-empty string,
 * otherwise from `fallbackId`.
 */
export function normalizeTask(raw: unknown, fallbackId: string, now: Date = new Date()): Task {
  if (!raw || typeof raw !== 'object') throw new Error('Task must be an object.');
  const r = raw as Record<string, unknown>;
  const created = isTimestamp(r.created) ? r.created : now.toISOString();
  const task: Task = {
    id: typeof r.id === 'string' && r.id.trim() ? r.id.trim() : fallbackId,
    title: requireTitle(r.title),
    description: typeof r.description === 'string' ? r.description : '',
    priority: isPriority(r.priority) ? r.priority : DEFAULT_PRIORITY,
    status: isStatus(r.status) ? r.status : DEFAULT_STATUS,
    due: isDateString(r.due) ? r.due : todayDate(now),
    labels: normalizeLabels(r.labels),
    created,
    updated: isTimestamp(r.updated) ? r.updated : created,
  };
  if (isTimestamp(r.deletedAt)) task.deletedAt = r.deletedAt;
  return task;
}
