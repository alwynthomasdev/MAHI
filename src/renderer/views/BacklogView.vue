<script setup lang="ts">
import { useTasksStore } from '../stores/tasks';
import TaskTable from '../components/TaskTable.vue';

/**
 * Tasks parked for later. They stay off Today, the Calendar and every effort
 * total whatever their due date, so the date is not shown here.
 */
const tasks = useTasksStore();
</script>

<template>
  <section>
    <header class="view-head">
      <h2>Backlog</h2>
      <span class="muted">{{ tasks.backlog.length }} in backlog</span>
    </header>
    <TaskTable
      :tasks="tasks.backlog"
      empty="Backlog is empty."
      hide-due
      @open="tasks.open"
      @priority="(t, v) => tasks.update(t.id, { priority: v })"
      @status="(t, v) => tasks.update(t.id, { status: v })"
      @effort="(t, v) => tasks.update(t.id, { effort: v })"
    >
      <template #actions="{ task }">
        <button
          class="ghost small"
          title="Move to Scheduled, due today if its date has passed"
          @click="tasks.schedule(task.id)"
        >
          Schedule
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
