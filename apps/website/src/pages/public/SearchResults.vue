<template>
  <main class="search-results-page ds-page" aria-labelledby="search-results-title">
    <div class="sr-container ds-container ds-stack">
      <header class="sr-head ds-card ds-card--pad">
        <div class="sr-heading-copy">
          <span class="ds-eyebrow">بازارگاه تجهیزات مخابراتی</span>
          <h1 id="search-results-title" class="ds-h1">
            {{ query ? `نتایج جستجو برای «${query}»` : 'جستجوی محصولات' }}
          </h1>
          <p class="ds-lead">محصولات موردنیازتان را پیدا کنید و نتایج را بر اساس دسته‌بندی و قیمت محدود کنید.</p>
        </div>

        <form class="sr-search-row" role="search" @submit.prevent="performSearch">
          <label class="sr-visually-hidden" for="product-search-query">جستجوی محصولات</label>
          <InputText
            id="product-search-query"
            v-model="searchQuery"
            placeholder="نام یا مدل محصول را وارد کنید..."
            class="sr-search-input"
            autocomplete="off"
          />
          <Button type="submit" label="جستجو" icon="pi pi-search" class="sr-primary-button" />
          <Button
            type="button"
            :label="showFilters ? 'بستن فیلترها' : 'فیلترها'"
            :icon="showFilters ? 'pi pi-times' : 'pi pi-filter'"
            class="sr-secondary-button"
            :aria-expanded="showFilters"
            aria-controls="search-filters"
            @click="toggleFilters"
          />
        </form>
      </header>

      <div class="sr-layout" :class="{ 'sr-layout--with-filters': showFilters }">
        <aside v-if="showFilters" id="search-filters" class="sr-sidebar" aria-label="فیلترهای جستجو">
          <Card class="sr-filter-card">
            <template #title>
              <h2 class="ds-card-title">فیلترهای جستجو</h2>
            </template>
            <template #content>
              <section class="sr-filter-block" aria-labelledby="category-filter-title">
                <h3 id="category-filter-title">دسته‌بندی</h3>
                <Tree
                  :value="categories"
                  selectionMode="single"
                  v-model:selectionKeys="selectedCategory"
                  :filter="true"
                  filterMode="lenient"
                  filterPlaceholder="جستجوی دسته..."
                  class="sr-full"
                  aria-label="انتخاب دسته‌بندی"
                />
              </section>

              <section class="sr-filter-block" aria-labelledby="price-filter-title">
                <h3 id="price-filter-title">محدوده قیمت</h3>
                <Slider
                  v-model="priceRange"
                  :range="true"
                  :min="0"
                  :max="maxPrice"
                  class="sr-full"
                  aria-label="محدوده قیمت"
                />
                <div class="sr-price-range">
                  <span>{{ formatPrice(priceRange[0]) }}</span>
                  <span>{{ formatPrice(priceRange[1]) }}</span>
                </div>
              </section>

              <div class="sr-filter-actions">
                <Button label="اعمال فیلترها" icon="pi pi-check" class="sr-primary-button sr-full" @click="applyFilters" />
                <Button label="حذف فیلترها" icon="pi pi-times" class="sr-secondary-button sr-full" @click="clearFilters" />
              </div>
            </template>
          </Card>
        </aside>

        <section class="sr-results" aria-labelledby="sr-results-heading">
          <div class="sr-results-head">
            <div>
              <h2 id="sr-results-heading" class="sr-results-title">محصولات</h2>
              <p class="sr-results-count" aria-live="polite">
                <template v-if="!loading && !errorMessage">{{ totalResults.toLocaleString('fa-IR') }} نتیجه یافت شد</template>
                <template v-else-if="loading">در حال جستجو...</template>
              </p>
            </div>
            <div class="sr-sort-actions" aria-label="مرتب‌سازی نتایج">
              <Button
                type="button"
                icon="pi pi-calendar"
                class="sr-icon-button"
                aria-label="مرتب‌سازی بر اساس جدیدترین محصولات"
                title="جدیدترین محصولات"
                @click="sortBy('date', 'desc')"
              />
              <Button
                type="button"
                icon="pi pi-sort-alpha-up"
                class="sr-icon-button"
                aria-label="مرتب‌سازی بر اساس نام"
                title="مرتب‌سازی بر اساس نام"
                @click="sortBy('name', 'asc')"
              />
              <label class="sr-visually-hidden" for="search-sort">مرتب‌سازی</label>
              <Select
                inputId="search-sort"
                v-model="sortOption"
                :options="sortOptions"
                optionLabel="label"
                optionValue="value"
                class="sr-sort-dropdown"
                @change="onSortChange"
              />
            </div>
          </div>

          <div v-if="loading" class="sr-state ds-card" role="status" aria-live="polite" aria-busy="true">
            <ProgressSpinner />
            <h3 class="sr-state-title">در حال جستجوی محصولات</h3>
            <p class="sr-state-text">لطفاً چند لحظه صبر کنید.</p>
          </div>

          <div v-else-if="errorMessage" class="sr-state sr-state--error ds-card" role="alert">
            <i class="pi pi-exclamation-triangle sr-state-icon" aria-hidden="true"></i>
            <h3 class="sr-state-title">دریافت نتایج ناموفق بود</h3>
            <p class="sr-state-text">{{ errorMessage }}</p>
            <Button label="تلاش دوباره" icon="pi pi-refresh" class="sr-primary-button" @click="performSearch({ resetPage: false })" />
          </div>

          <div v-else-if="products.length === 0" class="sr-state ds-card" role="status">
            <i class="pi pi-search sr-state-icon" aria-hidden="true"></i>
            <h3 class="sr-state-title">محصولی پیدا نشد</h3>
            <p class="sr-state-text">عبارت جستجو یا فیلترها را تغییر دهید و دوباره تلاش کنید.</p>
            <Button label="حذف فیلترها" icon="pi pi-filter-slash" class="sr-secondary-button" @click="clearFilters" />
          </div>

          <div v-else class="sr-product-grid">
            <ProductCard
              v-for="product in products"
              :key="product.id"
              :product="product"
              @add-to-cart="addToCart"
              @toggle-wishlist="addToWishlist"
              @view-product="viewProduct"
            />
          </div>

          <div v-if="!loading && !errorMessage && totalResults > 0" class="sr-paginator" aria-label="صفحه‌بندی نتایج">
            <Paginator
              :first="(currentPage - 1) * perPage"
              :rows="perPage"
              :totalRecords="totalResults"
              :rowsPerPageOptions="[12, 24, 48, 96]"
              @page="onPageChange"
            />
          </div>
        </section>
      </div>
    </div>
  </main>
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
const errorMessage = ref('')
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
  { label: 'مرتب‌سازی پیش‌فرض (جدیدترین)', value: 'relevance' },
  { label: 'نام: الف تا ی', value: 'name_asc' },
  { label: 'نام: ی تا الف', value: 'name_desc' },
  { label: 'تاریخ: جدیدترین', value: 'date_desc' },
  { label: 'تاریخ: قدیمی‌ترین', value: 'date_asc' }
])

