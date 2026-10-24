<template>
  <div class="products-page">

    <!-- Breadcrumb as page title -->
    <div class="breadcrumb-wrap">
      <Breadcrumb :home="home" :model="items" />
    </div>

    <!-- Two Column Layout: Filters (right) + Products (left) -->
    <div class="products-grid-layout">

      <!-- Right: Filters Sidebar -->
      <aside class="filters-sidebar">
        <Card class="filters-card">
          <template #content>
            <div class="filters-inner">
              <!-- Search -->
              <div class="filter-group">
                <label>جستجو</label>
                <div class="p-inputgroup">
                  <InputText
                    v-model="searchQuery"
                    placeholder="نام محصول..."
                    @keyup.enter="applyFilters"
                    class="w-full"
                  />
                  <Button icon="pi pi-search" @click="applyFilters" />
                </div>
              </div>

              <!-- Category -->
              <div class="filter-group">
                <label>دسته‌بندی</label>
                <Select
                  v-model="selectedCategory"
                  :options="categoryOptions"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="همه دسته‌ها"
                  class="w-full"
                  @change="applyFilters"
                />
              </div>

              <!-- Price Range -->
              <div class="filter-group">
                <label>محدوده قیمت</label>
                <div class="price-range">
                  <InputNumber
                    v-model="minPrice"
                    placeholder="از"
                    class="w-full"
                    @keyup.enter="applyFilters"
                  />
                  <span class="price-separator">تا</span>
                  <InputNumber
                    v-model="maxPrice"
                    placeholder="تا"
                    class="w-full"
                    @keyup.enter="applyFilters"
                  />
                </div>
              </div>

              <!-- Actions -->
              <div class="filter-actions">
                <Button label="اعمال فیلتر" icon="pi pi-filter" class="w-full" @click="applyFilters" />
                <Button label="پاک کردن" icon="pi pi-times" severity="secondary" text class="w-full" @click="resetFilters" />
              </div>
            </div>
          </template>
        </Card>
      </aside>

      <!-- Left: Products -->
      <div class="products-main">

        <!-- Loading -->
        <div v-if="loading" class="state-box">
          <ProgressSpinner />
          <p>در حال دریافت محصولات...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-box error">
          <i class="pi pi-exclamation-circle"></i>
          <h3>خطا</h3>
          <p>{{ error }}</p>
        </div>

        <!-- Empty -->
        <div v-else-if="products.length === 0" class="state-box">
          <i class="pi pi-search"></i>
          <h3>هیچ محصولی یافت نشد</h3>
          <p>با فیلترهای فعلی هیچ محصولی یافت نشد</p>
          <Button label="حذف فیلترها" icon="pi pi-times" severity="secondary" text @click="resetFilters" />
        </div>

        <!-- Products Grid -->
        <template v-else>
          <div class="products-count">
            <span>{{ totalItems }} محصول یافت شد</span>
          </div>
          <div class="products-grid">
            <div
              v-for="product in products"
              :key="product.id"
              class="product-card"
              @click="goToProduct(product)"
            >
              <div class="product-image">
                <img
                  v-if="product.images && product.images[0]?.url"
                  :src="product.images[0].url"
                  :alt="product.title"
                />
                <div v-else class="empty-image">
                  <i class="pi pi-image"></i>
                </div>
                <span v-if="product.prices && product.prices[0]" class="product-price-badge">
                  {{ formatPrice(product.prices[0].price) }}
                </span>
              </div>
              <div class="product-info">
                <h3 class="product-title">{{ product.title }}</h3>
                <p class="product-company">{{ product.company?.name || 'تأمین‌کننده' }}</p>
                <p v-if="product.shortDescription" class="product-desc">{{ product.shortDescription }}</p>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination-wrap">
            <Paginator
              :rows="filters.limit"
              :totalRecords="totalItems"
              :rowsPerPageOptions="[12, 24, 48]"
              @page="onPageChange"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import Paginator from 'primevue/paginator'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()

const products = ref([])
const loading = ref(false)
const error = ref(null)
const totalPages = ref(1)
const totalItems = ref(0)

const searchQuery = ref('')
const selectedCategory = ref(null)
const minPrice = ref(null)
const maxPrice = ref(null)

const filters = ref({
  search: '',
  category: null,
  minPrice: null,
  maxPrice: null,
  page: 1,
  limit: 12
})

const home = ref({ icon: 'pi pi-home', to: '/' })
const items = ref([{ label: 'محصولات' }])

const categoryOptions = ref([{ id: null, name: 'همه دسته‌ها' }])

onMounted(async () => {
  if (route.query.category) {
    const categoryId = Number(route.query.category)
    selectedCategory.value = Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null
    filters.value.category = selectedCategory.value
  }
  await Promise.all([loadCategories(), loadProducts()])
})

const loadCategories = async () => {
  try {
    const data = await productsStore.getCategories()
    categoryOptions.value = [{ id: null, name: 'همه دسته‌ها' }, ...(data || []).map((category) => ({
      ...category,
      name: category.nameFa || category.nameEn || category.name || category.slug,
    }))]
  } catch (err) {
    console.error('Error loading categories:', err)
  }
}

