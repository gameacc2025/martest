<template>
  <main class="companies-page ds-page">
    <div class="comp-container ds-container ds-stack">
      <WorkspacePageHeading
        eyebrow="شبکه تأمین بازارگاه"
        title="شرکت‌ها"
        description="تولیدکنندگان و تأمین‌کنندگان عضو بازارگاه را جستجو و بررسی کنید."
        icon="pi pi-building"
        heading-id="companies-page-title"
      >
        <template #actions><Breadcrumb :home="home" :model="items" class="comp-breadcrumb" /></template>
      </WorkspacePageHeading>

      <!-- Search and Filters -->
      <div class="comp-section">
        <Card>
          <template #content>
            <div class="comp-filter-grid">
              <div class="comp-filter-search">
                <form class="p-inputgroup" role="search" @submit.prevent="searchCompanies">
                  <label class="comp-visually-hidden" for="company-search-query">جستجوی شرکت‌ها</label>
                  <InputText
                    id="company-search-query"
                    v-model="searchQuery"
                    name="companySearch"
                    autocomplete="off"
                    placeholder="نام شرکت را جستجو کنید…"
                    class="comp-search-input"
                  />
                  <Button type="submit" icon="pi pi-search" class="p-button-primary" aria-label="جستجوی شرکت‌ها" />
                </form>
              </div>
              <div>
                <Select
                  v-model="categoryFilter"
                  :options="categoryOptions"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="انتخاب دسته‌بندی"
                  aria-label="فیلتر دسته‌بندی شرکت"
                  class="comp-full"
                  @change="applyFilters"
                />
              </div>
            </div>

            <div class="comp-verify-filters">
              <Button
                label="همه"
                class="p-button-outlined"
                :class="{ 'p-button-primary': verificationFilter === 'all' }"
                :aria-pressed="verificationFilter === 'all'"
                @click="verificationFilter = 'all'; applyFilters()"
              />
              <Button
                label="تایید شده"
                class="p-button-outlined p-button-success"
                :class="{ 'p-button-primary': verificationFilter === 'verified' }"
                :aria-pressed="verificationFilter === 'verified'"
                @click="verificationFilter = 'verified'; applyFilters()"
              />
              <Button
                label="در انتظار تایید"
                class="p-button-outlined p-button-warning"
                :class="{ 'p-button-primary': verificationFilter === 'pending' }"
                :aria-pressed="verificationFilter === 'pending'"
                @click="verificationFilter = 'pending'; applyFilters()"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Featured Companies -->
      <div v-if="featuredCompanies.length > 0" class="comp-section-lg">
        <h2 class="comp-h2">شرکت های ویژه</h2>
        <div class="comp-card-grid">
          <CompanyCard
            v-for="company in featuredCompanies"
            :key="company.id"
            :company="company"
            @follow="toggleFollow"
          />
        </div>
      </div>

      <!-- Companies List -->
      <div class="comp-section">
        <div class="comp-list-head">
          <h2 class="comp-h2">همه شرکت ها</h2>
          <div>
            <Select
              v-model="sortOption"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              aria-label="مرتب‌سازی فهرست شرکت‌ها"
              class="comp-sort"
              @change="applyFilters"
            />
          </div>
        </div>

        <div v-if="loading" class="comp-state" role="status" aria-live="polite" aria-busy="true">
          <ProgressSpinner aria-label="در حال بارگذاری شرکت‌ها" />
          <p class="comp-state-text">در حال بارگذاری شرکت‌ها…</p>
        </div>

        <div v-else-if="companiesError" class="comp-state comp-state--error" role="alert">
          <i class="pi pi-exclamation-triangle comp-empty-icon" aria-hidden="true"></i>
          <h3 class="comp-empty-title">دریافت فهرست شرکت‌ها ناموفق بود</h3>
          <p class="comp-empty-text">{{ companiesError }}</p>
          <Button label="تلاش دوباره" icon="pi pi-refresh" @click="loadCompanies" />
        </div>

        <div v-else-if="companies.length === 0" class="comp-state" role="status">
          <i class="pi pi-building comp-empty-icon"></i>
          <h3 class="comp-empty-title">هیچ شرکتی یافت نشد</h3>
          <p class="comp-empty-text">با فیلترهای فعلی هیچ شرکتی یافت نشد</p>
        </div>

        <div v-else class="comp-card-grid">
          <CompanyCard
            v-for="company in companies"
            :key="company.id"
            :company="company"
            @follow="toggleFollow"
          />
        </div>

        <div v-if="totalCompanies > perPage" class="comp-paginator">
          <Paginator
            :rows="perPage"
            :totalRecords="totalCompanies"
            :rowsPerPageOptions="[12, 24, 48, 96]"
            @page="onPageChange"
          />
        </div>
      </div>

      <!-- Categories -->
      <div class="comp-section">
        <h2 class="comp-h2">دسته بندی شرکت ها</h2>
        <div class="comp-category-grid">
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            class="category-card"
            :aria-label="'نمایش شرکت‌های دسته ' + category.name"
            @click="filterByCategory(category.id)"
          >
            <i class="pi pi-building" aria-hidden="true"></i>
            <span class="category-card-title">{{ category.name }}</span>
            <span v-if="category.companyCount != null" class="category-card-count">{{ Number(category.companyCount).toLocaleString('fa-IR') }} شرکت</span>
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCompanyStore } from '../../stores/companies'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import Paginator from 'primevue/paginator'
import CompanyCard from '../../components/companies/CompanyCard.vue'

