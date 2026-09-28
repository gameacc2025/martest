<template>
  <div class="products-page">
    <div class="products-container">
      <div class="products-head">
        <h1 class="products-title">محصولات</h1>
        <Breadcrumb :home="home" :model="items" class="products-breadcrumb" />
      </div>

      <!-- Search and Filters -->
      <div class="products-filters">
        <Card>
          <template #content>
            <div class="filters-row">
              <div class="filters-search">
                <div class="p-inputgroup">
                  <InputText
                    v-model="searchQuery"
                    placeholder="جستجوی محصولات..."
                    class="filters-search-input"
                    @keyup.enter="searchProducts"
                  />
                  <Button
                    icon="pi pi-search"
                    class="p-button-primary"
                    @click="searchProducts"
                  />
                </div>
              </div>
              <div class="filters-category">
                <Dropdown
                  v-model="categoryFilter"
                  :options="categoryOptions"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="همه دسته بندی ها"
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
                @click="priceFilter = 'all'; applyFilters()"
              />
              <Button
                label="ارزان ترین"
                class="p-button-outlined"
                :class="{ 'p-button-primary': priceFilter === 'cheap' }"
                @click="priceFilter = 'cheap'; applyFilters()"
              />
              <Button
                label="گران ترین"
                class="p-button-outlined"
                :class="{ 'p-button-primary': priceFilter === 'expensive' }"
                @click="priceFilter = 'expensive'; applyFilters()"
              />
              <Button
                label="موجود"
                class="p-button-outlined p-button-success"
                :class="{ 'p-button-primary': stockFilter === 'in_stock' }"
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
            <span class="section-count">({{ totalProducts }} محصول)</span>
          </h2>
          <div class="section-actions">
            <Dropdown
              v-model="sortOption"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              class="sort-dropdown"
              @change="applyFilters"
            />
            <Button
              icon="pi pi-th-large"
              class="p-button-outlined"
              @click="toggleViewMode"
            />
          </div>
        </div>

        <div v-if="loading" class="products-grid products-grid--4">
          <ProductCard v-for="n in 8" :key="n" skeleton />
        </div>

        <div v-else-if="products.length === 0" class="products-empty">
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
                      :alt="product.name"
                    />
                  </div>
                  <div class="product-list-info">
                    <div class="product-list-head">
                      <div>
                        <h3 class="product-list-name">{{ product.name }}</h3>
                        <p class="product-list-desc">{{ product.description }}</p>
                        <div class="product-list-rating">
                          <Rating :modelValue="product.rating || 0" :cancel="false" readonly />
                          <span>({{ product.reviewCount || 0 }} نظر)</span>
                        </div>
                        <div class="product-list-meta">
                          <span>دسته بندی: {{ product.category?.name || 'نامشخص' }}</span>
                          <span>برند: {{ product.brand?.name || 'نامشخص' }}</span>
                        </div>
                      </div>
                      <div class="product-list-price">
                        <p class="price-main">{{ formatPrice(product.price) }}</p>
                        <p v-if="product.oldPrice" class="price-old">{{ formatPrice(product.oldPrice) }}</p>
                        <div class="product-list-actions">
                          <Button
                            label="افزودن به سبد"
                            icon="pi pi-shopping-cart"
                            class="p-button-primary p-button-sm w-full"
                            @click="addToCart(product)"
                          />
                          <Button
                            icon="pi pi-heart"
                            class="p-button-text p-button-sm w-full"
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

        <div class="products-paginator">
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
          <div
            v-for="category in categories"
            :key="category.id"
            class="category-card"
            @click="filterByCategory(category.id)"
          >
            <img
              :src="category.image || '/placeholder-category.jpg'"
              :alt="category.name"
              class="category-image"
            />
            <h3 class="category-name">{{ category.name }}</h3>
            <p class="category-count">{{ category.productCount }} محصول</p>
          </div>
        </div>
      </div>

      <!-- Brands -->
      <div class="products-section">
        <h2 class="section-title">برندها</h2>
        <div class="categories-grid">
          <div
            v-for="brand in brands"
            :key="brand.id"
            class="category-card"
            @click="filterByBrand(brand.id)"
          >
            <img
              :src="brand.logo || '/placeholder-brand.jpg'"
              :alt="brand.name"
              class="brand-image"
            />
            <h3 class="category-name">{{ brand.name }}</h3>
            <p class="category-count">{{ brand.productCount }} محصول</p>
          </div>
        </div>
      </div>
    </div>
  </div>
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
import Dropdown from 'primevue/dropdown'
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
.products-page {
  direction: rtl;
}

.products-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--ds-space-8) var(--ds-space-4);
}

