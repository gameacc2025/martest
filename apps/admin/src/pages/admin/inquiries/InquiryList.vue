<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { inquiriesApi } from '@telecom/api-client'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Skeleton from 'primevue/skeleton'
import Toolbar from 'primevue/toolbar'

const router = useRouter()
const toast = useToast()

const inquiries = ref([])
const loading = ref(false)
const errored = ref(false)

// Server-side pagination / sort / filter state.
const pagination = ref({ page: 1, limit: 10, total: 0 })
const sortField = ref('createdAt')
const sortOrder = ref(-1)
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

// Skeleton placeholder rows shown while the first page loads.
const skeletonRows = Array.from({ length: 5 }, (_, i) => ({ id: i }))

function statusLabel(s) { return statusLabels[s] || s || '—' }
function formatDate(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleDateString('fa-IR') } catch { return '—' }
}

onMounted(() => fetchInquiries())

async function fetchInquiries(page = pagination.value.page) {
  loading.value = true
  errored.value = false
  try {
    const res = await inquiriesApi.list({
      page,
      limit: pagination.value.limit,
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
function debounceSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchInquiries(1), 450)
}
function applyStatusFilter() {
  fetchInquiries(1)
}
function onPage(event) {
  pagination.value.limit = event.rows
  fetchInquiries(event.page + 1)
}
function onSort(event) {
  sortField.value = event.sortField || 'createdAt'
  sortOrder.value = event.sortOrder || -1
  fetchInquiries(1)
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
<section class="inquiry-workspace-intro" aria-labelledby="inquiry-workspace-title">
  <span class="inquiry-workspace-icon"><i class="pi pi-inbox"></i></span>
  <div class="inquiry-workspace-copy">
    <span class="inquiry-workspace-eyebrow">مرکز رسیدگی به درخواست‌ها</span>
    <h1 id="inquiry-workspace-title">مدیریت استعلام‌ها</h1>
    <p>درخواست‌های ثبت‌شده، روند رسیدگی و پاسخ تأمین‌کنندگان را از یک نمای واحد مدیریت کنید.</p>
  </div>
</section>
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

      <!-- Skeleton loader for the first load -->
      <DataTable
        class="inquiry-management-table"
        v-if="loading && !inquiries.length"
        :value="skeletonRows"
        responsiveLayout="scroll"
      >
        <Column header="شناسه"><template #body><Skeleton width="2rem" /></template></Column>
        <Column header="عنوان"><template #body><Skeleton width="10rem" /></template></Column>
        <Column header="شرکت"><template #body><Skeleton width="8rem" /></template></Column>
        <Column header="اولویت"><template #body><Skeleton width="4rem" /></template></Column>
        <Column header="وضعیت"><template #body><Skeleton width="5rem" /></template></Column>
        <Column header="اقلام"><template #body><Skeleton width="2rem" /></template></Column>
        <Column header="پاسخ‌ها"><template #body><Skeleton width="2rem" /></template></Column>
        <Column header="تاریخ"><template #body><Skeleton width="6rem" /></template></Column>
        <Column header="عملیات"><template #body><Skeleton width="4rem" /></template></Column>
      </DataTable>

      <!-- Error state -->
      <div v-else-if="errored" class="state-block">
        <i class="pi pi-exclamation-triangle state-icon" style="color: var(--p-red-500)"></i>
        <h3>خطا در دریافت اطلاعات</h3>
        <p>مشکلی در ارتباط با سرور رخ داد.</p>
        <Button label="تلاش مجدد" icon="pi pi-refresh" @click="fetchInquiries(1)" />
      </div>

      <!-- Data table -->
      <DataTable
        class="inquiry-management-table"
        v-else
        :value="inquiries"
        :loading="loading"
        lazy
        paginator
        :rows="pagination.limit"
        :first="(pagination.page - 1) * pagination.limit"
        :totalRecords="pagination.total"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        :sortField="sortField"
        :sortOrder="sortOrder"
        @page="onPage"
        @sort="onSort"
        responsiveLayout="scroll"
        dataKey="id"
      >
        <Column field="id" header="شناسه" sortable style="width: 5rem"></Column>
        <Column field="title" header="عنوان" sortable></Column>
        <Column header="شرکت">
          <template #body="{ data }">{{ data.company?.name || '—' }}</template>
        </Column>
        <Column header="اولویت">
          <template #body="{ data }">
            <Tag v-if="data.priority" :severity="PRIORITY_SEVERITY[data.priority] || 'secondary'">
              {{ PRIORITY_LABELS[data.priority] || data.priority }}
            </Tag>
            <span v-else class="muted">—</span>
          </template>
        </Column>
        <Column field="status" header="وضعیت" sortable>
          <template #body="{ data }">
            <Tag :value="statusLabel(data.status)" :severity="statusSeverity[data.status]" />
          </template>
        </Column>
        <Column header="اقلام" style="width: 5rem">
          <template #body="{ data }">{{ data._count?.items ?? data.items?.length ?? 0 }}</template>
        </Column>
        <Column header="پاسخ‌ها" style="width: 5rem">
          <template #body="{ data }">{{ data._count?.responses ?? data.responses?.length ?? 0 }}</template>
        </Column>
        <Column field="createdAt" header="تاریخ ایجاد" sortable>
          <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
        </Column>
        <Column header="عملیات" style="width: 7rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-eye" severity="info" rounded text
                v-tooltip.top="'مشاهده'" aria-label="مشاهده استعلام" @click="viewInquiry(data)" />
              <Button icon="pi pi-refresh" severity="warn" rounded text
                v-tooltip.top="'تغییر وضعیت'" aria-label="تغییر وضعیت" @click="openStatusDialog(data)" />
            </div>
          </template>
        </Column>

        <!-- Empty state -->
        <template #empty>
          <div class="state-block">
            <i class="pi pi-inbox state-icon"></i>
            <h3>استعلامی یافت نشد</h3>
            <p>هنوز درخواست استعلامی ثبت نشده است یا با فیلترهای فعلی نتیجه‌ای وجود ندارد.</p>
            <Button label="ایجاد درخواست جدید" icon="pi pi-plus" @click="createInquiry" />
          </div>
        </template>
      </DataTable>
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
.inquiry-list-page :deep(.p-toolbar) {
  background: var(--ds-color-surface);
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl) var(--ds-radius-xl) 0 0;
  padding: var(--ds-space-4) var(--ds-space-5);
}
.inquiry-list-page :deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  padding: var(--ds-space-4) var(--ds-space-5);
}
.inquiry-list-page :deep(.p-datatable .p-datatable-tbody > tr > td) {
  border-color: var(--ds-color-border);
  padding: var(--ds-space-4) var(--ds-space-5);
}
@media (max-width: 640px) {
  .inquiry-list-page { gap: var(--ds-space-3); }
  .inquiry-list-page :deep(.p-toolbar) { align-items: stretch; }
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
.inquiry-list-page :deep(.p-toolbar) { flex-wrap: wrap; gap: .75rem; }
.inquiry-list-page :deep(.p-toolbar-start),
.inquiry-list-page :deep(.p-toolbar-end) { display: flex; align-items: center; flex-wrap: wrap; gap: .65rem; }
.inquiry-list-page :deep(.p-toolbar .p-inputtext),
.inquiry-list-page :deep(.p-toolbar .p-select) { min-height: 2.65rem; border-radius: var(--ds-radius-md); }
.inquiry-list-page :deep(.p-toolbar .p-button) { min-height: 2.65rem; border-radius: var(--ds-radius-md); }
.inquiry-list-page :deep(.p-datatable-table-container) { overflow-x: auto; }
.inquiry-list-page :deep(.p-datatable-thead > tr > th) { white-space: nowrap; }
.inquiry-list-page :deep(.p-datatable-tbody > tr) { transition: background var(--ds-transition-fast); }
.inquiry-list-page :deep(.p-paginator) { border-top: 1px solid var(--ds-color-border); background: var(--ds-color-surface); }
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
  .inquiry-list-page :deep(.p-toolbar-start),
  .inquiry-list-page :deep(.p-toolbar-end),
  .inquiry-list-page .toolbar-filters { width: 100%; }
  .inquiry-list-page :deep(.p-toolbar-end) { justify-content: stretch; }
  .inquiry-list-page :deep(.p-toolbar-end .p-button) { width: 100%; }
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
.inquiry-management-toolbar :deep(.p-toolbar-start),
.inquiry-management-toolbar :deep(.p-toolbar-end) { gap: .65rem; flex-wrap: wrap; }
.inquiry-management-toolbar :deep(.p-inputtext),
.inquiry-management-toolbar :deep(.p-select) { min-height: 2.65rem; border-radius: var(--ds-radius-md); }
.inquiry-management-table :deep(.p-datatable-table-container) { overflow-x: auto; scrollbar-width: thin; }
.inquiry-management-table :deep(.p-datatable-thead > tr > th) {
  padding: .9rem 1rem;
  border-color: var(--ds-color-border);
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  white-space: nowrap;
}
.inquiry-management-table :deep(.p-datatable-tbody > tr > td) {
  padding: .85rem 1rem;
  border-color: var(--ds-color-border);
  color: var(--ds-color-text);
  vertical-align: middle;
}
.inquiry-management-table :deep(.p-datatable-tbody > tr:hover) { background: var(--ds-color-surface-hover); }
.inquiry-management-table :deep(.p-paginator) {
  justify-content: flex-start;
  padding: .8rem 1rem;
  border-top: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.inquiry-management-table :deep(.p-paginator-page),
.inquiry-management-table :deep(.p-paginator-next),
.inquiry-management-table :deep(.p-paginator-prev) {
  min-width: 2.25rem;
  min-height: 2.25rem;
  border-radius: var(--ds-radius-md);
}
.inquiry-management-table :deep(.p-datatable-empty-message > td) { padding: 0; }
@media (max-width: 640px) {
  .inquiry-management-toolbar :deep(.p-toolbar) { align-items: stretch; flex-direction: column; }
  .inquiry-management-toolbar :deep(.p-toolbar-start),
  .inquiry-management-toolbar :deep(.p-toolbar-end),
  .inquiry-management-toolbar .toolbar-filters { width: 100%; }
  .inquiry-management-toolbar :deep(.p-toolbar-end .p-button) { width: 100%; }
}
</style>