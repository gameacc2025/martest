<template>
  <div class="product-details-page">
    <div class="container mx-auto px-4 py-8">
      <Breadcrumb :home="home" :model="items" />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Product Gallery -->
        <div class="product-gallery">
          <div class="main-image mb-4">
            <img
              :src="product.image || '/placeholder-product.jpg'"
              :alt="product.name"
              class="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
          <div class="thumbnail-gallery grid grid-cols-4 gap-2" v-if="product.images && product.images.length > 0">
            <img
              v-for="(img, index) in product.images"
              :key="index"
              :src="img"
              :alt="`Product thumbnail ${index + 1}`"
              class="w-full h-20 object-cover rounded cursor-pointer border-2 border-transparent hover:border-primary"
              @click="selectImage(img)"
            />
          </div>
        </div>

        <!-- Product Info -->
        <div class="product-info">
          <div class="mb-4">
            <span class="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm" v-if="product.category">
              {{ product.category.name }}
            </span>
          </div>

          <h1 class="text-3xl font-bold mb-4">{{ product.name }}</h1>

          <div class="flex items-center gap-4 mb-6">
            <div class="text-2xl font-bold text-primary">
              {{ formatPrice(product.price) }}
            </div>
            <div class="text-gray-500 line-through" v-if="product.originalPrice">
              {{ formatPrice(product.originalPrice) }}
            </div>
            <div class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm" v-if="product.discount">
              {{ product.discount }}% تخفیف
            </div>
          </div>

          <div class="mb-6">
            <div class="flex items-center gap-2 mb-2">
              <Rating :modelValue="product.rating || 0" :cancel="false" readonly />
              <span class="text-gray-600">({{ product.reviewsCount || 0 }} نظر)</span>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="font-semibold mb-2">توضیحات کوتاه:</h3>
            <p class="text-gray-600">{{ product.shortDescription }}</p>
          </div>

          <div class="mb-6">
            <h3 class="font-semibold mb-2">ویژگی ها:</h3>
            <div class="grid grid-cols-2 gap-2">
              <div v-for="(spec, key) in product.specifications" :key="key" class="flex justify-between">
                <span class="text-gray-500">{{ key }}:</span>
                <span>{{ spec }}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-4 mb-6">
            <Button
              label="افزودن به سبد خرید"
              icon="pi pi-shopping-cart"
              class="p-button-primary flex-1"
              @click="addToCart"
            />
            <Button
              label="افزودن به علاقه مندی ها"
              icon="pi pi-heart"
              class="p-button-outlined p-button-secondary"
              @click="addToWishlist"
            />
          </div>

          <div class="company-info flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <img
              :src="product.company?.logo || '/placeholder-company.jpg'"
              alt="Company logo"
              class="w-12 h-12 rounded-full"
            />
            <div>
              <h4 class="font-semibold">{{ product.company?.name }}</h4>
              <p class="text-sm text-gray-500">{{ product.company?.description }}</p>
            </div>
            <Button
              label="مشاهده پروفایل شرکت"
              class="p-button-text p-button-sm"
              @click="viewCompanyProfile"
            />
          </div>
        </div>
      </div>

      <!-- Product Description -->
      <div class="mt-12 bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4">توضیحات کامل محصول</h2>
        <div class="prose max-w-none" v-html="product.description"></div>
      </div>

      <!-- Related Products -->
      <div class="mt-12">
        <h2 class="text-xl font-bold mb-6">محصولات مرتبط</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProductCard
            v-for="related in relatedProducts"
            :key="related.id"
            :product="related"
            @add-to-cart="addToCart"
          />
        </div>
      </div>

      <!-- Reviews Section -->
      <div class="mt-12 bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-6">نظرات کاربران</h2>
        <div class="space-y-6">
          <ReviewCard
            v-for="review in reviews"
            :key="review.id"
            :review="review"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import { useCartStore } from '../../stores/cart'
import { useWishlistStore } from '../../stores/wishlist'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Rating from 'primevue/rating'
import ProductCard from '@telecom/shared-ui/components/products/ProductCard.vue'
import ReviewCard from '@telecom/shared-ui/components/reviews/ReviewCard.vue'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()

const product = ref({})
const relatedProducts = ref([])
const reviews = ref([])
const selectedImage = ref('')

const home = ref({
  icon: 'pi pi-home',
  to: '/'
})

const items = ref([
  { label: 'محصولات', to: '/products' },
  { label: 'جزئیات محصول' }
])

onMounted(async () => {
  await loadProduct()
})

const loadProduct = async () => {
  try {
    const productId = route.params.id
    const data = await productsStore.getProductById(productId)
    product.value = data.product
    relatedProducts.value = data.relatedProducts || []
    reviews.value = data.reviews || []
    selectedImage.value = product.value.image || product.value.images?.[0] || ''
  } catch (error) {
    console.error('Error loading product:', error)
  }
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR'
  }).format(price)
}

const selectImage = (image) => {
  selectedImage.value = image
}

const addToCart = () => {
  cartStore.addToCart({
    id: product.value.id,
    name: product.value.name,
    price: product.value.price,
    image: product.value.image,
    quantity: 1
  })
}

const addToWishlist = () => {
  wishlistStore.addToWishlist(product.value)
}

const viewCompanyProfile = () => {
  if (product.value.company?.id) {
    router.push({ name: 'company-profile', params: { id: product.value.company.id } })
  }
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
</style>