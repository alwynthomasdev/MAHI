<script setup lang="ts">
import { ref } from 'vue';
import { SNOOZE } from '../lib/snooze';

const emit = defineEmits<{ snooze: [due: string] }>();
const open = ref(false);

function pick(to: () => string) {
  open.value = false;
  emit('snooze', to());
}
</script>

<template>
  <span class="snooze" @click.stop>
    <button class="ghost trigger" title="Postpone" @click="open = !open">Postpone ▾</button>
    <template v-if="open">
      <div class="menu-backdrop" @click="open = false" />
      <div class="menu right" role="menu">
        <button
          v-for="s in SNOOZE"
          :key="s.label"
          class="menu-opt"
          role="menuitem"
          @click="pick(s.to)"
        >
          {{ s.label }}
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
</style>
