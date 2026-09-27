<script setup lang="ts">
import { computed } from 'vue';
import { SORT_KEYS, type SortKey } from '@models/Filter';
import { PRIORITIES, STATUSES, type Priority, type Status } from '@models/Task';
import { useTasksStore } from '../stores/tasks';
import MultiSelect from './MultiSelect.vue';

/** Search / filter / order-by controls for the List view (drives the tasks store). */
const tasks = useTasksStore();
const listStatuses = STATUSES.filter((s) => s !== 'Archive');

const text = computed({
  get: () => tasks.filter.text ?? '',
  set: (v: string) => tasks.setFilter({ text: v }),
});
const statuses = computed({
  get: () => tasks.filter.statuses ?? [],
  set: (v: string[]) => tasks.setFilter({ statuses: v as Status[] }),
});
const priorities = computed({
  get: () => tasks.filter.priorities ?? [],
  set: (v: string[]) => tasks.setFilter({ priorities: v as Priority[] }),
});
const labels = computed({
  get: () => tasks.filter.labels ?? [],
  set: (v: string[]) => tasks.setFilter({ labels: v }),
});
const hasFilter = computed(
  () => !!(text.value || statuses.value.length || priorities.value.length || labels.value.length),
);

function setSortKey(e: Event) {
  tasks.sort = { ...tasks.sort, key: (e.target as HTMLSelectElement).value as SortKey };
}
function flipDir() {
  tasks.sort = { ...tasks.sort, dir: tasks.sort.dir === 'asc' ? 'desc' : 'asc' };
}
</script>

<template>
  <div class="filter-bar">
    <input v-model="text" type="search" class="search" placeholder="Search titles…" />
    <MultiSelect v-model="statuses" label="Status" :options="listStatuses" />
    <MultiSelect v-model="priorities" label="Priority" :options="PRIORITIES" />
    <MultiSelect v-model="labels" label="Labels" :options="tasks.labels" />
    <button v-if="hasFilter" class="ghost" @click="tasks.clearFilter()">Clear</button>
    <span class="spacer" />
    <label class="sort">
      <span class="muted">Order by</span>
      <select :value="tasks.sort.key" @change="setSortKey">
        <option v-for="s in SORT_KEYS" :key="s.key" :value="s.key">{{ s.label }}</option>
      </select>
      <button :title="tasks.sort.dir === 'asc' ? 'Ascending' : 'Descending'" @click="flipDir">
        {{ tasks.sort.dir === 'asc' ? '↑' : '↓' }}
      </button>
    </label>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.search {
  width: 240px;
}
.sort {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-md);
}
</style>
