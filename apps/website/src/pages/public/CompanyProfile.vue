<template>
  <div class="company-profile-page">
    <div class="ds-container ds-page">
      <div class="mb-6">
        <Breadcrumb :home="home" :model="items" class="mt-2" />
      </div>

      <!-- Company Header -->
      <div class="bg-gradient-to-r from-primary to-primary-600 rounded-lg p-6 mb-8 text-white">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div class="md:col-span-1">
            <img
              :src="company.logo || '/placeholder-company.jpg'"
              alt="Company Logo"
              class="w-24 h-24 rounded-full border-4 border-white object-cover"
            />
          </div>
          <div class="md:col-span-2">
            <h1 class="text-3xl font-bold mb-2">{{ company.name }}</h1>
            <p class="text-lg mb-4">{{ company.tagline }}</p>
            <div class="flex gap-4 mb-4">
              <div class="flex items-center gap-2">
                <i class="pi pi-star"></i>
                <span>{{ company.averageRating || 0 }} ({{ company.reviewCount || 0 }} نظر)</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-shopping-bag"></i>
                <span>{{ company.productCount || 0 }} محصول</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-users"></i>
                <span>{{ company.followerCount || 0 }} دنبال کننده</span>
              </div>
            </div>
            <Button
              v-if="!isFollowing"
              label="دنبال کردن"
              icon="pi pi-plus"
              class="p-button-outlined p-button-light"
              @click="followCompany"
            />
            <Button
              v-else
              label="دنبال شده"
              icon="pi pi-check"
              class="p-button-success"
              @click="unfollowCompany"
            />
          </div>
        </div>
      </div>

      <!-- Company Navigation -->
      <div class="mb-8">
        <TabMenu :model="tabs" v-model:activeIndex="activeTab" />
      </div>

      <!-- Company Content -->
      <div>
        <!-- About Tab -->
        <div v-if="activeTab === 0">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
              <Card>
                <template #title>درباره شرکت</template>
                <template #content>
                  <div class="prose max-w-none" v-html="company.description"></div>

                  <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 class="font-semibold mb-2">اطلاعات تماس</h3>
                      <div class="space-y-2">
                        <div class="flex items-center gap-2">
                          <i class="pi pi-phone"></i>
                          <span>{{ company.phone || 'ثبت نشده' }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <i class="pi pi-envelope"></i>
                          <span>{{ company.email || 'ثبت نشده' }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <i class="pi pi-map-marker"></i>
                          <span>{{ company.address || 'ثبت نشده' }}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 class="font-semibold mb-2">شبکه های اجتماعی</h3>
                      <div class="flex gap-3">
                        <Button
                          v-if="company.socialLinks?.website"
                          icon="pi pi-globe"
                          class="p-button-rounded p-button-text"
                          @click="openLink(company.socialLinks.website)"
                        />
                        <Button
                          v-if="company.socialLinks?.instagram"
                          icon="pi pi-instagram"
                          class="p-button-rounded p-button-text"
                          @click="openLink(company.socialLinks.instagram)"
                        />
                        <Button
                          v-if="company.socialLinks?.telegram"
                          icon="pi pi-send"
                          class="p-button-rounded p-button-text"
                          @click="openLink(company.socialLinks.telegram)"
                        />
                        <Button
                          v-if="company.socialLinks?.linkedin"
                          icon="pi pi-linkedin"
                          class="p-button-rounded p-button-text"
                          @click="openLink(company.socialLinks.linkedin)"
                        />
                      </div>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <div class="lg:col-span-1">
              <Card>
                <template #title>اطلاعات شرکت</template>
                <template #content>
                  <div class="space-y-4">
                    <div class="flex justify-between">
                      <span class="text-gray-500">شناسه ملی:</span>
                      <span>{{ company.nationalId || 'ثبت نشده' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">شماره ثبت:</span>
                      <span>{{ company.registrationNumber || 'ثبت نشده' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">تاریخ تاسیس:</span>
                      <span>{{ formatDate(company.establishedDate) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">دسته بندی:</span>
                      <span>{{ company.category?.name || 'ثبت نشده' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-500">وضعیت:</span>
                      <span
                        class="px-2 py-1 rounded-full text-xs"
                        :class="company.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                      >
                        {{ company.isVerified ? 'تایید شده' : 'در انتظار تایید' }}
                      </span>
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </div>

        <!-- Products Tab -->
        <div v-if="activeTab === 1">
          <div class="mb-4">
            <h2 class="text-xl font-bold">محصولات شرکت</h2>
          </div>

          <div v-if="loadingProducts" class="text-center py-8">
            <ProgressSpinner />
          </div>

          <div v-else-if="products.length === 0" class="text-center py-8">
            <p class="text-gray-500">هیچ محصولی یافت نشد</p>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProductCard
              v-for="product in products"
              :key="product.id"
              :product="product"
              @add-to-cart="addToCart"
              @add-to-wishlist="addToWishlist"
            />
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

        <!-- Reviews Tab -->
        <div v-if="activeTab === 2">
          <div class="mb-4">
            <h2 class="text-xl font-bold">نظرات کاربران</h2>
          </div>

          <div v-if="loadingReviews" class="text-center py-8">
            <ProgressSpinner />
          </div>

          <div v-else-if="reviews.length === 0" class="text-center py-8">
            <p class="text-gray-500">هیچ نظری یافت نشد</p>
          </div>

          <div v-else class="space-y-4">
            <ReviewCard
              v-for="review in reviews"
              :key="review.id"
              :review="review"
            />
          </div>

          <div class="mt-8">
            <Paginator
              :rows="perPage"
              :totalRecords="totalReviews"
              :rowsPerPageOptions="[10, 20, 50]"
              @page="onReviewPageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCompanyStore } from '../../stores/companies'
import { useProductsStore } from '../../stores/products'
import { useCartStore } from '../../stores/cart'
import { useWishlistStore } from '../../stores/wishlist'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import TabMenu from 'primevue/tabmenu'
import ProgressSpinner from 'primevue/progressspinner'
import Paginator from 'primevue/paginator'
import ProductCard from '@telecom/shared-ui/components/products/ProductCard.vue'
import ReviewCard from '@telecom/shared-ui/components/reviews/ReviewCard.vue'

const route = useRoute()
const router = useRouter()
const companyStore = useCompanyStore()
const productsStore = useProductsStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()

const company = ref({})
const products = ref([])
const reviews = ref([])
const loadingProducts = ref(false)
const loadingReviews = ref(false)
const isFollowing = ref(false)
const activeTab = ref(0)
const perPage = ref(12)
const currentPage = ref(1)
const totalProducts = ref(0)
const totalReviews = ref(0)

const home = ref({
  icon: 'pi pi-home',
  to: '/'
})

const items = ref([
  { label: 'شرکت ها', to: '/companies' },
  { label: company.value.name, to: route.path }
])

const tabs = ref([
  { label: 'درباره', icon: 'pi pi-info-circle' },
  { label: 'محصولات', icon: 'pi pi-shopping-bag' },
  { label: 'نظرات', icon: 'pi pi-comments' }
])

onMounted(async () => {
  await loadCompany()
  await loadProducts()
  await loadReviews()
  await checkFollowingStatus()
})

const loadCompany = async () => {
  try {
    const companyId = route.params.id
    const data = await companyStore.getCompanyById(companyId)
    company.value = data
    items.value[1].label = company.value.name
  } catch (error) {
    console.error('Error loading company:', error)
  }
}

const loadProducts = async () => {
  loadingProducts.value = true
  try {
    const companyId = route.params.id
    const params = {
      page: currentPage.value,
      limit: perPage.value,
      companyId: companyId
    }
    const data = await productsStore.getProductsByCompany(params)
    products.value = data.products
    totalProducts.value = data.total
  } catch (error) {
    console.error('Error loading company products:', error)
  } finally {
    loadingProducts.value = false
  }
}

const loadReviews = async () => {
  loadingReviews.value = true
  try {
    const companyId = route.params.id
    const params = {
      page: currentPage.value,
      limit: perPage.value,
      companyId: companyId
    }
    const data = await companyStore.getCompanyReviews(params)
    reviews.value = data.reviews
    totalReviews.value = data.total
  } catch (error) {
    console.error('Error loading company reviews:', error)
  } finally {
    loadingReviews.value = false
  }
}

const checkFollowingStatus = async () => {
  try {
    const companyId = route.params.id
    isFollowing.value = await companyStore.isFollowing(companyId)
  } catch (error) {
    console.error('Error checking following status:', error)
  }
}

const followCompany = async () => {
  try {
    const companyId = route.params.id
    await companyStore.followCompany(companyId)
    isFollowing.value = true
    company.value.followerCount = (company.value.followerCount || 0) + 1
  } catch (error) {
    console.error('Error following company:', error)
  }
}

const unfollowCompany = async () => {
  try {
    const companyId = route.params.id
    await companyStore.unfollowCompany(companyId)
    isFollowing.value = false
    company.value.followerCount = (company.value.followerCount || 0) - 1
  } catch (error) {
    console.error('Error unfollowing company:', error)
  }
}

const formatDate = (date) => {
  if (!date) return 'نامشخص'
  return new Date(date).toLocaleDateString('fa-IR')
}

const openLink = (url) => {
  window.open(url, '_blank')
}

const onPageChange = (event) => {
  currentPage.value = event.page + 1
  perPage.value = event.rows
  loadProducts()
}

const onReviewPageChange = (event) => {
  currentPage.value = event.page + 1
  perPage.value = event.rows
  loadReviews()
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
</script>

<style scoped>
.company-profile-page {
  direction: rtl;
}

:deep(.p-tabmenu .p-tabmenu-nav) {
  direction: rtl;
}

:deep(.p-tabmenu .p-tabmenuitem) {
  direction: rtl;
}

.prose :deep(img) {
  max-width: 100%;
  height: auto;
}
</style>