<script setup lang="ts">
import { computed, watch } from 'vue';
import { addToDate, parseDate, startOfMonth, weekDays } from '@shared/dates';
import { useTasksStore } from '../stores/tasks';
import CalendarMonth from '../components/calendar/CalendarMonth.vue';
import CalendarWeek from '../components/calendar/CalendarWeek.vue';
import CalendarDay from '../components/calendar/CalendarDay.vue';

/**
 * Month (counts per day) · Week (a lane per day, drag to reschedule) · Day
 * (a task list). Only open tasks — Done and Archive are left out. It looks
 * forward only: past days are blank and out of reach, and overdue tasks fall
 * into today. Mode and date live in the store so they survive switching tabs.
 */
const tasks = useTasksStore();

const MODES = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
] as const;

const fmt = (day: string, opts: Intl.DateTimeFormatOptions) =>
  parseDate(day).toLocaleDateString(undefined, opts);

const title = computed(() => {
  const d = tasks.calendarDate;
  if (tasks.calendarMode === 'month') return fmt(d, { month: 'long', year: 'numeric' });
  if (tasks.calendarMode === 'day') {
    return fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  const days = weekDays(d);
  return `${fmt(days[0], { day: 'numeric', month: 'short' })} – ${fmt(days[6], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
});

/** The first day of the month / week / day on show. */
const periodStart = computed(() => {
  const d = tasks.calendarDate;
  if (tasks.calendarMode === 'month') return startOfMonth(d);
  return tasks.calendarMode === 'week' ? weekDays(d)[0] : d;
});

/** The calendar only looks forward: no stepping back past the period holding today. */
const canGoBack = computed(() => periodStart.value > tasks.today);

function step(dir: 1 | -1) {
  if (dir === -1 && !canGoBack.value) return;
  const d = tasks.calendarDate;
  tasks.calendarDate =
    tasks.calendarMode === 'month'
      ? addToDate(startOfMonth(d), { months: dir })
      : addToDate(d, { days: tasks.calendarMode === 'week' ? 7 * dir : dir });
}

// Never rest on a past day — after stepping back to this month, or across midnight.
watch(
  () => [tasks.calendarDate, tasks.today],
  () => {
    if (tasks.calendarDate < tasks.today) tasks.calendarDate = tasks.today;
  },
  { immediate: true },
);

function goToday() {
  tasks.refreshToday();
  tasks.calendarDate = tasks.today;
}

function openDay(day: string) {
  tasks.calendarDate = day;
  tasks.calendarMode = 'day';
}
</script>

<template>
  <section class="calendar-view">
    <header class="view-head cal-head">
      <h2>Calendar</h2>
      <div class="nav">
        <button class="ghost arrow" title="Previous" :disabled="!canGoBack" @click="step(-1)">
          ‹
        </button>
        <button @click="goToday">Today</button>
        <button class="ghost arrow" title="Next" @click="step(1)">›</button>
      </div>
      <span class="title">{{ title }}</span>
      <span class="spacer" />
      <div class="seg" role="radiogroup" aria-label="View">
        <button
          v-for="m in MODES"
          :key="m.value"
          role="radio"
          :aria-checked="tasks.calendarMode === m.value"
          :class="{ on: tasks.calendarMode === m.value }"
          @click="tasks.calendarMode = m.value"
        >
          {{ m.label }}
        </button>
      </div>
    </header>

    <CalendarMonth v-if="tasks.calendarMode === 'month'" @pick="openDay" />
    <CalendarWeek v-else-if="tasks.calendarMode === 'week'" @pick="openDay" />
    <CalendarDay v-else />
  </section>
</template>

<style scoped>
.calendar-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.cal-head {
  align-items: center;
}
.nav {
  display: flex;
  align-items: center;
  gap: 2px;
}
.arrow {
  font-size: 18px;
  line-height: 1;
  padding: 3px 10px;
}
.title {
  font-weight: 600;
  font-size: var(--fs-base);
}
</style>
