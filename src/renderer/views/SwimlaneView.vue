<script setup lang="ts">
import { computed, ref } from 'vue';
import { sortTasks } from '@models/Filter';
import { EFFORTS, PRIORITIES, type Status, type Task } from '@models/Task';
import { formatDue } from '@shared/dates';
import { EFFORT_COLOR, PRIORITY_COLOR, STATUS_COLOR } from '../lib/colors';
import { useTasksStore } from '../stores/tasks';
import EffortBadge from '../components/EffortBadge.vue';
import PillSelect from '../components/PillSelect.vue';

/**
 * Scheduled · WIP · Done side by side, with On Hold as a full-width lane along
 * the bottom. Native HTML5 drag-and-drop moves tasks between lanes. On
 * "Today & overdue" the header carries today's effort against the daily limit.
 */
const tasks = useTasksStore();

const LAYOUT: Status[] = ['Scheduled', 'WIP', 'Done', 'On Hold'];

const SCOPES = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today & overdue' },
] as const;

const inScope = (t: Task) => tasks.swimlaneScope === 'all' || t.due <= tasks.today;

const lanes = computed(() =>
  LAYOUT.map((status) => ({
    status,
    wide: status === 'On Hold',
    items: sortTasks(
      tasks.items.filter((t) => t.status === status && inScope(t)),
      { key: 'due', dir: 'asc' },
    ),
  })),
);

const dragId = ref<string | null>(null);
const overLane = ref<Status | null>(null);

function onDragStart(e: DragEvent, task: Task) {
  dragId.value = task.id;
  e.dataTransfer?.setData('text/plain', task.id);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd() {
  dragId.value = null;
  overLane.value = null;
}

async function onDrop(e: DragEvent, status: Status) {
  const id = e.dataTransfer?.getData('text/plain') || dragId.value;
  onDragEnd();
  const task = tasks.items.find((t) => t.id === id);
  if (task && task.status !== status) await tasks.update(task.id, { status });
}

const archiveAll = async () => {
  for (const t of lanes.value.find((l) => l.status === 'Done')?.items ?? []) {
    await tasks.update(t.id, { status: 'Archive' });
  }
};
</script>

<template>
  <section class="board-view">
    <header class="view-head">
      <h2>Swimlanes</h2>
      <div class="seg" role="radiogroup" aria-label="Show">
        <button
          v-for="s in SCOPES"
          :key="s.value"
          role="radio"
          :aria-checked="tasks.swimlaneScope === s.value"
          :class="{ on: tasks.swimlaneScope === s.value }"
          @click="tasks.swimlaneScope = s.value"
        >
          {{ s.label }}
        </button>
      </div>
      <EffortBadge v-if="tasks.swimlaneScope === 'today'" :total="tasks.todayEffort" />
    </header>
    <div class="board scroll-thin">
      <div
        v-for="lane in lanes"
        :key="lane.status"
        class="lane"
        :class="{ over: overLane === lane.status, wide: lane.wide }"
        @dragover.prevent="overLane = lane.status"
        @dragleave.self="overLane = null"
        @drop.prevent="onDrop($event, lane.status)"
      >
        <div class="lane-head" :style="{ '--c': STATUS_COLOR[lane.status] }">
          <span class="dot" />
          <span class="name">{{ lane.status }}</span>
          <span class="count">{{ lane.items.length }}</span>
          <span class="spacer" />
          <button
            v-if="lane.status === 'Done' && lane.items.length"
            class="ghost tiny"
            title="Archive every Done task"
            @click="archiveAll"
          >
            Archive all
          </button>
        </div>
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
            <div v-if="t.labels.length" class="labels">
              <span v-for="l in t.labels" :key="l" class="label">{{ l }}</span>
            </div>
            <div class="meta">
              <PillSelect
                :model-value="t.priority"
                :options="PRIORITIES"
                :colors="PRIORITY_COLOR"
                label="Priority"
                @update:model-value="(v) => tasks.update(t.id, { priority: v })"
              />
              <PillSelect
                :model-value="t.effort"
                :options="EFFORTS"
                :colors="EFFORT_COLOR"
                label="Effort"
                caption="Effort"
                @update:model-value="(v) => tasks.update(t.id, { effort: v })"
              />
              <span class="due" :class="formatDue(t.due).tone">{{ formatDue(t.due).text }}</span>
              <span class="spacer" />
              <button
                v-if="t.status === 'Done'"
                class="archive-btn"
                title="Archive"
                @click.stop="tasks.update(t.id, { status: 'Archive' })"
              >
                Archive
              </button>
            </div>
          </article>
          <div v-if="!lane.items.length" class="drop-hint muted">Drop tasks here</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.board-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.board {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  grid-template-rows: minmax(0, 1fr) minmax(170px, 32%);
  gap: 12px;
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
.lane.wide {
  grid-column: 1 / -1;
}
.lane.over {
  border-color: var(--accent);
  background: var(--hover-bg);
}
.lane-head {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 12px;
  font-weight: 600;
  font-size: var(--fs-md);
}
.lane-head .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--c);
}
.count {
  color: var(--text-faint);
  font-family: var(--mono);
  font-size: var(--fs-xs);
}
.tiny {
  font-size: var(--fs-xs);
  padding: 2px 6px;
  font-weight: 400;
}
.cards {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lane.wide .cards {
  flex-direction: row;
  align-items: flex-start;
  overflow-x: auto;
  overflow-y: hidden;
}
.lane.wide .task-card {
  flex: 0 0 260px;
}
.lane.wide .drop-hint {
  flex: 1;
}
.task-card {
  padding: 10px 11px;
  cursor: grab;
}
.task-card:hover {
  border-color: var(--text-faint);
}
.task-card.dragging {
  opacity: 0.4;
}
.title {
  font-size: var(--fs-base);
  word-break: break-word;
}
.labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.due {
  font-size: var(--fs-xs);
  color: var(--text-dim);
}
.due.today {
  color: var(--accent);
  font-weight: 600;
}
.due.overdue {
  color: var(--p-highest);
  font-weight: 600;
}
.archive-btn {
  font-size: var(--fs-xs);
  padding: 2px 8px;
  border-color: var(--archive);
  color: var(--archive);
  background: transparent;
}
.drop-hint {
  text-align: center;
  font-size: var(--fs-sm);
  padding: 18px 0;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}
</style>
