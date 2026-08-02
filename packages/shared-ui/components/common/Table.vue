<script setup>
/**
 * Table — design-system data table.
 *
 * Wraps PrimeVue DataTable + Column with a simple column/row config API and a
 * token-driven empty state. Passes through common DataTable features
 * (loading, paginator, rows) while keeping full PrimeVue compatibility via
 * `v-bind="$attrs"`. No hardcoded colors.
 */
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

defineOptions({ inheritAttrs: false })

defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  emptyMessage: { type: String, default: 'موردی یافت نشد.' },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <DataTable
    :value="rows"
    :loading="loading"
    class="ds-table"
    responsiveLayout="scroll"
    v-bind="$attrs"
  >
    <template #empty>
      <div class="ds-table-empty">
        <i class="pi pi-inbox"></i>
        <span>{{ emptyMessage }}</span>
      </div>
    </template>

    <Column
      v-for="col in columns"
      :key="col.key"
      :field="col.key"
      :header="col.label"
      :sortable="col.sortable || false"
      :class="col.tdClass || ''"
      :headerClass="col.thClass || ''"
      :style="col.style"
    >
      <template #body="slotProps">
        <slot
          v-if="col.slot"
          :name="col.slot"
          :row="slotProps.data"
          :value="slotProps.data[col.key]"
        >
          {{ slotProps.data[col.key] }}
        </slot>
        <template v-else>
          {{ col.render ? col.render(slotProps.data[col.key], slotProps.data) : (slotProps.data[col.key] ?? '—') }}
        </template>
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>
.ds-table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-8) 0;
  color: var(--ds-color-text-muted);
}

.ds-table-empty i {
  font-size: var(--ds-font-size-2xl);
}
</style>
