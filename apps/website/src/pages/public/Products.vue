<template>
  <main class="products-page" aria-labelledby="products-page-title">
    <div class="products-container">
      <header class="products-head">
        <div class="products-heading-copy"><span class="ds-eyebrow">کاتالوگ بازارگاه</span><h1 id="products-page-title" class="products-title">محصولات</h1><p>تجهیزات مخابراتی و شبکه را بر اساس دسته‌بندی، قیمت و موجودی پیدا کنید.</p></div>
        <Breadcrumb :home="home" :model="items" class="products-breadcrumb" />
      </header>

      <!-- Search and Filters -->
      <div class="products-filters">
        <Card>
          <template #content>
            <div class="filters-row">
              <div class="filters-search">
                <form class="p-inputgroup" role="search" @submit.prevent="searchProducts">
                  <InputText
                    id="products-search-query"
                    v-model="searchQuery"
                    name="productsSearch"
                    type="search"
                    autocomplete="off"
                    placeholder="جستجوی محصولات…"
                    aria-label="جستجوی محصولات"
                    class="filters-search-input"
                  />
                  <Button type="submit" icon="pi pi-search" class="p-button-primary" aria-label="جستجوی محصولات" />
                </form>
              </div>
              <div class="filters-category">
                <Select
                  v-model="categoryFilter"
                  :options="categoryOptions"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="همه دسته‌بندی‌ها"
                  aria-label="فیلتر دسته‌بندی محصولات"
                  class="w-full"
                  @change="applyFilters"
                />
              </div>
            </div>

            <div class="filters-quick">
              <Button
                label="همه"
                class="p-button-outlined"
                :class="{ 'p-button-primary': priceFilter === 'all' }"
                :aria-pressed="priceFilter === 'all'"
                @click="priceFilter = 'all'; applyFilters()"
              />
              <Button
                label="ارزان ترین"
                class="p-button-outlined"
                :class="{ 'p-button-primary': priceFilter === 'cheap' }"
                :aria-pressed="priceFilter === 'cheap'"
                @click="priceFilter = 'cheap'; applyFilters()"
              />
              <Button
                label="گران ترین"
                class="p-button-outlined"
                :class="{ 'p-button-primary': priceFilter === 'expensive' }"
                :aria-pressed="priceFilter === 'expensive'"
                @click="priceFilter = 'expensive'; applyFilters()"
              />
              <Button
                label="موجود"
                class="p-button-outlined p-button-success"
                :class="{ 'p-button-primary': stockFilter === 'in_stock' }"
                :aria-pressed="stockFilter === 'in_stock'"
                @click="stockFilter = 'in_stock'; applyFilters()"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Featured Products -->
      <div v-if="featuredProducts.length > 0" class="products-section">
        <div class="section-head">
          <h2 class="section-title">محصولات ویژه</h2>
          <Button
            label="مشاهده همه"
            icon="pi pi-arrow-left"
            class="p-button-outlined"
            @click="viewAllFeatured"
          />
        </div>
        <div class="products-grid products-grid--5">
          <ProductCard
            v-for="product in featuredProducts"
            :key="product.id"
            :product="product"
            @add-to-cart="addToCart"
            @add-to-wishlist="addToWishlist"
          />
        </div>
      </div>

      <!-- Products Grid -->
      <div class="products-section">
        <div class="section-head">
          <h2 class="section-title">
            همه محصولات
            <span class="section-count" aria-live="polite">({{ totalProducts.toLocaleString('fa-IR') }} محصول)</span>
          </h2>
          <div class="section-actions">
            <Select
              v-model="sortOption"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              class="sort-dropdown"
              aria-label="مرتب‌سازی محصولات"
              @change="applyFilters"
            />
            <Button
              icon="pi pi-th-large"
              class="p-button-outlined"
              :aria-label="viewMode === 'grid' ? 'نمایش فهرستی' : 'نمایش شبکه‌ای'"
              :aria-pressed="viewMode === 'list'"
              @click="toggleViewMode"
            />
          </div>
        </div>

        <div v-if="loading" class="products-grid products-grid--4" role="status" aria-live="polite" aria-busy="true" aria-label="در حال دریافت محصولات">
          <ProductCard v-for="n in 8" :key="n" skeleton />
        </div>

        <div v-else-if="productsError" class="products-empty products-empty--error" role="alert">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <h3>دریافت محصولات ناموفق بود</h3>
          <p>{{ productsError }}</p>
          <Button label="تلاش دوباره" icon="pi pi-refresh" class="p-button-outlined" @click="loadProducts" />
        </div>

        <div v-else-if="products.length === 0" class="products-empty" role="status" aria-live="polite">
          <i class="pi pi-shopping-bag"></i>
          <h3>هیچ محصولی یافت نشد</h3>
          <p>با فیلترهای فعلی هیچ محصولی یافت نشد</p>
          <Button
            label="حذف فیلترها"
            icon="pi pi-times"
            class="p-button-outlined"
            @click="clearFilters"
          />
        </div>

        <div v-else>
          <!-- Grid View -->
          <div v-if="viewMode === 'grid'" class="products-grid products-grid--4">
            <ProductCard
              v-for="product in products"
              :key="product.id"
              :product="product"
              @add-to-cart="addToCart"
              @add-to-wishlist="addToWishlist"
            />
          </div>

          <!-- List View -->
          <div v-else class="products-list">
            <Card v-for="product in products" :key="product.id" class="product-list-item">
              <template #content>
                <div class="product-list-layout">
                  <div class="product-list-image">
                    <img
                      :src="product.image || '/placeholder-product.jpg'"
                      :alt="product.name || 'تصویر محصول'"
                      width="640"
                      height="400"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div class="product-list-info">
                    <div class="product-list-head">
                      <div>
                        <h3 class="product-list-name">{{ product.name }}</h3>
                        <p class="product-list-desc">{{ product.description }}</p>
                        <div v-if="product.rating != null" class="product-list-rating">
                          <Rating :modelValue="product.rating || 0" :cancel="false" readonly />
                          <span>({{ product.reviewCount || 0 }} نظر)</span>
                        </div>
                        <div class="product-list-meta">
                          <span>دسته بندی: {{ product.category?.name || 'نامشخص' }}</span>
                          <span>برند: {{ product.brand?.name || 'نامشخص' }}</span>
                        </div>
                      </div>
                      <div class="product-list-price">
                        <p class="price-main">{{ product.price != null ? formatPrice(product.price) : '—' }}</p>
                        <p v-if="product.oldPrice" class="price-old">{{ formatPrice(product.oldPrice) }}</p>
                        <div class="product-list-actions">
                          <Button
                            label="افزودن به سبد"
                            icon="pi pi-shopping-cart"
                            class="p-button-primary p-button-sm w-full"
                            @click="addToCart(product)"
                          />
                          <Button
                            type="button"
                            icon="pi pi-heart"
                            class="p-button-text p-button-sm w-full"
                            :aria-label="isInWishlist(product.id) ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'"
                            :aria-pressed="isInWishlist(product.id)"
                            :class="{ 'text-red-500': isInWishlist(product.id) }"
                            @click="toggleWishlist(product)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>

        <div v-if="totalProducts > perPage" class="products-paginator">
          <Paginator
            :rows="perPage"
            :totalRecords="totalProducts"
            :rowsPerPageOptions="[12, 24, 48, 96]"
            @page="onPageChange"
          />
        </div>
      </div>

      <!-- Categories -->
      <div class="products-section">
        <h2 class="section-title">دسته بندی محصولات</h2>
        <div class="categories-grid">
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            class="category-card"
            :aria-label="'فیلتر محصولات دسته ' + category.name"
            :aria-pressed="categoryFilter === category.id"
            @click="filterByCategory(category.id)"
          >
            <img
              :src="category.image || '/placeholder-category.jpg'"
              :alt="category.name || 'تصویر دسته‌بندی'"
              width="640"
              height="360"
              loading="lazy"
              decoding="async"
              class="category-image"
            />
            <span class="category-name">{{ category.name }}</span>
            <span v-if="category.productCount != null" class="category-count">{{ Number(category.productCount).toLocaleString('fa-IR') }} محصول</span>
          </button>
        </div>
      </div>

      <!-- Brands -->
      <div class="products-section">
        <h2 class="section-title">برندها</h2>
        <div class="categories-grid">
          <button
            v-for="brand in brands"
            :key="brand.id"
            type="button"
            class="category-card"
            :aria-label="'فیلتر محصولات برند ' + brand.name"
            @click="filterByBrand(brand.id)"
          >
            <img
              :src="brand.logo || '/placeholder-brand.jpg'"
              :alt="brand.name || 'لوگوی برند'"
              width="640"
              height="360"
              loading="lazy"
              decoding="async"
              class="brand-image"
            />
            <span class="category-name">{{ brand.name }}</span>
            <span v-if="brand.productCount != null" class="category-count">{{ Number(brand.productCount).toLocaleString('fa-IR') }} محصول</span>
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import { useCartStore } from '../../stores/cart'
import { useWishlistStore } from '../../stores/wishlist'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Paginator from 'primevue/paginator'
import Rating from 'primevue/rating'
import ProductCard from '@telecom/shared-ui/components/products/ProductCard.vue'

