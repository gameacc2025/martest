<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { productsApi } from '@telecom/api-client'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'

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
    <WorkspacePageHeading
      heading-id="company-products-title"
      icon="pi pi-building"
      title="محصولات شرکت"
      description="فهرست محصولات ثبت‌شده شرکت و وضعیت انتشار آن‌ها را مدیریت کنید."
    >
      <template #actions>
        <router-link :to="{ name: 'manage-product-create' }" class="company-products-create-link"><i class="pi pi-plus" aria-hidden="true"></i> محصول جدید</router-link>
      </template>
    </WorkspacePageHeading>

    <section class="product-catalogue-surface" aria-label="فهرست محصولات شرکت">
      <DataTable class="product-catalogue-table" :value="products" :loading="loading" :paginator="true" :rows="pagination.limit"
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
            {{ data.prices?.[0]?.price != null ? formatPrice(data.prices[0].price) : '—' }}
          </template>
        </Column>
        <Column header="عملیات">
          <template #body="{ data }">
            <Button v-if="data.status === 'APPROVED'" icon="pi pi-globe" severity="success" rounded text :aria-label="'انتشار محصول ' + data.title" :loading="publishingId === data.id" v-tooltip.top="'انتشار در سایت پس از تأیید STAFF'" @click="publishProduct(data)" />
            <router-link :to="{ name: 'manage-product-edit', params: { id: data.id } }" class="company-table-action-link" :aria-label="'ویرایش محصول ' + data.title"><i class="pi pi-pencil" aria-hidden="true"></i></router-link>
          </template>
        </Column>
    </DataTable>
    </section>
  </div>
</template>

<style scoped>
.company-products-page {
  direction: rtl;
}

.my-products-page,
.company-products-page { display: flex; flex-direction: column; gap: 16px; }

.my-products-page .card {
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  box-shadow: 0 1px 2px rgba(20, 35, 63, 0.05);
  overflow: hidden;
}

.my-products-page :deep(.p-toolbar) {
  border: 0;
  border-bottom: 1px solid var(--tm-line);
  background: var(--tm-surface);
}

.company-products-page :deep(.p-datatable),
.my-products-page :deep(.p-datatable) { border-radius: var(--tm-radius-lg); }

.company-products-page :deep(.p-datatable-thead > tr > th),
.my-products-page :deep(.p-datatable-thead > tr > th) {
  background: var(--tm-surface-alt);
  color: var(--tm-muted);
  font-size: 11.5px;
  font-weight: 700;
}

/* Company-wide catalogue page uses the same data surface as the manage-products route. */
.company-products-page { display: flex; flex-direction: column; gap: 16px; }

.company-products-page .product-catalogue-surface {
  overflow: hidden;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius);
  background: var(--tm-surface);
  box-shadow: none;
}

.company-products-page .product-catalogue-table :deep(.p-datatable-table-container) { overflow-x: auto; scrollbar-width: thin; }

.company-products-page .product-catalogue-table :deep(.p-datatable-thead > tr > th) {
  padding: .9rem 1rem;
  border-color: var(--tm-line);
  background: var(--tm-surface-alt);
  color: var(--tm-muted);
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}

.company-products-page .product-catalogue-table :deep(.p-datatable-tbody > tr > td) {
  padding: .85rem 1rem;
  border-color: var(--tm-line);
  color: var(--tm-ink);
  vertical-align: middle;
}

.company-products-page .product-catalogue-table :deep(.p-datatable-tbody > tr:hover) { background: var(--tm-surface-alt); }

.company-products-page .product-catalogue-table :deep(.p-paginator) {
  justify-content: flex-start;
  padding: .8rem 1rem;
  border-top: 1px solid var(--tm-line);
  background: var(--tm-surface);
}

.company-products-create-link {
  display: inline-flex; min-height: 44px; align-items: center; justify-content: center; gap: .5rem;
  padding: .65rem 1rem; border-radius: var(--tm-radius); background: var(--tm-blue); color: #fff;
  font-size: 12.5px; font-weight: 600; text-decoration: none;
}

.company-products-create-link:hover { background: var(--tm-blue-strong); }

.company-products-create-link:focus-visible, .company-table-action-link:focus-visible { outline: 2px solid var(--tm-cyan-strong); outline-offset: 2px; }

.company-table-action-link { display: inline-grid; width: 44px; height: 44px; place-items: center; border-radius: var(--tm-radius-sm); color: var(--tm-muted); text-decoration: none; }

.company-table-action-link:hover { background: var(--tm-surface-alt); color: var(--tm-blue-strong); }

.company-products-page .product-catalogue-table :deep(.p-paginator-page),
.company-products-page .product-catalogue-table :deep(.p-paginator-next),
.company-products-page .product-catalogue-table :deep(.p-paginator-prev) {
  min-width: 2.25rem;
  min-height: 2.25rem;
  border-radius: var(--tm-radius);
}

@media (max-width: 640px) {
  .company-products-create-link { width: 100%; justify-content: center; }
}

.my-products-page .card,.company-products-page .product-catalogue-surface {
  border-radius: var(--tm-radius-lg);
  box-shadow: 0 1px 3px rgba(20, 35, 63, 0.06);
}

.my-products-page :deep(.p-toolbar) { background: var(--tm-surface-alt); }

.my-products-page :deep(.p-datatable-thead > tr > th),
.company-products-page .product-catalogue-table :deep(.p-datatable-thead > tr > th) { font-size: .74rem; }

.my-products-page :deep(.p-datatable-tbody > tr > td),
.company-products-page .product-catalogue-table :deep(.p-datatable-tbody > tr > td) { font-size: .82rem; }
</style>
