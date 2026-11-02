<template>
  <div class="product-list-page ds-stack">
    <!-- Card with Toolbar -->
<WorkspacePageHeading eyebrow="کاتالوگ شرکت" title="مدیریت محصولات شرکت" description="محصولات شرکت را مدیریت کنید و روند بررسی و انتشار آن‌ها را دنبال کنید." icon="pi pi-briefcase" heading-id="product-management-title" />
        <section class="card ds-panel product-management-surface" aria-label="فهرست و ابزارهای مدیریت محصولات">
      <Toolbar class="ds-toolbar product-management-toolbar">
        <template #start>
          <span class="search-input">
            <InputText v-model="searchQuery" placeholder="جستجوی محصول..." @input="debounceSearch" />
          </span>
          <Select v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value"
            placeholder="فیلتر وضعیت" class="filter-dropdown" @change="onStatusFilterChange" />
        </template>
        <template #end>
          <Button label="محصول جدید" icon="pi pi-plus" @click="openCreateDialog" />
        </template>
      </Toolbar>

      <SharedDataTable
        ref="productTableRef"
        v-if="products.length > 0 || loading"
        class="product-management-table"
        title="فهرست محصولات شرکت"
        :columns="productTableColumns"
        :rows="products"
        :loading="loading"
        :lazy="true"
        :total-records="pagination.total"
        :rows-per-page="pagination.limit"
        :rows-per-page-options="[10, 20, 50]"
        :searchable="false"
        :column-toggle="false"
        :mobile-card-layout="true"
        @request="onTableRequest"
      >
        <template #productTitle="{ row }">
          <div class="product-title-cell">
            <strong class="product-title">{{ row.title }}</strong>
            <span v-if="row.brand || row.model" class="product-meta">
              {{ [row.brand, row.model].filter(Boolean).join(' · ') }}
            </span>
          </div>
        </template>
        <template #status="{ row }">
          <div class="status-cell">
            <Tag :value="statusLabel(row.status)" :severity="statusSeverity(row.status)" />
            <span v-if="getUnreviewedEditCount(row) > 0" class="unreviewed-badge" v-tooltip.top="'شمار ویرایش‌های پس از تأیید که هنوز بازبینی نشده‌اند'">
              <i class="pi pi-pencil" />
              {{ getUnreviewedEditCount(row) }} ویرایش بدون بازبینی
            </span>
          </div>
        </template>
        <template #actions="{ row }">
          <Button v-if="canSubmitForReview(row)" icon="pi pi-send" severity="success" rounded text v-tooltip.top="'ارسال برای بررسی'" aria-label="ارسال محصول برای بررسی" @click="submitForReview(row)" />
          <Button v-if="row.status === 'APPROVED'" icon="pi pi-globe" severity="success" rounded text :loading="publishingId === row.id" v-tooltip.top="'انتشار در سایت پس از تأیید STAFF'" aria-label="انتشار محصول" @click="publishProduct(row)" />
          <Button v-if="canEdit(row)" icon="pi pi-pencil" severity="info" rounded text v-tooltip.top="'ویرایش محصول'" aria-label="ویرایش محصول" @click="editProduct(row)" />
          <Button icon="pi pi-copy" severity="secondary" rounded text v-tooltip.top="'کپی محصول'" aria-label="کپی محصول" @click="duplicateProduct(row)" />
          <Button v-if="row.status === 'REJECTED'" icon="pi pi-info-circle" severity="warning" rounded text v-tooltip.top="'علت رد'" aria-label="مشاهده علت رد" @click="showRejection(row)" />
          <Button v-if="canDelete" icon="pi pi-trash" severity="danger" rounded text v-tooltip.top="'حذف محصول'" aria-label="حذف محصول" @click="confirmDelete(row)" />
        </template>
      </SharedDataTable>

      <div v-else-if="loadError" class="empty-state">
        <i class="pi pi-exclamation-triangle"></i>
        <p>{{ loadError }}</p>
        <Button label="تلاش مجدد" icon="pi pi-refresh" severity="secondary" @click="fetchProducts(pagination.page)" />
      </div>

      <div v-else-if="!loading" class="empty-state">
        <i class="pi pi-box"></i>
        <p>محصولی یافت نشد</p>
      </div>
    </section>

    <!-- Create/Edit Product Dialog -->
    <Dialog v-model:visible="showDialog" :header="dialogHeader" :modal="true" class="p-fluid">
      <div class="field">
        <label for="title">عنوان</label>
        <InputText id="title" v-model="form.title" />
      </div>
      <div class="field">
        <label for="description">توضیحات</label>
        <Textarea id="description" v-model="form.description" rows="3" />
      </div>
      <div class="field">
        <label for="company">شرکت</label>
        <Select id="company" v-model="form.companyId" :options="companies" optionLabel="name" optionValue="id" placeholder="انتخاب کنید" />
      </div>
      <div class="field">
        <label for="category">دسته‌بندی</label>
        <Select id="category" v-model="form.categoryId" :options="categories" optionLabel="name" optionValue="id" placeholder="انتخاب کنید" />
      </div>
      <div class="field">
        <label for="status">وضعیت</label>
        <Select id="status" v-model="form.status" :options="['DRAFT', 'PUBLISHED', 'ARCHIVED']" placeholder="انتخاب کنید" />
      </div>
      <template #footer>
        <Button label="انصراف" icon="pi pi-times" severity="secondary" text @click="closeDialog" />
        <Button label="ذخیره" icon="pi pi-check" @click="saveProduct" />
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="showDeleteDialog" header="تایید حذف" :modal="true">
      <p>آیا از حذف محصول "{{ productToDelete?.title }}" مطمئن هستید؟</p>
      <template #footer>
        <Button label="خیر" icon="pi pi-times" severity="secondary" text @click="showDeleteDialog = false" />
        <Button label="بله" icon="pi pi-check" severity="danger" @click="deleteProduct" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showReasonDialog" header="علت رد محصول" :modal="true">
      <p>{{ rejectionReason || 'علتی ثبت نشده است.' }}</p>
      <template #footer>
        <Button label="بستن" icon="pi pi-times" severity="secondary" text @click="showReasonDialog = false" />
      </template>
    </Dialog>

  </div>