const router = useRouter()
const productsStore = useProductsStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()

const products = ref([])
const featuredProducts = ref([])
const categories = ref([])
const brands = ref([])
const loading = ref(false)
const productsError = ref('')
const totalProducts = ref(0)
const perPage = ref(12)
const currentPage = ref(1)
const viewMode = ref('grid')

const searchQuery = ref('')
const categoryFilter = ref(null)
const priceFilter = ref('all')
const stockFilter = ref(null)
const sortOption = ref('rating_desc')

const home = ref({
  icon: 'pi pi-home',
  to: '/'
})

const items = ref([
  { label: 'محصولات', to: '/products' }
])

const categoryOptions = ref([
  { id: null, name: 'همه دسته بندی ها' }
])

const sortOptions = ref([
  { label: 'امتیاز: زیاد به کم', value: 'rating_desc' },
  { label: 'امتیاز: کم به زیاد', value: 'rating_asc' },
  { label: 'قیمت: ارزان به گران', value: 'price_asc' },
  { label: 'قیمت: گران به ارزان', value: 'price_desc' },
  { label: 'تاریخ: جدیدترین', value: 'date_desc' },
  { label: 'تاریخ: قدیمی ترین', value: 'date_asc' },
  { label: 'نام: A به Z', value: 'name_asc' },
  { label: 'نام: Z به A', value: 'name_desc' }
])

