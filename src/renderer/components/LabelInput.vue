<script setup lang="ts">
import { computed, ref } from 'vue';

/** Chip input for labels, suggesting existing ones. Enter or comma commits. */
const props = defineProps<{ modelValue: string[]; suggestions: string[] }>();
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();

const draft = ref('');
const listId = `labels-${Math.random().toString(36).slice(2)}`;

const available = computed(() => {
  const have = new Set(props.modelValue.map((l) => l.toLowerCase()));
  return props.suggestions.filter((s) => !have.has(s.toLowerCase()));
});

function commit() {
  const v = draft.value.replace(/,/g, '').trim();
  draft.value = '';
  if (!v || props.modelValue.some((l) => l.toLowerCase() === v.toLowerCase())) return;
  emit('update:modelValue', [...props.modelValue, v]);
}

function remove(label: string) {
  emit(
    'update:modelValue',
    props.modelValue.filter((l) => l !== label),
  );
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    commit();
  } else if (e.key === 'Backspace' && !draft.value && props.modelValue.length) {
    remove(props.modelValue[props.modelValue.length - 1]);
  }
}
</script>

<template>
  <div class="labels-input">
    <span v-for="l in modelValue" :key="l" class="label chip">
      {{ l }}
      <button type="button" class="x" :aria-label="`Remove ${l}`" @click="remove(l)">✕</button>
    </span>
    <input
      v-model="draft"
      :list="listId"
      placeholder="Add label…"
      @keydown="onKeydown"
      @blur="commit"
    />
    <datalist :id="listId">
      <option v-for="s in available" :key="s" :value="s" />
    </datalist>
  </div>
</template>

<style scoped>
.labels-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface-2);
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--fs-xs);
}
.x {
  border: none;
  background: none;
  padding: 0;
  font-size: 9px;
  color: var(--text-faint);
}
input {
  flex: 1;
  min-width: 100px;
  border: none;
  background: transparent;
  padding: 3px 2px;
}
input:focus-visible {
  outline: none;
}
</style>
