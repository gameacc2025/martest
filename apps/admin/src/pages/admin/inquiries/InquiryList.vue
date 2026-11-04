<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import KpiStatsRow from '@telecom/shared-ui/components/common/KpiStatsRow.vue'
import SharedDataTable from '@telecom/shared-ui/components/common/DataTable.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { inquiriesApi } from '@telecom/api-client'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Toolbar from 'primevue/toolbar'

const router = useRouter()
const toast = useToast()

const inquiries = ref([])
const tableRef = ref(null)
const loading = ref(false)
const errored = ref(false)

// Server-side pagination / sort / filter state.
const pagination = ref({ page: 1, limit: 10, total: 0 })
const sortField = ref('createdAt')
const sortOrder = ref(-1)

const kpiItems = computed(() => [
  { label: 'کل استعلام‌ها', value: pagination.value.total, icon: 'pi pi-inbox', tone: 'primary' },
  { label: 'باز', value: inquiries.value.filter((item) => item.status === 'OPEN').length, icon: 'pi pi-folder-open', tone: 'info' },
  { label: 'ارسال‌شده', value: inquiries.value.filter((item) => item.status === 'SUBMITTED').length, icon: 'pi pi-send', tone: 'warning' },
  { label: 'تکمیل‌شده', value: inquiries.value.filter((item) => item.status === 'COMPLETED').length, icon: 'pi pi-check-circle', tone: 'success' },
  { label: 'منقضی / لغو', value: inquiries.value.filter((item) => ['EXPIRED', 'CANCELLED'].includes(item.status)).length, icon: 'pi pi-times-circle', tone: 'danger' },
])

const tableColumns = [
  { field: 'id', header: 'شناسه', sortable: true, style: 'width: 5rem' },
  { field: 'title', header: 'عنوان', sortable: true },
  { field: 'company.name', header: 'شرکت', slot: 'company' },
  { field: 'priority', header: 'اولویت', slot: 'priority' },
  { field: 'status', header: 'وضعیت', sortable: true, slot: 'status' },
  { field: '_count.items', header: 'اقلام', slot: 'itemsCount' },
  { field: '_count.responses', header: 'پاسخ‌ها', slot: 'responsesCount' },
  { field: 'createdAt', header: 'تاریخ ایجاد', sortable: true, slot: 'createdDate' },
]
const searchQuery = ref('')
const statusFilter = ref(null)

const showStatusDialog = ref(false)
const selectedInquiry = ref(null)
const newStatus = ref('')
const statusComment = ref('')
const savingStatus = ref(false)

const statusOptions = [
  { label: 'همه', value: null },
  { label: 'پیش‌نویس', value: 'DRAFT' },
  { label: 'ارسال شده', value: 'SUBMITTED' },
  { label: 'باز', value: 'OPEN' },
  { label: 'بسته شده', value: 'CLOSED' },
  { label: 'منقضی شده', value: 'EXPIRED' },
  { label: 'تکمیل شده', value: 'COMPLETED' },
  { label: 'لغو شده', value: 'CANCELLED' },
]

const statusSeverity = {
  DRAFT: 'secondary', SUBMITTED: 'info', OPEN: 'success', CLOSED: 'warn',
  EXPIRED: 'danger', COMPLETED: 'success', CANCELLED: 'danger',
}
const statusLabels = {
  DRAFT: 'پیش‌نویس', SUBMITTED: 'ارسال شده', OPEN: 'باز', CLOSED: 'بسته شده',
  EXPIRED: 'منقضی شده', COMPLETED: 'تکمیل شده', CANCELLED: 'لغو شده',
}

const PRIORITY_LABELS = { LOW: 'کم', NORMAL: 'عادی', HIGH: 'زیاد', URGENT: 'فوری' }
const PRIORITY_SEVERITY = { LOW: 'secondary', NORMAL: 'info', HIGH: 'warn', URGENT: 'danger' }

function statusLabel(s) { return statusLabels[s] || s || '—' }
function formatDate(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleDateString('fa-IR') } catch { return '—' }
}

onMounted(() => fetchInquiries())

