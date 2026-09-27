<script setup lang="ts">
import { computed, ref } from 'vue';

/** A dropdown of checkboxes for the list view filters. */
const props = defineProps<{ label: string; options: readonly string[]; modelValue: string[] }>();
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();

const open = ref(false);
const summary = computed(() =>
  props.modelValue.length === 0
    ? props.label
    : props.modelValue.length === 1
      ? `${props.label}: ${props.modelValue[0]}`
      : `${props.label}: ${props.modelValue.length}`,
);

function toggle(o: string) {
  emit(
    'update:modelValue',
    props.modelValue.includes(o)
      ? props.modelValue.filter((v) => v !== o)
      : [...props.modelValue, o],
  );
}
</script>

<template>
  <span class="ms">
    <button type="button" :class="{ active: modelValue.length }" @click="open = !open">
      {{ summary }} ▾
    </button>
    <template v-if="open">
      <div class="menu-backdrop" @click="open = false" />
      <div class="menu scroll-thin">
        <div v-if="!options.length" class="muted none">None yet</div>
        <label v-for="o in options" :key="o" class="menu-opt check">
          <input type="checkbox" :checked="modelValue.includes(o)" @change="toggle(o)" />
          {{ o }}
        </label>
        <button
          v-if="modelValue.length"
          class="menu-opt clear"
          @click="emit('update:modelValue', [])"
        >
          Clear
        </button>
      </div>
    </template>
  </span>
</template>

<style scoped>
.ms {
  position: relative;
}
button {
  font-size: var(--fs-md);
}
button.active {
  border-color: var(--accent);
  color: var(--accent);
}
.menu {
  max-height: 280px;
  overflow-y: auto;
}
.check {
  display: flex;
  align-items: center;
  gap: 6px;
}
.clear {
  color: var(--text-dim);
}
.none {
  padding: 5px 8px;
  font-size: var(--fs-sm);
}
</style>
