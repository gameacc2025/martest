<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { inquiriesApi } from '@telecom/api-client'
import { useAuthStore } from '../../../stores/auth'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Toolbar from 'primevue/toolbar'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

// inquiries.create is granted to COMPANY_MANAGER only — COMPANY_USER can view
// and respond to inquiries but not open new ones (backend/prisma/seed.js).
const canCreate = computed(() => auth.hasPermission('inquiries.create'))

const inquiries = ref([])
const loading = ref(false)
const errored = ref(false)

const pagination = ref({ page: 1, limit: 10, total: 0 })
const sortField = ref('createdAt')
const sortOrder = ref(-1)
const searchQuery = ref('')
const statusFilter = ref(null)
const scopeFilter = ref('all')

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

const scopeOptions = [
  { label: 'همه', value: 'all' },
  { label: 'ارسال شده', value: 'sent' },
  { label: 'دریافتی', value: 'received' },
]

function statusLabel(s) { return statusLabels[s] || s || '—' }
function formatDate(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleDateString('fa-IR') } catch { return '—' }
}

function isActionable(inquiry) {
  return ['SUBMITTED', 'OPEN'].includes(inquiry.status)
}

function isDeadlineApproaching(inquiry) {
  if (!inquiry.responseDeadline) return false
  const deadline = new Date(inquiry.responseDeadline)
  const now = new Date()
  const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
  return daysLeft <= 3 && daysLeft >= 0
}

function isDeadlinePassed(inquiry) {
  if (!inquiry.responseDeadline) return false
  return new Date(inquiry.responseDeadline) < new Date()
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
      scope: scopeFilter.value !== 'all' ? scopeFilter.value : undefined,
      sortBy: sortField.value,
      sortOrder: sortOrder.value === 1 ? 'asc' : 'desc',
    })
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
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت استعلام‌ها', life: 3000 })
  } finally {
    loading.value = false
  }
}

let searchTimer
function debounceSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchInquiries(1), 450)
}
function applyStatusFilter() { fetchInquiries(1) }
function onScopeChange() { fetchInquiries(1) }
function onPage(event) {
  pagination.value.limit = event.rows
  fetchInquiries(event.page + 1)
}
function onSort(event) {
  sortField.value = event.sortField || 'createdAt'
  sortOrder.value = event.sortOrder || -1
  fetchInquiries(1)
}

function viewInquiry(inquiry) {
  router.push({ name: 'company-inquiry-detail', params: { id: inquiry.id } })
}
function createInquiry() {
  router.push({ name: 'company-inquiry-create' })
}
</script>

<template>
  <div class="inquiry-list-page ds-stack">
<section class="inquiry-workspace-intro" aria-labelledby="inquiry-workspace-title">
  <span class="inquiry-workspace-icon"><i class="pi pi-comments"></i></span>
  <div class="inquiry-workspace-copy">
    <span class="inquiry-workspace-eyebrow">فرصت‌های فروش و تأمین</span>
    <h1 id="inquiry-workspace-title">استعلام‌های شرکت</h1>
    <p>درخواست‌های مرتبط با محصولات شرکت را بررسی کنید و وضعیت پاسخ‌گویی را دنبال کنید.</p>
  </div>
