<script setup lang="ts">
import { useTasksStore } from '../stores/tasks';
import TaskTable from '../components/TaskTable.vue';
import SnoozeMenu from '../components/SnoozeMenu.vue';

const tasks = useTasksStore();
</script>

<template>
  <section>
    <header class="view-head">
      <h2>Today</h2>
      <span class="muted">
        {{ tasks.todayTasks.length }} task{{ tasks.todayTasks.length === 1 ? '' : 's' }}
        <template v-if="tasks.overdueCount">
          · <span class="overdue">{{ tasks.overdueCount }} overdue</span></template
        >
      </span>
    </header>
    <TaskTable
      :tasks="tasks.todayTasks"
      empty="All clear — nothing due today."
      @open="tasks.open"
      @priority="(t, v) => tasks.update(t.id, { priority: v })"
      @status="(t, v) => tasks.update(t.id, { status: v })"
    >
      <template #actions="{ task }">
        <SnoozeMenu @snooze="(due) => tasks.update(task.id, { due })" />
      </template>
    </TaskTable>
  </section>
</template>

<style scoped>
.overdue {
  color: var(--p-highest);
  font-weight: 600;
}
</style>