async function fetchInquiries(page = pagination.value.page, limit = pagination.value.limit) {
  loading.value = true
  errored.value = false
  try {
    const res = await inquiriesApi.list({
      page,
      limit,
      search: searchQuery.value || undefined,
      status: statusFilter.value || undefined,
      sortBy: sortField.value,
      sortOrder: sortOrder.value === 1 ? 'asc' : 'desc',
    })
    // The list endpoint returns { data: [...], meta: {...} } as the body.
    // Depending on the HTTP layer this arrives either directly or under `.data`.
    const body = res?.data ?? res
    inquiries.value = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []
    pagination.value = {
      page: body?.meta?.page || 1,
      limit: body?.meta?.limit || pagination.value.limit,
      total: body?.meta?.total || inquiries.value.length,
    }
  } catch (err) {
    errored.value = true
    inquiries.value = []
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت درخواست‌ها', life: 3000 })
  } finally {
    loading.value = false
  }
}

let searchTimer
function resetTablePage() {
  tableRef.value?.resetPage()
}
function debounceSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    resetTablePage()
    fetchInquiries(1)
  }, 450)
}
function applyStatusFilter() {
  resetTablePage()
  fetchInquiries(1)
}
function onTableRequest({ page, rows, sortField: requestedSortField, sortOrder: requestedSortOrder }) {
  pagination.value.limit = rows
  if (requestedSortField) sortField.value = requestedSortField
  if (requestedSortOrder) sortOrder.value = requestedSortOrder === 'asc' ? 1 : -1
  fetchInquiries(page, rows)
}

function openStatusDialog(inquiry) {
  selectedInquiry.value = inquiry
  newStatus.value = inquiry.status
  statusComment.value = ''
  showStatusDialog.value = true
}

async function updateStatus() {
  if (!newStatus.value || newStatus.value === selectedInquiry.value.status) {
    toast.add({ severity: 'warn', summary: 'توجه', detail: 'وضعیت جدید را انتخاب کنید', life: 3000 })
    return
  }
  savingStatus.value = true
  try {
    await inquiriesApi.changeStatus(selectedInquiry.value.id, {
      status: newStatus.value,
      comment: statusComment.value || undefined,
    })
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'وضعیت درخواست بروزرسانی شد', life: 3000 })
    showStatusDialog.value = false
    fetchInquiries()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در بروزرسانی وضعیت', life: 3000 })
  } finally {
    savingStatus.value = false
  }
}

function viewInquiry(inquiry) {
  router.push({ name: 'admin-inquiry-detail', params: { id: inquiry.id } })
}
function createInquiry() {
  router.push({ name: 'admin-inquiry-create' })
}
</script>

<template>
  <div class="inquiry-list-page ds-stack">
    <WorkspacePageHeading title="مدیریت استعلام‌ها" heading-id="inquiry-workspace-title" />
    <KpiStatsRow :items="kpiItems" :loading="loading" />
    <div class="card ds-panel inquiry-management-surface">
      <Toolbar class="list-toolbar ds-toolbar inquiry-management-toolbar">
        <template #start>
          <div class="toolbar-filters">
            <span class="p-input-icon-right search-wrap">
              <i class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="جستجو در عنوان/توضیحات..."
                aria-label="جستجوی استعلام"
                @input="debounceSearch"
              />
            </span>
            <Select
              v-model="statusFilter"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="فیلتر وضعیت"
              class="status-filter"
              showClear
              aria-label="فیلتر وضعیت"
              @change="applyStatusFilter"
            />
          </div>
        </template>

        <template #end>
          <Button label="درخواست جدید" icon="pi pi-plus" @click="createInquiry" />
        </template>
      </Toolbar>

      <div v-if="errored" class="state-block" role="alert">
        <i class="pi pi-exclamation-triangle state-icon"></i>
        <h3>خطا در دریافت اطلاعات</h3>
        <p>مشکلی در ارتباط با سرور رخ داد.</p>
        <Button label="تلاش مجدد" icon="pi pi-refresh" @click="fetchInquiries(1)" />
      </div>

      <SharedDataTable
        v-else
        ref="tableRef"
        class="inquiry-management-table"
        title="فهرست استعلام‌ها"
        :columns="tableColumns"
        :rows="inquiries"
        :loading="loading"
        :lazy="true"
        :total-records="pagination.total"
        :rows-per-page="pagination.limit"
        :rows-per-page-options="[5, 10, 20, 50]"
        :searchable="false"
        :column-toggle="false"
        :initial-sort-field="sortField"
        :initial-sort-order="sortOrder"
        empty-message="استعلامی یافت نشد. با فیلترهای فعلی نتیجه‌ای وجود ندارد."
        @request="onTableRequest"
      >
        <template #company="{ row }">
          {{ row.company?.name || '—' }}
        </template>
        <template #priority="{ row }">
          <Tag v-if="row.priority" :severity="PRIORITY_SEVERITY[row.priority] || 'secondary'">
            {{ PRIORITY_LABELS[row.priority] || row.priority }}
          </Tag>
          <span v-else class="muted">—</span>
        </template>
        <template #status="{ row }">
          <Tag :value="statusLabel(row.status)" :severity="statusSeverity[row.status] || 'secondary'" />
        </template>
        <template #itemsCount="{ row }">
          {{ row._count?.items ?? row.items?.length ?? 0 }}
        </template>
        <template #responsesCount="{ row }">
          {{ row._count?.responses ?? row.responses?.length ?? 0 }}
        </template>
        <template #createdDate="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
        <template #actions="{ row }">
          <Button icon="pi pi-eye" severity="info" rounded text v-tooltip.top="'مشاهده'" aria-label="مشاهده استعلام" @click="viewInquiry(row)" />
          <Button icon="pi pi-refresh" severity="warn" rounded text v-tooltip.top="'تغییر وضعیت'" aria-label="تغییر وضعیت استعلام" @click="openStatusDialog(row)" />
        </template>
      </SharedDataTable>
    </div>

    <!-- Status Change Dialog -->
    <Dialog
      v-model:visible="showStatusDialog"
      header="تغییر وضعیت درخواست"
      :modal="true"
      :style="{ width: '28rem' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <div class="field">
        <label for="newStatus">وضعیت جدید</label>
        <Select
          id="newStatus"
          v-model="newStatus"
          :options="statusOptions.filter(o => o.value)"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
      </div>
      <div class="field">
        <label for="statusComment">توضیحات (اختیاری)</label>
        <Textarea id="statusComment" v-model="statusComment" rows="3" class="w-full" placeholder="توضیحات تغییر وضعیت..." />
      </div>
      <template #footer>
        <Button label="انصراف" icon="pi pi-times" severity="secondary" text @click="showStatusDialog = false" />
        <Button label="ذخیره" icon="pi pi-check" :loading="savingStatus" @click="updateStatus" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.inquiry-list-page {
  direction: rtl;
}

