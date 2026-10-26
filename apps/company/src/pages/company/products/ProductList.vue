<template>
  <div class="product-list-page">
    <!-- Card with Toolbar -->
    <div class="card">
      <div class="card-head">
        <h1 class="card-head-title"><i class="pi pi-box"></i> مدیریت محصولات</h1>
      </div>
      <Toolbar>
        <template #start>
          <span class="search-input">
            <InputText v-model="searchQuery" placeholder="جستجوی محصول..." @input="debounceSearch" />
          </span>
          <Select v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value"
            placeholder="فیلتر وضعیت" class="filter-dropdown" @change="fetchProducts(1)" />
        </template>
        <template #end>
          <Button label="محصول جدید" icon="pi pi-plus" @click="openCreateDialog" />
        </template>
      </Toolbar>

      <DataTable :value="products" :loading="loading" :paginator="true" :rows="pagination.limit"
        :totalRecords="pagination.total" :rowsPerPageOptions="[5, 10, 20, 50]"
        @page="onPageChange" responsiveLayout="scroll" :rowHover="true"
        v-if="products.length > 0 || loading">
        <Column field="id" header="شناسه" sortable style="width: 80px"></Column>
        <Column field="title" header="عنوان" sortable>
          <template #body="{ data }">
            <div>
              <div class="product-title">{{ data.title }}</div>
              <div v-if="data.brand || data.model" class="product-meta">
                {{ [data.brand, data.model].filter(Boolean).join(' · ') }}
              </div>
            </div>
          </template>
        </Column>
        <Column header="شرکت">
          <template #body="{ data }">
            {{ data.company?.name || '-' }}
          </template>
        </Column>
        <Column header="دسته‌بندی">
          <template #body="{ data }">
            {{ data.category?.name || '-' }}
          </template>
        </Column>
        <Column field="status" header="وضعیت" style="width: 170px">
          <template #body="{ data }">
            <div class="status-cell">
              <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
              <span v-if="getUnreviewedEditCount(data) > 0" class="unreviewed-badge" v-tooltip.top="'شمار ویرایش‌های پس از تأیید که هنوز بازبینی نشده‌اند'">
                <i class="pi pi-pencil" />
                {{ getUnreviewedEditCount(data) }} ویرایش بدون بازبینی
              </span>
            </div>
          </template>
        </Column>
        <Column header="عملیات" style="width: 160px">
          <template #body="{ data }">
            <div class="actions-cell">
              <Button v-if="['DRAFT', 'REJECTED'].includes(data.status)" icon="pi pi-send" severity="success" rounded text v-tooltip.top="'ارسال برای بررسی'" @click="submitForReview(data)" />
              <Button v-if="data.status === 'APPROVED'" icon="pi pi-globe" severity="success" rounded text :loading="publishingId === data.id" v-tooltip.top="'انتشار در سایت پس از تأیید STAFF'" @click="publishProduct(data)" />
              <Button v-if="canEdit(data)" icon="pi pi-pencil" severity="info" rounded text v-tooltip.top="'ویرایش محصول'" @click="editProduct(data)" />
              <!-- Approve/Reject are STAFF-only actions (products.approve / products.reject —
                   see backend/prisma/seed.js). Company roles never hold these permissions;
                   the backend already 403s them, but the buttons don't belong in this panel
                   at all — the review happens in the Admin Panel. -->
              <Button icon="pi pi-copy" severity="secondary" rounded text v-tooltip.top="'کپی محصول'" @click="duplicateProduct(data)" />
              <Button v-if="data.status === 'REJECTED'" icon="pi pi-info-circle" severity="warning" rounded text v-tooltip.top="'علت رد'" @click="showRejection(data)" />
              <!-- products.delete: COMPANY_MANAGER only, COMPANY_USER does not have it -->
              <Button v-if="canDelete" icon="pi pi-trash" severity="danger" rounded text @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>

      <div v-else-if="loadError" class="empty-state">
        <i class="pi pi-exclamation-triangle"></i>
        <p>{{ loadError }}</p>
        <Button label="تلاش مجدد" icon="pi pi-refresh" severity="secondary" @click="fetchProducts(pagination.page)" />
      </div>

      <div v-else-if="!loading" class="empty-state">
        <i class="pi pi-box"></i>
        <p>محصولی یافت نشد</p>
      </div>
    </div>

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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { productsApi, companiesApi } from '@telecom/api-client'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../../../stores/auth'
import { getStatusLabel, getStatusSeverity, STATUS_OPTIONS, canEdit, getUnreviewedEditCount } from '../../../config/product'
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

function debounceSearch() {
  clearTimeout(debounceSearch.timer)
  debounceSearch.timer = setTimeout(() => {
    fetchProducts(1)
  }, 500)
}

async function fetchProducts(page = 1) {
  loading.value = true
  loadError.value = ''
  try {
    // Management listing: use the authenticated endpoint so the caller sees
    // ALL statuses (SUPER_ADMIN → every company, company user → own company).
    // The public `list` endpoint would only return PUBLISHED products.
    const params = { page, search: searchQuery.value }
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

function onPageChange(event) {
  fetchProducts(event.page + 1)
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
  padding: 1.5rem;
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
</style>