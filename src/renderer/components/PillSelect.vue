<script setup lang="ts" generic="T extends string">
/**
 * A compact native <select> with a coloured dot — used inline for a task's
 * priority and status so they can be changed without opening the task.
 */
const props = defineProps<{
  modelValue: T;
  options: readonly T[];
  colors: Record<T, string>;
  label: string;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: T] }>();

function onChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value as T;
  if (v !== props.modelValue) emit('update:modelValue', v);
}
</script>

<template>
  <label class="pill" :style="{ '--dot': colors[modelValue] }" @click.stop>
    <span class="dot" />
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
</style>
