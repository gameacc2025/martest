<template>
  <div class="order-list-page">
    <!-- Card with Toolbar -->
    <WorkspacePageHeading title="مدیریت سفارش‌ها" heading-id="order-management-title" />
    <KpiStatsRow :items="kpiItems" :loading="loading" />
    <div class="card ds-panel">
      <Toolbar class="ds-toolbar">
        <template #start>
          <span class="p-input-icon-right">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="جستجو..." aria-label="جستجو در سفارش‌ها" @input="debounceSearch" />
          </span>
          <Select
            v-model="statusFilter"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="وضعیت"
            aria-label="فیلتر وضعیت سفارش"
            class="status-filter"
            @change="applyFilters"
          />
        </template>
      </Toolbar>

      <SharedDataTable
        ref="tableRef"
        class="order-management-table"
        title="فهرست سفارش‌ها"
        :columns="tableColumns"
        :rows="orders"
        :loading="loading"
        :lazy="true"
        :total-records="pagination.total"
        :rows-per-page="pagination.limit"
        :rows-per-page-options="[5, 10, 20, 50]"
        :searchable="false"
        :column-toggle="false"
        @request="onTableRequest"
      >
        <template #orderUser="{ row }">{{ row.user?.username || '—' }}</template>
        <template #orderStatus="{ row }">
          <Tag :value="row.status" :severity="getSeverity(row.status)" />
        </template>
        <template #orderAmount="{ row }">
          {{ Number(row.totalAmount || 0).toLocaleString('fa-IR') }}
        </template>
        <template #orderDate="{ row }">
          {{ row.createdAt ? new Date(row.createdAt).toLocaleDateString('fa-IR') : '—' }}
        </template>
        <template #actions="{ row }">
          <Button icon="pi pi-eye" severity="info" rounded text aria-label="مشاهده سفارش" @click="viewOrder(row)" />
          <Button icon="pi pi-pencil" severity="warn" rounded text aria-label="تغییر وضعیت سفارش" @click="editStatus(row)" />
        </template>
      </SharedDataTable>
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
import KpiStatsRow from '@telecom/shared-ui/components/common/KpiStatsRow.vue'
import SharedDataTable from '@telecom/shared-ui/components/common/DataTable.vue'
import { ref, computed, onMounted } from 'vue'
import { ordersApi } from '@telecom/api-client'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const orders = ref([])
const tableRef = ref(null)
const loading = ref(false)
const showDialog = ref(false)
const editingId = ref(null)
const searchQuery = ref('')
const statusFilter = ref(null)
const tableColumns = [
  { field: 'id', header: 'شناسه', style: 'width: 5rem' },
  { field: 'user.username', header: 'کاربر', slot: 'orderUser' },
  { field: 'status', header: 'وضعیت', slot: 'orderStatus' },
  { field: 'totalAmount', header: 'مبلغ', slot: 'orderAmount' },
  { field: 'createdAt', header: 'تاریخ', slot: 'orderDate' },
]

const statusOptions = ref([
  { label: 'در انتظار (صفحه جاری)', value: 'PENDING' },
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

const kpiItems = computed(() => [
  { label: 'کل سفارش‌ها', value: pagination.value.total, icon: 'pi pi-receipt', tone: 'primary' },
  { label: 'در انتظار', value: orders.value.filter((item) => item.status === 'PENDING').length, icon: 'pi pi-clock', tone: 'warning' },
  { label: 'ارسال‌شده (صفحه جاری)', value: orders.value.filter((item) => item.status === 'SHIPPED').length, icon: 'pi pi-truck', tone: 'info' },
  { label: 'تحویل‌شده (صفحه جاری)', value: orders.value.filter((item) => item.status === 'DELIVERED').length, icon: 'pi pi-check-circle', tone: 'success' },
  { label: 'لغو / بازپرداخت (صفحه جاری)', value: orders.value.filter((item) => ['CANCELLED', 'REFUNDED'].includes(item.status)).length, icon: 'pi pi-replay', tone: 'danger' },
])

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
  tableRef.value?.resetPage()
  fetchOrders(1)
}

async function fetchOrders(page = 1, limit = pagination.value.limit) {
  loading.value = true
  try {
    const res = await ordersApi.list({ page, limit, search: searchQuery.value, status: statusFilter.value })
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

function onTableRequest({ page, rows }) {
  pagination.value.limit = rows
  fetchOrders(page, rows)
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
    tableRef.value?.resetPage()
    await fetchOrders(1)
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
@media (max-width: 640px) { .order-management-intro { align-items: flex-start; padding: 1rem; } .order-management-icon { width: 2.75rem; height: 2.75rem; } }

</style>