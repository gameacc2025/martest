<template>
  <div class="company-list-page ds-stack">
    <!-- Card with Toolbar -->
    <header class="management-page-intro" aria-labelledby="management-page-title">
      <span class="management-page-icon"><i class="pi pi-building"></i></span>
      <div class="management-page-copy">
        <span>مدیریت اعضای بازارگاه</span>
        <h1 id="management-page-title">مدیریت شرکت‌ها</h1>
        <p>اطلاعات، وضعیت و تأیید شرکت‌های عضو بازارگاه را مدیریت کنید.</p>
      </div>
    </header>
    <div class="card ds-panel company-management-surface">
      <Toolbar class="ds-toolbar company-management-toolbar">
        <template #start>
          <span class="p-input-icon-right">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="جستجوی شرکت..."
              @input="debounceSearch"
            />
          </span>

          <Select
            v-model="statusFilter"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="وضعیت"
            class="filter-control"
            @change="applyFilters"
          />

          <Select
            v-model="typeFilter"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="نوع شرکت"
            class="filter-control"
            @change="applyFilters"
          />
        </template>

        <template #end>
          <Button
            v-if="canCreateCompany"
            label="افزودن شرکت"
            icon="pi pi-plus"
            @click="openCreateDialog"
          />
        </template>
      </Toolbar>

      <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
        {{ errorMessage }}
      </Message>

      <DataTable
        :value="companies"
        :loading="loading"
        :paginator="true"
        :lazy="true"
        :first="first"
        :rows="pagination.limit"
        :totalRecords="pagination.total"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        @page="onPageChange"
        responsiveLayout="scroll"
      >
        <template #loading>
          <div class="text-center py-8">
            <i class="pi pi-spin pi-spinner text-primary-600"></i>
            <span class="mr-2">در حال دریافت شرکت‌ها...</span>
          </div>
        </template>

        <template #empty>
          <div class="text-center text-muted" style="padding: 2rem 0">
            <i class="pi pi-building text-4xl mb-4 block"></i>
            <div class="font-semibold mb-2">هیچ شرکتی یافت نشد</div>
            <div>با معیارهای فعلی هیچ شرکتی برای نمایش وجود ندارد.</div>
          </div>
        </template>

        <Column header="لوگو">
          <template #body="{ data }">
            <Avatar
              v-if="getCompanyLogo(data)"
              :image="getCompanyLogo(data)"
              shape="circle"
              size="large"
            />
            <Avatar v-else icon="pi pi-building" shape="circle" size="large" />
          </template>
        </Column>
        <Column field="name" header="نام شرکت" sortable>
          <template #body="{ data }">
            {{ data.name || data.companyName || '-' }}
          </template>
        </Column>
        <Column field="type" header="نوع">
          <template #body="{ data }">
            <Tag :severity="getTypeSeverity(data.type)">
              {{ getTypeLabel(data.type) }}
            </Tag>
          </template>
        </Column>
        <Column field="email" header="ایمیل">
          <template #body="{ data }">
            {{ data.email || '-' }}
          </template>
        </Column>
        <Column field="phone" header="تلفن">
          <template #body="{ data }">
            {{ data.phone || data.phoneNumber || '-' }}
          </template>
        </Column>
        <Column field="status" header="وضعیت">
          <template #body="{ data }">
            <Tag :severity="getStatusSeverity(data.status)">
              {{ getStatusLabel(data.status) }}
            </Tag>
          </template>
        </Column>
        <Column field="isVerified" header="تایید">
          <template #body="{ data }">
            <Tag :severity="data.isVerified ? 'success' : 'warning'">
              {{ data.isVerified ? 'تایید شده' : 'در انتظار تایید' }}
            </Tag>
          </template>
        </Column>
        <Column field="createdAt" header="تاریخ ایجاد" sortable>
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>
        <Column header="عملیات" :exportable="false" style="min-width: 12rem">
          <template #body="{ data }">
            <div class="flex align-items-center gap-2">
              <Button
                v-if="canEditCompany"
                icon="pi pi-pencil"
                severity="info"
                text
                rounded
                v-tooltip.top="'ویرایش شرکت'"
                aria-label="ویرایش شرکت"
                @click="openEditDialog(data)"
              />
              <Button
                v-if="data.status === 'PENDING' && canManageCompanyStatus"
                icon="pi pi-check"
                severity="success"
                text
                rounded
                v-tooltip.top="'تأیید و فعال‌سازی شرکت'"
                aria-label="تأیید و فعال‌سازی شرکت"
                :loading="processingCompanyId === data.id"
                @click="approveCompany(data)"
              />
              <Button
                v-if="!data.isVerified && canVerifyCompany"
                icon="pi pi-shield"
                severity="success"
                text
                rounded
                v-tooltip.top="'تأیید مدارک شرکت'"
                aria-label="تأیید مدارک شرکت"
                :loading="processingCompanyId === data.id"
                @click="setCompanyVerification(data, true)"
              />
              <Button
                v-if="data.isVerified && canVerifyCompany"
                icon="pi pi-shield"
                severity="secondary"
                text
                rounded
                v-tooltip.top="'لغو تأیید مدارک'"
                aria-label="لغو تأیید مدارک شرکت"
                :loading="processingCompanyId === data.id"
                @click="setCompanyVerification(data, false)"
              />
              <Button
                v-if="data.status === 'ACTIVE' && canManageCompanyStatus"
                icon="pi pi-ban"
                severity="danger"
                text
                rounded
                v-tooltip.top="'غیرفعال‌سازی شرکت'"
                aria-label="غیرفعال‌سازی شرکت"
                :loading="processingCompanyId === data.id"
                @click="changeCompanyStatus(data, 'INACTIVE')"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <Dialog
        v-model:visible="editDialogVisible"
        header="ویرایش شرکت"
        modal
        :style="{ width: 'min(92vw, 560px)' }"
      >
        <form class="company-form" @submit.prevent="submitUpdateCompany">
          <div class="form-field">
            <label for="edit-company-name">نام شرکت</label>
            <InputText id="edit-company-name" v-model="editForm.name" required autofocus />
          </div>

          <div class="form-field">
            <label for="edit-company-type">نوع شرکت</label>
            <Select
              id="edit-company-type"
              v-model="editForm.type"
              :options="companyTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="انتخاب نوع شرکت"
            />
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label for="edit-company-email">ایمیل</label>
              <InputText id="edit-company-email" v-model="editForm.email" type="email" />
            </div>
            <div class="form-field">
              <label for="edit-company-phone">تلفن</label>
              <InputText id="edit-company-phone" v-model="editForm.phone" />
            </div>
          </div>

          <div class="form-field">
            <label for="edit-company-website">وب‌سایت</label>
            <InputText id="edit-company-website" v-model="editForm.website" />
          </div>

          <div class="form-field">
            <label for="edit-company-address">آدرس</label>
            <InputText id="edit-company-address" v-model="editForm.address" />
          </div>

          <div class="form-field">
            <label for="edit-company-description">توضیحات</label>
            <Textarea id="edit-company-description" v-model="editForm.description" rows="3" autoResize />
          </div>

          <div class="dialog-actions">
            <Button
              type="button"
              label="انصراف"
              severity="secondary"
              outlined
              @click="editDialogVisible = false"
            />
            <Button type="submit" label="ذخیره تغییرات" icon="pi pi-check" :loading="updating" />
          </div>
        </form>
      </Dialog>

      <Dialog
        v-model:visible="createDialogVisible"
        header="افزودن شرکت"
        modal
        :style="{ width: 'min(92vw, 560px)' }"
      >
        <form class="company-form" @submit.prevent="submitCreateCompany">
          <div class="form-field">
            <label for="company-name">نام شرکت</label>
            <InputText id="company-name" v-model="createForm.name" required autofocus />
          </div>

          <div class="form-field">
            <label for="company-type">نوع شرکت</label>
            <Select
              id="company-type"
              v-model="createForm.type"
              :options="companyTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="انتخاب نوع شرکت"
            />
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label for="company-email">ایمیل</label>
              <InputText id="company-email" v-model="createForm.email" type="email" />
            </div>

            <div class="form-field">
              <label for="company-phone">تلفن</label>
              <InputText id="company-phone" v-model="createForm.phone" />
            </div>
          </div>

          <div class="form-field">
            <label for="company-website">وب‌سایت</label>
            <InputText id="company-website" v-model="createForm.website" />
          </div>

          <div class="form-field">
            <label for="company-address">آدرس</label>
            <InputText id="company-address" v-model="createForm.address" />
          </div>

          <div class="form-field">
            <label for="company-description">توضیحات</label>
            <Textarea id="company-description" v-model="createForm.description" rows="3" autoResize />
          </div>

          <div class="dialog-actions">
            <Button
              type="button"
              label="انصراف"
              severity="secondary"
              outlined
              @click="createDialogVisible = false"
            />
            <Button type="submit" label="ثبت شرکت" icon="pi pi-check" :loading="creating" />
          </div>
        </form>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useCompanyStore } from '@/stores/companies'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const companyStore = useCompanyStore()
