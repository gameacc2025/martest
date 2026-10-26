<template>
  <div class="product-list-page">
    <!-- Card with Toolbar -->
    <div class="card">
      <Toolbar>
        <template #start>
          <span class="p-input-icon-right">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="جستجو..." @input="debounceSearch" />
          </span>
          <Select v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value"
            placeholder="فیلتر وضعیت" class="ml-2" style="min-width: 160px" @change="fetchProducts(1)" />
        </template>

        <template #end>
          <Button v-if="canCreateProduct" label="محصول جدید" icon="pi pi-plus" @click="openCreateDialog" />
        </template>
      </Toolbar>

      <DataTable :value="products" :loading="loading" :paginator="true" :rows="pagination.limit"
        :totalRecords="pagination.total" :rowsPerPageOptions="[5, 10, 20, 50]"
        @page="onPageChange" responsiveLayout="scroll" v-if="products.length > 0 || loading">
        <Column field="id" header="شناسه" sortable></Column>
        <Column field="title" header="عنوان" sortable></Column>
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
        <Column field="status" header="وضعیت">
          <template #body="{ data }">
            <div class="status-cell">
              <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
              <span v-if="getUnreviewedEditCount(data) > 0" class="unreviewed-badge" v-tooltip.top="'تغییرات پس از تأیید که هنوز بازبینی نشده‌اند'">
                <i class="pi pi-pencil" />
                {{ getUnreviewedEditCount(data) }} ویرایش
              </span>
            </div>
          </template>
        </Column>
        <Column header="عملیات">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-eye" severity="secondary" rounded text v-tooltip.top="'پیش‌نمایش'" @click="showPreview(data)" />
              <Button v-if="canEditProduct && data.status === 'DRAFT'" icon="pi pi-pencil" severity="info" rounded text v-tooltip.top="'ویرایش محصول'" @click="editProduct(data)" />
              <Button v-if="canApproveProduct && data.status === 'PENDING_REVIEW'" icon="pi pi-check" severity="success" rounded text v-tooltip.top="'تأیید'" :loading="approvingId === data.id" @click="approveProduct(data)" />
              <Button v-if="canRejectProduct && data.status === 'PENDING_REVIEW'" icon="pi pi-times" severity="danger" rounded text v-tooltip.top="'رد'" @click="openRejectDialog(data)" />
              <Button v-if="canPublishProduct && ['APPROVED', 'HIDDEN'].includes(data.status)" icon="pi pi-globe" severity="success" rounded text v-tooltip.top="'انتشار در سایت'" :loading="publishingId === data.id" @click="publishProduct(data)" />
              <Button v-if="canHideProduct && data.status === 'PUBLISHED'" icon="pi pi-eye-slash" severity="secondary" rounded text v-tooltip.top="'مخفی کردن از سایت'" :loading="hidingId === data.id" @click="hideProduct(data)" />
              <Button v-if="canArchiveProduct && ['DRAFT', 'REJECTED', 'APPROVED', 'PUBLISHED', 'HIDDEN'].includes(data.status)" icon="pi pi-folder" severity="secondary" rounded text v-tooltip.top="'بایگانی محصول'" :loading="archivingId === data.id" @click="archiveProduct(data)" />
              <Button v-if="canRestoreProduct && ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'HIDDEN', 'ARCHIVED'].includes(data.status)" icon="pi pi-replay" severity="warning" rounded text v-tooltip.top="'بازگردانی به پیش‌نویس'" :loading="restoringId === data.id" @click="restoreProductToDraft(data)" />
              <Button v-if="canCreateProduct" icon="pi pi-copy" severity="secondary" rounded text v-tooltip.top="'کپی محصول'" @click="duplicateProduct(data)" />
              <Button v-if="data.status === 'REJECTED'" icon="pi pi-info-circle" severity="warning" rounded text v-tooltip.top="'علت رد'" @click="showRejection(data)" />
              <Button v-if="canDeleteProduct" icon="pi pi-trash" severity="danger" rounded text @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>

      <div v-else-if="loadError" class="table-state">
        <i class="pi pi-exclamation-triangle" />
        <p>{{ loadError }}</p>
        <Button label="تلاش مجدد" icon="pi pi-refresh" severity="secondary" @click="fetchProducts(pagination.page)" />
      </div>

      <div v-else class="table-state">
        <i class="pi pi-box" />
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

    <!-- Reject product dialog -->
    <Dialog v-model:visible="showRejectDialog" header="رد محصول" :modal="true" :style="{ width: '32rem' }" :breakpoints="{ '640px': '92vw' }">
      <div class="field">
        <label>علت رد <span style="color: var(--p-red-500)">*</span></label>
        <Textarea v-model="rejectReason" placeholder="علت رد محصول را وارد کنید..." rows="3" class="w-full" />
      </div>
      <template #footer>
        <Button label="انصراف" icon="pi pi-times" severity="secondary" text @click="showRejectDialog = false" />
        <Button label="رد محصول" icon="pi pi-times" severity="danger" :loading="rejectingId !== null" @click="rejectProduct" />
      </template>
    </Dialog>

    <!-- Product preview (marketplace-style review) -->
    <Dialog v-model:visible="showPreviewDialog" header="پیش‌نمایش محصول" :modal="true"
      :style="{ width: '46rem' }" :breakpoints="{ '640px': '94vw' }" :contentStyle="{ maxHeight: '70vh', overflow: 'auto' }">
      <ProductPreviewCard v-if="previewProduct" :product="previewProduct" />
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { productsApi, companiesApi } from '@telecom/api-client'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../../../stores/auth'
import { getStatusLabel, getStatusSeverity, STATUS_OPTIONS, getUnreviewedEditCount } from '../../../config/product'
import ProductPreviewCard from '../../../components/ProductPreviewCard.vue'
import Select from 'primevue/select'

