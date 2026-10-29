<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import { useCartStore } from '../../stores/cart'
import { useWishlistStore } from '../../stores/wishlist'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'
import ProgressSpinner from 'primevue/progressspinner'
import ProductCard from '@telecom/shared-ui/components/products/ProductCard.vue'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()

const company = ref(null)
const products = ref([])
const loading = ref(false)
const errorMessage = ref('')
const currentPage = ref(1)
const perPage = ref(12)
const totalProducts = ref(0)

const home = { icon: 'pi pi-home', to: '/' }

watch(
  () => route.params.id,
  () => {
    currentPage.value = 1
    loadCompanyProducts()
  },
  { immediate: true },
)

async function loadCompanyProducts() {
  const companyId = Number(route.params.id)
  if (!Number.isInteger(companyId) || companyId < 1) {
    company.value = null
    products.value = []
    totalProducts.value = 0
    errorMessage.value = 'شناسه شرکت معتبر نیست.'
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''
  company.value = null
  try {
    // Public company reads, reviews, and follows are not exposed by the current
    // backend contract. Use the public catalog endpoint, which explicitly
    // supports companyId and returns only PUBLISHED + PUBLIC products.
    const result = await productsStore.getProducts({
      page: currentPage.value,
      limit: perPage.value,
      companyId,
    })
    const catalogProducts = Array.isArray(result?.data) ? result.data : []
    products.value = catalogProducts.map(normalizeProduct)
    totalProducts.value = result?.meta?.total ?? products.value.length
    company.value = products.value.find(product => product.company)?.company ?? null
  } catch (error) {
    console.error('Error loading public company products:', error)
    products.value = []
    totalProducts.value = 0
    errorMessage.value = 'دریافت محصولات عمومی این شرکت ممکن نشد. لطفاً دوباره تلاش کنید.'
  } finally {
    loading.value = false
  }
}

function normalizeProduct(product) {
  const images = Array.isArray(product?.images) ? product.images : []
  const primaryImage = images.find(image => image?.isPrimary && image?.url)
    || images.find(image => image?.url)
  const price = Number(product?.prices?.[0]?.price ?? product?.price ?? 0)
  return {
    ...product,
    name: product?.title || product?.name || '',
    image: primaryImage?.url || product?.image || '',
    price,
    finalPrice: price,
    specs: product?.specifications?.standard || product?.specifications || {},
  }
}

function onPageChange(event) {
  currentPage.value = event.page + 1
  perPage.value = event.rows
  loadCompanyProducts()
}

function addToCart(product) {
  cartStore.addToCart({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    quantity: 1,
  })
}

function addToWishlist(product) {
  wishlistStore.addToWishlist(product)
}

function viewProduct(product) {
  router.push({ name: 'product-details', params: { id: product.id } })
}

function goToProducts() {
  router.push({ name: 'products' })
}
</script>

<template>
  <main class="company-profile-page ds-page" dir="rtl" aria-labelledby="company-profile-title" :aria-busy="loading">
    <div class="company-profile-shell ds-container ds-stack">
      <Breadcrumb :home="home" :model="[{ label: company?.name || 'صفحه شرکت' }]" aria-label="مسیر صفحه" />

      <section v-if="loading" class="company-state ds-card" role="status" aria-live="polite" aria-busy="true">
        <ProgressSpinner />
        <h1>در حال دریافت محصولات شرکت</h1>
        <p>چند لحظه صبر کنید...</p>
      </section>

      <section v-else-if="errorMessage" class="company-state company-state--error ds-card" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <h1>دریافت اطلاعات شرکت ناموفق بود</h1>
        <p>{{ errorMessage }}</p>
        <Button label="تلاش دوباره" icon="pi pi-refresh" @click="loadCompanyProducts" />
      </section>

      <template v-else>
        <header class="company-hero ds-card">
          <span class="company-hero__icon" aria-hidden="true"><i class="pi pi-building"></i></span>
          <div class="company-hero__copy">
            <span class="ds-eyebrow">تأمین‌کننده در بازارگاه مخابرات</span>
            <h1 id="company-profile-title" class="ds-h1">{{ company?.name || 'محصولات این شرکت' }}</h1>
            <p v-if="company?.type" class="company-type">{{ company.type }}</p>
            <p class="ds-lead">
              در این صفحه فقط محصولاتی نمایش داده می‌شوند که در کاتالوگ عمومی منتشر شده‌اند.
            </p>
          </div>
          <div class="company-hero__meta">
            <span class="ds-badge ds-badge--info">{{ totalProducts.toLocaleString('fa-IR') }} محصول عمومی</span>
            <Button label="همه محصولات" icon="pi pi-arrow-left" severity="secondary" outlined @click="goToProducts" />
          </div>
        </header>

        <section class="company-products-section" aria-labelledby="company-products-title">
          <header class="ds-section-head">
            <div>
              <span class="ds-eyebrow">کاتالوگ عمومی</span>
              <h2 id="company-products-title" class="ds-h2">محصولات منتشرشده</h2>
            </div>
          </header>

          <div v-if="products.length === 0" class="company-state ds-card" role="status">
            <i class="pi pi-box" aria-hidden="true"></i>
            <h3>محصول عمومی برای نمایش وجود ندارد</h3>
            <p>اطلاعات عمومی شرکت از طریق محصولات منتشرشده در دسترس قرار می‌گیرد.</p>
            <Button label="مشاهده همه محصولات" icon="pi pi-arrow-left" @click="goToProducts" />
          </div>

          <div v-else class="company-product-grid">
            <ProductCard
              v-for="product in products"
              :key="product.id"
              :product="product"
              @add-to-cart="addToCart"
              @toggle-wishlist="addToWishlist"
              @view-product="viewProduct"
            />
          </div>

          <div v-if="totalProducts > 0" class="company-paginator" aria-label="صفحه‌بندی محصولات شرکت">
            <Paginator
              :first="(currentPage - 1) * perPage"
              :rows="perPage"
              :totalRecords="totalProducts"
              :rowsPerPageOptions="[12, 24, 48, 96]"
              @page="onPageChange"
            />
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.company-profile-page { direction: rtl; }
.company-profile-shell { padding-block: var(--ds-space-8) var(--ds-space-16); }
.company-hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--ds-space-6);
  padding: clamp(1.25rem, 4vw, 2.5rem);
  background: linear-gradient(120deg, var(--ds-color-surface), var(--ds-color-surface-hover));
}
.company-hero__icon {
  display: flex;
  width: 5rem;
  height: 5rem;
  align-items: center;
  justify-content: center;
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-brand-dark);
  color: var(--ds-color-on-brand);
  font-size: 2rem;
}
.company-hero__copy { min-width: 0; }
.company-type { margin: var(--ds-space-2) 0 0; color: var(--ds-color-primary-text); font-weight: var(--ds-font-weight-bold); }
.company-hero__meta { display: flex; flex-direction: column; align-items: flex-start; gap: var(--ds-space-3); }
.company-products-section { display: flex; flex-direction: column; gap: var(--ds-space-4); }
.company-product-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--ds-space-5); }
.company-state {
  display: flex;
  min-height: 16rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-8);
  text-align: center;
}
.company-state > i { font-size: 2.25rem; color: var(--ds-color-primary-text); }
.company-state h1, .company-state h3 { margin: 0; color: var(--ds-color-text); font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); }
.company-state p { max-width: 60ch; margin: 0; color: var(--ds-color-text-muted); line-height: var(--ds-line-height-relaxed); }
.company-state--error { border-color: var(--ds-status-danger-fg); }
.company-paginator { margin-top: var(--ds-space-4); }
@media (max-width: 1000px) {
  .company-hero { grid-template-columns: auto minmax(0, 1fr); }
  .company-hero__meta { grid-column: 1 / -1; flex-direction: row; align-items: center; flex-wrap: wrap; }
  .company-product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .company-hero { grid-template-columns: minmax(0, 1fr); }
  .company-hero__icon { width: 4rem; height: 4rem; }
  .company-hero__meta { grid-column: auto; align-items: stretch; }
  .company-product-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
