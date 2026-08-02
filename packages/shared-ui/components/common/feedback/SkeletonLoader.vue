<script setup>
/**
 * SkeletonLoader — content placeholders while data loads.
 *
 * Offers a few preset layouts common to the dashboard so pages don't hand-roll
 * skeletons: text lines, cards, a KPI row, a table, and a list. Purely
 * presentational; token-driven; respects reduced-motion.
 */
defineProps({
  // 'text' | 'card' | 'cards' | 'kpis' | 'table' | 'list'
  variant: {
    type: String,
    default: 'text',
    validator: (v) => ['text', 'card', 'cards', 'kpis', 'table', 'list'].includes(v),
  },
  // Number of repeated blocks (rows/cards/items depending on variant).
  count: { type: Number, default: 3 },
  // For the table variant: number of columns.
  columns: { type: Number, default: 5 },
})
</script>

<template>
  <div class="skeleton" role="status" aria-live="polite" aria-busy="true">
    <span class="skeleton-sr">در حال بارگذاری…</span>

    <!-- Simple text lines -->
    <template v-if="variant === 'text'">
      <span
        v-for="n in count"
        :key="n"
        class="sk sk-line"
        :style="{ width: n === count ? '60%' : '100%' }"
      ></span>
    </template>

    <!-- Single card -->
    <div v-else-if="variant === 'card'" class="sk-card">
      <span class="sk sk-line sk-line--lg" style="width: 40%"></span>
      <span class="sk sk-line"></span>
      <span class="sk sk-line"></span>
      <span class="sk sk-line" style="width: 70%"></span>
    </div>

    <!-- Grid of cards -->
    <div v-else-if="variant === 'cards'" class="sk-cards">
      <div v-for="n in count" :key="n" class="sk-card">
        <span class="sk sk-circle"></span>
        <span class="sk sk-line" style="width: 80%"></span>
        <span class="sk sk-line" style="width: 55%"></span>
      </div>
    </div>

    <!-- KPI row -->
    <div v-else-if="variant === 'kpis'" class="sk-kpis">
      <div v-for="n in count" :key="n" class="sk-kpi">
        <span class="sk sk-square"></span>
        <div class="sk-kpi-text">
          <span class="sk sk-line sk-line--lg" style="width: 3rem"></span>
          <span class="sk sk-line" style="width: 5rem"></span>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div v-else-if="variant === 'table'" class="sk-table">
      <div class="sk-table-row sk-table-head">
        <span v-for="c in columns" :key="`h-${c}`" class="sk sk-line"></span>
      </div>
      <div v-for="r in count" :key="`r-${r}`" class="sk-table-row">
        <span v-for="c in columns" :key="`c-${r}-${c}`" class="sk sk-line"></span>
      </div>
    </div>

    <!-- List (avatar + two lines) -->
    <div v-else-if="variant === 'list'" class="sk-list">
      <div v-for="n in count" :key="n" class="sk-list-item">
        <span class="sk sk-square"></span>
        <div class="sk-list-text">
          <span class="sk sk-line" style="width: 70%"></span>
          <span class="sk sk-line" style="width: 45%"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton {
  width: 100%;
}

.skeleton-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sk {
  display: block;
  background: linear-gradient(
    90deg,
    var(--ds-color-surface-alt) 25%,
    var(--ds-color-surface-hover) 37%,
    var(--ds-color-surface-alt) 63%
  );
  background-size: 400% 100%;
  border-radius: var(--ds-radius-sm);
  animation: sk-shimmer 1.4s ease infinite;
}

.sk-line { height: 0.85rem; margin-bottom: var(--ds-space-3); }
.sk-line--lg { height: 1.4rem; }
.sk-circle { width: 3rem; height: 3rem; border-radius: var(--ds-radius-circle); }
.sk-square { width: 3rem; height: 3rem; border-radius: var(--ds-radius-md); flex-shrink: 0; }

/* Card */
.sk-card {
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  padding: var(--ds-space-5);
}

/* Cards grid */
.sk-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--ds-space-4);
}

/* KPIs */
.sk-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--ds-space-4);
}
.sk-kpi {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  padding: var(--ds-space-5);
}
.sk-kpi-text { flex: 1; }
.sk-kpi-text .sk-line:last-child { margin-bottom: 0; }

/* Table */
.sk-table {
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  padding: var(--ds-space-4) var(--ds-space-5);
}
.sk-table-row {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: var(--ds-space-4);
}
.sk-table-row .sk-line { margin-bottom: var(--ds-space-4); }
.sk-table-head .sk-line { height: 1.1rem; }

/* List */
.sk-list {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}
.sk-list-item {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
}
.sk-list-text { flex: 1; }
.sk-list-text .sk-line:last-child { margin-bottom: 0; }

@keyframes sk-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

@media (max-width: 1200px) {
  .sk-kpis { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 575px) {
  .sk-kpis { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .sk { animation: none; }
}
</style>