.products-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--ds-space-6);
  flex-wrap: wrap;
  gap: var(--ds-space-3);
}

.products-title {
  font-size: var(--ds-font-size-2xl);
  font-weight: var(--ds-font-weight-bold);
  margin: 0;
}

/* ── Filters ─────────────────────────────────── */
.products-filters {
  margin-bottom: var(--ds-space-6);
}

.filters-row {
  display: flex;
  gap: var(--ds-space-4);
  flex-wrap: wrap;
  margin-bottom: var(--ds-space-4);
}

.filters-search {
  flex: 1;
  min-width: 14rem;
}

.filters-category {
  min-width: 12rem;
}

.filters-quick {
  display: flex;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}

/* ── Sections ────────────────────────────────── */
.products-section {
  margin-bottom: var(--ds-space-8);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--ds-space-4);
  flex-wrap: wrap;
  gap: var(--ds-space-3);
}

.section-title {
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-bold);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
}

.section-count {
  font-weight: var(--ds-font-weight-normal);
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
}

.section-actions {
  display: flex;
  gap: var(--ds-space-2);
  align-items: center;
}

.sort-dropdown {
  width: 14rem;
}

/* ── Grid ────────────────────────────────────── */
.products-grid {
  display: grid;
  gap: var(--ds-space-4);
}

.products-grid--4 {
  grid-template-columns: repeat(4, 1fr);
}

.products-grid--5 {
  grid-template-columns: repeat(5, 1fr);
}

@media (max-width: 1200px) {
  .products-grid--4 {
    grid-template-columns: repeat(3, 1fr);
  }
  .products-grid--5 {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .products-grid--4,
  .products-grid--5 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .products-grid--4,
  .products-grid--5 {
    grid-template-columns: 1fr;
  }
}

/* ── Empty State ─────────────────────────────── */
.products-empty {
  text-align: center;
  padding: var(--ds-space-12) var(--ds-space-4);
  color: var(--ds-color-text-muted);
}

.products-empty i {
  font-size: 3rem;
  margin-bottom: var(--ds-space-4);
  display: block;
}

.products-empty h3 {
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  margin: 0 0 var(--ds-space-2) 0;
  color: var(--ds-color-text);
}

.products-empty p {
  margin: 0 0 var(--ds-space-4) 0;
}

/* ── List View ───────────────────────────────── */
.products-list {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.product-list-item {
  transition: box-shadow var(--ds-transition);
}

.product-list-item:hover {
  box-shadow: var(--ds-shadow-md);
}

.product-list-layout {
  display: flex;
  gap: var(--ds-space-6);
}

.product-list-image {
  width: 12rem;
  flex-shrink: 0;
}

.product-list-image img {
  width: 100%;
  height: 8rem;
  object-fit: cover;
  border-radius: var(--ds-radius-md);
}

.product-list-info {
  flex: 1;
  min-width: 0;
}

.product-list-head {
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-4);
}

.product-list-name {
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  margin: 0 0 var(--ds-space-1) 0;
}

.product-list-desc {
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
  margin: 0 0 var(--ds-space-2) 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-list-rating {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
  margin-bottom: var(--ds-space-2);
}

.product-list-meta {
  display: flex;
  gap: var(--ds-space-4);
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
}

.product-list-price {
  text-align: start;
  flex-shrink: 0;
}

.price-main {
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-primary);
  margin: 0 0 var(--ds-space-1) 0;
}

.price-old {
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
  text-decoration: line-through;
  margin: 0 0 var(--ds-space-3) 0;
}

.product-list-actions {
  display: flex;
  gap: var(--ds-space-2);
  flex-direction: column;
  min-width: 10rem;
}

@media (max-width: 768px) {
  .product-list-layout {
    flex-direction: column;
  }
  .product-list-image {
    width: 100%;
  }
  .product-list-image img {
    height: 12rem;
  }
  .product-list-head {
    flex-direction: column;
  }
  .product-list-price {
    text-align: start;
  }
}

/* ── Paginator ───────────────────────────────── */
.products-paginator {
  margin-top: var(--ds-space-6);
}

/* ── Categories / Brands Grid ────────────────── */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--ds-space-4);
}

@media (max-width: 1200px) {
  .categories-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 992px) {
  .categories-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
}

.category-card {
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--ds-transition), box-shadow var(--ds-transition);
  text-align: center;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--ds-shadow-md);
}

.category-image,
.brand-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: var(--ds-color-surface-alt);
}

.category-name {
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  margin: var(--ds-space-3) var(--ds-space-3) var(--ds-space-1) 0;
}

.category-count {
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
  margin: 0 0 var(--ds-space-3) 0;
}
</style>