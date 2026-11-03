<script setup>
/**
 * DataTable — one shared enterprise data table for the whole app.
 *
 * Used by Users, Companies, Products, Categories, Inquiries, Roles and
 * Permissions. Wraps PrimeVue DataTable and layers on the features every admin
 * list needs so pages never re-implement a table:
 *
 *   • Pagination (client or server/lazy)      • Search box (debounced)
 *   • Sorting (client or server)              • Column filters (per-column)
 *   • Column visibility toggle                • Row actions (per-row buttons)
 *   • Bulk actions (checkbox selection)       • Status badges (via column type)
 *   • Loading skeleton                        • Empty state
 *   • Responsive (horizontal scroll + stacked)
 *
 * Design principles:
 *   - Fully driven by a `columns` config array — no per-page table markup.
 *   - Presentational + emits: it never calls APIs. In `lazy` mode it emits a
 *     single `request` event ({ page, rows, sortField, sortOrder, search,
 *     filters }) so the parent can fetch using its EXISTING API structure.
 *   - Token-driven styling only (no hardcoded colors).
 *
 * Column shape:
 *   {
 *     field: string,               // data key (supports dot paths for display)
 *     header: string,
 *     sortable?: boolean,
 *     filter?: boolean,            // show a per-column filter input
 *     filterType?: 'text'|'select',
 *     filterOptions?: [{label,value}],
 *     type?: 'text'|'badge'|'date'|'datetime'|'custom',
 *     badgeMap?: { [value]: { label, tone } },  // for type==='badge'
 *     slot?: string,               // named slot for custom cell rendering
 *     render?: (value, row) => string,
 *     style?: string|object,
 *     hidden?: boolean,            // initial visibility
 *     toggleable?: boolean,        // can be hidden via column-visibility menu
 *   }
 */
import { ref, computed, watch, onUnmounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import Popover from 'primevue/popover'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  // ── Data ──────────────────────────────────────────────────
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  dataKey: { type: String, default: 'id' },
  loading: { type: Boolean, default: false },

  // ── Server-side mode ──────────────────────────────────────
  // When true, sorting/paging/search are delegated to the parent via `request`.
  lazy: { type: Boolean, default: false },
  initialSortField: { type: String, default: null },
  initialSortOrder: { type: Number, default: null },
  totalRecords: { type: Number, default: null },

  // ── Pagination ────────────────────────────────────────────
  paginator: { type: Boolean, default: true },
  rowsPerPage: { type: Number, default: 10 },
  rowsPerPageOptions: { type: Array, default: () => [10, 20, 50, 100] },

  // ── Feature toggles ───────────────────────────────────────
  mobileCardLayout: { type: Boolean, default: true },
  searchable: { type: Boolean, default: true },
  searchPlaceholder: { type: String, default: 'جستجو...' },
  columnToggle: { type: Boolean, default: true },
  selectable: { type: Boolean, default: false }, // enables bulk actions
  showActions: { type: Boolean, default: true }, // reserve a row-actions column

  // ── Titles / labels ───────────────────────────────────────
  title: { type: String, default: '' },
  emptyMessage: { type: String, default: 'موردی یافت نشد.' },
  actionsHeader: { type: String, default: 'عملیات' },

  // Bulk actions: [{ label, icon, command(selection), severity? }]
  bulkActions: { type: Array, default: () => [] },
})

const emit = defineEmits(['request', 'update:selection', 'search'])

// ── Internal state ──────────────────────────────────────────
const search = ref('')
const selection = ref([])
const sortField = ref(props.initialSortField)
const sortOrder = ref(props.initialSortOrder) // 1 asc, -1 desc
const page = ref(1)
const rows = ref(props.rowsPerPage)
const columnFilters = ref({})

// Column visibility (respects initial `hidden`).
const visibleMap = ref(
  Object.fromEntries(props.columns.map((c) => [c.field, !c.hidden]))
)
watch(
  () => props.columns,
  (cols) => {
    visibleMap.value = Object.fromEntries(
      cols.map((c) => [c.field, visibleMap.value[c.field] ?? !c.hidden])
    )
  }
)

