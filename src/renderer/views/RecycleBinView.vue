<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Task } from '@models/Task';
import { call, mahi } from '../api';

const items = ref<Task[]>([]);
const error = ref<string | null>(null);
const confirmEmpty = ref(false);

async function load() {
  try {
    items.value = await call(mahi.bin.list());
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function run(p: Promise<unknown>) {
  error.value = null;
  try {
    await p;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
  // The tasks:changed broadcast also reloads the main list.
  await load();
}

function when(iso?: string) {
  return iso ? new Date(iso).toLocaleString() : '';
}

let unsub: (() => void) | null = null;
onMounted(() => {
  void load();
  unsub = mahi.events.onTasksChanged(() => void load());
});
onBeforeUnmount(() => unsub?.());
</script>

<template>
  <section>
    <header class="view-head">
      <h2>Recycle bin</h2>
      <span class="muted">{{ items.length }} item{{ items.length === 1 ? '' : 's' }}</span>
      <span class="spacer" />
      <template v-if="items.length">
        <button v-if="!confirmEmpty" class="ghost" @click="confirmEmpty = true">Empty bin</button>
        <template v-else>
          <span class="muted small">Permanently delete everything?</span>
          <button
            class="danger"
            @click="run(call(mahi.bin.empty())).then(() => (confirmEmpty = false))"
          >
            Empty
          </button>
          <button class="ghost" @click="confirmEmpty = false">Cancel</button>
        </template>
      </template>
    </header>

    <p v-if="error" class="err">{{ error }}</p>
    <div v-if="!items.length" class="empty muted">The recycle bin is empty.</div>
    <div v-else class="card">
      <div v-for="t in items" :key="t.id" class="row item">
        <div class="title-cell">
          <div class="title">{{ t.title }}</div>
          <div class="muted small">{{ t.status }} · deleted {{ when(t.deletedAt) }}</div>
        </div>
        <button class="small" @click="run(call(mahi.bin.restore(t.id)))">Restore</button>
        <button class="ghost small del" @click="run(call(mahi.bin.purge(t.id)))">
          Delete forever
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.item {
  padding: 9px 14px;
  border-bottom: 1px solid var(--border);
}
.item:last-child {
  border-bottom: none;
}
.title-cell {
  flex: 1;
  min-width: 0;
}
.small {
  font-size: var(--fs-sm);
}
button.small {
  padding: 3px 10px;
}
.del {
  color: var(--danger);
}
.err {
  color: var(--danger);
}
.empty {
  padding: 40px 0;
  text-align: center;
}
</style>