</template>

<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import SharedDataTable from '@telecom/shared-ui/components/common/DataTable.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { productsApi, companiesApi } from '@telecom/api-client'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../../../stores/auth'
import { getStatusLabel, getStatusSeverity, STATUS_OPTIONS, canEdit, canSubmitForReview, getUnreviewedEditCount } from '../../../config/product'
import Select from 'primevue/select'

const toast = useToast()
const router = useRouter()
const auth = useAuthStore()

// The company filter/selector is only meaningful (and permitted) for
// SUPER_ADMIN. Company users manage their own products, so the /companies
// list endpoint is not fetched for them (it would 403).
const canChooseCompany = computed(() => auth.isSuperAdmin)

// products.delete is granted to COMPANY_MANAGER only (see backend/prisma/seed.js
// ROLE_PERMISSIONS.COMPANY_USER) — hide the delete action for COMPANY_USER
// instead of showing a button that will always 403.
const canDelete = computed(() => auth.hasPermission('products.delete'))

const products = ref([])
const productTableRef = ref(null)
const companies = ref([])
const categories = ref([])
const loading = ref(false)
const publishingId = ref(null)
const loadError = ref('')
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const showReasonDialog = ref(false)
const editingId = ref(null)
const productToDelete = ref(null)
const rejectionReason = ref('')
const searchQuery = ref('')
const statusFilter = ref(null)
const statusOptions = STATUS_OPTIONS