onMounted(async () => {
  await loadCategories()
  await loadBrands()
  await loadProducts()
  await loadFeaturedProducts()
})

const loadCategories = async () => {
  try {
    const data = await productsStore.getCategories()
    categories.value = data
    categoryOptions.value = [
      { id: null, name: 'همه دسته بندی ها' },
      ...data
    ]
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const loadBrands = async () => {
  try {
    const data = await productsStore.getBrands()
    brands.value = data
  } catch (error) {
    console.error('Error loading brands:', error)
  }
}

const loadProducts = async () => {
  loading.value = true
  productsError.value = ''
  try {
    const params = {
      page: currentPage.value,
      limit: perPage.value,
      search: searchQuery.value || undefined,
      category: categoryFilter.value || undefined,
      brand: undefined,
      minPrice: getMinPrice(),
      maxPrice: getMaxPrice(),
      inStock: stockFilter.value === 'in_stock',
      sortBy: getSortField(),
      sortOrder: getSortOrder()
    }

    const data = await productsStore.getProducts(params) || {}
    const list = data.data ?? []
    products.value = Array.isArray(list) ? list : []
    totalProducts.value = data.meta?.total || 0
  } catch (error) {
    products.value = []
    totalProducts.value = 0
    productsError.value = 'اتصال به فهرست محصولات برقرار نشد. دوباره تلاش کنید.'
    console.error('Error loading products:', error)
  } finally {
    loading.value = false
  }
}

const loadFeaturedProducts = async () => {
  try {
    const data = await productsStore.getFeaturedProducts(5)
    featuredProducts.value = Array.isArray(data) ? data : (data?.items ?? [])
  } catch (error) {
    featuredProducts.value = []
    console.error('Error loading featured products:', error)
  }
}

const searchProducts = () => {
  currentPage.value = 1
  loadProducts()
}

const applyFilters = () => {
  currentPage.value = 1
  loadProducts()
}

const clearFilters = () => {
  searchQuery.value = ''
  categoryFilter.value = null
  priceFilter.value = 'all'
  stockFilter.value = null
  sortOption.value = 'rating_desc'
  currentPage.value = 1
  loadProducts()
}

const filterByCategory = (categoryId) => {
  categoryFilter.value = categoryId
  currentPage.value = 1
  loadProducts()
}

const filterByBrand = (brandId) => {
  router.push({
    name: 'products',
    query: { brand: brandId }
  })
}

const viewAllFeatured = () => {
  router.push({
    name: 'products',
    query: { featured: 'true' }
  })
}

const onPageChange = (event) => {
  currentPage.value = event.page + 1
  perPage.value = event.rows
  loadProducts()
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

const getMinPrice = () => {
  if (priceFilter.value === 'cheap') return 0
  if (priceFilter.value === 'expensive') return 1000000
  return undefined
}

const getMaxPrice = () => {
  if (priceFilter.value === 'cheap') return 1000000
  if (priceFilter.value === 'expensive') return undefined
  return undefined
}

const getSortField = () => {
  const [field] = sortOption.value.split('_')
  return field === 'rating' ? 'averageRating' :
         field === 'price' ? 'price' :
         field === 'date' ? 'createdAt' : 'name'
}

const getSortOrder = () => {
  const [, order] = sortOption.value.split('_')
  return order
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

const toggleWishlist = (product) => {
  if (isInWishlist(product.id)) {
    wishlistStore.removeFromWishlist(product.id)
  } else {
    wishlistStore.addToWishlist(product)
  }
}

const isInWishlist = (productId) => {
  return wishlistStore.items.some(item => item.id === productId)
}
</script>

<style scoped>
.products-page { min-height: 100%; background: var(--ds-color-background); color: var(--ds-color-text); }
.products-container { display: flex; flex-direction: column; gap: var(--ds-space-6); max-width: 1440px; margin: 0 auto; padding: var(--ds-space-6) var(--ds-space-4) var(--ds-space-12); }
.products-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ds-space-4);
  padding: 0 0 var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border);
  background: transparent;
}
.products-heading-copy { min-width: 0; }
.products-title { margin: 0; color: var(--ds-color-text); font-size: clamp(1.5rem, 2.5vw, var(--ds-font-size-2xl)); font-weight: var(--ds-font-weight-bold); }
.products-heading-copy p { max-width: 68ch; margin: .4rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.8; }
.products-breadcrumb { margin: 0; }
.products-filters :deep(.p-card) { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); box-shadow: none; }
.products-filters :deep(.p-card-body) { padding: var(--ds-space-4); }
.filters-row { display: grid; grid-template-columns: minmax(0, 2fr) minmax(12rem, 1fr); gap: var(--ds-space-3); }
.filters-search-input, .products-filters :deep(.p-select) { min-height: var(--ds-touch-target); border-radius: var(--ds-radius-md); }
.filters-quick { display: flex; flex-wrap: wrap; gap: var(--ds-space-2); margin-top: var(--ds-space-4); }
.filters-quick :deep(.p-button) { min-height: var(--ds-touch-target); border-radius: var(--ds-radius-md); }
.products-section { display: flex; flex-direction: column; gap: var(--ds-space-4); padding-top: var(--ds-space-5); border-top: 1px solid var(--ds-color-border); }
.section-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ds-space-3); }
.section-title { margin: 0; color: var(--ds-color-text); font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); }
.section-count { color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-normal); }
.section-actions { display: flex; align-items: center; gap: var(--ds-space-2); }
.sort-dropdown { min-width: 12rem; }
.products-grid { display: grid; gap: var(--ds-space-4); }
.products-grid--4, .products-grid--5 { grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr)); }

