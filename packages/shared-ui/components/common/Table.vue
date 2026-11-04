<script setup>
/**
 * Table — shared enterprise data table.
 *
 * Keeps the existing column/row/slot contract and PrimeVue pass-through
 * behavior. Visual treatment is centralized here so list screens share the
 * same hierarchy, density, hover/focus and empty/loading presentation.
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
  <div class="ds-table-frame" :class="{ 'ds-table-frame--loading': loading }">
    <DataTable
      :value="rows"
      :loading="loading"
      class="ds-table"
      responsiveLayout="scroll"
      v-bind="$attrs"
    >
      <template #empty>
        <div class="ds-table-empty">
          <span class="ds-table-empty-icon"><i class="pi pi-inbox"></i></span>
          <strong>داده‌ای برای نمایش وجود ندارد</strong>
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
  </div>
</template>

<style scoped>
.ds-table-frame {
  min-width: 0;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface);
}

.ds-table-frame :deep(.p-datatable) {
  border: 0;
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-sm);
}

.ds-table-frame :deep(.p-datatable-table-container) {
  border-radius: inherit;
  scrollbar-width: thin;
  scrollbar-color: var(--ds-color-border) transparent;
}

.ds-table-frame :deep(.p-datatable-thead > tr > th) {
  position: relative;
  padding: .95rem 1rem;
  border-color: var(--ds-color-border);
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  white-space: nowrap;
}

.ds-table-frame :deep(.p-datatable-thead > tr > th:first-child) {
  padding-inline-start: 1.25rem;
}

.ds-table-frame :deep(.p-datatable-tbody > tr) {
  background: var(--ds-color-surface);
  transition: background-color var(--ds-transition-fast);
}

.ds-table-frame :deep(.p-datatable-tbody > tr > td) {
  padding: .9rem 1rem;
  border-color: var(--ds-color-border);
  color: var(--ds-color-text);
  line-height: 1.65;
  vertical-align: middle;
}

.ds-table-frame :deep(.p-datatable-tbody > tr > td:first-child) {
  padding-inline-start: 1.25rem;
  font-weight: var(--ds-font-weight-medium);
}

.ds-table-frame :deep(.p-datatable-tbody > tr:hover) {
  background: color-mix(in srgb, var(--ds-color-primary) 4%, var(--ds-color-surface));
}

.ds-table-frame :deep(.p-datatable-tbody > tr:focus-visible) {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: -2px;
}

.ds-table-frame :deep(.p-sortable-column:hover) {
  color: var(--ds-color-primary-text);
}

.ds-table-frame :deep(.p-sortable-column.p-datatable-column-sorted) {
  color: var(--ds-color-primary-text);
  background: color-mix(in srgb, var(--ds-color-primary) 7%, var(--ds-color-surface-alt));
}

.ds-table-frame :deep(.p-paginator) {
  justify-content: flex-start;
  gap: .25rem;
  padding: .7rem 1rem;
  border-top: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
  color: var(--ds-color-text-muted);
}

.ds-table-frame :deep(.p-paginator .p-paginator-page),
.ds-table-frame :deep(.p-paginator .p-paginator-next),
.ds-table-frame :deep(.p-paginator .p-paginator-prev),
.ds-table-frame :deep(.p-paginator .p-paginator-first),
.ds-table-frame :deep(.p-paginator .p-paginator-last) {
  min-width: 2.25rem;
  min-height: 2.25rem;
  border-radius: var(--ds-radius-md);
}

.ds-table-frame :deep(.p-paginator .p-paginator-page.p-highlight) {
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary-text);
}

.ds-table-frame :deep(.p-datatable-loading-overlay) {
  background: color-mix(in srgb, var(--ds-color-surface) 68%, transparent);
  backdrop-filter: blur(2px);
}

.ds-table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .45rem;
  min-height: 13rem;
  justify-content: center;
  padding: 2rem 1rem;
  color: var(--ds-color-text-muted);
  text-align: center;
}

.ds-table-empty-icon {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  margin-bottom: .35rem;
  border-radius: 1rem;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
  font-size: 1.25rem;
}

.ds-table-empty strong {
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-sm);
}

.ds-table-empty > span:last-child {
  max-width: 30rem;
  font-size: var(--ds-font-size-xs);
  line-height: 1.8;
}

@media (max-width: 640px) {
  .ds-table-frame { border-radius: var(--ds-radius-md); }
  .ds-table-frame :deep(.p-datatable-thead > tr > th) {
    padding: .75rem .8rem;
  }
  .ds-table-frame :deep(.p-datatable-tbody > tr > td) {
    padding: .75rem .8rem;
  }
  .ds-table-frame :deep(.p-paginator) {
    justify-content: center;
    flex-wrap: wrap;
    padding: .65rem .5rem;
  }
}
</style>