// Use centralized status helpers from config/product.js
const statusLabel = getStatusLabel
const statusSeverity = getStatusSeverity
const productTableColumns = [
  { field: 'id', header: 'شناسه', sortable: true, style: 'width: 6rem' },
  { field: 'title', header: 'عنوان', sortable: true, slot: 'productTitle' },
  { field: 'company.name', header: 'شرکت' },
  { field: 'category.name', header: 'دسته‌بندی' },
  { field: 'status', header: 'وضعیت', slot: 'status' },
]


const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
})

const form = ref({
  title: '',
  description: '',
  companyId: null,
  categoryId: null,
  status: 'DRAFT'
})

const dialogHeader = computed(() => {
  return editingId.value ? 'ویرایش محصول' : 'ایجاد محصول جدید'
})

function resetTablePage() {
  productTableRef.value?.resetPage()
}

function onStatusFilterChange() {
  resetTablePage()
  fetchProducts(1)
}

function debounceSearch() {
  clearTimeout(debounceSearch.timer)
  debounceSearch.timer = setTimeout(() => {
    resetTablePage()
    fetchProducts(1)
  }, 500)
}

async function fetchProducts(page = 1, limit = pagination.value.limit) {
  loading.value = true
  loadError.value = ''
  try {
    // Management listing: use the authenticated endpoint so the caller sees
    // ALL statuses (SUPER_ADMIN → every company, company user → own company).
    // The public `list` endpoint would only return PUBLISHED products.
    const params = { page, limit, search: searchQuery.value }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await productsApi.myProducts(params)
    // New envelope: res.data = { data: [...], meta: {...} }
    const body = res.data
    const items = body?.data?.data || body?.data || body?.items || body || []
    products.value = Array.isArray(items) ? items : []
    if (body?.data?.meta || body?.meta) {
      const meta = body?.data?.meta || body?.meta
      pagination.value = {
        page: meta?.page || page,
        limit: meta?.limit || 10,
        total: meta?.total || 0,
        totalPages: meta?.totalPages || 1,
      }
    }
  } catch (err) {
    // Inline error state (with retry) instead of a misleading empty list.
    // Network failures (no HTTP status) get a dedicated, human-readable message.
    const status = err.status ?? err.response?.status
    loadError.value = err.response?.data?.error?.message || err.serverMessage || (status ? (err.message || 'خطا در دریافت محصولات') : 'ارتباط با سرور برقرار نشد')
    products.value = []
    toast.add({ severity: 'error', summary: 'خطا', detail: loadError.value, life: 4000 })
  } finally {
    loading.value = false
  }
}

async function fetchCompanies() {
  try {
    const res = await companiesApi.list()
    const body = res.data
    const items = body?.data?.data || body?.data || body?.items || body || []
    companies.value = Array.isArray(items) ? items : []
  } catch (err) {
    console.error('Error fetching companies:', err)
  }
}

function onTableRequest({ page, rows }) {
  pagination.value.limit = rows
  fetchProducts(page, rows)
}

function openCreateDialog() {
  router.push({ name: 'manage-product-create' })
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

function closeDialog() {
  showDialog.value = false
}

async function saveProduct() {
  try {
    if (editingId.value) {
      await productsApi.update(editingId.value, form.value)
      toast.add({ severity: 'success', summary: 'موفقیت', detail: 'محصول با موفقیت بروزرسانی شد', life: 3000 })
    } else {
      await productsApi.create(form.value)
      toast.add({ severity: 'success', summary: 'موفقیت', detail: 'محصول با موفقیت ایجاد شد', life: 3000 })
    }
    showDialog.value = false
    resetTablePage()
    editingId.value = null
    form.value = { title: '', description: '', companyId: null, categoryId: null, status: 'DRAFT' }
    await fetchProducts()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در ذخیره محصول', life: 3000 })
  }
}

async function submitForReview(product) {
  try {
    await productsApi.submitReview(product.id)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'محصول برای بررسی ارسال شد', life: 3000 })
    await fetchProducts(pagination.value.page)
  } catch (err) {
    // The API returns the specific missing requirements in error.details
    // (falls back to errors / message for older shapes).
    const body = err.response?.data?.error || err.response?.data || {}
    const reasons = body.details || body.errors
    const detail = Array.isArray(reasons) && reasons.length
      ? reasons.join('؛ ')
      : body.message || err.message || 'محصول آماده ارسال برای بررسی نیست'
    toast.add({ severity: 'error', summary: 'محصول آماده ارسال نیست', detail, life: 7000 })
  }
}