const shownColumns = computed(() => props.columns.filter((c) => visibleMap.value[c.field]))
const toggleableColumns = computed(() => props.columns.filter((c) => c.toggleable !== false))
const hasFilters = computed(() => props.columns.some((c) => c.filter))

// The count PrimeVue paginator should use.
const effectiveTotal = computed(() =>
  props.lazy ? props.totalRecords ?? props.rows.length : displayRows.value.length
)

// ── Client-side derived rows (search + filter + no server) ──
const displayRows = computed(() => {
  if (props.lazy) return props.rows // server already filtered/paged

  let data = [...props.rows]

  // Global search across visible, non-custom columns.
  const q = search.value.trim().toLowerCase()
  if (q) {
    data = data.filter((row) =>
      props.columns.some((c) => {
        const v = getValue(row, c.field)
        return v != null && String(v).toLowerCase().includes(q)
      })
    )
  }

  // Per-column filters.
  for (const [field, val] of Object.entries(columnFilters.value)) {
    if (val === '' || val == null) continue
    data = data.filter((row) => {
      const v = getValue(row, field)
      if (v == null) return false
      return String(v).toLowerCase().includes(String(val).toLowerCase())
    })
  }

  return data
})

// ── Helpers ─────────────────────────────────────────────────
function getValue(row, path) {
  if (!path) return undefined
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), row)
}

function formatCell(col, row) {
  const value = getValue(row, col.field)
  if (col.render) return col.render(value, row)
  if (col.type === 'date') return formatDate(value)
  if (col.type === 'datetime') return formatDateTime(value)
  return value ?? '—'
}

function formatDate(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleDateString('fa-IR') } catch { return '—' }
}
function formatDateTime(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleString('fa-IR') } catch { return '—' }
}

function badgeFor(col, row) {
  const value = getValue(row, col.field)
  const meta = col.badgeMap?.[value]
  return {
    label: meta?.label ?? value ?? '—',
    severity: toneToSeverity(meta?.tone),
  }
}
function toneToSeverity(tone) {
  const map = { success: 'success', warning: 'warn', danger: 'danger', info: 'info', primary: 'info', gray: 'secondary' }
  return map[tone] || 'secondary'
}

// ── Server-side request emission ────────────────────────────
function emitRequest() {
  emit('request', {
    page: page.value,
    rows: rows.value,
    sortField: sortField.value,
    sortOrder: sortOrder.value === 1 ? 'asc' : sortOrder.value === -1 ? 'desc' : null,
    search: search.value.trim(),
    filters: { ...columnFilters.value },
  })
}

function onPage(event) {
  page.value = Math.floor(event.first / event.rows) + 1
  rows.value = event.rows
  if (props.lazy) emitRequest()
}

function onSort(event) {
  sortField.value = event.sortField
  sortOrder.value = event.sortOrder
  if (props.lazy) {
    page.value = 1
    emitRequest()
  }
}

// Debounced search.
let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    emit('search', search.value.trim())
    if (props.lazy) emitRequest()
  }, 400)
}

onUnmounted(() => clearTimeout(searchTimer))

function onFilterChange() {
  page.value = 1
  if (props.lazy) emitRequest()
}

// Keep selection in sync with the parent.
watch(selection, (val) => emit('update:selection', val))

const firstRow = computed(() => (page.value - 1) * rows.value)

// Column visibility popover.
const colMenu = ref(null)
function toggleColMenu(e) {
  colMenu.value?.toggle(e)
}

// Expose a way for parents to clear selection after a bulk action.
function clearSelection() {
  selection.value = []
}

function resetPage() {
  page.value = 1
  selection.value = []
}

defineExpose({ clearSelection, resetPage })
</script>

