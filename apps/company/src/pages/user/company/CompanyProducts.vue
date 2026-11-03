<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { productsApi } from '@telecom/api-client'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

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
    <header class="page-header ds-page-heading">
      <div class="products-heading-copy"><span class="products-heading-icon" aria-hidden="true"><i class="pi pi-building"></i></span><div><h1>محصولات شرکت</h1><p>فهرست محصولات ثبت‌شده شرکت و وضعیت انتشار آن‌ها را مدیریت کنید.</p></div></div>
      <router-link :to="{ name: 'manage-product-create' }" class="company-products-create-link"><i class="pi pi-plus" aria-hidden="true"></i> محصول جدید</router-link>
    </header>

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

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
  padding: var(--ds-space-5) var(--ds-space-6);
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.page-header h1 { color: var(--ds-color-text); font-size: var(--ds-font-size-2xl); margin: 0; }
.my-products-page,
.company-products-page { display: flex; flex-direction: column; gap: var(--ds-space-5); }
.my-products-page .card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}
.my-products-page :deep(.p-toolbar) {
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.company-products-page :deep(.p-datatable),
.my-products-page :deep(.p-datatable) { border-radius: var(--ds-radius-xl); }
.company-products-page :deep(.p-datatable-thead > tr > th),
.my-products-page :deep(.p-datatable-thead > tr > th) {
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
@media (max-width: 640px) { .page-header { padding: var(--ds-space-4); } }


.products-heading-copy { min-width: 0; }

.company-products-page .page-header p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.7; }
@media (max-width: 640px) { .company-products-page .page-header { align-items: stretch; } }


/* Company-wide catalogue page uses the same data surface as the manage-products route. */
.company-products-page { display: flex; flex-direction: column; gap: var(--ds-space-5); }
.company-products-page .product-catalogue-surface {
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  box-shadow: none;
}
.company-products-page .product-catalogue-table :deep(.p-datatable-table-container) { overflow-x: auto; scrollbar-width: thin; }
.company-products-page .product-catalogue-table :deep(.p-datatable-thead > tr > th) {
  padding: .9rem 1rem;
  border-color: var(--ds-color-border);
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  white-space: nowrap;
}
.company-products-page .product-catalogue-table :deep(.p-datatable-tbody > tr > td) {
  padding: .85rem 1rem;
  border-color: var(--ds-color-border);
  color: var(--ds-color-text);
  vertical-align: middle;
}
.company-products-page .product-catalogue-table :deep(.p-datatable-tbody > tr:hover) { background: var(--ds-color-surface-hover); }
.company-products-page .product-catalogue-table :deep(.p-paginator) {
  justify-content: flex-start;
  padding: .8rem 1rem;
  border-top: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.company-products-page .page-header { padding: 0 0 var(--ds-space-4); border: 0; border-bottom: 1px solid var(--ds-color-border); border-radius: 0; background: transparent; box-shadow: none; }
.company-products-create-link {
  display: inline-flex; min-height: var(--ds-touch-target); align-items: center; justify-content: center; gap: .5rem;
  padding: .65rem 1rem; border-radius: var(--ds-radius-md); background: var(--ds-color-primary); color: var(--ds-color-primary-contrast);
  font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-semibold); text-decoration: none;
}
.company-products-create-link:hover { background: var(--ds-color-primary-hover); }
.company-products-create-link:focus-visible, .company-table-action-link:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }
.company-table-action-link { display: inline-grid; width: var(--ds-touch-target); height: var(--ds-touch-target); place-items: center; border-radius: var(--ds-radius-sm); color: var(--ds-color-text-muted); text-decoration: none; }
.company-table-action-link:hover { background: var(--ds-color-surface-hover); color: var(--ds-color-primary-text); }
.company-products-page .product-catalogue-table :deep(.p-paginator-page),
.company-products-page .product-catalogue-table :deep(.p-paginator-next),
.company-products-page .product-catalogue-table :deep(.p-paginator-prev) {
  min-width: 2.25rem;
  min-height: 2.25rem;
  border-radius: var(--ds-radius-md);
}
@media (max-width: 640px) {
  .company-products-page .page-header { align-items: stretch; padding: var(--ds-space-4); }
   .company-products-page .page-header :deep(.p-button), .company-products-create-link { width: 100%; justify-content: center; }
}

.products-heading-copy { display: flex; align-items: center; gap: .8rem; }
.products-heading-icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 18%, transparent);
  border-radius: 9px;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary-text);
  font-size: 1.05rem;
}
.my-products-page .page-header,.company-products-page .page-header {
  align-items: center;
  padding: .95rem 1.1rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  background: color-mix(in srgb, var(--ds-color-primary) 3%, var(--ds-color-surface));
  box-shadow: var(--ds-shadow-xs);
}
.my-products-page .page-header h1,.company-products-page .page-header h1 { font-size: 1.25rem; line-height: 1.45; }
.my-products-page .page-header p,.company-products-page .page-header p { font-size: .78rem; }
.my-products-page .card,.company-products-page .product-catalogue-surface {
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);
}
.my-products-page :deep(.p-toolbar) { background: var(--ds-color-surface-alt); }
.my-products-page :deep(.p-datatable-thead > tr > th),
.company-products-page .product-catalogue-table :deep(.p-datatable-thead > tr > th) { font-size: .74rem; }
.my-products-page :deep(.p-datatable-tbody > tr > td),
.company-products-page .product-catalogue-table :deep(.p-datatable-tbody > tr > td) { font-size: .82rem; }
@media (max-width: 640px) {
  .my-products-page .page-header,.company-products-page .page-header { align-items: flex-start; padding: .85rem; }
  .products-heading-icon { width: 2.2rem; height: 2.2rem; }
}

</style>