const toast = useToast()
const router = useRouter()
const auth = useAuthStore()

// The company filter/selector is only meaningful (and permitted) for
// SUPER_ADMIN. Company users manage their own products, so the /companies
// list endpoint is not fetched for them (it would 403).
const canChooseCompany = computed(() => auth.isSuperAdmin)
const canCreateProduct = computed(() => auth.isSuperAdmin || (auth.hasPermission('products.create') && Boolean(auth.companyId)))
const canEditProduct = computed(() => auth.isSuperAdmin || (auth.hasPermission('products.update') && Boolean(auth.companyId)))
const canDeleteProduct = computed(() => auth.isSuperAdmin || (auth.hasPermission('products.delete') && Boolean(auth.companyId)))
const canApproveProduct = computed(() => auth.isSuperAdmin || auth.hasPermission('products.approve'))
const canRejectProduct = computed(() => auth.isSuperAdmin || auth.hasPermission('products.reject'))
const canPublishProduct = computed(() => auth.isSuperAdmin || auth.hasPermission('products.publish'))
const canHideProduct = computed(() => auth.isSuperAdmin || auth.hasPermission('products.hide'))
const canArchiveProduct = computed(() => auth.isSuperAdmin || auth.hasPermission('products.archive'))
const canRestoreProduct = computed(() => auth.isSuperAdmin || auth.hasPermission('products.review'))


const products = ref([])
const companies = ref([])
const categories = ref([])
const loading = ref(false)
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

// Approve / reject workflow (PENDING_REVIEW products)
const approvingId = ref(null)
const publishingId = ref(null)
const hidingId = ref(null)
const archivingId = ref(null)
const restoringId = ref(null)
const rejectingId = ref(null)
const showRejectDialog = ref(false)
const rejectReason = ref('')
const productToReject = ref(null)

// Marketplace-style preview
const showPreviewDialog = ref(false)
const previewProduct = ref(null)

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
  router.push({ name: 'admin-product-create' })
}