.toolbar-filters {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.status-filter {
  min-width: 150px;
}

.muted {
  color: var(--text-color-secondary);
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  text-align: center;
}

.state-icon {
  font-size: 2.5rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.state-block h3 {
  margin: 0;
  font-size: 1.05rem;
}

.state-block p {
  margin: 0 0 0.75rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  max-width: 24rem;
}

@media (max-width: 640px) {
  .toolbar-filters {
    width: 100%;
  }
  .toolbar-filters .search-wrap,
  .status-filter {
    width: 100%;
  }
}

/* Shared inbox/list visual language; filtering and server pagination unchanged. */
.inquiry-list-page { gap: var(--ds-space-5); }
.inquiry-list-page .ds-page-heading { margin-bottom: 0; }
.inquiry-list-page .card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}
@media (max-width: 640px) {
  .inquiry-list-page { gap: var(--ds-space-3); }
}

/* Inquiry workspace: the primary operational inbox for this role. */
.inquiry-list-page { gap: clamp(1rem, 2vw, 1.5rem); }
.inquiry-workspace-intro {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: linear-gradient(110deg, color-mix(in srgb, var(--ds-color-primary) 8%, var(--ds-color-surface)), var(--ds-color-surface) 72%);
  box-shadow: var(--ds-shadow-xs);
}
.inquiry-workspace-icon {
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  flex: 0 0 auto;
  border-radius: 1rem;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
  font-size: 1.35rem;
}
.inquiry-workspace-copy { min-width: 0; }
.inquiry-workspace-eyebrow {
  display: block;
  margin-bottom: .2rem;
  color: var(--ds-color-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
.inquiry-workspace-copy h1 {
  margin: 0;
  color: var(--ds-color-text);
  font-size: clamp(1.3rem, 2vw, 1.7rem);
  font-weight: 800;
}
.inquiry-workspace-copy p {
  margin: .35rem 0 0;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  line-height: 1.7;
}
.inquiry-list-page .card {
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.inquiry-list-page .state-block {
  min-height: 14rem;
  justify-content: center;
  border-top: 1px solid var(--ds-color-border);
  color: var(--ds-color-text-muted);
}
.inquiry-list-page .state-icon { color: var(--ds-color-primary); }
@media (max-width: 640px) {
  .inquiry-workspace-intro { align-items: flex-start; padding: 1rem; }
  .inquiry-workspace-icon { width: 2.75rem; height: 2.75rem; }
}


/* Admin review queue: compact filters and readable state/action table. */
.inquiry-management-surface {
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.inquiry-management-toolbar {
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
</style>
