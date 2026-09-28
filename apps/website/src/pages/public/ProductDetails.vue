<template>
  <div class="product-details-page">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumb :home="home" :model="items" />

      <!-- Loading -->
      <div v-if="loading" class="pd-state">
        <ProgressSpinner />
        <p class="pd-state-text">در حال بارگذاری محصول...</p>
      </div>

      <!-- Not found (API did not return product data) -->
      <div v-else-if="notFound" class="pd-state">
        <i class="pi pi-inbox pd-state-icon"></i>
        <h2 class="pd-state-title">محصول یافت نشد</h2>
        <p class="pd-state-text">محصول مورد نظر در دسترس نیست یا حذف شده است.</p>
        <Button label="بازگشت به فروشگاه" icon="pi pi-arrow-right" @click="goBack" />
      </div>

      <!-- Error (no response / server failure) -->
      <div v-else-if="loadError" class="pd-state">
        <i class="pi pi-exclamation-triangle pd-state-icon"></i>
        <h2 class="pd-state-title">خطا در دریافت محصول</h2>
        <p class="pd-state-text">{{ loadError }}</p>
        <div class="pd-state-actions">
          <Button label="تلاش مجدد" icon="pi pi-refresh" @click="loadProduct" />
          <Button label="بازگشت به فروشگاه" icon="pi pi-arrow-right" severity="secondary" @click="goBack" />
        </div>
      </div>

      <!-- Product content -->
      <template v-else>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Product Gallery -->
          <div class="product-gallery">
            <div class="main-image mb-4">
              <img
                :src="selectedImage || primaryImage || '/placeholder-product.jpg'"
                :alt="product.title"
                class="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
            <div class="thumbnail-gallery grid grid-cols-4 gap-2" v-if="galleryImages.length > 1">
              <img
                v-for="(img, index) in galleryImages"
                :key="img.url || index"
                :src="img.url"
                :alt="`تصویر ${index + 1}`"
                class="w-full h-20 object-cover rounded cursor-pointer border-2 transition-colors"
                :class="img.url === selectedImage ? 'border-primary' : 'border-transparent hover:border-primary'"
                @click="selectedImage = img.url"
              />
            </div>
          </div>

          <!-- Product Info -->
          <div class="product-info">
            <div class="mb-4 flex flex-wrap gap-2">
              <span
                v-if="product.category?.nameFa || product.category?.nameEn"
                class="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
              >
                {{ product.category.nameFa || product.category.nameEn }}
              </span>
              <span
                v-if="product.subcategory?.nameFa || product.subcategory?.nameEn"
                class="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
              >
                {{ product.subcategory.nameFa || product.subcategory.nameEn }}
              </span>
            </div>

            <h1 class="text-3xl font-bold mb-4">{{ product.title || 'بدون عنوان' }}</h1>

            <p v-if="product.brand || product.model" class="text-gray-500 mb-4">
              {{ [product.brand, product.model].filter(Boolean).join(' · ') }}
              <span v-if="product.sku" class="pd-sku">SKU: {{ product.sku }}</span>
            </p>
            <p v-else-if="product.sku" class="text-gray-500 mb-4">SKU: {{ product.sku }}</p>

            <div class="mb-6">
              <template v-if="prices.length">
                <span class="text-2xl font-bold text-primary">{{ minPriceText }}</span>
                <span class="text-gray-500 text-sm" v-if="prices.length > 1"> ({{ prices.length }} سطح قیمت)</span>
              </template>
              <span v-else class="text-gray-500" dir="rtl">قیمت: برای استعلام با فروشنده تماس بگیرید</span>
            </div>

            <div class="mb-6" v-if="specRows.length">
              <h3 class="font-semibold mb-2">مشخصات فنی:</h3>
              <div class="grid grid-cols-2 gap-2">
                <div v-for="row in specRows" :key="row.title" class="flex justify-between">
                  <span class="text-gray-500">{{ row.title }}:</span>
                  <span class="text-gray-800">{{ row.value }}</span>
                </div>
              </div>
            </div>

            <div class="mb-6" v-if="product.shortDescription || product.description">
              <h3 class="font-semibold mb-2">توضیحات کوتاه:</h3>
              <p class="text-gray-600">{{ product.shortDescription || product.description }}</p>
            </div>

            <div class="flex gap-4 mb-6">
              <Button label="افزودن به سبد خرید" icon="pi pi-shopping-cart" class="p-button-primary flex-1" @click="addToCart" />
              <Button label="افزودن به علاقه مندی ها" icon="pi pi-heart" class="p-button-outlined p-button-secondary" @click="addToWishlist" />
            </div>

            <div class="company-info flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <i class="pi pi-building company-icon"></i>
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold">{{ product.company?.name || 'شرکت نامشخص' }}</h4>
                <p class="text-sm text-gray-500 truncate">{{ product.company?.type ? `نوع: ${product.company.type}` : '' }}</p>
              </div>
              <Button
                v-if="product.company?.id"
                label="مشاهده پروفایل شرکت"
                class="p-button-text p-button-sm"
                @click="viewCompanyProfile"
              />
            </div>
          </div>
        </div>

        <!-- Product Description -->
        <div v-if="product.description" class="mt-12 bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-bold mb-4">توضیحات کامل محصول</h2>
          <div class="prose max-w-none" v-html="product.description"></div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import { useCartStore } from '../../stores/cart'
