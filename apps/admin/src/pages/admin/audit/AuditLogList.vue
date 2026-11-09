<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import KpiStatsRow from '@telecom/shared-ui/components/common/KpiStatsRow.vue'
import SharedDataTable from '@telecom/shared-ui/components/common/DataTable.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useAuditStore } from '@/stores/admin/audit'
import { useToast } from 'primevue/usetoast'
import { usePermissions } from '@/composables/usePermissions'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import Toolbar from 'primevue/toolbar'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'

const toast = useToast()
const auditStore = useAuditStore()
const { can, P } = usePermissions()

// Permission gates
const canRead = computed(() => can(P.AUDIT_LOGS.READ))
const canExport = computed(() => can(P.AUDIT_LOGS.EXPORT))

const logs = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, limit: 50, total: 0, totalPages: 1 })
const stats = ref({})

const searchQuery = ref('')
const actionFilter = ref(null)
const entityTypeFilter = ref(null)
const severityFilter = ref(null)
const dateFrom = ref(null)
const dateTo = ref(null)
const sortField = ref('occurredAt')
const sortOrder = ref(-1) // -1 desc, 1 asc

const actionOptions = ref([
  { label: 'همه عملیات', value: null },
  { label: 'ورود کاربر', value: 'USER_LOGIN' },
  { label: 'خروج کاربر', value: 'USER_LOGOUT' },
  { label: 'ایجاد', value: 'CREATE' },
  { label: 'بروزرسانی', value: 'UPDATE' },
  { label: 'حذف', value: 'DELETE' },
  { label: 'تغییر وضعیت', value: 'STATUS_CHANGE' },
  { label: 'تخصیص مجوز', value: 'PERMISSION_GRANT' },
  { label: 'انقضای مجوز', value: 'PERMISSION_REVOKE' },
  { label: 'ورود ناموفق', value: 'LOGIN_FAILED' },
  { label: 'تغییر رمز عبور', value: 'PASSWORD_CHANGE' },
])

const entityTypeOptions = ref([
  { label: 'همه موجودیت‌ها', value: null },
  { label: 'کاربر', value: 'User' },
  { label: 'شرکت', value: 'Company' },
  { label: 'محصول', value: 'Product' },
  { label: 'دسته‌بندی', value: 'Category' },
  { label: 'سفارش', value: 'Order' },
  { label: 'فاکتور', value: 'Invoice' },
  { label: 'استعلام', value: 'Inquiry' },
  { label: 'نقش', value: 'Role' },
  { label: 'مجوز', value: 'Permission' },
])

const severityOptions = ref([
  { label: 'همه سطوح', value: null },
  { label: 'اطلاعات (INFO)', value: 'INFO' },
  { label: 'هشدار (WARN)', value: 'WARN' },
  { label: 'خطا (ERROR)', value: 'ERROR' },
  { label: 'بحرانی (CRITICAL)', value: 'CRITICAL' },
])

const sortFields = ref([
  { label: 'زمان رخداد', value: 'occurredAt' },
  { label: 'عملیات', value: 'action' },
  { label: 'نوع موجودیت', value: 'entityType' },
  { label: 'شناسه موجودیت', value: 'entityId' },
  { label: 'شناسه کاربر', value: 'userId' },
  { label: 'آدرس IP', value: 'ipAddress' },
  { label: 'سطح شدت', value: 'severity' },
])

const showDetailDialog = ref(false)
const detailLog = ref(null)
const detailLoading = ref(false)

const kpiItems = computed(() => [
  { label: 'کل رویدادها', value: pagination.value.total, icon: 'pi pi-history', tone: 'primary' },
  { label: 'اخطارها (ERROR)', value: stats.value.bySeverity?.ERROR || 0, icon: 'pi pi-exclamation-triangle', tone: 'danger' },
  { label: 'بحرانی (CRITICAL)', value: stats.value.bySeverity?.CRITICAL || 0, icon: 'pi pi-exclamation-circle', tone: 'warn' },
  { label: 'ورود‌های اخیر', value: (stats.value.topActions?.find(a => a.action === 'USER_LOGIN')?.count) || 0, icon: 'pi pi-sign-in', tone: 'success' },
])

function severityLabel(severity) {
  return severity
}

function severitySeverity(severity) {
  switch (severity) {
    case 'INFO': return 'info'
    case 'WARN': return 'warn'
    case 'ERROR': return 'danger'
    case 'CRITICAL': return 'contrast'
    default: return 'secondary'
  }
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('fa-IR')
  } catch {
    return '—'
  }
}

