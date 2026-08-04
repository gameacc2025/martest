<template>
  <div class="company-list-page">
    <!-- Card with Toolbar -->
    <div class="card">
      <Toolbar>
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
      </DataTable>

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
const createForm = ref(getEmptyCreateForm())

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
</style>