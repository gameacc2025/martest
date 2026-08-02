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
  <div class="inquiry-list-page">
    <div class="card">
      <Toolbar class="list-toolbar">
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
</style>