<template>
  <div class="ent-table" :class="{ 'ent-table--mobile-cards': mobileCardLayout }" :aria-busy="loading ? 'true' : 'false'">
    <!-- Toolbar -->
    <div v-if="title || searchable || columnToggle || $slots.toolbar || (selectable && selection.length)" class="ent-table-toolbar">
      <div class="ent-table-toolbar-start">
        <h2 v-if="title" class="ent-table-title">{{ title }}</h2>
        <span class="ent-table-record-count" aria-live="polite">
          <i class="pi pi-list" aria-hidden="true"></i>
          {{ effectiveTotal.toLocaleString('fa-IR') }} رکورد
        </span>

        <!-- Bulk actions appear when rows are selected -->
        <div v-if="selectable && selection.length" class="ent-table-bulk">
          <span class="ent-table-bulk-count">{{ selection.length.toLocaleString('fa-IR') }} انتخاب شده</span>
          <Button
            v-for="action in bulkActions"
            :key="action.label"
            :label="action.label"
            :icon="action.icon"
            :severity="action.severity || 'secondary'"
            size="small"
            outlined
            @click="action.command(selection)"
          />
        </div>
      </div>

      <div class="ent-table-toolbar-end">
        <slot name="toolbar"></slot>

        <span v-if="searchable" class="ent-table-search">
          <i class="pi pi-search" aria-hidden="true"></i>
          <InputText
            v-model="search"
            :placeholder="searchPlaceholder"
            @input="onSearchInput"
            aria-label="جستجو"
          />
        </span>

        <Button
          v-if="columnToggle"
          icon="pi pi-sliders-h"
          severity="secondary"
          outlined
          aria-label="نمایش ستون‌ها"
          v-tooltip.bottom="'ستون‌ها'"
          @click="toggleColMenu"
        />
        <Popover ref="colMenu">
          <div class="ent-table-colmenu">
            <span class="ent-table-colmenu-title">نمایش ستون‌ها</span>
            <label
              v-for="col in toggleableColumns"
              :key="col.field"
              class="ent-table-colmenu-item"
            >
              <Checkbox v-model="visibleMap[col.field]" :binary="true" />
              <span>{{ col.header }}</span>
            </label>
          </div>
        </Popover>
      </div>
    </div>

    <!-- Per-column filter row -->
    <div v-if="hasFilters" class="ent-table-filters">
      <template v-for="col in shownColumns" :key="`f-${col.field}`">
        <div v-if="col.filter" class="ent-table-filter">
          <Select
            v-if="col.filterType === 'select'"
            v-model="columnFilters[col.field]"
            :options="col.filterOptions || []"
            optionLabel="label"
            optionValue="value"
            :placeholder="col.header"
            :aria-label="`فیلتر ${col.header}`"
            showClear
            @change="onFilterChange"
          />
          <InputText
            v-else
            v-model="columnFilters[col.field]"
            :placeholder="col.header"
            :aria-label="`فیلتر ${col.header}`"
            @input="onFilterChange"
          />
        </div>
      </template>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="ent-table-skeleton" role="status" aria-label="در حال بارگذاری جدول">
      <div class="ent-table-skeleton-row ent-table-skeleton-head">
        <Skeleton v-for="n in shownColumns.length" :key="`sh-${n}`" height="1.25rem" />
      </div>
      <div v-for="r in rows" :key="`sr-${r}`" class="ent-table-skeleton-row">
        <Skeleton v-for="n in shownColumns.length" :key="`sc-${r}-${n}`" height="1rem" />
      </div>
    </div>

    <!-- Table -->
    <DataTable
      v-else
      v-model:selection="selection"
      :value="displayRows"
      :dataKey="dataKey"
      :lazy="lazy"
      :paginator="paginator"
      :rows="rows"
      :first="firstRow"
      :totalRecords="effectiveTotal"
      :rowsPerPageOptions="rowsPerPageOptions"
      :sortField="sortField"
      :sortOrder="sortOrder"
      removableSort
      responsiveLayout="scroll"
      class="ent-table-dt"
      :class="{ 'ent-table-dt--selectable': selectable }"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
      currentPageReportTemplate="{first} تا {last} از {totalRecords}"
      v-bind="$attrs"
      @page="onPage"
      @sort="onSort"
    >
      <!-- Selection checkbox column (bulk actions) -->
      <Column v-if="selectable" selectionMode="multiple" headerStyle="width: 3rem" />

      <!-- Data columns -->
      <Column
        v-for="col in shownColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="col.sortable || false"
        :style="col.style"
      >
        <template #body="{ data }">
          <div class="ent-table-cell-content" :data-label="col.header">
            <!-- Custom slots keep their original row/value contract. -->
            <slot
              v-if="col.slot"
              :name="col.slot"
              :row="data"
              :value="getValue(data, col.field)"
            />
            <!-- Status badge -->
            <Tag
              v-else-if="col.type === 'badge'"
              :severity="badgeFor(col, data).severity"
            >{{ badgeFor(col, data).label }}</Tag>
            <!-- Default / formatted -->
            <span v-else>{{ formatCell(col, data) }}</span>
          </div>
        </template>
      </Column>

      <!-- Row actions column -->
      <Column
        v-if="showActions && $slots.actions"
        :header="actionsHeader"
        :style="'width: 1%; white-space: nowrap'"
      >
        <template #body="{ data }">
          <div class="ent-table-actions ent-table-cell-content" :data-label="actionsHeader">
            <slot name="actions" :row="data"></slot>
          </div>
        </template>
      </Column>

      <!-- Empty state -->
      <template #empty>
        <div class="ent-table-empty" role="status"><span>{{ emptyMessage }}</span></div>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.ent-table {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  box-shadow: none;
}