import { useWishlistStore } from '../../stores/wishlist'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()

const product = ref({})
const loading = ref(false)
const loadError = ref('')
const selectedImage = ref('')

const home = ref({
  icon: 'pi pi-home',
  to: '/'
})

const items = ref([
  { label: 'محصولات', to: '/products' },
  { label: 'جزئیات محصول' }
])

// No product data came back from the API (but also no transport error).
const notFound = computed(() => {
  return !loading.value && !loadError.value && !(product.value && (product.value.id != null || product.value.title))
})

const galleryImages = computed(() => {
  const list = Array.isArray(product.value.images) ? product.value.images : []
  return [...list]
    .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
    .filter((img) => img?.url)
    .map((img) => ({ url: img.url, ...img }))
})

const primaryImage = computed(() => galleryImages.value[0]?.url || '')

const prices = computed(() => {
  const list = Array.isArray(product.value.prices) ? product.value.prices : []
  return list.filter((t) => t.price != null && t.price !== '')
})

const minPrice = computed(() => {
  if (!prices.value.length) return null
  return Math.min(...prices.value.map((t) => Number(t.price)))
})

const minPriceText = computed(() => (minPrice.value == null ? '' : formatPrice(minPrice.value)))

const specRows = computed(() => {
  const rows = []
  const specs = product.value.specifications && typeof product.value.specifications === 'object'
    ? product.value.specifications
    : {}
  for (const [key, value] of Object.entries(specs.standard || {})) {
    if (value !== '' && value != null) rows.push({ title: key, value: String(value) })
  }
  for (const attr of specs.attributes || []) {
    if (attr?.title && attr.value !== '' && attr.value != null) rows.push({ title: attr.title, value: String(attr.value) })
  }
  return rows
})

const loadProduct = async () => {
  const productId = route.params.id
  if (productId == null || productId === '') {
    loadError.value = 'شناسه محصول نامعتبر است'
    product.value = {}
    return
  }

  loading.value = true
  loadError.value = ''
  try {
    const data = await productsStore.getProductById(productId)
    // Defensive unwrap: some endpoints nest the envelope twice.
    const resolved = data?.data && typeof data.data === 'object' && 'id' in data.data ? data.data : data
    product.value = resolved && typeof resolved === 'object' ? resolved : {}
    selectedImage.value = primaryImage.value
  } catch (err) {
    const status = err.status ?? err.response?.status
    loadError.value = err.response?.data?.error?.message || err.serverMessage || (status ? (err.message || 'خطا در دریافت محصول') : 'ارتباط با سرور برقرار نشد')
    product.value = {}
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, () => {
  product.value = {}
  loadError.value = ''
  loadProduct()
})

onMounted(loadProduct)

const formatPrice = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return '—'
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR'
  }).format(num)
}

const addToCart = () => {
  if (!product.value.id) return
  cartStore.addToCart({
    id: product.value.id,
    name: product.value.title || 'بدون عنوان',
    price: minPrice.value ?? 0,
    image: primaryImage.value,
    quantity: 1
  })
}

const addToWishlist = () => {
  if (!product.value.id) return
  wishlistStore.addToWishlist(product.value)
}

const viewCompanyProfile = () => {
  if (product.value.company?.id) {
    router.push({ name: 'company-profile', params: { id: product.value.company.id } })
  }
}

const goBack = () => {
  if (router.currentRoute.value.path === '/products') return
  router.push('/products')
}
</script>

<style scoped>
.product-details-page {
  direction: rtl;
}

.prose :deep(img) {
  max-width: 100%;
  height: auto;
}

.pd-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 1.5rem;
  text-align: center;
}

.pd-state-icon {
  font-size: 2.75rem;
  color: var(--text-color-secondary);
  opacity: 0.5;
}

.pd-state-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.pd-state-text {
  margin: 0;
  color: var(--text-color-secondary);
  max-width: 32rem;
}

.pd-state-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.pd-sku {
  font-size: 0.78rem;
  color: var(--text-color-secondary);
}

.company-icon {
  font-size: 2.25rem;
  color: var(--text-color-secondary);
  opacity: 0.6;
}
</style>