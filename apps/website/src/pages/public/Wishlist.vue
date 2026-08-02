<template>
  <div class="wishlist-page">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold">لیست علاقه مندی ها</h1>
        <Breadcrumb :home="home" :model="items" class="mt-2" />
      </div>

      <div v-if="wishlistItems.length === 0" class="text-center py-12">
        <i class="pi pi-heart text-6xl text-gray-300 mb-4"></i>
        <h2 class="text-xl font-semibold mb-2">لیست علاقه مندی های شما خالی است</h2>
        <p class="text-gray-500 mb-6">هیچ محصولی را به لیست علاقه مندی های خود اضافه نکرده اید</p>
        <Button
          label="مشاهده محصولات"
          icon="pi pi-shopping-bag"
          class="p-button-primary"
          @click="goToProducts"
        />
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Wishlist Items -->
        <div class="lg:col-span-2">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProductCard
              v-for="product in wishlistItems"
              :key="product.id"
              :product="product"
              :showWishlistButton="false"
              @add-to-cart="addToCart"
            >
              <template #actions>
                <div class="flex gap-2 mt-2">
                  <Button
                    icon="pi pi-shopping-cart"
                    class="p-button-primary p-button-sm flex-1"
                    label="افزودن به سبد"
                    @click="addToCart(product)"
                  />
                  <Button
                    icon="pi pi-trash"
                    class="p-button-danger p-button-sm"
                    @click="removeFromWishlist(product.id)"
                  />
                </div>
              </template>
            </ProductCard>
          </div>
        </div>

        <!-- Wishlist Summary -->
        <div class="lg:col-span-1">
          <Card>
            <template #title>خلاصه لیست علاقه مندی ها</template>
            <template #content>
              <div class="space-y-4">
                <div class="flex justify-between">
                  <span>تعداد محصولات:</span>
                  <span class="font-semibold">{{ wishlistItems.length }}</span>
                </div>

                <div class="flex justify-between">
                  <span>مجموع قیمت تخمینی:</span>
                  <span class="font-semibold">{{ formatPrice(totalPrice) }}</span>
                </div>
              </div>
            </template>
            <template #footer>
              <div class="space-y-2">
                <Button
                  label="افزودن همه به سبد خرید"
                  icon="pi pi-shopping-cart"
                  class="w-full p-button-primary"
                  @click="addAllToCart"
                />
                <Button
                  label="خالی کردن لیست"
                  icon="pi pi-trash"
                  class="w-full p-button-outlined p-button-danger"
                  @click="clearWishlist"
                />
              </div>
            </template>
          </Card>

          <!-- Categories -->
          <Card class="mt-4">
            <template #title>دسته بندی ها</template>
            <template #content>
              <div class="space-y-2">
                <div
                  v-for="category in categories"
                  :key="category.id"
                  class="flex justify-between items-center p-2 rounded hover:bg-gray-50 cursor-pointer"
                  @click="filterByCategory(category.id)"
                >
                  <span>{{ category.name }}</span>
                  <span class="text-gray-500">{{ category.count }}</span>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWishlistStore } from '../../stores/wishlist'
import { useCartStore } from '../../stores/cart'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProductCard from '@telecom/shared-ui/components/products/ProductCard.vue'

const router = useRouter()
const wishlistStore = useWishlistStore()
const cartStore = useCartStore()

const wishlistItems = computed(() => wishlistStore.items)
const categories = ref([])

const home = ref({
  icon: 'pi pi-home',
  to: '/'
})

const items = ref([
  { label: 'لیست علاقه مندی ها', to: '/wishlist' }
])

onMounted(() => {
  loadCategories()
})

const loadCategories = () => {
  // Group wishlist items by category
  const categoryMap = {}

  wishlistItems.value.forEach(product => {
    const categoryId = product.category?.id || 'uncategorized'
    const categoryName = product.category?.name || 'بدون دسته بندی'

    if (!categoryMap[categoryId]) {
      categoryMap[categoryId] = {
        id: categoryId,
        name: categoryName,
        count: 0
      }
    }

    categoryMap[categoryId].count++
  })

  categories.value = Object.values(categoryMap)
}

const totalPrice = computed(() => {
  return wishlistItems.value.reduce((sum, product) => sum + (product.price || 0), 0)
})

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

const addAllToCart = () => {
  wishlistItems.value.forEach(product => {
    cartStore.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    })
  })
}

const removeFromWishlist = (productId) => {
  wishlistStore.removeFromWishlist(productId)
  loadCategories()
}

const clearWishlist = () => {
  wishlistStore.clearWishlist()
  loadCategories()
}

const filterByCategory = (categoryId) => {
  router.push({
    name: 'products',
    query: { category: categoryId }
  })
}

const goToProducts = () => {
  router.push('/products')
}
</script>

<style scoped>
.wishlist-page {
  direction: rtl;
}
</style>