const auth = useAuthStore()

const companies = ref([])
const loading = ref(false)
const creating = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')
const statusFilter = ref(null)
const typeFilter = ref(null)
const createDialogVisible = ref(false)
const editDialogVisible = ref(false)
const updating = ref(false)
const processingCompanyId = ref(null)
const editingCompanyId = ref(null)
const createForm = ref(getEmptyCreateForm())
const editForm = ref(getEmptyCreateForm())

const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
})

const statusOptions = ref([
  { label: 'همه', value: null },
  { label: 'در انتظار', value: 'PENDING' },
  { label: 'فعال', value: 'ACTIVE' },
  { label: 'غیرفعال', value: 'INACTIVE' },
  { label: 'تعلیق شده', value: 'SUSPENDED' },
])

const typeOptions = ref([
  { label: 'همه', value: null },
  { label: 'تولیدکننده', value: 'MANUFACTURER' },
  { label: 'واردکننده', value: 'IMPORTER' },
  { label: 'اپراتور مخابراتی', value: 'TELECOM_OPERATOR' },
])

const companyTypeOptions = computed(() => typeOptions.value.filter((item) => item.value))

const first = computed(() => (pagination.value.page - 1) * pagination.value.limit)
const canCreateCompany = computed(() => auth.hasPermission('companies.create'))
const canEditCompany = computed(() =>
  auth.hasPermission('companies.update') || auth.hasPermission('company_profile.update')
)
const canManageCompanyStatus = computed(() =>
  auth.hasPermission('companies.activate') || auth.hasPermission('companies.deactivate')
)
const canVerifyCompany = computed(() => auth.hasPermission('companies.update'))

