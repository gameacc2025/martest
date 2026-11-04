<script setup>
/** Row of KPI metric cards for list-page summaries. */
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
  gap: { type: String, default: 'var(--ds-space-4)' },
})
</script>

<template>
  <div
    class="kpi-stats-row"
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
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-4);
  margin-bottom: var(--ds-space-5);
}
.kpi-stats-row :deep(.kpi-card) {
  flex: 1 1 16rem;
  min-width: 16rem;
}
@media (max-width: 640px) {
  .kpi-stats-row {
    gap: var(--ds-space-3);
    margin-bottom: var(--ds-space-4);
  }
  .kpi-stats-row :deep(.kpi-card) {
    flex: 1 1 100%;
    min-width: 0;
  }
}
</style>