/* Toolbar: title/count on one side, search and view controls on the other. */
.ent-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.ent-table-toolbar-start,
.ent-table-toolbar-end {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .75rem;
  min-width: 0;
}
.ent-table-title {
  margin: 0;
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-bold);
  line-height: 1.4;
}
.ent-table-record-count {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .3rem .65rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-pill);
  color: var(--ds-color-text-muted);
  background: var(--ds-color-surface-alt);
  font-size: var(--ds-font-size-xs);
  white-space: nowrap;
}
.ent-table-record-count i { color: var(--ds-color-primary); }
.ent-table-bulk {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .5rem;
  padding: .35rem .65rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 24%, transparent);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-info-soft);
}
.ent-table-bulk-count {
  color: var(--ds-color-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-bold);
  white-space: nowrap;
}

/* Search and column controls. */
.ent-table-search {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 14rem;
}
.ent-table-search > i {
  position: absolute;
  inset-inline-start: .85rem;
  color: var(--ds-color-text-muted);
  font-size: .9rem;
  pointer-events: none;
}
.ent-table-search :deep(input) {
  width: 100%;
  min-height: 2.75rem;
  padding-inline-start: 2.4rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text);
  transition: border-color var(--ds-transition-fast), box-shadow var(--ds-transition-fast), background var(--ds-transition-fast);
}
.ent-table-search :deep(input:focus) {
  border-color: var(--ds-color-primary);
  background: var(--ds-color-surface);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ds-color-focus) 28%, transparent);
}
.ent-table-toolbar-end > :deep(button) {
  min-width: 2.75rem;
  min-height: 2.75rem;
  border-radius: var(--ds-radius-md);
}

/* Column visibility menu. */
.ent-table-colmenu {
  display: flex;
  flex-direction: column;
  gap: .65rem;
  min-width: 13rem;
  padding: .35rem;
}
.ent-table-colmenu-title {
  padding-bottom: .55rem;
  border-bottom: 1px solid var(--ds-color-border);
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-bold);
}
.ent-table-colmenu-item {
  display: flex;
  align-items: center;
  gap: .6rem;
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-sm);
  cursor: pointer;
}

