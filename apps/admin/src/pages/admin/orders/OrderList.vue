<template>
  <div class="order-list-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1>مدیریت سفارشات</h1>
    </div>

    <!-- Card with Toolbar -->
    <div class="card">
      <Toolbar>
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
        <Dropdown id="status" v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="انتخاب کنید" />
      </div>
      <template #footer>
        <Button label="انصراف" icon="pi pi-times" severity="secondary" text @click="showDialog = false" />
        <Button label="ذخیره" icon="pi pi-check" @click="saveStatus" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
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
</style>