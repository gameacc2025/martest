<template>
  <div class="search-results-page">
    <div class="sr-container">
      <div class="sr-head">
        <h1 class="sr-title">نتایج جستجو برای: "{{ query }}"</h1>
        <div class="sr-search-row">
          <InputText
            v-model="searchQuery"
            placeholder="جستجوی محصولات..."
            class="sr-search-input"
            @keyup.enter="performSearch"
          />
          <Button label="جستجو" icon="pi pi-search" class="p-button-primary" @click="performSearch" />
          <Button label="فیلترها" icon="pi pi-filter" class="p-button-outlined" @click="toggleFilters" />
        </div>
      </div>

      <div class="sr-layout">
        <!-- Filters Sidebar -->
        <div class="sr-sidebar" v-if="showFilters">
          <Card>
            <template #title>فیلترها</template>
            <template #content>
              <!-- Category Filter -->
              <div class="sr-filter-block">
                <h3>دسته بندی</h3>
                <Tree
                  :value="categories"
                  selectionMode="single"
                  v-model:selectionKeys="selectedCategory"
                  :filter="true"
                  filterMode="lenient"
                  filterPlaceholder="جستجوی دسته..."
                  class="sr-full"
                />
              </div>

              <!-- Price Range Filter -->
              <div class="sr-filter-block">
                <h3>محدوده قیمت</h3>
                <Slider v-model="priceRange" :range="true" :min="0" :max="maxPrice" class="sr-full" />
                <div class="sr-price-range">
                  <span>{{ formatPrice(priceRange[0]) }}</span>
                  <span>{{ formatPrice(priceRange[1]) }}</span>
                </div>
              </div>

              <Button label="اعمال فیلترها" icon="pi pi-check" class="sr-full p-button-primary" @click="applyFilters" />
              <Button label="حذف فیلترها" icon="pi pi-times" class="sr-full p-button-outlined p-button-secondary sr-mt" @click="clearFilters" />
            </template>
          </Card>
        </div>

        <!-- Search Results -->
        <div class="sr-results">
          <div class="sr-results-head">
            <div class="sr-results-count">{{ totalResults }} نتیجه یافت شد</div>
            <div class="sr-sort-actions">
              <Button icon="pi pi-calendar" class="p-button-text" @click="sortBy('date', 'desc')" title="جدیدترین محصولات" />
              <Button icon="pi pi-sort-alpha-up" class="p-button-text" @click="sortBy('name', 'asc')" title="مرتب سازی بر اساس نام" />
              <Select v-model="sortOption" :options="sortOptions" optionLabel="label" optionValue="value" class="sr-sort-dropdown" @change="onSortChange" />
            </div>
          </div>

          <div v-if="loading" class="sr-state">
            <ProgressSpinner />
            <p class="sr-state-text">در حال بارگذاری...</p>
          </div>

          <div v-else-if="products.length === 0" class="sr-state">
            <i class="pi pi-search sr-empty-icon"></i>
            <h3 class="sr-empty-title">هیچ محصولی یافت نشد</h3>
            <p class="sr-empty-text">برای جستجوی مجدد، کلمات کلیدی خود را تغییر دهید</p>
          </div>

          <div v-else class="sr-product-grid">
            <ProductCard
              v-for="product in products"
              :key="product.id"
              :product="product"
              @add-to-cart="addToCart"
              @add-to-wishlist="addToWishlist"
            />
          </div>

          <div class="sr-paginator">
            <Paginator :rows="perPage" :totalRecords="totalResults" :rowsPerPageOptions="[12, 24, 48, 96]" @page="onPageChange" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import { useCartStore } from '../../stores/cart'
import { useWishlistStore } from '../../stores/wishlist'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tree from 'primevue/tree'
import Slider from 'primevue/slider'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import Paginator from 'primevue/paginator'
import ProductCard from '@telecom/shared-ui/components/products/ProductCard.vue'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()

const query = ref(route.query.q || '')
const searchQuery = ref(query.value)
const products = ref([])
const categories = ref([])
const loading = ref(false)
const showFilters = ref(false)
const totalResults = ref(0)
const perPage = ref(12)
const currentPage = ref(1)
const maxPrice = ref(10000000)
const priceRange = ref([0, 10000000])
const selectedCategory = ref(null)
const sortOption = ref('relevance')
const selectedCompany = ref(null)

const sortOptions = ref([
  { label: 'مرتب سازی پیش فرض (جدیدترین)', value: 'relevance' },
  { label: 'نام: A به Z', value: 'name_asc' },
  { label: 'نام: Z به A', value: 'name_desc' },
  { label: 'تاریخ: جدیدترین', value: 'date_desc' },
  { label: 'تاریخ: قدیمی‌ترین', value: 'date_asc' }
])

onMounted(async () => {
  await loadCategories()
  await performSearch()
})

watch(() => route.query.q, (newQuery) => {
  if (newQuery !== query.value) {
    query.value = newQuery || ''
    searchQuery.value = query.value
    performSearch()
  }
})