onMounted(() => {
  loadCompanies()
})

function debounceSearch() {
  clearTimeout(debounceSearch.timer)
  debounceSearch.timer = setTimeout(() => {
    applyFilters()
  }, 500)
}

function applyFilters() {
  loadCompanies(1)
}

async function loadCompanies(page = pagination.value.page, limit = pagination.value.limit) {
  try {
    loading.value = true
    errorMessage.value = ''

    const response = await companyStore.getCompanies({
      page,
      limit,
      search: searchQuery.value || undefined,
      status: statusFilter.value || undefined,
      type: typeFilter.value || undefined,
    })

    const normalized = normalizeCompanyResponse(response, page, limit)
    companies.value = normalized.companies
    pagination.value = normalized.pagination
  } catch (error) {
    errorMessage.value = error.message || 'خطا در دریافت شرکت‌ها'
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: error.message || 'خطا در دریافت شرکت‌ها',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

function normalizeCompanyResponse(response, page, limit) {
  const meta = response?.meta || response?.pagination || {}
  const items = response?.data || response?.companies || response?.items || []
  const total = meta.total ?? response?.total ?? items.length
  const currentPage = meta.page ?? response?.page ?? page
  const currentLimit = meta.limit ?? response?.limit ?? limit

  return {
    companies: Array.isArray(items) ? items : [],
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: meta.totalPages ?? response?.totalPages ?? Math.max(Math.ceil(total / currentLimit), 1),
    },
  }
}

function onPageChange(event) {
  loadCompanies(event.page + 1, event.rows)
}

function getEmptyCreateForm() {
  return {
    name: '',
    type: null,
    email: '',
    phone: '',
    website: '',
    address: '',
    description: '',
  }
}

function openCreateDialog() {
  createForm.value = getEmptyCreateForm()
  createDialogVisible.value = true
}

async function submitCreateCompany() {
  try {
    creating.value = true
    const payload = Object.fromEntries(
      Object.entries(createForm.value).filter(([, value]) => value !== '' && value !== null)
    )

    await companyStore.createCompany(payload)
    createDialogVisible.value = false
    toast.add({ severity: 'success', summary: 'موفق', detail: 'شرکت با موفقیت ایجاد شد', life: 3000 })
    await loadCompanies(1)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: error.message || 'خطا در ایجاد شرکت',
      life: 3000,
    })
  } finally {
    creating.value = false
  }
}