onMounted(async () => {
  await loadCategories()
  await performSearch()
})

watch(() => route.query.q, (newQuery) => {
  const normalizedQuery = newQuery || ''
  if (normalizedQuery !== query.value) {
    query.value = normalizedQuery
    searchQuery.value = normalizedQuery
    performSearch()
  }
})

const loadCategories = async () => {
  try {
    const data = await productsStore.getCategories()
    categories.value = buildCategoryTree(Array.isArray(data) ? data : [])
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const buildCategoryTree = (categoryList, parentId = null) => {
  return categoryList
    .filter(category => category.parentId === parentId)
    .map(category => ({
      key: category.id,
      label: category.name,
      children: buildCategoryTree(categoryList, category.id)
    }))
}

const performSearch = async ({ resetPage = true } = {}) => {
  loading.value = true
  errorMessage.value = ''
  if (resetPage) currentPage.value = 1

  try {
    const params = {
      page: currentPage.value,
      limit: perPage.value,
      sortBy: getSortField(),
      sortOrder: getSortOrder(),
    }
    const categoryId = getSelectedCategoryId()
    if (categoryId) params.categoryId = categoryId
    // Do not constrain the default range: a fixed slider maximum must not hide otherwise valid products.
    if (priceRange.value[0] > 0) params.minPrice = priceRange.value[0]
    if (priceRange.value[1] < maxPrice.value) params.maxPrice = priceRange.value[1]
    if (selectedCompany.value) params.companyId = selectedCompany.value

    const result = await productsStore.searchProducts(searchQuery.value, params)
    const catalogProducts = Array.isArray(result?.data) ? result.data : []
    products.value = catalogProducts.map((product) => {
      const primaryImage = product?.images?.find((image) => image?.isPrimary && image?.url)
        || product?.images?.find((image) => image?.url)
      const price = Number(product?.prices?.[0]?.price ?? product?.price ?? 0)
      return {
        ...product,
        name: product?.title || product?.name || '',
        image: primaryImage?.url || product?.image || '',
        price,
        finalPrice: price,
        specs: product?.specifications?.standard || product?.specifications || {},
      }
    })
    totalResults.value = result?.meta?.total ?? products.value.length

    // Keep the heading and URL in sync without triggering a duplicate search.
    query.value = searchQuery.value
    router.push({ query: searchQuery.value ? { q: searchQuery.value } : {} })
  } catch (error) {
    console.error('Error searching products:', error)
    products.value = []
    totalResults.value = 0
    errorMessage.value = 'اتصال به سرویس جستجو برقرار نشد. لطفاً دوباره تلاش کنید.'
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
  performSearch({ resetPage: false })
}

const formatPrice = (price) => new Intl.NumberFormat('fa-IR', {
  style: 'currency',
  currency: 'IRR'
}).format(price)

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

const viewProduct = (product) => {
  router.push({ name: 'product-details', params: { id: product.id } })
}
</script>

<style scoped>
.search-results-page {
  direction: rtl;
}

.sr-container {
  padding-block: var(--ds-space-8) var(--ds-space-16);
}

.sr-head {
  display: grid;
  gap: var(--ds-space-6);
}

.sr-heading-copy {
  display: grid;
  gap: var(--ds-space-2);
}

.sr-search-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-3);
}

.sr-search-input {
  flex: 1 1 18rem;
  min-width: min(100%, 12rem);
}

.sr-primary-button,
.sr-secondary-button {
  min-height: var(--ds-touch-target);
  white-space: nowrap;
}

.sr-primary-button {
  background: var(--ds-color-accent);
  border-color: var(--ds-color-accent);
  color: var(--ds-color-on-accent);
}

.sr-secondary-button {
  background: var(--ds-color-surface);
  border-color: var(--ds-color-border);
  color: var(--ds-color-text);
}

.sr-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--ds-space-6);
  align-items: start;
}

