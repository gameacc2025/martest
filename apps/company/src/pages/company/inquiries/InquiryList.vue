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
import Toolbar from 'primevue/toolbar'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'

const router = useRouter()
const toast = useToast()

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
  <div class="inquiry-list-page">
    <div class="page-header">
      <h1>استعلام‌ها</h1>
      <div class="page-header-actions">
        <Button label="استعلام جدید" icon="pi pi-plus" @click="createInquiry" />
      </div>
    </div>

    <div class="card">
      <Toolbar class="list-toolbar">
        <template #start>
          <div class="toolbar-filters">
            <span class="p-input-icon-right search-wrap">
              <i class="pi pi-search" />
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
              <Column header="عملیات" style="width: 5rem">
                <template #body="{ data }">
                  <Button icon="pi pi-eye" severity="info" rounded text
                    v-tooltip.top="'مشاهده'" @click="viewInquiry(data)" />
                </template>
              </Column>

              <template #empty>
                <div class="state-block">
                  <i class="pi pi-inbox state-icon"></i>
                  <h3>استعلامی یافت نشد</h3>
                  <p>هنوز استعلامی ثبت نشده است یا با فیلترهای فعلی نتیجه‌ای وجود ندارد.</p>
                  <Button label="ایجاد استعلام جدید" icon="pi pi-plus" @click="createInquiry" />
                </div>
              </template>
            </DataTable>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>

<style scoped>
.inquiry-list-page {
  direction: rtl;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header h1 {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
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
</style>