function openEditDialog(company) {
  editingCompanyId.value = company.id
  editForm.value = {
    name: company.name || company.companyName || '',
    type: company.type || null,
    email: company.email || '',
    phone: company.phone || company.phoneNumber || '',
    website: company.website || '',
    address: company.address || '',
    description: company.description || '',
  }
  editDialogVisible.value = true
}

async function submitUpdateCompany() {
  if (!editingCompanyId.value) return

  try {
    updating.value = true
    const payload = Object.fromEntries(
      Object.entries(editForm.value).filter(([, value]) => value !== '' && value !== null)
    )
    await companyStore.updateCompany(editingCompanyId.value, payload)
    editDialogVisible.value = false
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'اطلاعات شرکت با موفقیت ویرایش شد',
      life: 3000,
    })
    await loadCompanies()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: error.message || 'خطا در ویرایش شرکت',
      life: 4000,
    })
  } finally {
    updating.value = false
  }
}

async function approveCompany(company) {
  await changeCompanyStatus(company, 'ACTIVE', 'شرکت با موفقیت تأیید و فعال شد')
}

async function changeCompanyStatus(company, status, successMessage) {
  try {
    processingCompanyId.value = company.id
    await companyStore.changeStatus(company.id, status)
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: successMessage || 'وضعیت شرکت تغییر کرد',
      life: 3000,
    })
    await loadCompanies()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: error.message || 'خطا در تغییر وضعیت شرکت',
      life: 4000,
    })
  } finally {
    processingCompanyId.value = null
  }
}

async function setCompanyVerification(company, isVerified) {
  try {
    processingCompanyId.value = company.id
    await companyStore.toggleVerify(company.id, isVerified)
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: isVerified ? 'مدارک شرکت تأیید شد' : 'تأیید مدارک شرکت لغو شد',
      life: 3000,
    })
    await loadCompanies()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: error.message || 'خطا در تغییر وضعیت تأیید شرکت',
      life: 4000,
    })
  } finally {
    processingCompanyId.value = null
  }
}

function getCompanyLogo(company) {
  return company.logoUrl || company.logo || company.image || company.avatarUrl || ''
}

function getTypeLabel(type) {
  const option = typeOptions.value.find((item) => item.value === type)
  return option?.label || type || '-'
}

function getTypeSeverity(type) {
  const severities = {
    MANUFACTURER: 'info',
    IMPORTER: 'warning',
    TELECOM_OPERATOR: 'success',
  }

  return severities[type] || 'secondary'
}

function getStatusLabel(status) {
  const option = statusOptions.value.find((item) => item.value === status)
  return option?.label || status || '-'
}

function getStatusSeverity(status) {
  const severities = {
    PENDING: 'warning',
    ACTIVE: 'success',
    INACTIVE: 'danger',
    SUSPENDED: 'secondary',
  }

  return severities[status] || 'secondary'
}

function formatDate(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}
</script>

<style scoped>
.company-list-page {
  direction: rtl;
}

.filter-control {
  width: 170px;
}

.company-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

/* Shared Paces-style list hierarchy; query, pagination and permissions unchanged. */
.company-list-page { gap: var(--ds-space-5); }
.company-list-page .ds-page-heading { margin-bottom: 0; }
.company-list-page .card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}
.company-list-page :deep(.p-toolbar) {
  background: var(--ds-color-surface);
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl) var(--ds-radius-xl) 0 0;
  padding: var(--ds-space-4) var(--ds-space-5);
}
.company-list-page :deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  padding: var(--ds-space-4) var(--ds-space-5);
  white-space: nowrap;
}
.company-list-page :deep(.p-datatable .p-datatable-tbody > tr > td) {
  border-color: var(--ds-color-border);
  padding: var(--ds-space-4) var(--ds-space-5);
}
@media (max-width: 640px) {
  .company-list-page { gap: var(--ds-space-3); }
  .company-list-page :deep(.p-toolbar) { align-items: stretch; }
}

