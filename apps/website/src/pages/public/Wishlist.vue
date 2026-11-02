<template>
  <div class="wishlist-page">
    <div class="ds-container ds-page">
      <header class="commerce-page-heading">
        <div class="commerce-heading-copy"><span class="ds-eyebrow"><i class="pi pi-heart"></i> مجموعه منتخب شما</span><h1 class="ds-page-heading__title">لیست علاقه‌مندی‌ها</h1><p>محصولاتی را که برای بررسی دوباره ذخیره کرده‌اید، اینجا پیدا می‌کنید.</p></div>
        <Breadcrumb :home="home" :model="items" />
      </header>

      <div v-if="wishlistItems.length === 0" class="wishlist-empty-state">
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

.wishlist-page { color: var(--ds-color-text); }
.wishlist-page .ds-page-heading {
  align-items: flex-end;
  padding-bottom: var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border);
}
.wishlist-page .ds-page-heading__title {
  color: var(--ds-color-text);
  font-size: clamp(1.35rem, 2vw, var(--ds-font-size-2xl));
  font-weight: var(--ds-font-weight-bold);
}
.wishlist-page :deep(.p-card) {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.wishlist-page :deep(.p-card .p-card-title) {
  color: var(--ds-color-text);
  font-weight: var(--ds-font-weight-bold);
}
.wishlist-page :deep(.p-button) { border-radius: var(--ds-radius-md); }
.commerce-page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: var(--ds-space-6);
  padding: clamp(1rem, 2vw, 1.5rem);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: linear-gradient(110deg, color-mix(in srgb, var(--ds-color-primary) 7%, var(--ds-color-surface)), var(--ds-color-surface) 72%);
  box-shadow: var(--ds-shadow-xs);
}
.commerce-heading-copy { min-width: 0; }
.commerce-heading-copy .ds-eyebrow { display: inline-flex; align-items: center; gap: .45rem; margin-bottom: .25rem; font-weight: var(--ds-font-weight-bold); }
.commerce-heading-copy h1 { margin: 0; color: var(--ds-color-text); font-size: clamp(1.35rem, 2vw, var(--ds-font-size-2xl)); font-weight: var(--ds-font-weight-bold); }
.commerce-heading-copy p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.7; }
.commerce-page-heading :deep(.p-breadcrumb) { padding: 0; background: transparent; border: 0; }
.wishlist-page { color: var(--ds-color-text); }
.wishlist-page :deep(.p-card) { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); box-shadow: var(--ds-shadow-xs); }
.wishlist-page :deep(.p-card-title) { color: var(--ds-color-text); font-weight: var(--ds-font-weight-bold); }
.wishlist-page :deep(.p-button) { border-radius: var(--ds-radius-md); }
.wishlist-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 22rem; gap: .8rem; padding: 2rem; border: 1px dashed var(--ds-color-border); border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); text-align: center; }
.wishlist-empty-state > i { display: grid; place-items: center; width: 4.5rem; height: 4.5rem; border-radius: 1.25rem; background: var(--ds-color-primary-soft); color: var(--ds-color-primary); font-size: 1.8rem; }
.wishlist-empty-state h2 { margin: 0; color: var(--ds-color-text); }
.wishlist-empty-state p { color: var(--ds-color-text-muted); }

</style>