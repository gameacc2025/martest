<template>
  <main class="wishlist-page" aria-labelledby="wishlist-page-title">
    <div class="ds-container ds-page">
      <WorkspacePageHeading
        eyebrow="مجموعه منتخب شما"
        title="لیست علاقه‌مندی‌ها"
        description="محصولاتی را که برای بررسی دوباره ذخیره کرده‌اید، اینجا پیدا می‌کنید."
        icon="pi pi-heart"
        heading-id="wishlist-page-title"
      >
        <template #actions><Breadcrumb :home="home" :model="items" /></template>
      </WorkspacePageHeading>

      <div v-if="wishlistItems.length === 0" class="wishlist-empty-state" role="status">
        <i class="pi pi-heart text-6xl text-gray-300 mb-4" aria-hidden="true"></i>
        <h2 class="text-xl font-semibold mb-2">لیست علاقه مندی های شما خالی است</h2>
        <p class="text-gray-500 mb-6">هیچ محصولی را به لیست علاقه مندی های خود اضافه نکرده اید</p>
        <router-link to="/products" class="wishlist-browse-link"><i class="pi pi-shopping-bag" aria-hidden="true"></i> مشاهده محصولات</router-link>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Wishlist Items -->
        <div class="lg:col-span-2">
          <div class="wishlist-product-grid">
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
                  <Button type="button" icon="pi pi-trash" class="p-button-danger p-button-sm" :aria-label="'حذف ' + (product.name || product.title || 'محصول') + ' از علاقه‌مندی‌ها'" @click="removeFromWishlist(product.id)" />
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
                  <span>جمع قیمت اقلام دارای قیمت:</span>
                  <span v-if="pricedItems.length" class="font-semibold">{{ formatPrice(totalPrice) }}</span>
                  <span v-else class="font-semibold">ثبت نشده</span>
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
                <button
                  v-for="category in categories"
                  :key="category.id"
                  type="button"
                  class="wishlist-category-filter"
                  :aria-label="'نمایش محصولات دسته ' + category.name"
                  @click="filterByCategory(category.id)"
                >
                  <span>{{ category.name }}</span>
                  <span class="wishlist-category-count">{{ category.count.toLocaleString('fa-IR') }}</span>
                </button>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
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

const pricedItems = computed(() => wishlistItems.value.filter(product => product.price != null))
const totalPrice = computed(() => {
  return pricedItems.value.reduce((sum, product) => sum + Number(product.price), 0)
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

</script>

<style scoped>
.wishlist-page { direction: rtl; color: var(--ds-color-text); }
.wishlist-page .ds-page-heading {
  align-items: flex-end;
  padding: 0 0 var(--ds-space-4);
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.wishlist-page .ds-page-heading__title { color: var(--ds-color-text); font-size: clamp(1.35rem, 2vw, var(--ds-font-size-2xl)); font-weight: var(--ds-font-weight-bold); }
.wishlist-page :deep(.p-card) {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  box-shadow: none;
}
.wishlist-page :deep(.p-card .p-card-title) { color: var(--ds-color-text); font-weight: var(--ds-font-weight-bold); }
.wishlist-page :deep(.p-button) { min-height: var(--ds-touch-target); border-radius: var(--ds-radius-md); }
.wishlist-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 18rem;
  gap: .8rem;
  padding: 2rem;
  border-top: 1px solid var(--ds-color-border);
  background: transparent;
  text-align: center;
}
.wishlist-empty-state > i { color: var(--ds-color-text-muted); font-size: 1.6rem; }
.wishlist-empty-state h2 { margin: 0; color: var(--ds-color-text); }
.wishlist-empty-state p { color: var(--ds-color-text-muted); }
.wishlist-browse-link {
  display: inline-flex;
  min-height: var(--ds-touch-target);
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: .65rem 1rem;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-primary);
  color: var(--ds-color-primary-contrast);
  font-weight: var(--ds-font-weight-semibold);
  text-decoration: none;
}
.wishlist-browse-link:focus-visible,
.wishlist-category-filter:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }
.wishlist-category-filter {
  display: flex;
  width: 100%;
  min-height: var(--ds-touch-target);
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: .5rem .25rem;
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  background: transparent;
  color: var(--ds-color-text);
  font: inherit;
  text-align: start;
  cursor: pointer;
}
.wishlist-category-filter:hover { color: var(--ds-color-primary-text); background: var(--ds-color-surface-hover); }
.wishlist-category-count { color: var(--ds-color-text-muted); font-variant-numeric: tabular-nums; }
.wishlist-product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,168px),210px));justify-content:start;gap:10px}
@media(max-width:520px){.wishlist-product-grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),210px));gap:8px}}
</style>