.sr-layout--with-filters {
  grid-template-columns: minmax(0, 1fr);
}

.sr-sidebar,
.sr-results {
  min-width: 0;
}

.sr-filter-card {
  position: sticky;
  top: var(--ds-space-4);
}

.sr-filter-block {
  margin-bottom: var(--ds-space-6);
}

.sr-filter-block h3 {
  margin: 0 0 var(--ds-space-3);
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-bold);
}

.sr-full {
  width: 100%;
}

.sr-price-range {
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-3);
  margin-top: var(--ds-space-3);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
}

.sr-filter-actions {
  display: grid;
  gap: var(--ds-space-3);
}

.sr-results-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-4);
  margin-bottom: var(--ds-space-5);
}

.sr-results-title {
  margin: 0;
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-bold);
}

.sr-results-count {
  min-height: 1.5rem;
  margin: var(--ds-space-1) 0 0;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
}

.sr-sort-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-2);
}

.sr-icon-button {
  min-width: var(--ds-touch-target);
  min-height: var(--ds-touch-target);
}

.sr-sort-dropdown {
  width: min(100%, 16rem);
}

.sr-state {
  display: flex;
  min-height: 17rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-8);
  text-align: center;
}

.sr-state--error {
  border-color: var(--ds-status-danger-fg);
}

.sr-state-icon {
  color: var(--ds-color-primary-text);
  font-size: 2.25rem;
}

.sr-state--error .sr-state-icon {
  color: var(--ds-status-danger-fg);
}

.sr-state-title {
  margin: 0;
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-bold);
}

.sr-state-text {
  margin: 0;
  color: var(--ds-color-text-muted);
  line-height: var(--ds-line-height-relaxed);
}

.sr-product-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--ds-space-5);
}

.sr-paginator {
  margin-top: var(--ds-space-6);
}

.sr-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

:deep(.p-tree .p-tree-container .p-treenode-children),
:deep(.p-tree .p-treenode-label) {
  direction: rtl;
}

@media (min-width: 640px) {
  .sr-product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 992px) {
  .sr-layout--with-filters {
    grid-template-columns: minmax(16rem, 0.85fr) minmax(0, 2.6fr);
  }

  .sr-product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
