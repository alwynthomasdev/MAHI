<script setup lang="ts">
import { computed } from 'vue';
import { effortLoad, type EffortLoad } from '@models/Effort';
import { useSettingsStore } from '../stores/settings';

/**
 * A day's effort against the daily limit: green, amber over 70% of the limit,
 * red over it. `compact` drops the wording for calendar cells and lane heads.
 */
const props = defineProps<{ total: number; compact?: boolean }>();
const settings = useSettingsStore();

const NOTE: Record<EffortLoad, string> = {
  ok: 'Within limit',
  warn: 'Near limit',
  over: 'Over limit',
};

const load = computed(() => effortLoad(props.total, settings.effortLimit));
const title = computed(
  () => `Effort ${props.total} of ${settings.effortLimit} — ${NOTE[load.value].toLowerCase()}`,
);
</script>

<template>
  <span class="effort" :class="[load, { compact }]" :title="title">
    <span class="dot" />
    <template v-if="!compact">Effort</template>
    <b>{{ total }}</b
    >/ {{ settings.effortLimit }}
    <template v-if="!compact && load !== 'ok'">· {{ NOTE[load] }}</template>
  </span>
</template>

<style scoped>
.effort {
  --c: var(--ok);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 9px;
  border: 1px solid var(--c);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--c) 14%, transparent);
  font-size: var(--fs-sm);
  font-weight: 400;
  color: var(--text);
  white-space: nowrap;
}
.effort.warn {
  --c: var(--warn);
}
.effort.over {
  --c: var(--danger);
}
.effort.compact {
  gap: 4px;
  padding: 0 7px;
  font-size: var(--fs-xs);
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--c);
  flex-shrink: 0;
}
</style>