/* Filters are a separate, quiet control strip. */
.ent-table-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .65rem;
  padding: .85rem 1.25rem;
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface-alt);
}
.ent-table-filter :deep(.p-inputtext),
.ent-table-filter :deep(.p-select) {
  min-width: 12rem;
  min-height: 2.75rem;
  border-radius: var(--ds-radius-md);
}

/* PrimeVue table surface. */
.ent-table :deep(.p-datatable) { min-width: 0; }
.ent-table :deep(.p-datatable-table-container) {
  overflow-x: auto;
  scrollbar-width: thin;
}
.ent-table :deep(.p-datatable-table) { min-width: 42rem; }
.ent-table :deep(.p-datatable-thead > tr > th) {
  padding: .95rem 1rem;
  border-color: var(--ds-color-border);
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  white-space: nowrap;
}
.ent-table :deep(.p-datatable-column-header-content) {
  gap: .45rem;
}
.ent-table :deep(.p-datatable-tbody > tr) {
  background: var(--ds-color-surface);
  transition: background-color var(--ds-transition-fast);
}
.ent-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--ds-color-surface-hover);
}
.ent-table :deep(.p-datatable-tbody > tr > td) {
  padding: .9rem 1rem;
  border-color: var(--ds-color-border);
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-sm);
  vertical-align: middle;
}
.ent-table :deep(.p-datatable-tbody > tr.p-datatable-row-selected) {
  background: var(--ds-color-info-soft);
}
.ent-table :deep(.p-datatable-tbody > tr > td:first-child) {
  border-inline-start: 2px solid transparent;
}
.ent-table :deep(.p-datatable-tbody > tr.p-datatable-row-selected > td:first-child) {
  border-inline-start-color: var(--ds-color-primary);
}
.ent-table-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: .35rem;
  white-space: nowrap;
}
.ent-table-actions :deep(button) {
  width: 2.75rem;
  min-width: 2.75rem;
  height: 2.75rem;
  min-height: 2.75rem;
  border-radius: var(--ds-radius-md);
}

/* Empty and loading states have the same visual weight as the data surface. */
.ent-table-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: .75rem;
  min-height: 13rem;
  padding: 2rem 1rem;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
}
.ent-table-empty i {
  display: grid;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1.1rem;
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-primary);
  font-size: 1.5rem;
}
.ent-table-skeleton {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
}
.ent-table-skeleton-row {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 1rem;
}
.ent-table-skeleton-head { margin-bottom: .25rem; }

