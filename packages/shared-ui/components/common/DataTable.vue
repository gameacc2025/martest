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
import { ref, computed, watch } from 'vue'
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
  totalRecords: { type: Number, default: null },

  // ── Pagination ────────────────────────────────────────────
  paginator: { type: Boolean, default: true },
  rowsPerPage: { type: Number, default: 10 },
  rowsPerPageOptions: { type: Array, default: () => [10, 20, 50, 100] },

  // ── Feature toggles ───────────────────────────────────────
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
const sortField = ref(null)
const sortOrder = ref(null) // 1 asc, -1 desc
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
  props.lazy ? props.totalRecords ?? props.rows.length : props.rows.length
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
defineExpose({ clearSelection })
</script>

<template>
  <div class="ent-table">
    <!-- Toolbar -->
    <div v-if="title || searchable || columnToggle || $slots.toolbar || (selectable && selection.length)" class="ent-table-toolbar">
      <div class="ent-table-toolbar-start">
        <h2 v-if="title" class="ent-table-title">{{ title }}</h2>

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
          <i class="pi pi-search"></i>
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
            showClear
            @change="onFilterChange"
          />
          <InputText
            v-else
            v-model="columnFilters[col.field]"
            :placeholder="col.header"
            @input="onFilterChange"
          />
        </div>
      </template>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="ent-table-skeleton">
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
          <!-- Custom slot -->
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
        </template>
      </Column>

      <!-- Row actions column -->
      <Column
        v-if="showActions && $slots.actions"
        :header="actionsHeader"
        :style="'width: 1%; white-space: nowrap'"
      >
        <template #body="{ data }">
          <div class="ent-table-actions">
            <slot name="actions" :row="data"></slot>
          </div>
        </template>
      </Column>

      <!-- Empty state -->
      <template #empty>
        <div class="ent-table-empty">
          <i class="pi pi-inbox"></i>
          <span>{{ emptyMessage }}</span>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.ent-table {
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
}

/* Toolbar */
.ent-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4) var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border);
  flex-wrap: wrap;
}

.ent-table-toolbar-start,
.ent-table-toolbar-end {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  flex-wrap: wrap;
}

.ent-table-title {
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text);
  margin: 0;
}

.ent-table-bulk {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-1) var(--ds-space-3);
  background: var(--ds-color-info-soft);
  border-radius: var(--ds-radius-pill);
}

.ent-table-bulk-count {
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-primary);
}

/* Search */
.ent-table-search {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.ent-table-search i {
  position: absolute;
  inset-inline-start: 0.75rem;
  color: var(--ds-color-text-muted);
  font-size: 0.85rem;
  pointer-events: none;
}

.ent-table-search :deep(input) {
  padding-inline-start: 2.25rem;
  border-radius: var(--ds-radius-pill);
  min-width: 14rem;
}

/* Column-visibility popover */
.ent-table-colmenu {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  min-width: 12rem;
  padding: var(--ds-space-1);
}

.ent-table-colmenu-title {
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text);
  margin-bottom: var(--ds-space-1);
}

.ent-table-colmenu-item {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text);
  cursor: pointer;
}

/* Filters row */
.ent-table-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface-alt);
}

.ent-table-filter :deep(.p-inputtext),
.ent-table-filter :deep(.p-select) {
  min-width: 12rem;
}

/* Row actions */
.ent-table-actions {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
}

/* Empty state */
.ent-table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-10) 0;
  color: var(--ds-color-text-muted);
}
.ent-table-empty i {
  font-size: var(--ds-font-size-2xl);
}

/* Skeleton */
.ent-table-skeleton {
  padding: var(--ds-space-4) var(--ds-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}
.ent-table-skeleton-row {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: var(--ds-space-4);
}
.ent-table-skeleton-head {
  margin-bottom: var(--ds-space-1);
}

/* Responsive: let the DataTable scroll horizontally on small screens */
@media (max-width: 640px) {
  .ent-table-search :deep(input) {
    min-width: 100%;
  }
  .ent-table-toolbar-end {
    width: 100%;
  }
}
</style>
