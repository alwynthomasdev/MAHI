<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { call, mahi } from '../api';
import { useSettingsStore } from '../stores/settings';

/**
 * The only view in the standalone Add Task window. Title only — everything
 * else takes its default. The window stays open after each add, ready for the
 * next; the main window refreshes via the tasks:changed broadcast.
 */
const settings = useSettingsStore();
const title = ref('');
const busy = ref(false);
const flash = ref<string | null>(null);
const error = ref<string | null>(null);
const input = ref<HTMLInputElement | null>(null);
let flashTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(async () => {
  // The shared index.html says "MAHI"; name this window for the taskbar / title bar.
  document.title = 'Add task';
  input.value?.focus();
  await settings.load().catch(() => undefined);
  // Re-focus whenever the window is brought back.
  window.addEventListener('focus', () => input.value?.focus());
});

async function add() {
  const t = title.value.trim();
  if (!t || busy.value) return;
  busy.value = true;
  error.value = null;
  try {
    await call(mahi.tasks.create({ title: t }));
    title.value = '';
    flash.value = `Added “${t}”`;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => (flash.value = null), 2500);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    busy.value = false;
    await nextTick();
    input.value?.focus();
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') void mahi.window.closeQuickAdd();
}
</script>

<template>
  <form class="quick" @submit.prevent="add" @keydown="onKeydown">
    <label class="lbl" for="qa-title">Add task</label>
    <div class="row">
      <input
        id="qa-title"
        ref="input"
        v-model="title"
        placeholder="What needs doing?"
        autocomplete="off"
      />
      <button type="submit" class="primary" :disabled="!title.trim() || busy">Add</button>
    </div>
    <p class="status" :class="{ err: error }">
      {{ error ?? flash ?? 'Enter to add · due today · Medium · Scheduled' }}
    </p>
  </form>
</template>

<style scoped>
.quick {
  height: 100%;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg);
}
.lbl {
  font-weight: 600;
  font-size: var(--fs-md);
  color: var(--text-dim);
}
input {
  flex: 1;
  font-size: 14px;
  padding: 8px 10px;
}
.row {
  gap: 8px;
}
button {
  padding: 8px 14px;
}
.status {
  margin: 0;
  font-size: var(--fs-xs);
  color: var(--text-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.status.err {
  color: var(--danger);
}
</style>
