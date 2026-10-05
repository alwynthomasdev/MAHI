<script setup lang="ts">
import { computed, ref } from 'vue';
import { parseDate } from '@shared/dates';
import { SNOOZE, type Snooze } from '../lib/snooze';
import { useTasksStore } from '../stores/tasks';

/**
 * The Postpone menu. `from` is the day the task is being moved from: it picks
 * the wording and shows where each preset lands. Leave it out when the tasks
 * sit on different days — each then moves from its own day.
 */
const props = defineProps<{ from?: string; align?: 'left' | 'right' }>();
const emit = defineEmits<{ snooze: [preset: Snooze] }>();
const tasks = useTasksStore();
const open = ref(false);

const options = computed(() =>
  SNOOZE.map((preset) => ({
    preset,
    label: props.from === tasks.today ? preset.label : preset.laterLabel,
    hint: props.from
      ? parseDate(preset.to(props.from, tasks.today)).toLocaleDateString(undefined, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      : '',
  })),
);

function pick(preset: Snooze) {
  open.value = false;
  emit('snooze', preset);
}
</script>

<template>
  <span class="snooze" @click.stop>
    <button class="ghost trigger" title="Postpone" @click="open = !open">Postpone ▾</button>
    <template v-if="open">
      <div class="menu-backdrop" @click="open = false" />
      <div class="menu" :class="{ right: align !== 'left' }" role="menu">
        <button
          v-for="o in options"
          :key="o.preset.label"
          class="menu-opt"
          role="menuitem"
          @click="pick(o.preset)"
        >
          <span>{{ o.label }}</span>
          <span v-if="o.hint" class="hint">{{ o.hint }}</span>
        </button>
      </div>
    </template>
  </span>
</template>

<style scoped>
.snooze {
  position: relative;
  display: inline-block;
}
.trigger {
  font-size: var(--fs-sm);
  padding: 3px 8px;
  color: var(--text-dim);
}
.menu.right {
  left: auto;
  right: 0;
}
.menu-opt {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  white-space: nowrap;
}
.hint {
  color: var(--text-faint);
  font-size: var(--fs-xs);
}
</style>
