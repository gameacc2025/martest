<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { productsApi } from '@telecom/api-client'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const toast = useToast()

const products = ref([])
const loading = ref(false)
const publishingId = ref(null)
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
    const res = await productsApi.myProducts({ page, limit: pagination.value.limit })
    const body = res.data
    const items = body?.data?.data || body?.data || body?.items || body || []
    products.value = Array.isArray(items) ? items : []
    const meta = body?.data?.meta || body?.meta || {}
    pagination.value = {
      page: meta.page || page,
      limit: meta.limit || 10,
      total: meta.total || 0,
      totalPages: meta.totalPages || 1,
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت محصولات شرکت', life: 3000 })
  } finally {
    loading.value = false
  }
}

function editProduct(product) {
  router.push({ name: 'manage-product-edit', params: { id: product.id } })
}

async function publishProduct(product) {
  publishingId.value = product.id
  try {
    await productsApi.publish(product.id, 'انتشار توسط شرکت پس از تأیید STAFF')
    toast.add({ severity: 'success', summary: 'انتشار موفق', detail: 'محصول در سایت منتشر شد', life: 3500 })
    await fetchProducts(pagination.value.page)
  } catch (err) {
    const message = err.response?.data?.error?.message || err.serverMessage || err.message || 'انتشار محصول ناموفق بود'
    toast.add({ severity: 'error', summary: 'خطا در انتشار', detail: message, life: 5000 })
  } finally {
    publishingId.value = null
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('fa-IR', { style: 'currency', currency: 'IRR' }).format(price)
}
</script>

<template>
  <div class="company-products-page">
    <div class="page-header">
      <h1>محصولات شرکت</h1>
      <Button label="محصول جدید" icon="pi pi-plus" @click="router.push({ name: 'manage-product-create' })" />
    </div>

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
            <Button v-if="data.status === 'APPROVED'" icon="pi pi-globe" severity="success" rounded text :loading="publishingId === data.id" v-tooltip.top="'انتشار در سایت پس از تأیید STAFF'" @click="publishProduct(data)" />
            <Button icon="pi pi-pencil" severity="info" rounded text v-tooltip.top="'ویرایش'" @click="editProduct(data)" />
          </template>
        </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.company-products-page {
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
