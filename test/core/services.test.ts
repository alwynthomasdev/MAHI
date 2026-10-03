import { promises as fs } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppContext } from '@core/AppContext';
import { makeTmpDir } from '../helpers/tmp';

let dir: string;
let cleanup: () => Promise<void>;
let ctx: AppContext;

beforeEach(async () => {
  ({ dir, cleanup } = await makeTmpDir());
  ctx = await AppContext.open(dir);
});
afterEach(() => cleanup());

describe('TaskService', () => {
  it('stores each task as its own JSON file', async () => {
    const t = await ctx.tasks.create({ title: 'Write plan' });
    const raw = JSON.parse(await fs.readFile(path.join(dir, 'tasks', `${t.id}.json`), 'utf8'));
    expect(raw).toMatchObject({
      id: t.id,
      title: 'Write plan',
      priority: 'Medium',
      status: 'Scheduled',
    });
    expect(await ctx.tasks.list()).toHaveLength(1);
  });

  it('updates and round-trips', async () => {
    const t = await ctx.tasks.create({ title: 'A' });
    await ctx.tasks.update(t.id, {
      status: 'WIP',
      effort: 'Hard',
      description: 'details',
      labels: ['x'],
    });
    expect(await ctx.tasks.get(t.id)).toMatchObject({
      status: 'WIP',
      effort: 'Hard',
      description: 'details',
      labels: ['x'],
    });
  });

  it('skips unreadable files instead of failing', async () => {
    await ctx.tasks.create({ title: 'ok' });
    await fs.writeFile(path.join(dir, 'tasks', 'broken.json'), '{ nope', 'utf8');
    expect((await ctx.tasks.list()).map((t) => t.title)).toEqual(['ok']);
  });

  it('never changes created: update, delete and restore all keep it', async () => {
    const t = await ctx.tasks.create({ title: 'A' }, new Date(2026, 0, 5));
    const updated = await ctx.tasks.update(t.id, { status: 'Done' }, new Date(2026, 5, 1));
    expect(updated.created).toBe(t.created);
    expect(updated.updated).not.toBe(t.created);

    await ctx.tasks.delete(t.id);
    expect((await ctx.bin.restore(t.id)).created).toBe(t.created);
    expect((await ctx.tasks.get(t.id)).created).toBe(t.created);
  });

  it('gives a file with no created a date once, and writes it back', async () => {
    const file = path.join(dir, 'tasks', 'hand.json');
    await fs.writeFile(file, JSON.stringify({ title: 'Hand-written' }), 'utf8');
    const [first] = await ctx.tasks.list();
    expect(JSON.parse(await fs.readFile(file, 'utf8')).created).toBe(first.created);
    expect((await ctx.tasks.get('hand')).created).toBe(first.created);
  });

  it('rejects path-like ids', async () => {
    await expect(ctx.tasks.get('../config')).rejects.toThrow(/Invalid task id/);
  });
});

describe('RecycleBinService', () => {
  it('delete moves to the bin; restore brings it back', async () => {
    const t = await ctx.tasks.create({ title: 'Oops' });
    await ctx.tasks.delete(t.id);
    expect(await ctx.tasks.list()).toHaveLength(0);
    const bin = await ctx.bin.list();
    expect(bin).toHaveLength(1);
    expect(bin[0].deletedAt).toBeTruthy();

    const restored = await ctx.bin.restore(t.id);
    expect(restored.deletedAt).toBeUndefined();
    expect(await ctx.bin.list()).toHaveLength(0);
    expect((await ctx.tasks.get(t.id)).title).toBe('Oops');
  });

  it('purge and empty remove for good', async () => {
    const a = await ctx.tasks.create({ title: 'a' });
    const b = await ctx.tasks.create({ title: 'b' });
    const c = await ctx.tasks.create({ title: 'c' });
    for (const t of [a, b, c]) await ctx.tasks.delete(t.id);
    await ctx.bin.purge(a.id);
    expect(await ctx.bin.list()).toHaveLength(2);
    expect(await ctx.bin.empty()).toBe(2);
    expect(await ctx.bin.list()).toHaveLength(0);
  });
});

describe('ImportExportService', () => {
  it('exports only the selected statuses', async () => {
    await ctx.tasks.create({ title: 'sched' });
    await ctx.tasks.create({ title: 'done', status: 'Done' });
    await ctx.tasks.create({ title: 'arch', status: 'Archive' });
    const doc = await ctx.io.buildExport(['Done', 'Archive']);
    expect(doc.app).toBe('MAHI');
    expect(doc.tasks.map((t) => t.title).sort()).toEqual(['arch', 'done']);
  });

  it('imports its own export without overwriting existing tasks', async () => {
    await ctx.tasks.create({ title: 'one' });
    await ctx.tasks.create({ title: 'two', labels: ['l'] });
    const doc = JSON.parse(JSON.stringify(await ctx.io.buildExport([])));

    // Same folder: every id clashes, so all get new ids and nothing is lost.
    const same = await ctx.io.importData(doc);
    expect(same).toEqual({ imported: 2, renamed: 2, skipped: 0 });
    expect(await ctx.tasks.list()).toHaveLength(4);
    // A re-imported task keeps the date it was first created, new id or not.
    const created = (await ctx.tasks.list()).map((t) => t.created).sort();
    expect(created).toEqual(
      doc.tasks.flatMap((t: { created: string }) => [t.created, t.created]).sort(),
    );

    // Fresh folder: ids are kept.
    const other = await makeTmpDir();
    try {
      const ctx2 = await AppContext.open(other.dir);
      expect(await ctx2.io.importData(doc)).toEqual({ imported: 2, renamed: 0, skipped: 0 });
      const ids = (await ctx2.tasks.list()).map((t) => t.id).sort();
      expect(ids).toEqual(doc.tasks.map((t: { id: string }) => t.id).sort());
    } finally {
      await other.cleanup();
    }
  });

  it('skips invalid entries and rejects non-exports', async () => {
    const r = await ctx.io.importData({ tasks: [{ title: 'ok' }, { priority: 'High' }, 42] });
    expect(r).toEqual({ imported: 1, renamed: 0, skipped: 2 });
    await expect(ctx.io.importData({ nope: true })).rejects.toThrow(/Not a MAHI export/);
  });
});
