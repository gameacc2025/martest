<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { productsApi } from '@telecom/api-client'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const toast = useToast()

const products = ref([])
const loading = ref(false)
const searchQuery = ref('')
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 })

const statusLabels = {
  DRAFT: 'پیش‌نویس', PENDING_REVIEW: 'در انتظار بررسی',
  APPROVED: 'تأیید شده', REJECTED: 'رد شده',
  PUBLISHED: 'منتشر شده', HIDDEN: 'مخفی', ARCHIVED: 'بایگانی شده',
}

const statusSeverity = {
  DRAFT: 'secondary', PENDING_REVIEW: 'warn', APPROVED: 'info',
  REJECTED: 'danger', PUBLISHED: 'success', HIDDEN: 'secondary', ARCHIVED: 'danger',
}

onMounted(() => {
  fetchProducts()
})

async function fetchProducts(page = 1) {
  loading.value = true
  try {
    // Company user's own products across ALL statuses — use the authenticated
    // management endpoint (the public `list` only returns PUBLISHED products).
    const res = await productsApi.myProducts({ page, limit: pagination.value.limit, search: searchQuery.value })
    products.value = res.data?.data || res.data || []
    const meta = res.data?.meta || {}
    pagination.value = {
      page: meta.page || page,
      limit: meta.limit || 10,
      total: meta.total || 0,
      totalPages: meta.totalPages || 1,
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت محصولات', life: 3000 })
  } finally {
    loading.value = false
  }
}

function editProduct(product) {
  router.push({ name: 'manage-product-edit', params: { id: product.id } })
}

function formatPrice(price) {
  return new Intl.NumberFormat('fa-IR', { style: 'currency', currency: 'IRR' }).format(price)
}
</script>

<template>
  <div class="my-products-page">
    <div class="page-header">
      <h1>محصولات من</h1>
      <Button label="محصول جدید" icon="pi pi-plus" @click="router.push({ name: 'manage-product-create' })" />
    </div>

    <div class="card">
      <Toolbar>
        <template #start>
          <span class="p-input-icon-right">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="جستجو..." @keyup.enter="fetchProducts(1)" />
          </span>
        </template>
      </Toolbar>

      <DataTable :value="products" :loading="loading" :paginator="true" :rows="pagination.limit"
        :totalRecords="pagination.total" :rowsPerPageOptions="[5, 10, 20]"
        @page="(e) => fetchProducts(e.page + 1)" responsiveLayout="scroll">
        <Column field="title" header="عنوان" sortable></Column>
        <Column header="دسته‌بندی">
          <template #body="{ data }">
            {{ data.category?.nameFa || '-' }}
          </template>
        </Column>
        <Column field="status" header="وضعیت" sortable>
          <template #body="{ data }">
            <Tag :value="statusLabels[data.status] || data.status" :severity="statusSeverity[data.status]" />
          </template>
        </Column>
        <Column header="قیمت">
          <template #body="{ data }">
            {{ formatPrice(data.prices?.[0]?.price || 0) }}
          </template>
        </Column>
        <Column header="عملیات">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" severity="info" rounded text v-tooltip.top="'ویرایش'" @click="editProduct(data)" />
              <router-link :to="{ name: 'manage-product-edit', params: { id: data.id } }">
                <Button icon="pi pi-history" severity="secondary" rounded text v-tooltip.top="'تاریخچه'" />
              </router-link>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.my-products-page {
  direction: rtl;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}
</style>
