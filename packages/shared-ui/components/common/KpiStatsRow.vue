<script setup>
/**
 * KpiStatsRow — responsive row of KpiCard metric tiles for list pages.
 *
 * The grid is intentionally auto-fit: it shows 4 tiles on wide screens and
 * stacks cleanly on tablet/mobile without any page-level media queries.
 */
import KpiCard from '@telecom/shared-ui/components/admin/dashboard/KpiCard.vue'

defineProps({
  items: {
    type: Array,
    required: true,
    validator: (arr) => arr.every(item =>
      typeof item === 'object' &&
      'label' in item &&
      'value' in item
    )
  },
  loading: { type: Boolean, default: false },
  gap: { type: String, default: '14px' },
})
</script>

<template>
  <div
    class="kpi-stats-row tm-grid tm-grid--stats"
    :style="{ gap }"
    role="region"
    aria-label="آمار کلی صفحه"
  >
    <KpiCard
      v-for="(item, idx) in items"
      :key="item.label + idx"
      :label="item.label"
      :value="loading ? null : item.value"
      :icon="item.icon || 'pi pi-chart-bar'"
      :tone="item.tone || 'primary'"
      :loading="loading"
      :to="item.to || null"
    />
  </div>
</template>

<style scoped>
.kpi-stats-row {
  margin-bottom: 16px;
}
@media (max-width: 640px) {
  .kpi-stats-row { margin-bottom: 12px; }
}
</style>