async function duplicateProduct(product) {
  try {
    const payload = {
      title: `${product.title} - کپی`,
      description: product.description,
      shortDescription: product.shortDescription,
      companyId: product.companyId,
      categoryId: product.categoryId,
      brand: product.brand,
      model: product.model,
      specifications: product.specifications || {},
      status: 'DRAFT',
      priceTiers: (product.prices || []).map(({ minQuantity, maxQuantity, price, unit, validFrom, validTo }) => ({ minQuantity, maxQuantity, price: Number(price), unit, validFrom, validTo }))
    }
    await productsApi.create(payload)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'نسخه پیش‌نویس محصول ایجاد شد', life: 3000 })
    await fetchProducts(pagination.value.page)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در کپی محصول', life: 3000 })
  }
}

function showRejection(product) {
  rejectionReason.value = (product.statusHistory || []).find((item) => item.newStatus === 'REJECTED')?.comment || ''
  showReasonDialog.value = true
}

function confirmDelete(product) {
  productToDelete.value = product
  showDeleteDialog.value = true
}

async function deleteProduct() {
  try {
    await productsApi.delete(productToDelete.value.id)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'محصول با موفقیت حذف شد', life: 3000 })
    showDeleteDialog.value = false
    resetTablePage()
    await fetchProducts()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در حذف محصول', life: 3000 })
  }
}

onMounted(() => {
  fetchProducts()
  // Only SUPER_ADMIN may read the platform-wide company list.
  if (canChooseCompany.value) fetchCompanies()
})

</script>

<style scoped>
.product-list-page {
  direction: rtl;
  padding: 0;
  gap: clamp(1rem, 2vw, 1.5rem);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
}

.page-header-actions {
  display: flex;
  gap: 0.5rem;
}

.card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  box-shadow: var(--ds-shadow-sm);
  overflow: hidden;
}

:deep(.p-toolbar) {
  background: var(--surface-card);
  border: none;
  border-bottom: 1px solid var(--surface-border);
  border-radius: 0;
  padding: 1rem 1.25rem;
  gap: 0.75rem;
}

:deep(.p-datatable) {
  background: transparent;
  border: none;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--surface-hover);
  color: var(--text-color-secondary);
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--surface-border);
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  transition: background 0.15s ease;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: var(--surface-hover);
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--surface-border);
  color: var(--text-color);
  vertical-align: middle;
}

:deep(.p-datatable .p-datatable-tbody > tr:last-child > td) {
  border-bottom: none;
}

.search-input {
  min-width: 240px;
}

.filter-dropdown {
  min-width: 160px;
}

.product-title {
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.4;
}

.product-meta {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  opacity: 0.4;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

.actions-cell {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
}

.status-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.unreviewed-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
  border-radius: 6px;
  padding: 0.15rem 0.5rem;
  white-space: nowrap;
}

:deep(.p-paginator) {
  background: var(--surface-card);
  border-top: 1px solid var(--surface-border);
  border-radius: 0;
  padding: 0.75rem 1rem;
}

@media (max-width: 767px) {
  .product-list-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-input {
    min-width: 100%;
  }

  :deep(.p-datatable .p-datatable-thead > tr > th),
  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.625rem 0.75rem;
  }
}