const loadCategories = async () => {
  try {
    const data = await productsStore.getCategories()
    categories.value = buildCategoryTree(data)
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const buildCategoryTree = (categories, parentId = null) => {
  return categories
    .filter(cat => cat.parentId === parentId)
    .map(cat => ({
      key: cat.id,
      label: cat.name,
      children: buildCategoryTree(categories, cat.id)
    }))
}

const performSearch = async () => {
  loading.value = true
  currentPage.value = 1

  try {
    const params = {
      page: currentPage.value,
      limit: perPage.value,
      sortBy: getSortField(),
      sortOrder: getSortOrder(),
    }
    const categoryId = getSelectedCategoryId()
    if (categoryId) params.categoryId = categoryId
    // Do not constrain the default range: the schema has no stock/rating data,
    // and a fixed slider maximum must not hide otherwise valid products.
    if (priceRange.value[0] > 0) params.minPrice = priceRange.value[0]
    if (priceRange.value[1] < maxPrice.value) params.maxPrice = priceRange.value[1]
    if (selectedCompany.value) params.companyId = selectedCompany.value

    const result = await productsStore.searchProducts(searchQuery.value, params)
    products.value = Array.isArray(result.data) ? result.data : []
    totalResults.value = result.meta?.total ?? products.value.length

    // Keep the heading and URL in sync without triggering a duplicate search.
    query.value = searchQuery.value
    router.push({ query: searchQuery.value ? { q: searchQuery.value } : {} })
  } catch (error) {
    console.error('Error searching products:', error)
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  performSearch()
}

const clearFilters = () => {
  selectedCategory.value = null
  priceRange.value = [0, maxPrice.value]
  performSearch()
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const sortBy = (field, order) => {
  sortOption.value = `${field}_${order}`
  performSearch()
}

const onSortChange = () => {
  performSearch()
}

const getSelectedCategoryId = () => {
  const keys = selectedCategory.value && typeof selectedCategory.value === 'object'
    ? selectedCategory.value
    : {}
  const selectedKey = Object.entries(keys).find(([, value]) => value === true || value?.checked)?.[0]
  const id = Number(selectedKey)
  return Number.isInteger(id) && id > 0 ? id : null
}

const getSortField = () => {
  const [field] = sortOption.value.split('_')
  if (field === 'name') return 'title'
  if (field === 'date') return 'createdAt'
  return 'createdAt'
}

const getSortOrder = () => {
  const [, order] = sortOption.value.split('_')
  return order === 'asc' ? 'asc' : 'desc'
}

const onPageChange = (event) => {
  currentPage.value = event.page + 1
  perPage.value = event.rows
  performSearch()
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR'
  }).format(price)
}

const addToCart = (product) => {
  cartStore.addToCart({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    quantity: 1
  })
}

const addToWishlist = (product) => {
  wishlistStore.addToWishlist(product)
}
</script>

<style scoped>
.search-results-page {
  direction: rtl;
}

.sr-container {
  max-width: var(--ds-container-max);
  margin: 0 auto;
  padding-inline: var(--ds-container-pad);
  padding-block: var(--ds-space-6);
}

@media (min-width: 768px) {
  .sr-container {
    padding-inline: var(--ds-container-pad-lg);
    padding-block: var(--ds-space-8);
  }
}

.sr-head {
  margin-bottom: 1.5rem;
}

.sr-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
}

.sr-search-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.sr-search-input {
  flex: 1;
  min-width: 12rem;
}

.sr-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 992px) {
  .sr-layout {
    grid-template-columns: 1fr 3fr;
  }
}

.sr-filter-block {
  margin-bottom: 1.5rem;
}

.sr-filter-block h3 {
  font-weight: 600;
  margin: 0 0 0.75rem 0;
}

.sr-full {
  width: 100%;
}

.sr-price-range {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-top: 0.5rem;
}

.sr-rating-hint {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-inline-start: 0.5rem;
}

.sr-checkbox-row {
  display: flex;
  gap: 1rem;
}

.sr-mt {
  margin-top: 0.5rem;
}

.sr-results-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.sr-results-count {
  color: var(--text-color-secondary);
}

.sr-sort-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.sr-sort-dropdown {
  width: 100%;
}

@media (min-width: 768px) {
  .sr-sort-dropdown {
    width: 14rem;
  }
}

.sr-state {
  text-align: center;
  padding: 2rem 0;
}

.sr-state-text {
  margin-top: 1rem;
}

.sr-empty-icon {
  font-size: 2.5rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.sr-empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.sr-empty-text {
  color: var(--text-color-secondary);
}

.sr-product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 576px) {
  .sr-product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 992px) {
  .sr-product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.sr-paginator {
  margin-top: 2rem;
}

:deep(.p-tree .p-tree-container .p-treenode-children) {
  direction: rtl;
}

:deep(.p-tree .p-treenode-label) {
  direction: rtl;
}
</style>