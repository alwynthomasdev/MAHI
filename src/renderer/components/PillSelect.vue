<script setup lang="ts" generic="T extends string">
/**
 * A compact native <select> with a coloured dot — used inline for a task's
 * priority, status and effort so they can be changed without opening the
 * task. `caption` names the field inside the pill when the value alone is
 * ambiguous. `compact` shrinks the pill to the dot alone — the value moves to
 * a tooltip and clicking the dot still opens the menu.
 */
const props = defineProps<{
  modelValue: T;
  options: readonly T[];
  colors: Record<T, string>;
  label: string;
  caption?: string;
  compact?: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: T] }>();

function onChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value as T;
  if (v !== props.modelValue) emit('update:modelValue', v);
}
</script>

<template>
  <label
    class="pill"
    :class="{ compact }"
    :style="{ '--dot': colors[modelValue] }"
    :title="compact ? `${label}: ${modelValue}` : undefined"
    @click.stop
  >
    <span class="dot" />
    <span v-if="caption && !compact" class="caption">{{ caption }}</span>
    <select :value="modelValue" :aria-label="label" @change="onChange">
      <option v-for="o in options" :key="o" :value="o">{{ o }}</option>
    </select>
  </label>
</template>

<style scoped>
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px 0 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface-2);
  font-size: var(--fs-sm);
}
.pill:hover {
  border-color: var(--text-faint);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dot);
  flex-shrink: 0;
}
.caption {
  color: var(--text-faint);
  font-size: var(--fs-xs);
}
select {
  border: none;
  background: transparent;
  padding: 3px 2px;
  font-size: var(--fs-sm);
  cursor: pointer;
}
select:focus-visible {
  outline: none;
}
option {
  background: var(--surface);
  color: var(--text);
}
/* Dot only: the select sits invisibly on top so the dot itself is the control. */
.pill.compact {
  position: relative;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border-color: transparent;
  background: transparent;
}
.pill.compact:hover,
.pill.compact:focus-within {
  border-color: var(--text-faint);
}
.pill.compact .dot {
  width: 10px;
  height: 10px;
}
.pill.compact select {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  opacity: 0;
}
</style>