</section>
        <div class="card ds-panel">
      <Toolbar class="list-toolbar ds-toolbar">
        <template #start>
          <div class="toolbar-filters">
            <span class="search-wrap">
              <InputText
                v-model="searchQuery"
                placeholder="جستجو در عنوان/توضیحات..."
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
              @change="applyStatusFilter"
            />
          </div>
        </template>
        <template #end>
          <Button v-if="canCreate" label="استعلام جدید" icon="pi pi-plus" @click="createInquiry" />
        </template>
      </Toolbar>

      <Tabs v-model:value="scopeFilter" @update:value="onScopeChange">
        <TabList>
          <Tab v-for="opt in scopeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel v-for="opt in scopeOptions" :key="opt.value" :value="opt.value">
            <DataTable
              v-if="inquiries.length > 0 || loading"
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
              :rowHover="true"
            >
              <Column field="id" header="شناسه" sortable style="width: 5rem"></Column>
              <Column field="title" header="عنوان" sortable>
                <template #body="{ data }">
                  <div class="inquiry-title-cell">
                    <span class="inquiry-title" :class="{ 'actionable': isActionable(data) }">
                      {{ data.title }}
                    </span>
                    <span v-if="data.description" class="inquiry-desc">
                      {{ data.description.substring(0, 60) }}{{ data.description.length > 60 ? '...' : '' }}
                    </span>
                  </div>
                </template>
              </Column>
              <Column header="شرکت">
                <template #body="{ data }">{{ data.company?.name || '—' }}</template>
              </Column>
              <Column header="اولویت" style="width: 80px">
                <template #body="{ data }">
                  <Tag v-if="data.priority && data.priority !== 'NORMAL'" :severity="PRIORITY_SEVERITY[data.priority] || 'secondary'" :value="PRIORITY_LABELS[data.priority] || data.priority" />
                  <span v-else class="muted">عادی</span>
                </template>
              </Column>
              <Column field="status" header="وضعیت" sortable style="width: 120px">
                <template #body="{ data }">
                  <Tag :value="statusLabel(data.status)" :severity="statusSeverity[data.status]" />
                </template>
              </Column>
              <Column header="اقلام" style="width: 5rem">
                <template #body="{ data }">
                  <span class="count-badge">{{ data._count?.items ?? data.items?.length ?? 0 }}</span>
                </template>
              </Column>
              <Column header="پاسخ‌ها" style="width: 5rem">
                <template #body="{ data }">
                  <span class="count-badge">{{ data._count?.responses ?? data.responses?.length ?? 0 }}</span>
                </template>
              </Column>
              <Column field="responseDeadline" header="ددلاین" sortable style="width: 100px">
                <template #body="{ data }">
                  <span v-if="data.responseDeadline" :class="{
                    'deadline-urgent': isDeadlineApproaching(data),
                    'deadline-passed': isDeadlinePassed(data)
                  }">
                    {{ formatDate(data.responseDeadline) }}
                  </span>
                  <span v-else class="muted">—</span>
                </template>
              </Column>
              <Column field="createdAt" header="تاریخ ایجاد" sortable style="width: 100px">
                <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
              </Column>
              <Column header="عملیات" style="width: 5rem">
                <template #body="{ data }">
                  <Button icon="pi pi-eye" severity="info" rounded text
                    v-tooltip.top="'مشاهده'" @click="viewInquiry(data)" />
                </template>
              </Column>

              <template #empty>
                <div v-if="!loading" class="state-block">
                  <i class="pi pi-inbox state-icon"></i>
                  <h3 v-if="searchQuery || statusFilter">نتیجه‌ای یافت نشد</h3>
                  <h3 v-else>استعلامی ثبت نشده</h3>
                  <p v-if="searchQuery || statusFilter">فیلترها را تغییر دهید یا جستجو را پاک کنید.</p>
                  <p v-else>هنوز استعلامی ایجاد نشده است.</p>
                  <Button v-if="canCreate && !searchQuery && !statusFilter" label="ایجاد استعلام جدید" icon="pi pi-plus" @click="createInquiry" />
                </div>
              </template>
            </DataTable>

            <div v-else-if="!loading" class="state-block">
              <i class="pi pi-inbox state-icon"></i>
              <h3>استعلامی ثبت نشده</h3>
              <p>هنوز استعلامی ایجاد نشده است.</p>
              <Button v-if="canCreate" label="ایجاد استعلام جدید" icon="pi pi-plus" @click="createInquiry" />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>

<style scoped>
.inquiry-list-page {
  direction: rtl;
  padding: 1.5rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
}

.page-header-actions {
  display: flex;
  gap: 0.5rem;
}

.card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  box-shadow: var(--ds-shadow-sm);
  overflow: hidden;
}

:deep(.p-toolbar) {
  background: var(--surface-card);
  border: none;
  border-bottom: 1px solid var(--surface-border);
  border-radius: 0;
  padding: 1rem 1.25rem;
  gap: 0.75rem;
}

.toolbar-filters {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-wrap {
  min-width: 240px;
}

.status-filter {
  min-width: 150px;
}

:deep(.p-tabs) {
  background: transparent;
}

:deep(.p-tablist) {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  padding: 0 1.25rem;
}

:deep(.p-tab) {
  padding: 0.875rem 1.25rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  transition: color 0.15s ease, border-color 0.15s ease;
}

:deep(.p-tab.p-tab-active) {
  color: var(--ds-color-primary);
  border-color: var(--ds-color-primary);
}

:deep(.p-tabpanels) {
  background: transparent;
  padding: 0;
}

:deep(.p-tabpanel) {
  padding: 0;
}

:deep(.p-datatable) {
  background: transparent;
  border: none;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--surface-hover);
  color: var(--text-color-secondary);
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--surface-border);
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  transition: background 0.15s ease;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: var(--surface-hover);
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--surface-border);
  color: var(--text-color);
  vertical-align: middle;
}

:deep(.p-datatable .p-datatable-tbody > tr:last-child > td) {
  border-bottom: none;
}

.inquiry-title-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.inquiry-title {
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.4;
}

.inquiry-title.actionable {
  color: var(--ds-color-primary);
}

.inquiry-desc {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  line-height: 1.4;
}

.muted {
  color: var(--text-color-secondary);
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.375rem;
  background: var(--surface-hover);
  border-radius: var(--ds-radius-full);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-color-secondary);
}

.deadline-urgent {
  color: var(--ds-color-warning);
  font-weight: 600;
}

.deadline-passed {
  color: var(--ds-color-danger);
  font-weight: 600;
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1.5rem;
  text-align: center;
}

.state-icon {
  font-size: 2.5rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
  opacity: 0.5;
}

.state-block h3 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text-color);
}

.state-block p {
  margin: 0 0 0.75rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  max-width: 24rem;
}

:deep(.p-paginator) {
  background: var(--surface-card);
  border-top: 1px solid var(--surface-border);
  border-radius: 0;
  padding: 0.75rem 1rem;
}

@media (max-width: 767px) {
  .inquiry-list-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-filters {
    width: 100%;
  }

  .search-wrap,
  .status-filter {
    width: 100%;
  }

  :deep(.p-datatable .p-datatable-thead > tr > th),
  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.625rem 0.75rem;
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

</style>