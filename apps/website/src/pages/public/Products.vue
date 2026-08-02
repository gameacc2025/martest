<template>
  <div class="products-page">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold">محصولات</h1>
        <Breadcrumb :home="home" :model="items" class="mt-2" />
      </div>

      <!-- Search and Filters -->
      <div class="mb-8">
        <Card>
          <template #content>
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div class="lg:col-span-3">
                <div class="p-inputgroup">
                  <InputText
                    v-model="searchQuery"
                    placeholder="جستجوی محصولات..."
                    class="flex-1"
                    @keyup.enter="searchProducts"
                  />
                  <Button
                    icon="pi pi-search"
                    class="p-button-primary"
                    @click="searchProducts"
                  />
                </div>
              </div>
              <div>
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

            <div class="mt-4 flex gap-2 flex-wrap">
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
      <div v-if="featuredProducts.length > 0" class="mb-12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">محصولات ویژه</h2>
          <Button
            label="مشاهده همه"
            icon="pi pi-arrow-left"
            class="p-button-outlined"
            @click="viewAllFeatured"
          />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
      <div class="mb-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">
            همه محصولات
            <span class="text-gray-500 text-sm">({{ totalProducts }} محصول)</span>
          </h2>
          <div class="flex gap-2">
            <Dropdown
              v-model="sortOption"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full md:w-14rem"
              @change="applyFilters"
            />
            <Button
              icon="pi pi-th-large"
              class="p-button-outlined"
              @click="toggleViewMode"
            />
          </div>
        </div>

        <div v-if="loading" class="text-center py-8">
          <ProgressSpinner />
          <p class="mt-4">در حال بارگذاری...</p>
        </div>

        <div v-else-if="products.length === 0" class="text-center py-8">
          <i class="pi pi-shopping-bag text-4xl text-gray-400 mb-4"></i>
          <h3 class="text-xl font-semibold mb-2">هیچ محصولی یافت نشد</h3>
          <p class="text-gray-500">با فیلترهای فعلی هیچ محصولی یافت نشد</p>
          <Button
            label="حذف فیلترها"
            icon="pi pi-times"
            class="p-button-outlined mt-4"
            @click="clearFilters"
          />
        </div>

        <div v-else>
          <!-- Grid View -->
          <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProductCard
              v-for="product in products"
              :key="product.id"
              :product="product"
              @add-to-cart="addToCart"
              @add-to-wishlist="addToWishlist"
            />
          </div>

          <!-- List View -->
          <div v-else class="space-y-4">
            <Card v-for="product in products" :key="product.id" class="product-list-item">
              <template #content>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div class="md:col-span-1">
                    <img
                      :src="product.image || '/placeholder-product.jpg'"
                      :alt="product.name"
                      class="w-full h-48 object-cover rounded"
                    />
                  </div>
                  <div class="md:col-span-2">
                    <div class="flex justify-between items-start">
                      <div>
                        <h3 class="text-lg font-semibold mb-2">{{ product.name }}</h3>
                        <p class="text-gray-600 mb-2">{{ product.description }}</p>
                        <div class="flex gap-2 mb-2">
                          <Rating :modelValue="product.rating || 0" :cancel="false" readonly />
                          <span class="text-sm text-gray-500">({{ product.reviewCount || 0 }} نظر)</span>
                        </div>
                        <div class="flex gap-4 text-sm text-gray-500">
                          <span>دسته بندی: {{ product.category?.name || 'نامشخص' }}</span>
                          <span>برند: {{ product.brand?.name || 'نامشخص' }}</span>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="space-y-2">
                          <p class="text-xl font-bold text-primary">{{ formatPrice(product.price) }}</p>
                          <p v-if="product.oldPrice" class="text-sm text-gray-500 line-through">
                            {{ formatPrice(product.oldPrice) }}
                          </p>
                          <div class="space-y-1">
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
                </div>
              </template>
            </Card>
          </div>
        </div>

        <div class="mt-8">
          <Paginator
            :rows="perPage"
            :totalRecords="totalProducts"
            :rowsPerPageOptions="[12, 24, 48, 96]"
            @page="onPageChange"
          />
        </div>
      </div>

      <!-- Categories -->
      <div class="mb-8">
        <h2 class="text-xl font-bold mb-6">دسته بندی محصولات</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div
            v-for="category in categories"
            :key="category.id"
            class="category-card p-4 border rounded-lg text-center cursor-pointer hover:bg-gray-50"
            @click="filterByCategory(category.id)"
          >
            <img
              :src="category.image || '/placeholder-category.jpg'"
              :alt="category.name"
              class="w-12 h-12 mx-auto mb-2 object-cover rounded"
            />
            <h3 class="font-semibold">{{ category.name }}</h3>
            <p class="text-sm text-gray-500">{{ category.productCount }} محصول</p>
          </div>
        </div>
      </div>

      <!-- Brands -->
      <div class="mb-8">
        <h2 class="text-xl font-bold mb-6">برندها</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div
            v-for="brand in brands"
            :key="brand.id"
            class="brand-card p-4 border rounded-lg text-center cursor-pointer hover:bg-gray-50"
            @click="filterByBrand(brand.id)"
          >
            <img
              :src="brand.logo || '/placeholder-brand.jpg'"
              :alt="brand.name"
              class="h-8 mx-auto mb-2 object-contain"
            />
            <h3 class="font-semibold">{{ brand.name }}</h3>
            <p class="text-sm text-gray-500">{{ brand.productCount }} محصول</p>
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
import ProgressSpinner from 'primevue/progressspinner'
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
    const list = data.products ?? data.items ?? []
    products.value = Array.isArray(list) ? list : []
    totalProducts.value = data.total || 0
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

.category-card {
  transition: all 0.2s ease;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.brand-card {
  transition: all 0.2s ease;
}

.brand-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-list-item {
  transition: all 0.2s ease;
}

.product-list-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>