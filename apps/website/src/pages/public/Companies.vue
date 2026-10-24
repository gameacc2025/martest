<template>
  <div class="companies-page">
    <div class="comp-container">
      <div class="comp-head">
        <h1>شرکت ها</h1>
        <Breadcrumb :home="home" :model="items" class="comp-breadcrumb" />
      </div>

      <!-- Search and Filters -->
      <div class="comp-section">
        <Card>
          <template #content>
            <div class="comp-filter-grid">
              <div class="comp-filter-search">
                <div class="p-inputgroup">
                  <InputText
                    v-model="searchQuery"
                    placeholder="جستجوی شرکت ها..."
                    class="comp-search-input"
                    @keyup.enter="searchCompanies"
                  />
                  <Button icon="pi pi-search" class="p-button-primary" @click="searchCompanies" />
                </div>
              </div>
              <div>
                <Select
                  v-model="categoryFilter"
                  :options="categoryOptions"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="انتخاب دسته بندی"
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
                @click="verificationFilter = 'all'; applyFilters()"
              />
              <Button
                label="تایید شده"
                class="p-button-outlined p-button-success"
                :class="{ 'p-button-primary': verificationFilter === 'verified' }"
                @click="verificationFilter = 'verified'; applyFilters()"
              />
              <Button
                label="در انتظار تایید"
                class="p-button-outlined p-button-warning"
                :class="{ 'p-button-primary': verificationFilter === 'pending' }"
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
              class="comp-sort"
              @change="applyFilters"
            />
          </div>
        </div>

        <div v-if="loading" class="comp-state">
          <ProgressSpinner />
          <p class="comp-state-text">در حال بارگذاری...</p>
        </div>

        <div v-else-if="companies.length === 0" class="comp-state">
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

        <div class="comp-paginator">
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
          <div
            v-for="category in categories"
            :key="category.id"
            class="category-card"
            @click="filterByCategory(category.id)"
          >
            <i class="pi pi-building"></i>
            <h3>{{ category.name }}</h3>
            <p>{{ category.companyCount }} شرکت</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
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
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-card:hover {
  background: var(--surface-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.category-card i {
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  display: block;
}

.category-card h3 {
  font-weight: 600;
  margin: 0;
}

.category-card p {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin: 0.25rem 0 0 0;
}
</style>