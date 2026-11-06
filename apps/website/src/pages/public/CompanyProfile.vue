<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import { useCompanyStore } from '../../stores/companies'
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
const companyStore = useCompanyStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()

const company = ref(null)
const products = ref([])
const loading = ref(false)
const profileError = ref('')
const productsError = ref('')
const currentPage = ref(1)
const perPage = ref(12)
const totalProducts = ref(0)
const home = { icon: 'pi pi-home', to: '/' }

watch(() => route.params.id, () => {
  currentPage.value = 1
  loadCompanyPage()
}, { immediate: true })

async function loadCompanyPage() {
  const companyId = Number(route.params.id)
  if (!Number.isInteger(companyId) || companyId < 1) {
    company.value = null
    products.value = []
    totalProducts.value = 0
    profileError.value = 'شناسه شرکت معتبر نیست.'
    loading.value = false
    return
  }

  loading.value = true
  profileError.value = ''
  productsError.value = ''

  const [profileResult, productsResult] = await Promise.allSettled([
    companyStore.getPublicCompany(companyId),
    productsStore.getProducts({ page: currentPage.value, limit: perPage.value, companyId }),
  ])

  if (profileResult.status === 'fulfilled') {
    company.value = profileResult.value
  } else {
    company.value = null
    profileError.value = 'دریافت معرفی عمومی شرکت ممکن نشد. لطفاً دوباره تلاش کنید.'
    console.error('Error loading public company profile:', profileResult.reason)
  }

  if (productsResult.status === 'fulfilled') {
    const result = productsResult.value
    products.value = (Array.isArray(result?.data) ? result.data : []).map(normalizeProduct)
    totalProducts.value = result?.meta?.total ?? products.value.length
  } else {
    products.value = []
    totalProducts.value = 0
    productsError.value = 'دریافت محصولات این شرکت ممکن نشد.'
    console.error('Error loading public company products:', productsResult.reason)
  }

  loading.value = false
}

function normalizeProduct(product) {
  const images = Array.isArray(product?.images) ? product.images : []
  const primaryImage = images.find(image => image?.isPrimary && image?.url) || images.find(image => image?.url)
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
  loadCompanyPage()
}
function addToCart(product) {
  cartStore.addToCart({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 })
}
function addToWishlist(product) { wishlistStore.addToWishlist(product) }
function viewProduct(product) { router.push({ name: 'product-details', params: { id: product.id } }) }
function goToProducts() { router.push({ name: 'products' }) }
function companyTypeLabel(type) {
  return ({ MANUFACTURER: 'تولیدکننده', IMPORTER: 'واردکننده', TELECOM_OPERATOR: 'اپراتور مخابراتی', SUPPLIER: 'تأمین‌کننده' })[type] || type || 'عضو بازارگاه'
}
</script>