.products-empty { display: flex; min-height: 14rem; flex-direction: column; align-items: center; justify-content: center; gap: var(--ds-space-3); padding: var(--ds-space-6); color: var(--ds-color-text-muted); text-align: center; }
.products-empty > i { color: var(--ds-color-text-muted); font-size: 1.5rem; }
.products-empty h3 { margin: 0; color: var(--ds-color-text); font-size: var(--ds-font-size-md); font-weight: var(--ds-font-weight-semibold); }
.products-empty p { max-width: 60ch; margin: 0; line-height: 1.7; }
.products-empty--error { border: 1px solid var(--ds-status-danger-fg); border-radius: var(--ds-radius-md); }
.products-list { display: flex; flex-direction: column; gap: var(--ds-space-3); }
.product-list-item { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); box-shadow: none; transition: border-color var(--ds-transition-fast), background-color var(--ds-transition-fast); }
.product-list-item:hover { border-color: var(--ds-color-primary); background: var(--ds-color-surface-hover); }
.product-list-layout { display: flex; gap: var(--ds-space-5); }
.product-list-image { width: 12rem; flex: 0 0 auto; }
.product-list-image img { width: 100%; height: 8rem; border-radius: var(--ds-radius-sm); object-fit: contain; padding: .5rem; background: var(--ds-color-surface-alt); }
.product-list-info { flex: 1; min-width: 0; }
.product-list-head { display: flex; justify-content: space-between; gap: var(--ds-space-4); }
.product-list-name { margin: 0 0 var(--ds-space-1); color: var(--ds-color-text); font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-semibold); }
.product-list-desc { display: -webkit-box; overflow: hidden; margin: 0 0 var(--ds-space-2); color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.7; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.product-list-rating { display: flex; align-items: center; gap: var(--ds-space-2); margin-bottom: var(--ds-space-2); color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
.product-list-meta { display: flex; flex-wrap: wrap; gap: var(--ds-space-3); color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
.product-list-price { flex: 0 0 auto; text-align: start; }
.price-main { margin: 0 0 var(--ds-space-1); color: var(--ds-color-primary-text); font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); font-variant-numeric: tabular-nums; }
.price-old { margin: 0 0 var(--ds-space-3); color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); text-decoration: line-through; }
.product-list-actions { display: flex; min-width: 10rem; flex-direction: column; gap: var(--ds-space-2); }
.product-list-actions :deep(.p-button) { min-height: var(--ds-touch-target); }
.products-paginator { margin-top: var(--ds-space-5); }
.categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 10rem), 1fr)); gap: var(--ds-space-3); }
.category-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: border-color var(--ds-transition-fast), background-color var(--ds-transition-fast);
}
.category-card:hover { border-color: var(--ds-color-primary); background: var(--ds-color-surface-hover); }
.category-card:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 3px; }
.category-image, .brand-image { width: 100%; aspect-ratio: 16 / 9; object-fit: contain; padding: .5rem; background: var(--ds-color-surface-alt); }
.category-name { display: block; margin: var(--ds-space-3) var(--ds-space-3) var(--ds-space-1); color: var(--ds-color-text); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-semibold); }
.category-count { display: block; margin: 0 var(--ds-space-3) var(--ds-space-3); color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs); }
@media (max-width: 768px) {
  .filters-row { grid-template-columns: minmax(0, 1fr); }
  .product-list-layout { flex-direction: column; }
  .product-list-image { width: 100%; }
  .product-list-image img { height: 12rem; }
  .product-list-head { flex-direction: column; }
  .product-list-price { text-align: start; }
}
@media (max-width: 560px) {
  .products-container { padding-inline: var(--ds-space-3); }
  .products-head { align-items: flex-start; flex-direction: column; }
  .section-actions { width: 100%; }
  .sort-dropdown { flex: 1; min-width: 0; }
  .products-grid--4, .products-grid--5 { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; }
  .product-list-actions { width: 100%; min-width: 0; }
}
@media (max-width: 360px) { .products-grid--4, .products-grid--5 { grid-template-columns: 1fr; } }
</style>