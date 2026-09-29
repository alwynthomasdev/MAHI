<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import type { UpdateInfo } from '@shared/ipc';
import { call, mahi } from './api';
import { useSettingsStore } from './stores/settings';
import { useTasksStore } from './stores/tasks';
import TaskDialog from './components/TaskDialog.vue';
import UpdateDialog from './components/UpdateDialog.vue';

const settings = useSettingsStore();
const tasks = useTasksStore();
const route = useRoute();

const booting = ref(true);
const error = ref<string | null>(null);
const updateInfo = ref<UpdateInfo | null>(null);

/** The same bundle backs the Add Task window, which renders only its own view.
 *  The hash check covers first mount, before the router's initial navigation. */
const isPopup = computed(
  () => route.name === 'quick-add' || window.location.hash.startsWith('#/quick-add'),
);

const NAV = [
  { to: '/today', label: 'Today' },
  { to: '/list', label: 'List' },
  { to: '/board', label: 'Swimlanes' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/archive', label: 'Archive' },
  { to: '/bin', label: 'Recycle bin' },
  { to: '/settings', label: 'Settings' },
];

async function boot() {
  error.value = null;
  booting.value = true;
  try {
    await settings.load();
    await tasks.load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    booting.value = false;
  }
}

/**
 * Update check on launch. Resolves `null` when current, in dev, or on macOS
 * (unsigned builds can't self-update); failures (offline) are swallowed.
 */
async function checkForUpdate() {
  try {
    updateInfo.value = await call(mahi.updates.check());
  } catch {
    /* stay quiet on startup */
  }
}

function openQuickAdd() {
  void mahi.window.openQuickAdd();
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    openQuickAdd();
  }
}

let unsub: (() => void) | null = null;
let dayTimer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  if (isPopup.value) return;
  void boot();
  void checkForUpdate();
  window.addEventListener('keydown', onKeydown);
  // Another window (the Add Task popup) or a data-folder switch changed tasks.
  unsub = mahi.events.onTasksChanged(() => void tasks.load());
  // Keep "today" honest if the app stays open past midnight.
  dayTimer = setInterval(() => tasks.refreshToday(), 60_000);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  unsub?.();
  clearInterval(dayTimer);
});
</script>

<template>
  <RouterView v-if="isPopup" />

  <div v-else class="shell">
    <header class="topbar">
      <div class="brand"><span class="mark">M</span> MAHI</div>
      <nav class="nav">
        <RouterLink v-for="n in NAV" :key="n.to" :to="n.to" class="nav-item" active-class="active">
          {{ n.label }}
          <span
            v-if="n.to === '/today' && tasks.todayTasks.length"
            class="count"
            :class="{ warn: tasks.overdueCount > 0 }"
            >{{ tasks.todayTasks.length }}</span
          >
        </RouterLink>
      </nav>
      <span class="spacer" />
      <button class="primary add" title="Add task (Ctrl+N)" @click="openQuickAdd">
        + Add task
      </button>
    </header>

    <main class="main scroll-thin">
      <div v-if="booting" class="muted pad">Loading…</div>
      <div v-else-if="error" class="pad">
        <p class="error">{{ error }}</p>
        <button @click="boot">Retry</button>
      </div>
      <RouterView v-else v-slot="{ Component }">
        <component :is="Component" @update="(info: UpdateInfo) => (updateInfo = info)" />
      </RouterView>
    </main>

    <TaskDialog
      v-if="tasks.editing"
      :key="tasks.editing.id"
      :task="tasks.editing"
      @close="tasks.closeEditor()"
    />
    <UpdateDialog v-if="updateInfo" :info="updateInfo" @close="updateInfo = null" />
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-rows: 52px 1fr;
  height: 100%;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  letter-spacing: 1px;
  flex-shrink: 0;
}
.mark {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: var(--accent);
  color: var(--accent-contrast);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}
.nav {
  display: flex;
  gap: 2px;
  overflow-x: auto;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--radius);
  color: var(--text-dim);
  text-decoration: none;
  font-size: 13px;
  white-space: nowrap;
}
.nav-item:hover {
  background: var(--surface-2);
  color: var(--text);
}
.nav-item.active {
  background: var(--surface-2);
  color: var(--text);
  font-weight: 600;
  box-shadow: inset 0 -2px 0 var(--accent);
}
.count {
  color: var(--text-faint);
  font-size: 11px;
  font-family: var(--mono);
}
.count.warn {
  color: var(--p-highest);
  font-weight: 600;
}
.add {
  flex-shrink: 0;
}
.main {
  overflow: auto;
  padding: 18px 22px;
  min-height: 0;
}
.pad {
  padding: 24px 0;
}
.error {
  color: var(--danger);
}
</style>
