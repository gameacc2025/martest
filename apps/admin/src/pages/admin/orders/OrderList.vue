<template>
  <div class="order-list-page">
    <!-- Card with Toolbar -->
<WorkspacePageHeading eyebrow="مدیریت فروش" title="مدیریت سفارش‌ها" description="فهرست سفارش‌های قدیمی؛ دسترسی و داده‌های این بخش تابع وضعیت API موجود است." icon="pi pi-receipt" />
        <div class="card ds-panel">
      <Toolbar class="ds-toolbar">
        <template #start>
          <span class="p-input-icon-right">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="جستجو..." @input="debounceSearch" />
          </span>
          <Select
            v-model="statusFilter"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="وضعیت"
            class="status-filter"
            @change="applyFilters"
          />
        </template>
      </Toolbar>

      <DataTable :value="orders" :loading="loading" :paginator="true" :rows="pagination.limit"
        :totalRecords="pagination.total" :rowsPerPageOptions="[5, 10, 20, 50]"
        @page="onPageChange" responsiveLayout="scroll">
        <Column field="id" header="شناسه" sortable></Column>
        <Column header="کاربر">
          <template #body="{ data }">
            {{ data.user?.username || '-' }}
          </template>
        </Column>
        <Column field="status" header="وضعیت" sortable>
          <template #body="{ data }">
            <Tag :value="data.status" :severity="getSeverity(data.status)" />
          </template>
        </Column>
        <Column field="totalAmount" header="مبلغ">
          <template #body="{ data }">
            {{ Number(data.totalAmount).toLocaleString('fa-IR') }}
          </template>
        </Column>
        <Column field="createdAt" header="تاریخ" sortable>
          <template #body="{ data }">
            {{ new Date(data.createdAt).toLocaleDateString('fa-IR') }}
          </template>
        </Column>
        <Column header="عملیات">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-eye" severity="info" rounded text @click="viewOrder(data)" />
              <Button icon="pi pi-pencil" severity="warn" rounded text @click="editStatus(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Status Update Dialog -->
    <Dialog v-model:visible="showDialog" header="تغییر وضعیت سفارش" :modal="true" class="p-fluid">
      <div class="field">
        <label for="status">وضعیت</label>
        <Select id="status" v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="انتخاب کنید" />
      </div>
      <template #footer>
        <Button label="انصراف" icon="pi pi-times" severity="secondary" text @click="showDialog = false" />
        <Button label="ذخیره" icon="pi pi-check" @click="saveStatus" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { ref, onMounted } from 'vue'
import { ordersApi } from '@telecom/api-client'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const orders = ref([])
const loading = ref(false)
const showDialog = ref(false)
const editingId = ref(null)
const searchQuery = ref('')
const statusFilter = ref(null)

const statusOptions = ref([
  { label: 'در انتظار', value: 'PENDING' },
  { label: 'تایید شده', value: 'CONFIRMED' },
  { label: 'ارسال شده', value: 'SHIPPED' },
  { label: 'تحویل شده', value: 'DELIVERED' },
  { label: 'لغو شده', value: 'CANCELLED' },
  { label: 'بازگشت شده', value: 'REFUNDED' },
])

const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
})

const form = ref({
  status: 'PENDING'
})

function getSeverity(status) {
  const map = {
    PENDING: 'warn',
    CONFIRMED: 'info',
    SHIPPED: 'info',
    DELIVERED: 'success',
    CANCELLED: 'danger',
    REFUNDED: 'danger'
  }
  return map[status] || 'info'
}

function debounceSearch() {
  clearTimeout(debounceSearch.timer)
  debounceSearch.timer = setTimeout(() => {
    applyFilters()
  }, 500)
}

function applyFilters() {
  fetchOrders(1)
}

async function fetchOrders(page = 1) {
  loading.value = true
  try {
    const res = await ordersApi.list({ page, search: searchQuery.value, status: statusFilter.value })
    const body = res.data
    const items = body?.data?.data || body?.data || body?.items || body || []
    orders.value = Array.isArray(items) ? items : []
    const meta = body?.data?.meta || body?.meta
    if (meta) {
      pagination.value = {
        page: meta?.page || page,
        limit: meta?.limit || 10,
        total: meta?.total || 0,
        totalPages: meta?.totalPages || 1,
      }
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت سفارشات', life: 3000 })
  } finally {
    loading.value = false
  }
}

function onPageChange(event) {
  fetchOrders(event.page + 1)
}

function viewOrder(order) {
  // Navigate to order details if needed
  console.log('View order:', order)
}

function editStatus(order) {
  editingId.value = order.id
  form.value = { status: order.status }
  showDialog.value = true
}

async function saveStatus() {
  try {
    await ordersApi.update(editingId.value, form.value)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'وضعیت سفارش با موفقیت بروزرسانی شد', life: 3000 })
    showDialog.value = false
    editingId.value = null
    await fetchOrders()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در بروزرسانی سفارش', life: 3000 })
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.order-list-page {
  direction: rtl;
}

.status-filter {
  width: 150px;
}

.order-list-page { display: flex; flex-direction: column; gap: var(--ds-space-5); }
.order-list-page .card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}
.order-list-page :deep(.p-toolbar) {
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.order-list-page :deep(.p-datatable-thead > tr > th) {
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}

.order-list-page { display: flex; flex-direction: column; gap: var(--ds-space-5); }
.order-list-page .ds-page-heading { margin-bottom: 0; }

.order-list-page { gap: var(--ds-space-5); }
.order-management-intro {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.order-management-icon {
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
.order-management-intro > div { min-width: 0; }
.order-management-intro > div > span { color: var(--ds-color-primary); font-size: var(--ds-font-size-xs); font-weight: var(--ds-font-weight-bold); }
.order-management-intro h1 { margin: .2rem 0; color: var(--ds-color-text); font-size: var(--ds-font-size-2xl); font-weight: 800; }
.order-management-intro p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.7; }
.order-list-page .card { background: var(--ds-color-surface); }
.order-list-page :deep(.p-toolbar) { flex-wrap: wrap; gap: .75rem; }
.order-list-page :deep(.p-toolbar .p-inputtext), .order-list-page :deep(.p-toolbar .p-select) { min-height: 2.65rem; border-radius: var(--ds-radius-md); }
.order-list-page :deep(.p-datatable-table-container) { overflow-x: auto; }
.order-list-page :deep(.p-datatable-tbody > tr > td) { vertical-align: middle; }
@media (max-width: 640px) { .order-management-intro { align-items: flex-start; padding: 1rem; } .order-management-icon { width: 2.75rem; height: 2.75rem; } }

</style>