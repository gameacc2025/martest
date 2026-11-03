<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { productsApi } from '@telecom/api-client'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'

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

function formatPrice(price) {
  return new Intl.NumberFormat('fa-IR', { style: 'currency', currency: 'IRR' }).format(price)
}
</script>

<template>
  <div class="my-products-page">
    <header class="page-header ds-page-heading">
      <div class="products-heading-copy"><h1>محصولات من</h1><p>محصولاتی را که مدیریت آن‌ها به حساب شما واگذار شده جستجو و پیگیری کنید.</p></div>
      <router-link :to="{ name: 'manage-product-create' }" class="products-create-link"><i class="pi pi-plus" aria-hidden="true"></i> محصول جدید</router-link>
    </header>

    <div class="card">
      <Toolbar>
        <template #start>
          <span class="p-input-icon-right">
            <i class="pi pi-search" aria-hidden="true" />
            <InputText v-model="searchQuery" name="myProductSearch" type="search" autocomplete="off" placeholder="جستجو…" aria-label="جستجو در محصولات من" @keyup.enter="fetchProducts(1)" />
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
            {{ data.prices?.[0]?.price != null ? formatPrice(data.prices[0].price) : '—' }}
          </template>
        </Column>
        <Column header="عملیات">
          <template #body="{ data }">
            <div class="flex gap-2">
              <router-link :to="{ name: 'manage-product-edit', params: { id: data.id } }" class="table-action-link" :aria-label="'ویرایش محصول ' + data.title"><i class="pi pi-pencil" aria-hidden="true"></i></router-link>
              <router-link :to="{ name: 'manage-product-edit', params: { id: data.id } }" class="table-action-link" :aria-label="'مشاهده تاریخچه محصول ' + data.title"><i class="pi pi-history" aria-hidden="true"></i></router-link>
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

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
  padding: 0 0 var(--ds-space-4);
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  border-radius: 0;
  box-shadow: none;
}
.page-header h1 { color: var(--ds-color-text); font-size: var(--ds-font-size-2xl); margin: 0; }
.my-products-page,
.company-products-page { display: flex; flex-direction: column; gap: var(--ds-space-5); }
.my-products-page .card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  box-shadow: none;
  overflow: hidden;
}
.my-products-page :deep(.p-toolbar) {
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.my-products-page :deep(.p-toolbar .p-inputtext) { min-height: 2.75rem; }
.my-products-page :deep(.p-button) { min-height: 2.75rem; }
.my-products-page :deep(.p-button.p-button-text) {
  width: 2.75rem;
  min-width: 2.75rem;
  height: 2.75rem;
}
.my-products-page :deep(.p-paginator-page),
.my-products-page :deep(.p-paginator-next),
.my-products-page :deep(.p-paginator-prev) {
  min-width: 2.75rem;
  min-height: 2.75rem;
}
.my-products-page :deep(.p-inputtext:focus-visible),
.my-products-page :deep(.p-button:focus-visible) {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 2px;
}
.company-products-page :deep(.p-datatable),
.my-products-page :deep(.p-datatable) { border-radius: var(--ds-radius-md); }
.company-products-page :deep(.p-datatable-thead > tr > th),
.my-products-page :deep(.p-datatable-thead > tr > th) {
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
@media (max-width: 640px) { .page-header { padding: var(--ds-space-4); } }


.products-heading-copy { min-width: 0; }

.my-products-page .page-header p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.7; }
@media (max-width: 640px) { .my-products-page .page-header { align-items: stretch; } }
.products-create-link {
  display: inline-flex; min-height: var(--ds-touch-target); align-items: center; justify-content: center; gap: .5rem;
  padding: .65rem 1rem; border-radius: var(--ds-radius-md); background: var(--ds-color-primary); color: var(--ds-color-primary-contrast);
  font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-semibold); text-decoration: none;
}
.products-create-link:hover { background: var(--ds-color-primary-hover); }
.products-create-link:focus-visible, .table-action-link:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }
.table-action-link { display: inline-grid; width: var(--ds-touch-target); height: var(--ds-touch-target); place-items: center; border-radius: var(--ds-radius-sm); color: var(--ds-color-text-muted); text-decoration: none; }
.table-action-link:hover { background: var(--ds-color-surface-hover); color: var(--ds-color-primary-text); }

</style>