/* Consistent catalogue management surface and dense-table hierarchy. */
.product-list-page { gap: var(--ds-space-5); }
.product-list-page .ds-page-heading { margin-bottom: 0; }
.product-list-page .card {
  border-radius: var(--ds-radius-xl);
  border-color: var(--ds-color-border);
  box-shadow: var(--ds-shadow-xs);
}
.product-list-page :deep(.p-toolbar) {
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl) var(--ds-radius-xl) 0 0;
  background: var(--ds-color-surface);
  padding: var(--ds-space-4) var(--ds-space-5);
  gap: var(--ds-space-3);
}
.product-list-page :deep(.p-datatable) { border: 0; }
.product-list-page :deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  padding: var(--ds-space-4) var(--ds-space-5);
  white-space: nowrap;
}
.product-list-page :deep(.p-datatable .p-datatable-tbody > tr > td) {
  border-color: var(--ds-color-border);
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-sm);
  padding: var(--ds-space-4) var(--ds-space-5);
}
.product-list-page :deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: var(--ds-color-surface-hover);
}
@media (max-width: 640px) {
  .product-list-page :deep(.p-toolbar) { align-items: stretch; }
  .product-list-page :deep(.p-toolbar-start),
  .product-list-page :deep(.p-toolbar-end) { flex-wrap: wrap; }
}

