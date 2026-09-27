<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import { PRIORITIES, STATUSES, type Task } from '@models/Task';
import { useTasksStore } from '../stores/tasks';
import LabelInput from './LabelInput.vue';

/** Open a task to edit every field, including the description. */
const props = defineProps<{ task: Task }>();
const emit = defineEmits<{ close: [] }>();

const tasks = useTasksStore();
const form = reactive({
  title: props.task.title,
  description: props.task.description,
  priority: props.task.priority,
  status: props.task.status,
  due: props.task.due,
  labels: [...props.task.labels],
});
const error = ref<string | null>(null);
const saving = ref(false);
const confirmDelete = ref(false);
const titleEl = ref<HTMLInputElement | null>(null);

onMounted(() => nextTick(() => titleEl.value?.focus()));

async function save() {
  if (!form.title.trim()) {
    error.value = 'Title is required.';
    return;
  }
  if (!form.due) {
    error.value = 'Due date is required.';
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    await tasks.update(props.task.id, { ...form, labels: [...form.labels] });
    emit('close');
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    saving.value = false;
  }
}

async function remove() {
  try {
    await tasks.remove(props.task.id);
    emit('close');
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void save();
}
</script>

<template>
  <div class="backdrop" @click.self="emit('close')" @keydown="onKeydown">
    <form class="card dialog" @submit.prevent="save">
      <header class="row">
        <h3>Edit task</h3>
        <span class="spacer" />
        <button type="button" class="ghost" aria-label="Close" @click="emit('close')">✕</button>
      </header>

      <label class="field">
        <span>Title</span>
        <input ref="titleEl" v-model="form.title" required />
      </label>

      <label class="field">
        <span>Description</span>
        <textarea v-model="form.description" rows="7" placeholder="Optional details…" />
      </label>

      <div class="grid">
        <label class="field">
          <span>Priority</span>
          <select v-model="form.priority">
            <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
          </select>
        </label>
        <label class="field">
          <span>Status</span>
          <select v-model="form.status">
            <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>
        <label class="field">
          <span>Due date</span>
          <input v-model="form.due" type="date" required />
        </label>
      </div>

      <div class="field">
        <span>Labels</span>
        <LabelInput v-model="form.labels" :suggestions="tasks.labels" />
      </div>

      <p v-if="error" class="err">{{ error }}</p>

      <footer class="row">
        <template v-if="!confirmDelete">
          <button type="button" class="ghost del" @click="confirmDelete = true">Delete</button>
        </template>
        <template v-else>
          <span class="muted small">Move to recycle bin?</span>
          <button type="button" class="danger" @click="remove">Delete</button>
          <button type="button" class="ghost" @click="confirmDelete = false">Keep</button>
        </template>
        <span class="spacer" />
        <button type="button" class="ghost" @click="emit('close')">Cancel</button>
        <button type="submit" class="primary" :disabled="saving">Save</button>
      </footer>
    </form>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  display: grid;
  place-items: center;
  z-index: var(--z-overlay);
}
.dialog {
  width: min(560px, 94vw);
  max-height: 92vh;
  overflow: auto;
  padding: 14px 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
h3 {
  margin: 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field > span {
  font-size: var(--fs-xs);
  color: var(--text-dim);
  font-weight: 600;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.err {
  color: var(--danger);
  margin: 0;
  font-size: var(--fs-sm);
}
.del {
  color: var(--danger);
}
.small {
  font-size: var(--fs-sm);
}
</style>