function debounceSearch() {
  clearTimeout(debounceSearch.timer)
  debounceSearch.timer = setTimeout(() => applyFilters(), 500)
}

function applyFilters() {
  loadLogs(1)
}

async function loadLogs(page = pagination.value.page, limit = pagination.value.limit) {
  if (!canRead.value) return
  try {
    loading.value = true
    const response = await auditStore.searchAuditLogs({
      page,
      limit,
      action: actionFilter.value,
      entityType: entityTypeFilter.value,
      entityId: searchQuery.value || undefined,
      userId: searchQuery.value ? Number(searchQuery.value) || undefined : undefined,
      ipAddress: searchQuery.value || undefined,
      severity: severityFilter.value,
      dateFrom: dateFrom.value ? new Date(dateFrom.value).toISOString() : undefined,
      dateTo: dateTo.value ? new Date(dateTo.value).toISOString() : undefined,
      sortBy: sortField.value,
      sortOrder: sortOrder.value === 1 ? 'asc' : 'desc',
    })
    logs.value = response.logs || []
    pagination.value = {
      page: response.page,
      limit: response.limit,
      total: response.total,
      totalPages: response.totalPages,
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت لاگ‌های حسابرسی', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  if (!canRead.value) return
  try {
    await auditStore.getAuditStats({
      dateFrom: dateFrom.value ? new Date(dateFrom.value).toISOString() : undefined,
      dateTo: dateTo.value ? new Date(dateTo.value).toISOString() : undefined,
    })
    stats.value = auditStore.stats || {}
  } catch (error) {
    console.error('Error loading audit stats:', error)
  }
}

async function openDetail(row) {
  showDetailDialog.value = true
  detailLoading.value = true
  detailLog.value = null
  try {
    detailLog.value = await auditStore.getAuditLogById(row.id)
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت جزئیات لاگ', life: 3000 })
    showDetailDialog.value = false
  } finally {
    detailLoading.value = false
  }
}

async function handleExport() {
  if (!canExport.value) return
  try {
    loading.value = true
    const blob = await auditStore.exportAuditLogs({
      format: 'csv',
      action: actionFilter.value,
      entityType: entityTypeFilter.value,
      entityId: searchQuery.value || undefined,
      userId: searchQuery.value ? Number(searchQuery.value) || undefined : undefined,
      ipAddress: searchQuery.value || undefined,
      severity: severityFilter.value,
      dateFrom: dateFrom.value ? new Date(dateFrom.value).toISOString() : undefined,
      dateTo: dateTo.value ? new Date(dateTo.value).toISOString() : undefined,
      sortBy: sortField.value,
      sortOrder: sortOrder.value === 1 ? 'asc' : 'desc',
    })

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'فایل CSV دانلود شد', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در صادرات فایل', life: 3000 })
  } finally {
    loading.value = false
  }
}

function onTableRequest({ page, rows, sortField: requestedSortField, sortOrder: requestedSortOrder }) {
  pagination.value.limit = rows
  if (requestedSortField) sortField.value = requestedSortField
  if (requestedSortOrder) sortOrder.value = requestedSortOrder === 'asc' ? 1 : -1
  loadLogs(page, rows)
}

onMounted(() => {
  loadLogs()
  loadStats()
})

// Reload when date filters change
watch([dateFrom, dateTo], () => {
  loadLogs(1)
  loadStats()
})
</script>

<template>
  <div class="audit-log-page ds-stack">
    <WorkspacePageHeading
      title="لاگ‌های حسابرسی"
      heading-id="audit-log-title"
      description="جستجو، فیلتر و صادرات رویدادهای حسابرسی سیستم (فقط مدیران سیستم)"
      icon="pi pi-shield"
    >
      <template #actions>
        <Button v-if="canExport" label="صادرات CSV" icon="pi pi-download" severity="secondary" @click="handleExport" :loading="loading" />
      </template>
    </WorkspacePageHeading>

    <KpiStatsRow :items="kpiItems" :loading="loading" />

    <div class="card ds-panel identity-management-surface">
      <Toolbar class="ds-toolbar identity-management-toolbar">
        <template #start>
          <div class="toolbar-filters">
            <span class="p-input-icon-right search-wrap">
              <i class="pi pi-search" aria-hidden="true" />
              <InputText
                v-model="searchQuery"
                name="auditSearch"
                autocomplete="off"
                placeholder="جستجو در IP، شناسه موجودیت، شناسه کاربر…"
                aria-label="جستجو در لاگ‌های حسابرسی"
                @input="debounceSearch"
              />
            </span>
            <Select
              v-model="actionFilter"
              :options="actionOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="عملیات"
              aria-label="فیلتر عملیات"
              class="filter-select"
              showClear
              @change="applyFilters"
            />
            <Select
              v-model="entityTypeFilter"
              :options="entityTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="نوع موجودیت"
              aria-label="فیلتر نوع موجودیت"
              class="filter-select"
              showClear
              @change="applyFilters"
            />
            <Select
              v-model="severityFilter"
              :options="severityOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="شدت"
              aria-label="فیلتر شدت"
              class="filter-select"
              showClear
              @change="applyFilters"
            />
            <Calendar
              v-model="dateFrom"
              placeholder="از تاریخ"
              :showIcon="true"
              :readonlyInput="true"
              class="date-filter"
              @change="applyFilters"
            />
            <Calendar
              v-model="dateTo"
              placeholder="تا تاریخ"
              :showIcon="true"
              :readonlyInput="true"
              class="date-filter"
              @change="applyFilters"
            />
          </div>
        </template>
      </Toolbar>

      <SharedDataTable
        ref="tableRef"
        class="identity-management-table"
        title="فهرست رویدادهای حسابرسی"
        :columns="tableColumns"
        :rows="logs"
        :loading="loading"
        :lazy="true"
        :total-records="pagination.total"
        :rows-per-page="pagination.limit"
        :rows-per-page-options="[10, 20, 50, 100]"
        :searchable="false"
        :column-toggle="false"
        :initial-sort-field="sortField"
        :initial-sort-order="sortOrder"
        @request="onTableRequest"
      >
        <template #severity="{ row }">
          <Tag :severity="severitySeverity(row.severity)" :value="severityLabel(row.severity)" />
        </template>
        <template #entityId="{ row }">
          <span v-if="row.entityId" class="entity-id-cell">{{ row.entityId }}</span>
          <span v-else class="text-muted">—</span>
        </template>
        <template #userId="{ row }">
          <span v-if="row.userId" class="user-id-cell">{{ row.userId }}</span>
          <span v-else class="text-muted">—</span>
        </template>
        <template #ipAddress="{ row }">
          <span v-if="row.ipAddress" class="ip-cell">{{ row.ipAddress }}</span>
          <span v-else class="text-muted">—</span>
        </template>
        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
        <template #metadata="{ row }">
          <Button
            v-if="row.metadata && Object.keys(row.metadata).length"
            icon="pi pi-info-circle"
            severity="secondary"
            rounded
            text
            size="small"
            @click="openDetail(row)"
          />
        </template>
        <template #actions="{ row }">
          <Button
            icon="pi pi-eye"
            severity="secondary"
            rounded
            text
            aria-label="مشاهده جزئیات"
            v-tooltip.top="'مشاهده جزئیات'"
            @click="openDetail(row)"
          />
        </template>
      </SharedDataTable>
    </div>

    <!-- Detail Dialog -->
    <Dialog
      v-model:visible="showDetailDialog"
      header="جزئیات رویداد حسابرسی"
      :modal="true"
      class="p-fluid"
      :style="{ width: '50rem' }"
      :breakpoints="{ '640px': '95vw', '1024px': '75vw' }"
    >
      <div v-if="detailLoading" class="text-center py-6">
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>
      <div v-else-if="detailLog" class="detail-content">
        <section class="detail-section">
          <h4>اطلاعات اصلی</h4>
          <div class="detail-grid">
            <div class="detail-row"><span>شناسه</span><b>{{ detailLog.id }}</b></div>
            <div class="detail-row"><span>عملیات</span><b>{{ detailLog.action }}</b></div>
            <div class="detail-row"><span>نوع موجودیت</span><b>{{ detailLog.entityType }}</b></div>
            <div class="detail-row"><span>شناسه موجودیت</span><b>{{ detailLog.entityId || '—' }}</b></div>
            <div class="detail-row"><span>شناسه کاربر</span><b>{{ detailLog.userId || '—' }}</b></div>
            <div class="detail-row"><span>نام کاربری / ایمیل</span><b>{{ detailLog.userEmail || detailLog.userPhone || '—' }}</b></div>
            <div class="detail-row"><span>آدرس IP</span><b>{{ detailLog.ipAddress || '—' }}</b></div>
            <div class="detail-row"><span>User Agent</span><b>{{ detailLog.userAgent || '—' }}</b></div>
            <div class="detail-row"><span>شدت</span><b><Tag :severity="severitySeverity(detailLog.severity)">{{ severityLabel(detailLog.severity) }}</Tag></b></div>
            <div class="detail-row"><span>زمان رخداد</span><b>{{ formatDate(detailLog.createdAt) }}</b></div>
          </div>
        </section>

        <section v-if="detailLog.metadata && Object.keys(detailLog.metadata).length" class="detail-section">
          <h4>داده‌های اضافه (Metadata)</h4>
          <pre class="metadata-pre">{{ JSON.stringify(detailLog.metadata, null, 2) }}</pre>
        </section>
      </div>
      <template #footer>
        <Button label="بستن" icon="pi pi-times" severity="secondary" text @click="showDetailDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<script>
const tableColumns = [
  { field: 'id', header: 'شناسه', sortable: true, style: 'width: 5rem' },
  { field: 'action', header: 'عملیات', sortable: true },
  { field: 'entityType', header: 'نوع موجودیت', sortable: true },
  { field: 'entityId', header: 'شناسه موجودیت', sortable: true, slot: 'entityId' },
  { field: 'userId', header: 'شناسه کاربر', sortable: true, slot: 'userId' },
  { field: 'userEmail', header: 'کاربر (ایمیل)' },
  { field: 'ipAddress', header: 'آدرس IP', sortable: true, slot: 'ipAddress' },
  { field: 'severity', header: 'شدت', sortable: true, slot: 'severity' },
  { field: 'createdAt', header: 'زمان رخداد', sortable: true, slot: 'createdAt' },
  { field: 'metadata', header: 'داده‌ها', slot: 'metadata' },
  { field: 'actions', header: 'عملیات', slot: 'actions', style: 'width: 4rem' },
]

export default { tableColumns }
</script>

<style scoped>
.audit-log-page {
  direction: rtl;
}

.toolbar-filters {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-select {
  width: 160px;
}

.date-filter {
  width: 160px;
}

.search-wrap {
  width: 280px;
}

.entity-id-cell,
.user-id-cell,
.ip-cell {
  font-family: monospace;
  font-size: 0.85rem;
  background: var(--ds-color-surface-hover);
  padding: 0.15rem 0.4rem;
  border-radius: var(--ds-radius-sm);
}

.text-muted {
  color: var(--text-color-secondary);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-section h4 {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: var(--primary-color);
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 0.35rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--ds-color-surface-hover);
  border-radius: var(--ds-radius-sm);
}

.detail-row span {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  font-weight: 600;
}

.detail-row b {
  color: var(--ds-color-text);
  font-size: 0.875rem;
  word-break: break-all;
}

.metadata-pre {
  background: var(--ds-color-surface-hover);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-sm);
  padding: 1rem;
  font-size: 0.75rem;
  line-height: 1.6;
  overflow-x: auto;
  max-height: 300px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Shared Paces-style list hierarchy */
.audit-log-page { gap: var(--ds-space-5); }
.audit-log-page .ds-page-heading { margin-bottom: 0; }
.audit-log-page .card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}
@media (max-width: 640px) {
  .audit-log-page { gap: var(--ds-space-3); }
}

.audit-log-page { gap: clamp(1rem, 2vw, 1.5rem); }
.management-page-intro {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: linear-gradient(110deg, color-mix(in srgb, var(--ds-color-primary) 8%, var(--ds-color-surface)), var(--ds-color-surface) 72%);
  box-shadow: var(--ds-shadow-xs);
}
.management-page-icon {
  display: grid;
  place-items: center;
  width: 3.2rem;
  height: 3.2rem;
  flex: 0 0 auto;
  border-radius: 1rem;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
  font-size: 1.3rem;
}
.management-page-copy { min-width: 0; }
.management-page-copy > span {
  display: block;
  margin-bottom: .2rem;
  color: var(--ds-color-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
.management-page-copy h1 {
  margin: 0;
  color: var(--ds-color-text);
  font-size: clamp(1.3rem, 2vw, 1.7rem);
  font-weight: 800;
}
.management-page-copy p {
  margin: .35rem 0 0;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  line-height: 1.7;
}
.audit-log-page .card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}
@media (max-width: 640px) {
  .management-page-intro { align-items: flex-start; padding: 1rem; }
  .management-page-icon { width: 2.75rem; height: 2.75rem; }
}

.identity-management-surface {
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.identity-management-toolbar {
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
</style>