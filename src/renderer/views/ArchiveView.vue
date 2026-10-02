<script setup lang="ts">
import { useTasksStore } from '../stores/tasks';
import TaskTable from '../components/TaskTable.vue';

const tasks = useTasksStore();
</script>

<template>
  <section>
    <header class="view-head">
      <h2>Archive</h2>
      <span class="muted">{{ tasks.archived.length }} archived</span>
    </header>
    <TaskTable
      :tasks="tasks.archived"
      empty="Nothing archived yet."
      @open="tasks.open"
      @priority="(t, v) => tasks.update(t.id, { priority: v })"
      @status="(t, v) => tasks.update(t.id, { status: v })"
      @effort="(t, v) => tasks.update(t.id, { effort: v })"
    >
      <template #actions="{ task }">
        <button
          class="ghost small"
          title="Move back to Done"
          @click="tasks.update(task.id, { status: 'Done' })"
        >
          Unarchive
        </button>
        <button class="ghost small del" title="Move to recycle bin" @click="tasks.remove(task.id)">
          Delete
        </button>
      </template>
    </TaskTable>
  </section>
</template>

<style scoped>
.small {
  font-size: var(--fs-sm);
  padding: 3px 8px;
}
.del {
  color: var(--danger);
}
</style>