const router = useRouter()
const companyStore = useCompanyStore()

const companies = ref([])
const featuredCompanies = ref([])
const categories = ref([])
const loading = ref(false)
const companiesError = ref('')
const totalCompanies = ref(0)
const perPage = ref(12)
const currentPage = ref(1)

const searchQuery = ref('')
const categoryFilter = ref(null)
const verificationFilter = ref('all')
const sortOption = ref('rating_desc')

const home = ref({
  icon: 'pi pi-home',
  to: '/'
})

const items = ref([
  { label: 'شرکت ها', to: '/companies' }
])

const categoryOptions = ref([
  { id: null, name: 'همه دسته بندی ها' }
])

const sortOptions = ref([
  { label: 'امتیاز: زیاد به کم', value: 'rating_desc' },
  { label: 'امتیاز: کم به زیاد', value: 'rating_asc' },
  { label: 'تعداد محصولات: زیاد به کم', value: 'products_desc' },
  { label: 'تعداد محصولات: کم به زیاد', value: 'products_asc' },
  { label: 'تاریخ عضویت: جدیدترین', value: 'date_desc' },
  { label: 'تاریخ عضویت: قدیمی ترین', value: 'date_asc' },
  { label: 'نام: A به Z', value: 'name_asc' },
  { label: 'نام: Z به A', value: 'name_desc' }
])

onMounted(async () => {
  await loadCategories()
  await loadCompanies()
  await loadFeaturedCompanies()
})

