<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { MAX_EFFORT_LIMIT, isEffortLimit } from '@models/Effort';
import { STATUSES, type Status } from '@models/Task';
import type { Theme, UpdateInfo } from '@shared/ipc';
import { call, mahi } from '../api';
import { useSettingsStore } from '../stores/settings';
import { useTasksStore } from '../stores/tasks';

const emit = defineEmits<{ update: [info: UpdateInfo] }>();

const settings = useSettingsStore();
const tasks = useTasksStore();

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const version = ref('');
const exportStatuses = ref<Status[]>(['Scheduled', 'WIP', 'On Hold', 'Done']);
const ioMsg = ref<string | null>(null);
const dirMsg = ref<string | null>(null);
const limitMsg = ref<string | null>(null);
const updateMsg = ref<string | null>(null);
const checking = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  version.value = await call(mahi.app.version()).catch(() => '');
});

function fail(e: unknown) {
  error.value = e instanceof Error ? e.message : String(e);
}

/** The lowest daily total that shows amber: the first whole number over 70% of the limit. */
const amberFrom = computed(() => Math.floor((settings.effortLimit * 7) / 10) + 1);

async function setLimit(e: Event) {
  const el = e.target as HTMLInputElement;
  const limit = Number(el.value);
  error.value = limitMsg.value = null;
  if (!isEffortLimit(limit)) {
    limitMsg.value = `Enter a whole number from 1 to ${MAX_EFFORT_LIMIT}.`;
    el.value = String(settings.effortLimit);
    return;
  }
  try {
    await settings.setEffortLimit(limit);
  } catch (err) {
    fail(err);
  }
}

async function pickDir() {
  error.value = dirMsg.value = null;
  try {
    if (await settings.pickDataDir()) {
      await tasks.load();
      dirMsg.value = `Now using ${settings.dataDir}`;
    }
  } catch (e) {
    fail(e);
  }
}

async function resetDir() {
  error.value = dirMsg.value = null;
  try {
    await settings.resetDataDir();
    await tasks.load();
    dirMsg.value = `Now using ${settings.dataDir}`;
  } catch (e) {
    fail(e);
  }
}

function toggleStatus(s: Status) {
  exportStatuses.value = exportStatuses.value.includes(s)
    ? exportStatuses.value.filter((x) => x !== s)
    : [...exportStatuses.value, s];
}

async function doExport() {
  error.value = ioMsg.value = null;
  try {
    const n = await call(mahi.io.export(exportStatuses.value));
    if (n !== null) ioMsg.value = `Exported ${n} task${n === 1 ? '' : 's'}.`;
  } catch (e) {
    fail(e);
  }
}

async function doImport() {
  error.value = ioMsg.value = null;
  try {
    const r = await call(mahi.io.import());
    if (!r) return;
    await tasks.load();
    const extra = [
      r.renamed ? `${r.renamed} given new ids (already existed)` : '',
      r.skipped ? `${r.skipped} skipped (unreadable)` : '',
    ].filter(Boolean);
    ioMsg.value = `Imported ${r.imported} task${r.imported === 1 ? '' : 's'}${extra.length ? ` — ${extra.join(', ')}` : ''}.`;
  } catch (e) {
    fail(e);
  }
}

async function checkUpdates() {
  error.value = updateMsg.value = null;
  checking.value = true;
  try {
    const info = await call(mahi.updates.check());
    if (info) emit('update', info);
    else updateMsg.value = 'You are on the latest version.';
  } catch (e) {
    updateMsg.value = `Could not check for updates: ${e instanceof Error ? e.message : String(e)}`;
  } finally {
    checking.value = false;
  }
}
</script>

<template>
  <section class="settings">
    <header class="view-head"><h2>Settings</h2></header>
    <p v-if="error" class="err">{{ error }}</p>

    <div class="card block">
      <h3>Appearance</h3>
      <div class="seg" role="radiogroup" aria-label="Theme">
        <button
          v-for="t in THEMES"
          :key="t.value"
          role="radio"
          :aria-checked="settings.theme === t.value"
          :class="{ on: settings.theme === t.value }"
          @click="settings.setTheme(t.value)"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <div class="card block">
      <h3>Daily effort</h3>
      <p class="muted">
        Each open task adds its effort to the day it is due: Easy 1, Moderate 2, Hard 3. Today and
        the Calendar flag a day amber above 70% of this limit and red above it. It is only a guide —
        nothing is blocked.
      </p>
      <label class="row limit">
        <span>Daily limit</span>
        <input
          type="number"
          min="1"
          :max="MAX_EFFORT_LIMIT"
          step="1"
          :value="settings.effortLimit"
          @change="setLimit"
        />
      </label>
      <p class="muted small">
        Amber from {{ amberFrom }}, red from {{ settings.effortLimit + 1 }}.
      </p>
      <p v-if="limitMsg" class="err">{{ limitMsg }}</p>
    </div>

    <div class="card block">
      <h3>Data folder</h3>
      <p class="muted">Each task is stored as its own JSON file in this folder.</p>
      <code class="path">{{ settings.dataDir }}</code>
      <div class="row actions">
        <button @click="pickDir">Change…</button>
        <button class="ghost" @click="resetDir">Use default</button>
        <button class="ghost" @click="call(mahi.config.openDataDir()).catch(fail)">
          Open folder
        </button>
      </div>
      <p v-if="dirMsg" class="ok">{{ dirMsg }}</p>
    </div>

    <div class="card block">
      <h3>Import / export</h3>
      <p class="muted">Export tasks with these statuses to a single JSON file:</p>
      <div class="checks">
        <label v-for="s in STATUSES" :key="s" class="check">
          <input type="checkbox" :checked="exportStatuses.includes(s)" @change="toggleStatus(s)" />
          {{ s }}
        </label>
      </div>
      <div class="row actions">
        <button class="primary" :disabled="!exportStatuses.length" @click="doExport">
          Export…
        </button>
        <button @click="doImport">Import…</button>
      </div>
      <p class="muted small">
        Import reads the same format. Existing tasks are never overwritten — clashing ids get a new
        id.
      </p>
      <p v-if="ioMsg" class="ok">{{ ioMsg }}</p>
    </div>

    <div class="card block">
      <h3>Updates</h3>
      <p class="muted">MAHI {{ version ? `v${version}` : '' }}</p>
      <div class="row actions">
        <button :disabled="checking" @click="checkUpdates">
          {{ checking ? 'Checking…' : 'Check for updates' }}
        </button>
      </div>
      <p v-if="updateMsg" class="muted small">{{ updateMsg }}</p>
    </div>
  </section>
</template>

<style scoped>
.settings {
  max-width: 680px;
}
.block {
  padding: 14px 18px;
  margin-bottom: 14px;
}
h3 {
  margin: 0 0 6px;
  font-size: 14px;
}
p {
  margin: 4px 0;
}
.path {
  display: block;
  font-family: var(--mono);
  font-size: var(--fs-sm);
  background: var(--surface-2);
  padding: 6px 10px;
  border-radius: var(--radius);
  word-break: break-all;
  margin: 6px 0;
}
.actions {
  margin: 8px 0 4px;
  gap: 8px;
}
.limit {
  margin: 8px 0 4px;
  gap: 10px;
}
.limit input {
  width: 80px;
}
.checks {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin: 6px 0;
}
.check {
  display: flex;
  align-items: center;
  gap: 5px;
}
.small {
  font-size: var(--fs-sm);
}
.ok {
  color: var(--ok);
}
.err {
  color: var(--danger);
}
</style>