/* Pagination. */
.ent-table :deep(.p-paginator) {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: .3rem;
  padding: .9rem 1rem;
  border-top: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.ent-table :deep(.p-paginator .p-paginator-page),
.ent-table :deep(.p-paginator .p-paginator-first),
.ent-table :deep(.p-paginator .p-paginator-prev),
.ent-table :deep(.p-paginator .p-paginator-next),
.ent-table :deep(.p-paginator .p-paginator-last) {
  min-width: 2.75rem;
  min-height: 2.75rem;
  border-radius: var(--ds-radius-md);
}
.ent-table :deep(.p-paginator .p-paginator-page.p-highlight) {
  background: var(--ds-color-primary);
  color: var(--ds-color-primary-contrast);
}
.ent-table :deep(.p-paginator-current) {
  margin-inline-start: auto;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
}
.ent-table :deep(.p-datatable-empty-message > td) { padding: 0; border: 0; }

@media (max-width: 760px) {
  .ent-table-toolbar {
    align-items: stretch;
    flex-direction: column;
    padding: 1rem;
  }
  .ent-table-toolbar-start,
  .ent-table-toolbar-end { width: 100%; }
  .ent-table-toolbar-end {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .ent-table-search { min-width: 0; width: 100%; }
  .ent-table-search :deep(input) { min-width: 0; }
  .ent-table-record-count { margin-inline-start: auto; }
  .ent-table-filters { padding: .75rem 1rem; }
  .ent-table-filter { flex: 1 1 10rem; min-width: 0; }
  .ent-table-filter :deep(.p-inputtext),
  .ent-table-filter :deep(.p-select) { width: 100%; min-width: 0; }
  .ent-table :deep(.p-paginator-current) {
    width: 100%;
    margin: .25rem 0 0;
    text-align: center;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ent-table *,
  .ent-table *::before,
  .ent-table *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; }
}
/* Mobile-first card presentation: retain every column/action without horizontal scrolling. */
@media (max-width: 767px) {
  .ent-table--mobile-cards .ent-table-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: .85rem;
    padding: 1rem;
  }
  .ent-table--mobile-cards .ent-table-toolbar-start,
  .ent-table--mobile-cards .ent-table-toolbar-end {
    width: 100%;
  }
  .ent-table--mobile-cards .ent-table-toolbar-end {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: .5rem;
  }
  .ent-table--mobile-cards .ent-table-toolbar-end > :deep(.ent-table-search) {
    min-width: 0;
    grid-column: 1 / -1;
  }
  .ent-table--mobile-cards .ent-table-filters {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    padding: .85rem 1rem;
  }
  .ent-table--mobile-cards .ent-table-filter,
  .ent-table--mobile-cards .ent-table-filter :deep(.p-inputtext),
  .ent-table--mobile-cards .ent-table-filter :deep(.p-select) {
    width: 100%;
    min-width: 0;
  }
  .ent-table--mobile-cards :deep(.p-datatable-table-container) {
    overflow: visible;
  }
  .ent-table--mobile-cards :deep(.p-datatable-table) {
    display: block;
    min-width: 0;
    width: 100%;
  }
  .ent-table--mobile-cards :deep(.p-datatable-thead) {
    display: none;
  }
  .ent-table--mobile-cards :deep(.p-datatable-tbody) {
    display: grid;
    gap: .75rem;
    padding: .75rem;
  }
  .ent-table--mobile-cards :deep(.p-datatable-tbody > tr) {
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: .15rem .65rem;
    padding: .55rem;
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-color-surface);
    box-shadow: none;
  }
  .ent-table--mobile-cards :deep(.p-datatable-tbody > tr > td) {
    display: block;
    min-width: 0;
    padding: .55rem .6rem;
    border: 0;
    background: transparent;
    overflow-wrap: anywhere;
  }
  .ent-table--mobile-cards :deep(.p-datatable-tbody > tr > td:first-child) {
    border-inline-start: 0;
  }
  .ent-table--mobile-cards .ent-table-cell-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: .3rem;
    min-width: 0;
    line-height: 1.55;
  }
  .ent-table--mobile-cards .ent-table-cell-content::before {
    content: attr(data-label);
    color: var(--ds-color-text-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
  }
  .ent-table--mobile-cards .ent-table-actions {
    align-items: center;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .ent-table--mobile-cards .ent-table-actions::before {
    flex-basis: 100%;
  }
  .ent-table--mobile-cards .ent-table-actions :deep(button) {
    width: 2.75rem;
    min-width: 2.75rem;
    height: 2.75rem;
    min-height: 2.75rem;
  }
  .ent-table--mobile-cards .ent-table-dt--selectable :deep(.p-datatable-tbody > tr > td:first-child) {
    position: absolute;
    z-index: 1;
    inset-block-start: .35rem;
    inset-inline-end: .35rem;
    width: auto;
    padding: .35rem;
  }
  .ent-table--mobile-cards .ent-table-dt--selectable :deep(.p-datatable-tbody > tr > td:nth-child(2)) {
    padding-inline-end: 2.5rem;
  }
  .ent-table--mobile-cards :deep(.p-paginator) {
    justify-content: center;
    flex-wrap: wrap;
    gap: .25rem;
    padding: .75rem .5rem;
  }
  .ent-table--mobile-cards .ent-table-empty {
    min-height: 10rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ent-table *,
  .ent-table *::before,
  .ent-table *::after {
    scroll-behavior: auto !important;
    transition-duration: .01ms !important;
    animation-duration: .01ms !important;
  }
}

</style>