const loadCategories = async () => {
  try {
    const data = await companyStore.getCategories()
    categories.value = data
    categoryOptions.value = [
      { id: null, name: 'همه دسته بندی ها' },
      ...data
    ]
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const loadCompanies = async () => {
  loading.value = true
  companiesError.value = ''
  try {
    const params = {
      page: currentPage.value,
      limit: perPage.value,
      search: searchQuery.value || undefined,
      category: categoryFilter.value || undefined,
      verified: verificationFilter.value === 'all' ? undefined : verificationFilter.value === 'verified',
      sortBy: getSortField(),
      sortOrder: getSortOrder()
    }

    const data = await companyStore.getCompanies(params)
    companies.value = data.companies
    totalCompanies.value = data.total
  } catch (error) {
    console.error('Error loading companies:', error)
    companies.value = []
    totalCompanies.value = 0
    companiesError.value = 'اتصال به فهرست شرکت‌ها برقرار نشد. دوباره تلاش کنید.'
  } finally {
    loading.value = false
  }
}

const loadFeaturedCompanies = async () => {
  try {
    const data = await companyStore.getFeaturedCompanies(4)
    featuredCompanies.value = data
  } catch (error) {
    console.error('Error loading featured companies:', error)
  }
}

const searchCompanies = () => {
  currentPage.value = 1
  loadCompanies()
}

const applyFilters = () => {
  currentPage.value = 1
  loadCompanies()
}

const filterByCategory = (categoryId) => {
  categoryFilter.value = categoryId
  currentPage.value = 1
  loadCompanies()
}

const onPageChange = (event) => {
  currentPage.value = event.page + 1
  perPage.value = event.rows
  loadCompanies()
}

const getSortField = () => {
  const [field] = sortOption.value.split('_')
  return field === 'rating' ? 'averageRating' :
         field === 'products' ? 'productCount' :
         field === 'date' ? 'createdAt' : 'name'
}

const getSortOrder = () => {
  const [, order] = sortOption.value.split('_')
  return order
}

const toggleFollow = async (companyId) => {
  try {
    const company = companies.value.find(c => c.id === companyId)
    if (!company) return

    if (company.isFollowing) {
      await companyStore.unfollowCompany(companyId)
      company.isFollowing = false
      company.followerCount = (company.followerCount || 0) - 1
    } else {
      await companyStore.followCompany(companyId)
      company.isFollowing = true
      company.followerCount = (company.followerCount || 0) + 1
    }
  } catch (error) {
    console.error('Error toggling follow:', error)
  }
}
</script>

<style scoped>
.companies-page {
  direction: rtl;
}

.comp-container {
  max-width: var(--ds-container-max);
  margin: 0 auto;
  padding-inline: var(--ds-container-pad);
  padding-block: var(--ds-space-6);
}

@media (min-width: 768px) {
  .comp-container {
    padding-inline: var(--ds-container-pad-lg);
    padding-block: var(--ds-space-8);
  }
}

.comp-head {
  margin-bottom: 1.5rem;
}

.comp-head h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.comp-breadcrumb {
  margin-top: 0.5rem;
}

.comp-section {
  margin-bottom: 2rem;
}

.comp-section-lg {
  margin-bottom: 3rem;
}

.comp-filter-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 992px) {
  .comp-filter-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .comp-filter-search {
    grid-column: span 2;
  }
}

.comp-search-input {
  flex: 1;
}

.comp-full {
  width: 100%;
}

.comp-verify-filters {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.comp-h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
}

.comp-card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 576px) {
  .comp-card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 992px) {
  .comp-card-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.comp-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.comp-sort {
  width: 100%;
}

@media (min-width: 768px) {
  .comp-sort {
    width: 14rem;
  }
}

.comp-state {
  text-align: center;
  padding: 2rem 0;
}

.comp-state-text {
  margin-top: 1rem;
}

.comp-empty-icon {
  font-size: 2.5rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.comp-empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.comp-empty-text {
  color: var(--text-color-secondary);
}

.comp-paginator {
  margin-top: 2rem;
}

.comp-category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 768px) {
  .comp-category-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 992px) {
  .comp-category-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

.category-card {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 7.5rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  padding: 1rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  font: inherit;
  text-align: center;
  cursor: pointer;
  transition: border-color var(--ds-transition-fast), background-color var(--ds-transition-fast), color var(--ds-transition-fast);
}

.category-card:hover {
  border-color: var(--ds-color-primary);
  background: var(--ds-color-surface-hover);
}
.category-card:focus-visible {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 3px;
}

.category-card i {
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  display: block;
}

.category-card-title {
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
}
.category-card-count {
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
}

.comp-head { align-items: flex-end; }
.comp-head h1 { font-size: var(--ds-font-size-2xl); }
.comp-section :deep(.p-card) {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.comp-section :deep(.p-card-body) { padding: var(--ds-space-5); }
.comp-section :deep(.p-inputtext),
.comp-section :deep(.p-select) { min-height: var(--ds-touch-target); }

.comp-head { align-items: center; padding: 1.25rem 1.5rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); box-shadow: var(--ds-shadow-xs); }
.comp-heading-identity { display: flex; align-items: center; gap: 1rem; min-width: 0; }
.comp-heading-icon { display: grid; place-items: center; width: 3.2rem; height: 3.2rem; flex: 0 0 auto; border-radius: 1rem; background: var(--ds-color-primary-soft); color: var(--ds-color-primary); font-size: 1.3rem; }
.comp-heading-identity .ds-eyebrow { display: inline-block; margin-bottom: .2rem; font-weight: var(--ds-font-weight-bold); }
.comp-heading-identity h1 { margin: 0; color: var(--ds-color-text); }
.comp-heading-identity p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
.comp-breadcrumb { margin: 0; }
.comp-section :deep(.p-card) { border-radius: var(--ds-radius-xl); border-color: var(--ds-color-border); box-shadow: var(--ds-shadow-xs); }
.comp-filter-grid :deep(.p-inputtext), .comp-filter-grid :deep(.p-select) { min-height: 2.7rem; border-radius: var(--ds-radius-md); }
.comp-verify-filters { padding-top: .9rem; border-top: 1px solid var(--ds-color-border); }
.comp-card-grid { gap: 1rem; }
.category-card { border-color: var(--ds-color-border); border-radius: var(--ds-radius-lg); background: var(--ds-color-surface); }
.category-card:hover { border-color: var(--ds-color-primary); box-shadow: var(--ds-shadow-md); }
@media (max-width: 640px) { .comp-head { align-items: flex-start; flex-direction: column; padding: 1rem; } .comp-heading-identity { align-items: flex-start; } }


/* Public supplier directory — search, filters, company cards and category discovery. */
.companies-page { background: var(--ds-color-background); color: var(--ds-color-text); }
.comp-container { width: 100%; max-width: var(--ds-container-max-wide); }
.comp-head {
  align-items: center;
  gap: 1.25rem;
  padding: clamp(1rem, 2vw, 1.5rem);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: linear-gradient(110deg, color-mix(in srgb, var(--ds-color-primary) 7%, var(--ds-color-surface)), var(--ds-color-surface) 72%);
  box-shadow: var(--ds-shadow-xs);
}
.comp-heading-identity { min-width: 0; }
.comp-heading-icon {
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  flex: 0 0 auto;
  border-radius: 1rem;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
}
.comp-heading-identity h1 { color: var(--ds-color-text); font-size: clamp(1.35rem, 2vw, var(--ds-font-size-2xl)); }
.comp-heading-identity p { color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.8; }
.comp-section :deep(.p-card) {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.comp-section :deep(.p-card-body) { padding: clamp(1rem, 2vw, 1.5rem); }
.comp-section :deep(.p-inputtext),
.comp-section :deep(.p-select) {
  min-height: 2.7rem;
  border-color: var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface-alt);
}
.comp-verify-filters { gap: .6rem; border-color: var(--ds-color-border); }
.comp-list-head { align-items: center; }
.comp-h2 { color: var(--ds-color-text); font-size: var(--ds-font-size-xl); }
.comp-sort :deep(.p-select) { border-radius: var(--ds-radius-md); }
.comp-card-grid { gap: clamp(.85rem, 1.5vw, 1.25rem); }
.comp-category-grid { gap: .85rem; }
.category-card {
  min-width: 0;
  padding: 1.1rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface);
  transition: border-color var(--ds-transition-fast), background var(--ds-transition-fast), transform var(--ds-transition-fast), box-shadow var(--ds-transition-fast);
}
.category-card i { color: var(--ds-color-primary); }
.category-card:hover {
  border-color: var(--ds-color-primary);
  background: var(--ds-color-surface-hover);
}
.category-card:focus-visible {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 3px;
}
.comp-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-3);
  padding: 3rem 1.5rem;
  border: 1px dashed var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
}
.comp-empty-title { color: var(--ds-color-text); }
.comp-empty-text { color: var(--ds-color-text-muted); line-height: 1.8; }
.comp-state--error { border-color: var(--ds-status-danger-fg); }
.comp-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
}
.comp-paginator { margin-top: var(--ds-space-5); }
@media (max-width: 640px) {
  .comp-head { align-items: flex-start; flex-direction: column; }
  .comp-heading-identity { align-items: flex-start; }
  .comp-verify-filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 8.5rem), 1fr)); }
  .comp-verify-filters :deep(.p-button) { justify-content: center; padding-inline: .45rem; }
  .comp-list-head { align-items: stretch; flex-direction: column; }
}
</style>