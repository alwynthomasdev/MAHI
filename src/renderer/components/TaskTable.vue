<script setup lang="ts">
import {
  EFFORTS,
  PRIORITIES,
  STATUSES,
  type Effort,
  type Priority,
  type Status,
  type Task,
} from '@models/Task';
import { formatDue } from '@shared/dates';
import { EFFORT_COLOR, PRIORITY_COLOR, STATUS_COLOR } from '../lib/colors';
import PillSelect from './PillSelect.vue';

/**
 * The shared task list used by Today, List and Archive. Priority, status and
 * effort are editable inline; clicking a row opens it. The `actions` slot adds
 * per-row buttons (postpone, delete, …).
 */
defineProps<{ tasks: Task[]; empty?: string }>();
const emit = defineEmits<{
  open: [task: Task];
  priority: [task: Task, value: Priority];
  status: [task: Task, value: Status];
  effort: [task: Task, value: Effort];
}>();
</script>

<template>
  <div v-if="!tasks.length" class="empty muted">{{ empty ?? 'Nothing here.' }}</div>
  <div v-else class="table card">
    <div
      v-for="t in tasks"
      :key="t.id"
      class="row task"
      tabindex="0"
      @click="emit('open', t)"
      @keydown.enter.self="emit('open', t)"
    >
      <div class="title-cell">
        <div class="title">{{ t.title }}</div>
        <div v-if="t.labels.length" class="labels">
          <span v-for="l in t.labels" :key="l" class="label">{{ l }}</span>
        </div>
      </div>
      <span class="due" :class="formatDue(t.due).tone" :title="t.due">{{
        formatDue(t.due).text
      }}</span>
      <PillSelect
        :model-value="t.priority"
        :options="PRIORITIES"
        :colors="PRIORITY_COLOR"
        label="Priority"
        @update:model-value="(v) => emit('priority', t, v)"
      />
      <PillSelect
        :model-value="t.status"
        :options="STATUSES"
        :colors="STATUS_COLOR"
        label="Status"
        @update:model-value="(v) => emit('status', t, v)"
      />
      <PillSelect
        :model-value="t.effort"
        :options="EFFORTS"
        :colors="EFFORT_COLOR"
        label="Effort"
        caption="Effort"
        @update:model-value="(v) => emit('effort', t, v)"
      />
      <span class="actions" @click.stop><slot name="actions" :task="t" /></span>
    </div>
  </div>
</template>

<style scoped>
.table {
  overflow: visible;
}
.task {
  padding: 9px 14px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  gap: 14px;
}
.task:last-child {
  border-bottom: none;
}
.task:hover {
  background: var(--hover-bg);
}
.title-cell {
  flex: 1;
  min-width: 0;
}
.title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 3px;
}
.due {
  width: 110px;
  font-size: var(--fs-sm);
  color: var(--text-dim);
  text-align: right;
  flex-shrink: 0;
}
.due.today {
  color: var(--accent);
  font-weight: 600;
}
.due.overdue {
  color: var(--p-highest);
  font-weight: 600;
}
.actions {
  display: flex;
  gap: 4px;
  min-width: 24px;
  justify-content: flex-end;
}
.empty {
  padding: 40px 0;
  text-align: center;
}
</style>