<template>
  <main class="company-profile-page ds-page" dir="rtl" aria-labelledby="company-profile-title" :aria-busy="loading">
    <div class="company-profile-shell ds-container">
      <Breadcrumb :home="home" :model="[{ label: company?.name || 'صفحه شرکت' }]" aria-label="مسیر صفحه" />

      <section v-if="loading && !company" class="company-state ds-card" role="status" aria-live="polite">
        <ProgressSpinner aria-label="در حال دریافت اطلاعات شرکت" />
        <h1 id="company-profile-title">در حال دریافت صفحه شرکت</h1>
        <p>چند لحظه صبر کنید…</p>
      </section>

      <section v-else-if="profileError && !company" class="company-state company-state--error ds-card" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <h1 id="company-profile-title">دریافت صفحه شرکت ناموفق بود</h1>
        <p>{{ profileError }}</p>
        <Button label="تلاش دوباره" icon="pi pi-refresh" @click="loadCompanyPage" />
      </section>

      <template v-else-if="company">
        <header class="company-hero">
          <div class="company-hero__topline">
            <div class="company-identity">
              <div class="company-logo">
                <img v-if="company.logo" :src="company.logo" :alt="'لوگوی ' + company.name" />
                <i v-else class="pi pi-building" aria-hidden="true"></i>
              </div>
              <div class="company-title-wrap">
                <div class="company-title-row">
                  <h1 id="company-profile-title">{{ company.name }}</h1>
                  <span v-if="company.isVerified" class="verified-pill"><i class="pi pi-verified"></i> تأییدشده</span>
                </div>
                <p class="company-kind">{{ companyTypeLabel(company.type) }}</p>
                <p v-if="company.nameEn" class="company-name-en" dir="ltr">{{ company.nameEn }}</p>
              </div>
            </div>
            <div class="company-hero__actions">
              <span class="product-count"><strong>{{ Number(company._count?.products ?? totalProducts).toLocaleString('fa-IR') }}</strong> محصول منتشرشده</span>
              <Button label="مشاهده همه محصولات" icon="pi pi-arrow-left" severity="secondary" outlined @click="goToProducts" />
            </div>
          </div>

          <section class="company-introduction" aria-labelledby="company-intro-title">
            <div class="intro-heading"><i class="pi pi-building" aria-hidden="true"></i><h2 id="company-intro-title">معرفی شرکت</h2></div>
            <p v-if="company.description">{{ company.description }}</p>
            <p v-else class="intro-empty">این شرکت هنوز توضیحی برای معرفی مجموعه خود ثبت نکرده است.</p>
          </section>

          <div class="company-contact-grid" aria-label="اطلاعات شرکت">
            <div v-if="company.address" class="contact-item"><i class="pi pi-map-marker"></i><span><small>نشانی</small>{{ company.address }}</span></div>
            <a v-if="company.phone" class="contact-item" :href="'tel:' + company.phone"><i class="pi pi-phone"></i><span><small>تلفن تماس</small>{{ company.phone }}</span></a>
            <a v-if="company.email" class="contact-item" :href="'mailto:' + company.email"><i class="pi pi-envelope"></i><span><small>پست الکترونیکی</small>{{ company.email }}</span></a>
            <a v-if="company.website" class="contact-item" :href="company.website" target="_blank" rel="noopener noreferrer"><i class="pi pi-globe"></i><span><small>وب‌سایت</small>{{ company.website }}</span></a>
            <div v-if="company.createdAt" class="contact-item"><i class="pi pi-calendar"></i><span><small>عضویت در بازارگاه</small>{{ new Date(company.createdAt).toLocaleDateString('fa-IR') }}</span></div>
          </div>
        </header>

        <section class="company-products-section" aria-labelledby="company-products-title">
          <header class="products-heading">
            <div>
              <span class="section-kicker">فروشگاه شرکت</span>
              <h2 id="company-products-title">محصولات شرکت</h2>
              <p>محصولات منتشرشده و قابل مشاهده در بازارگاه</p>
            </div>
            <span class="products-total">{{ totalProducts.toLocaleString('fa-IR') }} کالا</span>
          </header>

          <div v-if="productsError" class="company-inline-error" role="alert">
            <span>{{ productsError }}</span><Button label="تلاش دوباره" size="small" text @click="loadCompanyPage" />
          </div>
          <div v-else-if="!loading && products.length === 0" class="company-state company-empty-products" role="status">
            <i class="pi pi-box" aria-hidden="true"></i>
            <h3>هنوز محصولی برای نمایش ثبت نشده است</h3>
            <p>برای آشنایی با سایر کالاهای بازارگاه، به فروشگاه عمومی مراجعه کنید.</p>
            <Button label="رفتن به فروشگاه" icon="pi pi-arrow-left" @click="goToProducts" />
          </div>
          <div v-else class="company-product-grid">
            <ProductCard v-for="product in products" :key="product.id" :product="product"
              @add-to-cart="addToCart" @toggle-wishlist="addToWishlist" @view-product="viewProduct" />
          </div>

          <div v-if="totalProducts > 0" class="company-paginator" aria-label="صفحه‌بندی محصولات شرکت">
            <Paginator :first="(currentPage - 1) * perPage" :rows="perPage" :totalRecords="totalProducts"
              :rowsPerPageOptions="[12, 24, 48, 96]" @page="onPageChange" />
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.company-profile-page { direction: rtl; }
.company-profile-shell { display: flex; flex-direction: column; gap: 1.25rem; padding-block: 1.25rem 3rem; }
.company-hero { overflow: hidden; border: 1px solid var(--ds-color-border); border-radius: 14px; background: var(--ds-color-surface); }
.company-hero__topline { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1.35rem 1.5rem; background: color-mix(in srgb, var(--ds-color-primary) 5%, var(--ds-color-surface)); }
.company-identity { display: flex; align-items: center; gap: 1rem; min-width: 0; }
.company-logo { display: grid; place-items: center; flex: 0 0 76px; width: 76px; height: 76px; overflow: hidden; border: 1px solid var(--ds-color-border); border-radius: 12px; background: var(--ds-color-surface); color: var(--ds-color-primary-text); font-size: 1.8rem; }
.company-logo img { width: 100%; height: 100%; object-fit: contain; padding: .4rem; }
.company-title-wrap { min-width: 0; }
.company-title-row { display: flex; align-items: center; flex-wrap: wrap; gap: .65rem; }
.company-title-row h1 { margin: 0; color: var(--ds-color-text); font-size: clamp(1.2rem, 2vw, 1.65rem); font-weight: 800; line-height: 1.5; }
.verified-pill { display: inline-flex; align-items: center; gap: .3rem; padding: .25rem .55rem; border-radius: 999px; background: color-mix(in srgb, var(--ds-color-primary) 10%, transparent); color: var(--ds-color-primary-text); font-size: .7rem; font-weight: 700; }
.company-kind { margin: .25rem 0 0; color: var(--ds-color-primary-text); font-size: .82rem; font-weight: 700; }
.company-name-en { margin: .15rem 0 0; color: var(--ds-color-text-muted); font-size: .76rem; }
.company-hero__actions { display: flex; flex-direction: column; align-items: flex-end; gap: .7rem; flex-shrink: 0; }
.product-count { color: var(--ds-color-text-muted); font-size: .8rem; }
.product-count strong { color: var(--ds-color-text); font-size: 1.1rem; }
.company-hero__actions :deep(.p-button) { font-size: .78rem; }
.company-introduction { margin: 0 1.5rem; padding: 1rem 0 1.1rem; border-bottom: 1px solid var(--ds-color-border); }
.intro-heading { display: flex; align-items: center; gap: .5rem; margin-bottom: .45rem; color: var(--ds-color-primary-text); }
.intro-heading h2 { margin: 0; color: var(--ds-color-text); font-size: .92rem; font-weight: 800; }
.company-introduction > p { max-width: 100ch; margin: 0; color: var(--ds-color-text); font-size: .84rem; line-height: 2.1; white-space: pre-line; }
.company-introduction > .intro-empty { color: var(--ds-color-text-muted); }
.company-contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); gap: .75rem; padding: 1rem 1.5rem 1.2rem; }
.contact-item { display: flex; align-items: flex-start; gap: .6rem; min-width: 0; color: var(--ds-color-text); text-decoration: none; font-size: .78rem; line-height: 1.8; overflow-wrap: anywhere; }
.contact-item > i { margin-top: .2rem; color: var(--ds-color-primary-text); }
.contact-item small { display: block; color: var(--ds-color-text-muted); font-size: .68rem; }
.company-products-section { display: flex; flex-direction: column; gap: .9rem; }
.products-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; padding: .1rem .1rem .75rem; border-bottom: 1px solid var(--ds-color-border); }
.section-kicker { color: var(--ds-color-primary-text); font-size: .7rem; font-weight: 700; }
.products-heading h2 { margin: .15rem 0; color: var(--ds-color-text); font-size: 1.12rem; font-weight: 800; }
.products-heading p { margin: 0; color: var(--ds-color-text-muted); font-size: .76rem; }
.products-total { padding: .35rem .65rem; border-radius: 7px; background: var(--ds-color-surface-alt); color: var(--ds-color-text-muted); font-size: .75rem; white-space: nowrap; }
.company-product-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); align-items: stretch; justify-items: center; gap: 12px; }
.company-product-grid > * { width: 100%; max-width: 210px; min-width: 0; }
.company-paginator { margin-top: .4rem; }
.company-state { display: flex; min-height: 15rem; flex-direction: column; align-items: center; justify-content: center; gap: .7rem; padding: 2rem; text-align: center; }
.company-state > i { color: var(--ds-color-primary-text); font-size: 2rem; }
.company-state h1, .company-state h3 { margin: 0; color: var(--ds-color-text); font-size: 1rem; font-weight: 800; }
.company-state p { max-width: 55ch; margin: 0; color: var(--ds-color-text-muted); font-size: .82rem; line-height: 1.9; }
.company-inline-error { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .8rem 1rem; border: 1px solid var(--ds-status-danger-fg); border-radius: 8px; color: var(--ds-color-text); font-size: .82rem; }
.company-state--error { border: 1px solid var(--ds-status-danger-fg); }
@media (max-width: 1100px) { .company-product-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (max-width: 850px) { .company-product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } .company-hero__topline { align-items: flex-start; } }
@media (max-width: 620px) {
  .company-profile-shell { gap: 1rem; padding-block: .8rem 2rem; }
  .company-hero__topline { flex-direction: column; gap: .85rem; padding: 1rem; }
  .company-logo { flex-basis: 58px; width: 58px; height: 58px; }
  .company-hero__actions { width: 100%; flex-direction: row; align-items: center; justify-content: space-between; flex-wrap: wrap; }
  .company-introduction { margin-inline: 1rem; }
  .company-contact-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: .9rem 1rem 1rem; }
  .company-product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .products-heading h2 { font-size: 1rem; }
}
@media (max-width: 360px) { .company-contact-grid { grid-template-columns: 1fr; } .company-product-grid { grid-template-columns: 1fr; } }
</style>