function editProduct(product) {
  router.push({ name: 'admin-product-edit', params: { id: product.id } })
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

async function approveProduct(product) {
  try {
    approvingId.value = product.id
    await productsApi.approve(product.id, 'تأیید توسط مدیر سیستم')
    toast.add({ severity: 'success', summary: 'موفقیت', detail: `محصول "${product.title}" تأیید شد`, life: 3000 })
    await fetchProducts(pagination.value.page)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.response?.data?.error?.message || err.message || 'خطا در تأیید محصول', life: 4000 })
  } finally {
    approvingId.value = null
  }
}

async function publishProduct(product) {
  try {
    publishingId.value = product.id
    await productsApi.publish(product.id, 'انتشار توسط مدیر سیستم')
    toast.add({ severity: 'success', summary: 'موفقیت', detail: `محصول "${product.title}" در سایت منتشر شد`, life: 3000 })
    await fetchProducts(pagination.value.page)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.response?.data?.error?.message || err.message || 'خطا در انتشار محصول', life: 4000 })
  } finally {
    publishingId.value = null
  }
}

async function hideProduct(product) {
  try {
    hidingId.value = product.id
    await productsApi.hide(product.id, 'مخفی‌سازی توسط مدیر سیستم')
    toast.add({ severity: 'success', summary: 'موفقیت', detail: `محصول "${product.title}" از کاتالوگ عمومی مخفی شد`, life: 3000 })
    await fetchProducts(pagination.value.page)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.response?.data?.error?.message || err.message || 'مخفی‌سازی محصول ناموفق بود', life: 4000 })
  } finally {
    hidingId.value = null
  }
}

async function archiveProduct(product) {
  try {
    archivingId.value = product.id
    await productsApi.archive(product.id, 'بایگانی توسط مدیر سیستم')
    toast.add({ severity: 'success', summary: 'موفقیت', detail: `محصول "${product.title}" بایگانی شد`, life: 3000 })
    await fetchProducts(pagination.value.page)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.response?.data?.error?.message || err.message || 'بایگانی محصول ناموفق بود', life: 4000 })
  } finally {
    archivingId.value = null
  }
}

async function restoreProductToDraft(product) {
  try {
    restoringId.value = product.id
    await productsApi.restoreDraft(product.id, 'بازگردانی به پیش‌نویس توسط مدیر سیستم')
    toast.add({ severity: 'success', summary: 'موفقیت', detail: `محصول "${product.title}" به پیش‌نویس بازگردانده شد`, life: 3000 })
    await fetchProducts(pagination.value.page)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.response?.data?.error?.message || err.message || 'بازگردانی محصول ناموفق بود', life: 4000 })
  } finally {
    restoringId.value = null
  }
}

function openRejectDialog(product) {
  productToReject.value = product
  rejectReason.value = ''
  showRejectDialog.value = true
}

async function rejectProduct() {
  if (!rejectReason.value.trim()) {
    toast.add({ severity: 'warn', summary: 'خطا', detail: 'لطفاً علت رد را وارد کنید', life: 3000 })
    return
  }
  try {
    rejectingId.value = productToReject.value.id
    await productsApi.reject(productToReject.value.id, rejectReason.value)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: `محصول "${productToReject.value.title}" رد شد`, life: 3000 })
    showRejectDialog.value = false
    await fetchProducts(pagination.value.page)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.response?.data?.error?.message || err.message || 'خطا در رد محصول', life: 4000 })
  } finally {
    rejectingId.value = null
  }
}

function showRejection(product) {
  rejectionReason.value = (product.statusHistory || []).find((item) => item.newStatus === 'REJECTED')?.comment || ''
  showReasonDialog.value = true
}

function showPreview(product) {
  previewProduct.value = product
  showPreviewDialog.value = true
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

.table-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  color: var(--text-color-secondary);
  text-align: center;
}

.table-state i {
  font-size: 2.5rem;
  opacity: 0.4;
}

.table-state p {
  margin: 0;
  font-size: 0.95rem;
}
</style>