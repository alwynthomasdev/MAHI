<script setup lang="ts">
import { computed } from 'vue';

/**
 * A plain SVG ring chart. Slices start at 12 o'clock and run clockwise in the
 * order given; `active` (a slice key) dims the others, and hovering a slice
 * emits `hover` so the table below can highlight the same row. The default
 * slot sits in the middle of the ring.
 */
export interface PieSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

const props = defineProps<{ slices: PieSlice[]; active?: string | null }>();
const emit = defineEmits<{ hover: [key: string | null] }>();

const R = 100;
const HOLE = 62;

const total = computed(() => props.slices.reduce((sum, s) => sum + s.value, 0));

function point(fraction: number, r: number): string {
  const a = fraction * 2 * Math.PI;
  return `${(r * Math.sin(a)).toFixed(3)} ${(-r * Math.cos(a)).toFixed(3)}`;
}

/** A full ring: an arc cannot start and end on the same point, so two halves each way. */
const RING =
  `M0 ${-R} A${R} ${R} 0 1 1 0 ${R} A${R} ${R} 0 1 1 0 ${-R} Z ` +
  `M0 ${-HOLE} A${HOLE} ${HOLE} 0 1 0 0 ${HOLE} A${HOLE} ${HOLE} 0 1 0 0 ${-HOLE} Z`;

const arcs = computed(() => {
  let from = 0;
  return props.slices.map((s) => {
    const share = total.value ? s.value / total.value : 0;
    const to = from + share;
    const big = share > 0.5 ? 1 : 0;
    const d =
      share > 0.9999
        ? RING
        : `M${point(from, R)} A${R} ${R} 0 ${big} 1 ${point(to, R)} ` +
          `L${point(to, HOLE)} A${HOLE} ${HOLE} 0 ${big} 0 ${point(from, HOLE)} Z`;
    from = to;
    return { ...s, d, title: `${s.label}: ${s.value} (${Math.round(share * 100)}%)` };
  });
});
</script>

<template>
  <div class="pie">
    <svg viewBox="-102 -102 204 204" role="img" aria-label="Effort by label">
      <path
        v-for="a in arcs"
        :key="a.key"
        :d="a.d"
        :fill="a.color"
        fill-rule="evenodd"
        class="slice"
        :class="{ dim: active && active !== a.key }"
        @mouseenter="emit('hover', a.key)"
        @mouseleave="emit('hover', null)"
      >
        <title>{{ a.title }}</title>
      </path>
    </svg>
    <div class="middle"><slot /></div>
  </div>
</template>

<style scoped>
.pie {
  position: relative;
}
svg {
  display: block;
  width: 100%;
  height: auto;
}
.slice {
  stroke: var(--surface);
  stroke-width: 2;
  stroke-linejoin: round;
  transition: opacity 0.12s;
}
.slice.dim {
  opacity: 0.35;
}
.middle {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
</style>