/* Product operations workspace — consistent between admin and company portals. */
.product-list-page { gap: clamp(1rem, 2vw, 1.5rem); }
.product-management-intro {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: linear-gradient(110deg, color-mix(in srgb, var(--ds-color-primary) 8%, var(--ds-color-surface)), var(--ds-color-surface) 72%);
  box-shadow: var(--ds-shadow-xs);
}
.product-management-intro-icon {
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  flex: 0 0 auto;
  border-radius: 1rem;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
  font-size: 1.35rem;
}
.product-management-intro-copy { min-width: 0; }
.product-management-intro-copy > span {
  display: block;
  margin-bottom: .2rem;
  color: var(--ds-color-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
.product-management-intro-copy h1 {
  margin: 0;
  color: var(--ds-color-text);
  font-size: clamp(1.3rem, 2vw, 1.7rem);
  font-weight: 800;
}
.product-management-intro-copy p {
  margin: .35rem 0 0;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  line-height: 1.7;
}
.product-management-surface {
  overflow: hidden;
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.product-list-page :deep(.p-toolbar) { flex-wrap: wrap; }
.product-list-page :deep(.p-toolbar-start),
.product-list-page :deep(.p-toolbar-end) {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .7rem;
}
.product-list-page :deep(.p-toolbar .p-inputtext),
.product-list-page :deep(.p-toolbar .p-select) {
  min-height: 2.65rem;
  border-radius: var(--ds-radius-md);
}
.product-list-page :deep(.p-toolbar .p-button) { min-height: 2.65rem; border-radius: var(--ds-radius-md); }
.product-list-page :deep(.p-paginator) {
  border-top: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.product-list-page :deep(.p-datatable-table-container) { overflow-x: auto; }
@media (max-width: 767px) {
  .product-list-page :deep(.ent-table--mobile-cards .p-datatable-table-container) { overflow: visible; }
  .product-list-page :deep(.ent-table--mobile-cards .p-datatable-table) { min-width: 0; }
}
.product-list-page :deep(.p-datatable-tbody > tr) { transition: background var(--ds-transition-fast); }
.product-list-page :deep(.p-datatable-tbody > tr > td) { vertical-align: middle; }
.product-list-page :deep(.p-datatable .p-button.p-button-text) {
  width: 2.75rem;
  min-width: 2.75rem;
  height: 2.75rem;
  min-height: 2.75rem;
}
.table-state {
  min-height: 15rem;
  border-top: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.table-state i { color: var(--ds-color-primary); opacity: .65; }
@media (max-width: 640px) {
  .product-management-intro { align-items: flex-start; padding: 1rem; }
  .product-management-intro-icon { width: 2.75rem; height: 2.75rem; }
  .product-list-page :deep(.p-toolbar-start),
  .product-list-page :deep(.p-toolbar-end) { width: 100%; }
  .product-list-page :deep(.p-toolbar-end) { justify-content: stretch; }
  .product-list-page :deep(.p-toolbar-end .p-button) { width: 100%; }
}


/* Company catalogue: match the admin management surface while retaining tenant-scoped actions. */
.product-management-intro {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 7.5rem;
  padding: clamp(1.15rem, 2.4vw, 1.6rem);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 18%, var(--ds-color-border));
  border-radius: var(--ds-radius-xl);
  background:
    radial-gradient(circle at 8% 0%, color-mix(in srgb, var(--ds-color-primary) 13%, transparent), transparent 42%),
    var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.product-management-intro-icon {
  display: grid;
  place-items: center;
  flex: 0 0 3.25rem;
  width: 3.25rem;
  height: 3.25rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 24%, transparent);
  border-radius: 1rem;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
  font-size: 1.35rem;
}
.product-management-intro-copy { min-width: 0; }
.product-management-intro-copy > span {
  color: var(--ds-color-primary-text);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
.product-management-intro-copy h1 {
  margin: .2rem 0;
  color: var(--ds-color-text);
  font-size: clamp(1.3rem, 2vw, 1.7rem);
  font-weight: var(--ds-font-weight-bold);
}
.product-management-intro-copy p {
  margin: 0;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  line-height: 1.8;
}
.product-management-surface {
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.product-management-toolbar {
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.product-management-toolbar :deep(.p-toolbar-start),
.product-management-toolbar :deep(.p-toolbar-end) { gap: .65rem; flex-wrap: wrap; }
.product-management-toolbar :deep(.p-inputtext),
.product-management-toolbar :deep(.p-select) {
  min-height: 2.65rem;
  border-radius: var(--ds-radius-md);
}
.product-management-table :deep(.p-datatable-table-container) { overflow-x: auto; scrollbar-width: thin; }
.product-management-table :deep(.p-datatable-thead > tr > th) {
  padding: .9rem 1rem;
  border-color: var(--ds-color-border);
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  white-space: nowrap;
}
.product-management-table :deep(.p-datatable-tbody > tr > td) {
  padding: .85rem 1rem;
  border-color: var(--ds-color-border);
  color: var(--ds-color-text);
  vertical-align: middle;
}
.product-management-table :deep(.p-datatable-tbody > tr) { transition: background-color var(--ds-transition-fast); }
.product-management-table :deep(.p-datatable-tbody > tr:hover) { background: var(--ds-color-surface-hover); }
.product-management-table :deep(.p-paginator) {
  justify-content: flex-start;
  gap: .3rem;
  padding: .8rem 1rem;
  border-top: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.product-management-table :deep(.p-paginator-page),
.product-management-table :deep(.p-paginator-next),
.product-management-table :deep(.p-paginator-prev) {
  min-width: 2.75rem;
  min-height: 2.75rem;
  border-radius: var(--ds-radius-md);
}
.product-management-table :deep(.p-paginator-page.p-highlight) {
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary-text);
}
.product-management-table :deep(.p-button.p-button-text) { width: 2.2rem; height: 2.2rem; }
@media (max-width: 700px) {
  .product-management-intro { align-items: flex-start; }
  .product-management-toolbar :deep(.p-toolbar) { align-items: stretch; flex-direction: column; }
  .product-management-toolbar :deep(.p-toolbar-start),
  .product-management-toolbar :deep(.p-toolbar-end) { width: 100%; }
  .product-management-toolbar :deep(.p-toolbar-start) { display: grid; grid-template-columns: minmax(0, 1fr); }
  .product-management-toolbar :deep(.p-inputtext),
  .product-management-toolbar :deep(.p-select) { width: 100%; margin: 0; }
  .product-management-toolbar :deep(.p-toolbar-end .p-button) { width: 100%; }
}
</style>