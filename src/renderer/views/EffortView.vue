<script setup lang="ts">
import { computed, ref } from 'vue';
import { labelKey } from '@models/Report';
import { LABEL_COLORS, NO_LABEL_COLOR, OTHER_COLOR } from '../lib/colors';
import { useTasksStore } from '../stores/tasks';
import EffortPie, { type PieSlice } from '../components/EffortPie.vue';

/**
 * Where effort goes, by label: a pie and a table, for what is done (Done and
 * Archive) or what is planned (everything else). Tasks with no effort are left
 * out. A task with several labels counts in full towards each, so shares are
 * of the labelled effort, not of the total. The toggle lives in the store so it
 * survives switching tabs.
 */
const tasks = useTasksStore();

const SCOPES = [
  { value: 'done', label: 'Done' },
  { value: 'planned', label: 'Planned' },
] as const;

const OTHER = '\u0000other';

const report = computed(() => tasks.effortReport);
const sliceTotal = computed(() => report.value.rows.reduce((sum, r) => sum + r.points, 0));

/** Table rows, most effort first; `slice` is the pie slice the row belongs to. */
const rows = computed(() =>
  report.value.rows.map((r) => {
    const key = labelKey(r.label);
    const slot = r.label ? tasks.chartLabels.indexOf(key) : -1;
    return {
      ...r,
      key,
      name: r.label || 'No label',
      slot,
      slice: !r.label || slot >= 0 ? key : OTHER,
      color: !r.label ? NO_LABEL_COLOR : slot >= 0 ? LABEL_COLORS[slot] : OTHER_COLOR,
      share: sliceTotal.value ? Math.round((r.points / sliceTotal.value) * 100) : 0,
    };
  }),
);

/** Slices in palette order, then "Other" (labels past the palette), then "No label". */
const slices = computed<PieSlice[]>(() => {
  const own = rows.value
    .filter((r) => r.slot >= 0)
    .sort((a, b) => a.slot - b.slot)
    .map((r) => ({ key: r.key, label: r.name, value: r.points, color: r.color }));
  const other = rows.value.filter((r) => r.slice === OTHER);
  if (other.length) {
    own.push({
      key: OTHER,
      label: `Other (${other.length} labels)`,
      value: other.reduce((sum, r) => sum + r.points, 0),
      color: OTHER_COLOR,
    });
  }
  const none = rows.value.find((r) => !r.label);
  if (none) own.push({ key: none.key, label: none.name, value: none.points, color: none.color });
  return own;
});

const labelCount = computed(() => rows.value.filter((r) => r.label).length);
const hover = ref<string | null>(null);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
</script>

<template>
  <section>
    <header class="view-head head">
      <h2>Effort</h2>
      <span class="muted">Where effort goes, by label</span>
      <span class="spacer" />
      <div class="seg" role="radiogroup" aria-label="Show">
        <button
          v-for="s in SCOPES"
          :key="s.value"
          role="radio"
          :aria-checked="tasks.reportScope === s.value"
          :class="{ on: tasks.reportScope === s.value }"
          @click="tasks.reportScope = s.value"
        >
          {{ s.label }}
        </button>
      </div>
    </header>

    <p v-if="!report.taskCount" class="muted empty">
      {{
        tasks.reportScope === 'done'
          ? 'No Done or archived task has an effort yet.'
          : 'No planned task has an effort yet.'
      }}
    </p>

    <div v-else class="card panel">
      <div class="chart">
        <EffortPie :slices="slices" :active="hover" @hover="(k) => (hover = k)">
          <span class="value">{{ report.total }}</span>
          <span class="muted caption">effort {{ tasks.reportScope }}</span>
        </EffortPie>
      </div>
      <p class="muted counts">
        {{ plural(report.taskCount, 'task') }} · {{ plural(labelCount, 'label') }}
      </p>

      <table>
        <thead>
          <tr>
            <th>Label</th>
            <th class="num">Effort</th>
            <th class="num">Tasks</th>
            <th class="num">Share</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in rows"
            :key="r.key"
            :class="{ on: hover === r.slice }"
            @mouseenter="hover = r.slice"
            @mouseleave="hover = null"
          >
            <td>
              <span class="swatch" :style="{ background: r.color }" />
              <span :class="{ muted: !r.label }">{{ r.name }}</span>
            </td>
            <td class="num">{{ r.points }}</td>
            <td class="num">{{ r.tasks }}</td>
            <td class="num">{{ r.share }}%</td>
          </tr>
        </tbody>
      </table>
      <p class="muted note">
        A task with several labels counts in full towards each, so the labels can add up to more
        than the total.
        <template v-if="labelCount > LABEL_COLORS.length">
          The chart colours the {{ LABEL_COLORS.length }} labels with the most effort overall; the
          rest share "Other".
        </template>
      </p>
    </div>
  </section>
</template>

<style scoped>
.head {
  align-items: center;
}
.empty {
  padding: 24px 0;
}
.panel {
  max-width: 620px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-5) var(--space-4);
}
.chart {
  width: 300px;
  max-width: 100%;
  margin: 0 auto;
}
.value {
  font-size: 44px;
  font-weight: 600;
  line-height: 1.1;
}
.caption {
  font-size: var(--fs-sm);
}
.counts {
  margin: var(--space-3) 0 var(--space-4);
  text-align: center;
  font-size: var(--fs-sm);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-md);
}
th,
td {
  padding: 6px 14px;
  text-align: left;
}
th {
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}
.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
tbody tr.on {
  background: var(--hover-bg);
}
.swatch {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 8px;
  border-radius: 2px;
}
.note {
  margin: var(--space-4) 0 0;
  text-align: center;
  font-size: var(--fs-xs);
}
</style>
