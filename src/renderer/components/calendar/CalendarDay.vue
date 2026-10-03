<script setup lang="ts">
import { computed } from 'vue';
import { useTasksStore } from '../../stores/tasks';
import EffortBadge from '../EffortBadge.vue';
import TaskTable from '../TaskTable.vue';
import SnoozeMenu from '../SnoozeMenu.vue';

/**
 * The open tasks on the selected day, as in the Today tab. Today's list
 * includes overdue tasks — they fall into the current day. The effort badge
 * is this date's load, as in Month and Week: Done included and On Hold left
 * out, so it need not match the list below.
 */
const tasks = useTasksStore();

const dayTasks = computed(() => tasks.openByDue.get(tasks.calendarDate) ?? []);
</script>

<template>
  <section>
    <p class="muted summary">
      {{ dayTasks.length }} task{{ dayTasks.length === 1 ? '' : 's' }} due
      <EffortBadge :total="tasks.effortByDue.get(tasks.calendarDate) ?? 0" />
    </p>
    <TaskTable
      :tasks="dayTasks"
      empty="Nothing due on this day."
      @open="tasks.open"
      @priority="(t, v) => tasks.update(t.id, { priority: v })"
      @status="(t, v) => tasks.update(t.id, { status: v })"
      @effort="(t, v) => tasks.update(t.id, { effort: v })"
    >
      <template #actions="{ task }">
        <SnoozeMenu @snooze="(due) => tasks.update(task.id, { due })" />
      </template>
    </TaskTable>
  </section>
</template>

<style scoped>
.summary {
  margin: 0 0 10px;
}
.summary .effort {
  margin-left: 8px;
  vertical-align: middle;
}
</style>
