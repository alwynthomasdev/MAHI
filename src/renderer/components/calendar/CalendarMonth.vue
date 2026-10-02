<script setup lang="ts">
import { computed } from 'vue';
import { totalEffort } from '@models/Effort';
import { monthWeeks, parseDate } from '@shared/dates';
import { useTasksStore } from '../../stores/tasks';
import EffortBadge from '../EffortBadge.vue';

/**
 * A month grid showing how many open tasks fall on each day, and their effort
 * against the daily limit; click a day to open it.
 */
const emit = defineEmits<{ pick: [day: string] }>();
const tasks = useTasksStore();

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const month = computed(() => tasks.calendarDate.slice(0, 7));
const weeks = computed(() => monthWeeks(tasks.calendarDate));

const countOn = (day: string) => tasks.openByDue.get(day)?.length ?? 0;
const effortOn = (day: string) => totalEffort(tasks.openByDue.get(day) ?? []);
</script>

<template>
  <div class="month">
    <div class="weekdays">
      <span v-for="w in WEEKDAYS" :key="w">{{ w }}</span>
    </div>
    <div class="grid" :style="{ gridTemplateRows: `repeat(${weeks.length}, minmax(64px, 1fr))` }">
      <template v-for="week in weeks" :key="week[0]">
        <button
          v-for="day in week"
          :key="day"
          class="cell"
          :class="{
            outside: day.slice(0, 7) !== month,
            today: day === tasks.today,
            past: day < tasks.today,
          }"
          :title="parseDate(day).toLocaleDateString(undefined, { dateStyle: 'full' })"
          @click="emit('pick', day)"
        >
          <span class="top">
            <span class="num">{{ Number(day.slice(8)) }}</span>
            <EffortBadge v-if="effortOn(day)" :total="effortOn(day)" compact />
          </span>
          <span v-if="countOn(day)" class="count">
            <b>{{ countOn(day) }}</b> task{{ countOn(day) === 1 ? '' : 's' }}
          </span>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.month {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  padding-bottom: 6px;
  font-size: var(--fs-xs);
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}
.grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  min-height: 0;
}
.cell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  padding: 6px 8px 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  text-align: left;
}
.cell:hover {
  border-color: var(--accent);
  background: var(--hover-bg);
}
.cell.outside {
  background: transparent;
}
.cell.outside .num {
  color: var(--text-faint);
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}
.num {
  font-family: var(--mono);
  font-size: var(--fs-sm);
  color: var(--text-dim);
}
.cell.today {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--accent);
}
.cell.today .num {
  color: var(--accent);
  font-weight: 700;
}
.count {
  align-self: center;
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  background: var(--surface-2);
  border: 1px solid var(--border);
  font-size: var(--fs-xs);
  color: var(--text-dim);
  white-space: nowrap;
}
.count b {
  color: var(--text);
  font-size: var(--fs-base);
}
.cell.today .count {
  border-color: var(--accent);
}
.cell.past .count {
  border-color: var(--p-highest);
  color: var(--p-highest);
}
.cell.past .count b {
  color: var(--p-highest);
}
</style>