.company-list-page { gap: clamp(1rem, 2vw, 1.5rem); }
.management-page-intro {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: linear-gradient(110deg, color-mix(in srgb, var(--ds-color-primary) 8%, var(--ds-color-surface)), var(--ds-color-surface) 72%);
  box-shadow: var(--ds-shadow-xs);
}
.management-page-icon {
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
.management-page-copy { min-width: 0; }
.management-page-copy > span {
  display: block;
  margin-bottom: .2rem;
  color: var(--ds-color-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
.management-page-copy h1 {
  margin: 0;
  color: var(--ds-color-text);
  font-size: clamp(1.3rem, 2vw, 1.7rem);
  font-weight: 800;
}
.management-page-copy p {
  margin: .35rem 0 0;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  line-height: 1.7;
}
.company-list-page .card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}
.company-list-page :deep(.p-toolbar) { flex-wrap: wrap; gap: .75rem; }
.company-list-page :deep(.p-toolbar-start),
.company-list-page :deep(.p-toolbar-end) { display: flex; align-items: center; flex-wrap: wrap; gap: .65rem; }
.company-list-page :deep(.p-toolbar .p-inputtext),
.company-list-page :deep(.p-toolbar .p-select) { min-height: 2.65rem; border-radius: var(--ds-radius-md); }
.company-list-page :deep(.p-toolbar .p-button) { min-height: 2.65rem; border-radius: var(--ds-radius-md); }
.company-list-page :deep(.p-datatable-table-container) { overflow-x: auto; }
.company-list-page :deep(.p-datatable-tbody > tr) { transition: background var(--ds-transition-fast); }
.company-list-page :deep(.p-datatable-tbody > tr > td) { vertical-align: middle; }
@media (max-width: 640px) {
  .management-page-intro { align-items: flex-start; padding: 1rem; }
  .management-page-icon { width: 2.75rem; height: 2.75rem; }
  .company-list-page :deep(.p-toolbar-start),
  .company-list-page :deep(.p-toolbar-end) { width: 100%; }
}


/* Company directory: compact filter bar, enterprise data grid and responsive actions. */
.company-management-surface {
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.company-management-toolbar {
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.company-management-toolbar :deep(.p-toolbar-start),
.company-management-toolbar :deep(.p-toolbar-end) {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .65rem;
}
.company-management-toolbar :deep(.p-inputtext),
.company-management-toolbar :deep(.p-select) {
  min-height: 2.65rem;
  border-radius: var(--ds-radius-md);
}
.company-management-table :deep(.p-datatable-table-container) {
  overflow-x: auto;
  scrollbar-width: thin;
}
.company-management-table :deep(.p-datatable-thead > tr > th) {
  padding: .9rem 1rem;
  border-color: var(--ds-color-border);
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  white-space: nowrap;
}
.company-management-table :deep(.p-datatable-tbody > tr > td) {
  padding: .85rem 1rem;
  border-color: var(--ds-color-border);
  color: var(--ds-color-text);
  vertical-align: middle;
}
.company-management-table :deep(.p-datatable-tbody > tr) {
  transition: background-color var(--ds-transition-fast);
}
.company-management-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--ds-color-surface-hover);
}
.company-management-table :deep(.p-paginator) {
  justify-content: flex-start;
  gap: .3rem;
  padding: .8rem 1rem;
  border-top: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.company-management-table :deep(.p-paginator-page),
.company-management-table :deep(.p-paginator-next),
.company-management-table :deep(.p-paginator-prev) {
  min-width: 2.25rem;
  min-height: 2.25rem;
  border-radius: var(--ds-radius-md);
}
.company-management-table :deep(.p-paginator-page.p-highlight) {
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary-text);
}
.company-management-table :deep(.p-button.p-button-text) {
  width: 2.2rem;
  height: 2.2rem;
}
@media (max-width: 760px) {
  .company-management-toolbar :deep(.p-toolbar) { align-items: stretch; flex-direction: column; }
  .company-management-toolbar :deep(.p-toolbar-start),
  .company-management-toolbar :deep(.p-toolbar-end) { width: 100%; }
  .company-management-toolbar :deep(.p-toolbar-start) { display: grid; grid-template-columns: minmax(0, 1fr); }
  .company-management-toolbar :deep(.p-inputtext),
  .company-management-toolbar :deep(.p-select) { width: 100%; }
  .company-management-toolbar :deep(.p-toolbar-end .p-button) { width: 100%; }
}
</style>