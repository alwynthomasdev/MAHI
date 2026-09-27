<script setup lang="ts">
import { useTasksStore } from '../stores/tasks';
import FilterBar from '../components/FilterBar.vue';
import TaskTable from '../components/TaskTable.vue';

const tasks = useTasksStore();
</script>

<template>
  <section>
    <header class="view-head">
      <h2>All tasks</h2>
      <span class="muted">{{ tasks.listTasks.length }} shown</span>
    </header>
    <FilterBar />
    <TaskTable
      :tasks="tasks.listTasks"
      empty="No tasks match."
      @open="tasks.open"
      @priority="(t, v) => tasks.update(t.id, { priority: v })"
      @status="(t, v) => tasks.update(t.id, { status: v })"
    />
  </section>
</template>