const loadProducts = async () => {
  try {
    loading.value = true
    error.value = null
    const params = {
      page: filters.value.page,
      limit: filters.value.limit,
      status: 'PUBLISHED'
    }
    if (filters.value.search) params.search = filters.value.search
    if (filters.value.category) params.categoryId = Number(filters.value.category)
    if (filters.value.minPrice) params.minPrice = Number(filters.value.minPrice)
    if (filters.value.maxPrice) params.maxPrice = Number(filters.value.maxPrice)

    const result = await productsStore.getProducts(params) || {}
    // getProducts() returns { data, meta } from apiGetPaginated(); `data` is
    // the product array and pagination totals live under `meta`.
    const list = Array.isArray(result.data)
      ? result.data
      : (result.data?.products ?? result.data?.items ?? result.products ?? result.items ?? [])
    products.value = Array.isArray(list) ? list : []
    totalPages.value = result.meta?.totalPages ?? result.totalPages ?? 1
    totalItems.value = result.meta?.total ?? result.total ?? products.value.length
  } catch (err) {
    error.value = 'خطا در دریافت محصولات'
    products.value = []
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  filters.value = {
    search: searchQuery.value,
    category: selectedCategory.value,
    minPrice: minPrice.value,
    maxPrice: maxPrice.value,
    page: 1,
    limit: 12
  }
  loadProducts()
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = null
  minPrice.value = null
  maxPrice.value = null
  filters.value = { search: '', category: null, minPrice: null, maxPrice: null, page: 1, limit: 12 }
  loadProducts()
}

const onPageChange = (event) => {
  filters.value.page = event.page + 1
  filters.value.limit = event.rows
  loadProducts()
}

const goToProduct = (product) => {
  router.push({ name: 'product-details', params: { id: product.id } })
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('fa-IR', { style: 'currency', currency: 'IRR' }).format(price)
}

watch(() => route.query.category, (newVal) => {
  const parsed = Number(newVal)
  const categoryId = newVal && Number.isInteger(parsed) && parsed > 0 ? parsed : null
  selectedCategory.value = categoryId
  filters.value.category = categoryId
  filters.value.page = 1
  loadProducts()
})
</script>

<style scoped>
.products-page {
  direction: rtl;
  width: 100%;
  max-width: var(--ds-container-max-wide);
  margin-inline: auto;
  padding-inline: var(--ds-container-pad);
  padding-block: var(--ds-space-6);
}

@media (min-width: 768px) {
  .products-page {
    padding-inline: var(--ds-container-pad-lg);
    padding-block: var(--ds-space-8);
  }
}

@media (min-width: 1920px) {
  .products-page {
    padding-inline: var(--ds-container-pad-xl);
  }
}

@media (min-width: 1920px) {
  .products-page {
    padding-inline: var(--ds-container-pad-xl);
  }
}

/* Breadcrumb */
.breadcrumb-wrap { margin-bottom: var(--ds-space-4); }

/* Two Column Layout */
.products-grid-layout {
  display: grid;
  grid-template-columns: minmax(240px, 280px) 1fr;
  gap: var(--ds-space-6);
  align-items: start;
}

/* Filters Sidebar */
.filters-sidebar {
  position: sticky;
  top: 5rem;
  align-self: start;
}
.filters-card { border-radius: var(--ds-radius-lg); }
.filters-card :deep(.p-card-content) { padding: var(--ds-space-4); }
.filters-inner {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}
.filter-group label {
  display: block;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-muted);
  margin-bottom: var(--ds-space-2);
}
.price-range {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--ds-space-2);
}
.price-separator {
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
  text-align: center;
}
.filter-actions {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding-top: var(--ds-space-3);
  border-top: 1px solid var(--ds-color-border);
}

/* Products Main */
.products-main {
  min-height: 400px;
}
.products-count {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: var(--ds-space-4);
}

.product-card {
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow var(--ds-transition), transform var(--ds-transition), border-color var(--ds-transition);
}
.product-card:hover {
  box-shadow: var(--ds-shadow-lg);
  transform: translateY(-2px);
  border-color: var(--ds-color-primary);
}

.product-image {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--surface-ground);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--ds-transition);
}
.product-card:hover .product-image img {
  transform: scale(1.05);
}
.empty-image i {
  font-size: 2.5rem;
  color: var(--text-color-secondary);
  opacity: 0.3;
}
.product-price-badge {
  position: absolute;
  bottom: 0.5rem;
  inset-inline-end: 0.5rem;
  background: var(--primary-color);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
}

.product-info {
  padding: 0.75rem;
}
.product-title {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.product-company {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}
.product-desc {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* State boxes */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--text-color-secondary);
  text-align: center;
}
.state-box i { font-size: 2.5rem; opacity: 0.3; }
.state-box h3 { margin: 0; font-size: 1.1rem; color: var(--text-color); }
.state-box p { margin: 0; font-size: 0.9rem; }

/* Pagination */
.pagination-wrap {
  margin-top: 1.5rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 0.75rem;
}

/* Responsive */
@media (max-width: 900px) {
  .products-grid-layout {
    grid-template-columns: 1fr;
    gap: var(--ds-space-4);
  }
  .filters-sidebar {
    position: static;
    order: -1;
  }
}

@media (max-width: 576px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
