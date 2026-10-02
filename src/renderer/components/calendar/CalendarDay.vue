<script setup lang="ts">
import { computed } from 'vue';
import { useTasksStore } from '../../stores/tasks';
import EffortBadge from '../EffortBadge.vue';
import TaskTable from '../TaskTable.vue';
import SnoozeMenu from '../SnoozeMenu.vue';

/**
 * The open tasks due on the selected day, as in the Today tab. On today
 * itself, overdue tasks follow in their own list so nothing is hidden. The
 * effort badge is this date's load, as in Month and Week: tasks due on it,
 * Done included and On Hold left out, so it need not match the list below.
 */
const tasks = useTasksStore();

const dayTasks = computed(() => tasks.openByDue.get(tasks.calendarDate) ?? []);
const isToday = computed(() => tasks.calendarDate === tasks.today);
const overdue = computed(() =>
  isToday.value ? tasks.todayTasks.filter((t) => t.due < tasks.today) : [],
);
</script>

<template>
  <section>
    <p class="muted summary">
      {{ dayTasks.length }} task{{ dayTasks.length === 1 ? '' : 's' }} due
      <template v-if="overdue.length">
        · <span class="overdue">{{ overdue.length }} overdue</span></template
      >
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

    <template v-if="overdue.length">
      <h3 class="overdue section">Overdue</h3>
      <TaskTable
        :tasks="overdue"
        @open="tasks.open"
        @priority="(t, v) => tasks.update(t.id, { priority: v })"
        @status="(t, v) => tasks.update(t.id, { status: v })"
      @effort="(t, v) => tasks.update(t.id, { effort: v })"
      >
        <template #actions="{ task }">
          <SnoozeMenu @snooze="(due) => tasks.update(task.id, { due })" />
        </template>
      </TaskTable>
    </template>
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
.overdue {
  color: var(--p-highest);
  font-weight: 600;
}
.section {
  margin: 22px 0 8px;
  font-size: var(--fs-base);
}
</style>
