<script setup lang="ts">
import { computed, ref } from 'vue';
import { EFFORTS, PRIORITIES, STATUSES, type Task } from '@models/Task';
import { parseDate, weekDays } from '@shared/dates';
import { EFFORT_COLOR, PRIORITY_COLOR, STATUS_COLOR } from '../../lib/colors';
import { useTasksStore } from '../../stores/tasks';
import EffortBadge from '../EffortBadge.vue';
import PillSelect from '../PillSelect.vue';

/**
 * One lane per day, Monday–Sunday, headed by the day's effort against the
 * daily limit. Dragging a card to another day moves its due date there
 * (native HTML5 drag-and-drop, as in the Swimlane view). Days before today
 * are blank and take no drops — overdue tasks sit in today's lane.
 */
const emit = defineEmits<{ pick: [day: string] }>();
const tasks = useTasksStore();

const lanes = computed(() =>
  weekDays(tasks.calendarDate).map((day) => {
    const d = parseDate(day);
    const items = tasks.openByDue.get(day) ?? [];
    return {
      day,
      weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
      date: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      items,
      effort: tasks.effortByDue.get(day) ?? 0,
      past: day < tasks.today,
    };
  }),
);

const dragId = ref<string | null>(null);
const overDay = ref<string | null>(null);

function onDragStart(e: DragEvent, task: Task) {
  dragId.value = task.id;
  e.dataTransfer?.setData('text/plain', task.id);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd() {
  dragId.value = null;
  overDay.value = null;
}

/** Past days are not drop targets: leaving the event alone refuses the drop. */
function onDragOver(e: DragEvent, lane: { day: string; past: boolean }) {
  if (lane.past) return;
  e.preventDefault();
  overDay.value = lane.day;
}

async function onDrop(e: DragEvent, due: string) {
  const id = e.dataTransfer?.getData('text/plain') || dragId.value;
  onDragEnd();
  if (due < tasks.today) return;
  const task = tasks.items.find((t) => t.id === id);
  if (task && task.due !== due) await tasks.update(task.id, { due });
}
</script>

<template>
  <div class="week scroll-thin">
    <div
      v-for="lane in lanes"
      :key="lane.day"
      class="lane"
      :class="{
        over: overDay === lane.day,
        today: lane.day === tasks.today,
        past: lane.past,
      }"
      @dragover="onDragOver($event, lane)"
      @dragleave.self="overDay = null"
      @drop.prevent="onDrop($event, lane.day)"
    >
      <button
        class="lane-head ghost"
        :title="lane.past ? undefined : 'Open day'"
        :disabled="lane.past"
        @click="emit('pick', lane.day)"
      >
        <span class="weekday">{{ lane.weekday }}</span>
        <span class="date">{{ lane.date }}</span>
        <span class="spacer" />
        <EffortBadge v-if="lane.effort" :total="lane.effort" compact />
        <span v-if="!lane.past" class="count">{{ lane.items.length }}</span>
      </button>
      <div class="cards scroll-thin">
        <article
          v-for="t in lane.items"
          :key="t.id"
          class="card task-card"
          :class="{ dragging: dragId === t.id }"
          draggable="true"
          @dragstart="onDragStart($event, t)"
          @dragend="onDragEnd"
          @click="tasks.open(t)"
        >
          <div class="title">{{ t.title }}</div>
          <div class="foot">
            <div class="labels">
              <span v-for="l in t.labels" :key="l" class="label">{{ l }}</span>
            </div>
            <div class="meta">
              <PillSelect
                :model-value="t.priority"
                :options="PRIORITIES"
                :colors="PRIORITY_COLOR"
                label="Priority"
                compact
                @update:model-value="(v) => tasks.update(t.id, { priority: v })"
              />
              <PillSelect
                :model-value="t.status"
                :options="STATUSES"
                :colors="STATUS_COLOR"
                label="Status"
                compact
                @update:model-value="(v) => tasks.update(t.id, { status: v })"
              />
              <PillSelect
                :model-value="t.effort"
                :options="EFFORTS"
                :colors="EFFORT_COLOR"
                label="Effort"
                compact
                @update:model-value="(v) => tasks.update(t.id, { effort: v })"
              />
            </div>
          </div>
        </article>
        <div v-if="!lane.items.length && !lane.past" class="drop-hint muted">Drop here</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.week {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, minmax(170px, 1fr));
  gap: 8px;
  overflow-x: auto;
  min-height: 0;
}
.lane {
  display: flex;
  flex-direction: column;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  min-height: 0;
}
.lane.today {
  border-color: var(--accent);
}
.lane.over {
  border-color: var(--accent);
  background: var(--hover-bg);
}
.lane-head {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 10px;
  font-size: var(--fs-md);
  text-align: left;
  flex-shrink: 0;
}
.lane-head:hover {
  border-color: transparent;
  text-decoration: underline;
}
.lane.past {
  background: transparent;
  border-style: dashed;
  opacity: 0.45;
}
.lane.past .lane-head {
  opacity: 1;
  cursor: default;
  text-decoration: none;
}
.weekday {
  font-weight: 600;
}
.date {
  color: var(--text-dim);
}
.lane.today .weekday,
.lane.today .date {
  color: var(--accent);
  font-weight: 700;
}
.count {
  color: var(--text-faint);
  font-family: var(--mono);
  font-size: var(--fs-xs);
}
.cards {
  flex: 1;
  overflow-y: auto;
  padding: 0 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.task-card {
  padding: 8px 9px;
  cursor: grab;
}
.task-card:hover {
  border-color: var(--text-faint);
}
.task-card.dragging {
  opacity: 0.4;
}
.title {
  font-size: var(--fs-md);
  word-break: break-word;
}
.foot {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  margin-top: 5px;
}
.labels {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.meta {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.drop-hint {
  text-align: center;
  font-size: var(--fs-sm);
  padding: 14px 0;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}
</style>
