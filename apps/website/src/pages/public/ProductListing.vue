<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import PageHeader from '@telecom/shared-ui/components/common/PageHeader.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import Paginator from 'primevue/paginator'

const route = useRoute()
const productsStore = useProductsStore()
const products = ref([])
const featuredProducts = ref([])
const categories = ref([])
const loading = ref(false)
const featuredLoading = ref(false)
const error = ref(null)
const totalPages = ref(1)
const totalItems = ref(0)
const searchQuery = ref('')
const selectedCategory = ref(null)
const minPrice = ref(null)
const maxPrice = ref(null)
const sortBy = ref('createdAt')
const sortOrder = ref('desc')
const activeSlide = ref(0)
let slideTimer = null

const filters = ref({ search: '', category: null, minPrice: null, maxPrice: null, page: 1, limit: 24, sortBy: 'createdAt', sortOrder: 'desc' })
const sortOptions = [
  { label: 'جدیدترین', value: 'createdAt:desc' },
  { label: 'قدیمی‌ترین', value: 'createdAt:asc' },
  { label: 'نام محصول (الف تا ی)', value: 'title:asc' },
  { label: 'نام محصول (ی تا الف)', value: 'title:desc' },
]
const selectedSort = ref('createdAt:desc')
const categoryOptions = computed(() => categories.value.map(category => ({
  ...category,
  label: category.nameFa || category.nameEn || category.name || category.slug,
  count: Number(category.productCount ?? category.productsCount ?? category._count?.products) || null,
})))
const activeFeatured = computed(() => featuredProducts.value[activeSlide.value] || featuredProducts.value[0] || null)
const latestProducts = computed(() => products.value.slice(0, 8))
const remainingProducts = computed(() => products.value)

function imageOf(product) {
  return product?.images?.find(image => image?.isPrimary && image?.url)
    || product?.images?.find(image => image?.url) || null
}
function productName(product) { return product?.title || product?.name || 'محصول بدون عنوان' }
function categoryName(product) { return product?.category?.nameFa || product?.category?.name || product?.category?.nameEn || '' }
function formatPrice(price) {
  if (price === null || price === undefined || price === '') return ''
  return new Intl.NumberFormat('fa-IR').format(Number(price)) + ' ریال'
}
function productPrice(product) {
  const price = product?.prices?.[0]?.price
  return price === undefined || price === null ? 'استعلام قیمت' : formatPrice(price)
}
function productRoute(product) { return { name: 'product-details', params: { id: product.id } } }
function slideTo(index) {
  if (!featuredProducts.value.length) return
  activeSlide.value = (index + featuredProducts.value.length) % featuredProducts.value.length
}
function nextSlide() { slideTo(activeSlide.value + 1) }
function previousSlide() { slideTo(activeSlide.value - 1) }
function stopSlider() { if (slideTimer) clearInterval(slideTimer); slideTimer = null }
function startSlider() {
  stopSlider()
  if (featuredProducts.value.length > 1 && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    slideTimer = setInterval(nextSlide, 6000)
  }
}
async function loadCategories() {
  try {
    const result = await productsStore.getCategories()
    categories.value = Array.isArray(result) ? result : []
  } catch { categories.value = [] }
}
async function loadFeatured() {
  try {
    featuredLoading.value = true
    const result = await productsStore.getProducts({ page: 1, limit: 8, status: 'PUBLISHED', featured: true, sortBy: 'createdAt', sortOrder: 'desc' }) || {}
    const list = Array.isArray(result.data) ? result.data : (result.data?.products ?? result.data?.items ?? result.products ?? result.items ?? [])
    featuredProducts.value = Array.isArray(list) ? list : []
    activeSlide.value = 0
    startSlider()
  } catch { featuredProducts.value = [] } finally { featuredLoading.value = false }
}
async function loadProducts() {
  try {
    loading.value = true
    error.value = null
    const params = { page: filters.value.page, limit: filters.value.limit, status: 'PUBLISHED', sortBy: filters.value.sortBy, sortOrder: filters.value.sortOrder }
    if (filters.value.search) params.search = filters.value.search
    if (filters.value.category) params.categoryId = Number(filters.value.category)
    if (filters.value.minPrice !== null && filters.value.minPrice !== '') params.minPrice = Number(filters.value.minPrice)
    if (filters.value.maxPrice !== null && filters.value.maxPrice !== '') params.maxPrice = Number(filters.value.maxPrice)
    const result = await productsStore.getProducts(params) || {}
    const list = Array.isArray(result.data) ? result.data : (result.data?.products ?? result.data?.items ?? result.products ?? result.items ?? [])
    products.value = Array.isArray(list) ? list : []
    totalPages.value = result.meta?.totalPages ?? result.totalPages ?? 1
    totalItems.value = result.meta?.total ?? result.total ?? products.value.length
  } catch {
    error.value = 'خطا در دریافت محصولات. دوباره تلاش کنید.'
    products.value = []
    totalItems.value = 0
  } finally { loading.value = false }
}
function applyFilters() {
  const [nextSortBy, nextSortOrder] = selectedSort.value.split(':')
  filters.value = {
    search: searchQuery.value.trim(), category: selectedCategory.value,
    minPrice: minPrice.value, maxPrice: maxPrice.value,
    page: 1, limit: filters.value.limit, sortBy: nextSortBy, sortOrder: nextSortOrder,
  }
  loadProducts()
}
function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = null
  minPrice.value = null
  maxPrice.value = null
  selectedSort.value = 'createdAt:desc'
  filters.value = { search: '', category: null, minPrice: null, maxPrice: null, page: 1, limit: 24, sortBy: 'createdAt', sortOrder: 'desc' }
  loadProducts()
}
function onPageChange(event) {
  filters.value.page = event.page + 1
  filters.value.limit = event.rows
  loadProducts()
}
function chooseCategory(id) {
  selectedCategory.value = selectedCategory.value === id ? null : id
  applyFilters()
}
onMounted(async () => {
  const id = Number(route.query.category)
  if (route.query.category && Number.isInteger(id) && id > 0) selectedCategory.value = id
  filters.value.category = selectedCategory.value
  await Promise.all([loadCategories(), loadProducts(), loadFeatured()])
})
watch(() => route.query.category, value => {
  const id = Number(value)
  selectedCategory.value = value && Number.isInteger(id) && id > 0 ? id : null
  filters.value.category = selectedCategory.value
  filters.value.page = 1
  loadProducts()
})
onUnmounted(stopSlider)
</script>

<template>
  <main class="shop-page" dir="rtl">
    <PageHeader :home-route="{ name: 'products' }" />

    <div class="shop-feature-stage">
    <section v-if="activeFeatured" class="shop-hero" aria-label="محصولات منتخب فروشگاه" @mouseenter="stopSlider" @mouseleave="startSlider" @focusin="stopSlider" @focusout="startSlider">
      <div :key="activeFeatured.id || activeSlide" class="shop-hero-copy" aria-live="polite">
        <span class="shop-eyebrow"><i class="pi pi-sparkles"></i> پیشنهادهای منتخب فروشگاه</span>
        <h1>{{ productName(activeFeatured) }}</h1>
        <p>{{ activeFeatured.shortDescription || activeFeatured.description || 'مشخصات فنی و اطلاعات تأمین‌کننده این محصول را مشاهده کنید.' }}</p>
        <div class="shop-hero-meta">
          <span v-if="categoryName(activeFeatured)"><i class="pi pi-tag"></i>{{ categoryName(activeFeatured) }}</span>
          <span v-if="activeFeatured.company?.name"><i class="pi pi-building"></i>{{ activeFeatured.company.name }}</span>
        </div>
        <div class="shop-hero-actions">
          <router-link :to="productRoute(activeFeatured)" class="shop-primary-btn">مشاهده محصول <i class="pi pi-arrow-left"></i></router-link>
          <router-link :to="{ name: 'products' }" class="shop-secondary-btn">همه محصولات</router-link>
        </div>
        <div v-if="featuredProducts.length > 1" class="shop-slider-controls">
          <button type="button" aria-label="اسلاید قبلی" @click="previousSlide"><i class="pi pi-chevron-right"></i></button>
          <div class="shop-slider-dots"><button v-for="(product, index) in featuredProducts" :key="product.id" type="button" :class="{ active: index === activeSlide }" :aria-label="'نمایش پیشنهاد ' + (index + 1)" @click="slideTo(index)"></button></div>
          <button type="button" aria-label="اسلاید بعدی" @click="nextSlide"><i class="pi pi-chevron-left"></i></button>
        </div>
      </div>
      <router-link :key="activeFeatured.id || activeSlide" :to="productRoute(activeFeatured)" class="shop-hero-media" :aria-label="'مشاهده ' + productName(activeFeatured)">
        <img v-if="imageOf(activeFeatured)?.url" :src="imageOf(activeFeatured).url" :alt="productName(activeFeatured)" width="720" height="460" fetchpriority="high" />
        <i v-else class="pi pi-box"></i>
        <span class="shop-hero-label">منتخب بازارگاه</span>
      </router-link>
    </section>

    <section v-else-if="featuredLoading" class="shop-hero shop-hero--loading" aria-busy="true">
      <ProgressSpinner /><span>در حال آماده‌سازی پیشنهادهای فروشگاه…</span>
    </section>

    <aside class="shop-company-banner" aria-label="معرفی خدمات شرکت‌ها">
      <span class="shop-company-banner-icon"><i class="pi pi-building"></i></span>
      <span class="shop-company-banner-kicker">شبکه تأمین بازارگاه</span>
      <h2>خرید مطمئن از شرکت‌های تخصصی</h2>
      <p>مشخصات تأمین‌کنندگان را بررسی کنید و برای نیازهای پروژه‌ای خود استعلام بگیرید.</p>
      <router-link :to="{ name: 'categories' }">کاوش تجهیزات و تأمین‌کنندگان <i class="pi pi-arrow-left"></i></router-link>
      <span class="shop-company-banner-orbit" aria-hidden="true"></span>
    </aside>
    </div>

    <section class="shop-benefits" aria-label="مزایای بازارگاه">
      <div><i class="pi pi-verified"></i><span><b>تأمین‌کنندگان معتبر</b><small>اطلاعات شرکت و وضعیت تأیید</small></span></div>
      <div><i class="pi pi-file-check"></i><span><b>مشخصات تخصصی</b><small>جزئیات و مستندات محصولات</small></span></div>
      <div><i class="pi pi-comments"></i><span><b>استعلام پروژه‌ای</b><small>دریافت پیشنهاد از تأمین‌کنندگان</small></span></div>
    </section>

    <section v-if="categoryOptions.length" class="shop-category-section">
      <div class="shop-section-heading"><div><span>مرور سریع</span><h2>خرید بر اساس دسته‌بندی</h2></div><router-link :to="{ name: 'categories' }">همه دسته‌ها <i class="pi pi-arrow-left"></i></router-link></div>
      <div class="shop-category-strip">
        <button v-for="category in categoryOptions.slice(0, 8)" :key="category.id" type="button" class="shop-category-tile" :class="{ active: selectedCategory === category.id }" @click="chooseCategory(category.id)">
          <i class="pi pi-box"></i><span>{{ category.label }}</span><small v-if="category.count">{{ category.count.toLocaleString('fa-IR') }} محصول</small>
        </button>
      </div>
    </section>

    <section v-if="featuredProducts.length" class="shop-featured-section">
      <div class="shop-section-heading"><div><span>انتخاب بازارگاه</span><h2>محصولات ویژه</h2></div><span class="shop-section-note">منتخب‌های منتشرشده از کاتالوگ تأمین‌کنندگان</span></div>
      <div class="shop-featured-grid">
        <router-link v-for="product in featuredProducts.slice(0, 4)" :key="product.id" :to="productRoute(product)" class="shop-mini-product">
          <span class="shop-mini-image"><img v-if="imageOf(product)?.url" :src="imageOf(product).url" :alt="productName(product)" loading="lazy" /><i v-else class="pi pi-box"></i></span>
          <span class="shop-mini-content"><b>{{ productName(product) }}</b><small>{{ categoryName(product) || 'تجهیزات مخابراتی' }}</small><strong>{{ productPrice(product) }}</strong></span>
          <i class="pi pi-angle-left shop-mini-arrow"></i>
        </router-link>
      </div>
    </section>

    <div class="shop-catalog-layout">
      <aside class="shop-filter-sidebar" aria-label="فیلتر محصولات">
        <div class="shop-filter-head"><div><i class="pi pi-sliders-h"></i><b>فیلتر محصولات</b></div><button type="button" @click="resetFilters">حذف همه</button></div>
        <div class="shop-filter-section">
          <h3>جستجوی محصول</h3>
          <form class="shop-search" @submit.prevent="applyFilters"><InputText v-model="searchQuery" placeholder="نام، برند یا مدل محصول…" /><Button type="submit" icon="pi pi-search" aria-label="جستجو" /></form>
        </div>
        <div class="shop-filter-section">
          <h3>دسته‌بندی‌ها</h3>
          <button type="button" class="shop-filter-option" :class="{ active: !selectedCategory }" @click="chooseCategory(null)"><span class="shop-check"></span> همه محصولات</button>
          <button v-for="category in categoryOptions" :key="category.id" type="button" class="shop-filter-option" :class="{ active: selectedCategory === category.id }" @click="chooseCategory(category.id)"><span class="shop-check"></span><span>{{ category.label }}</span><small v-if="category.count">{{ category.count.toLocaleString('fa-IR') }}</small></button>
        </div>
        <div class="shop-filter-section">
          <h3>محدوده قیمت <small>ریال</small></h3>
          <div class="shop-price-inputs"><InputNumber v-model="minPrice" inputId="shop-min-price" placeholder="از" :useGrouping="true" /><span>تا</span><InputNumber v-model="maxPrice" inputId="shop-max-price" placeholder="تا" :useGrouping="true" /></div>
        </div>
        <div class="shop-filter-section shop-filter-section--last">
          <h3>مرتب‌سازی</h3>
          <Select v-model="selectedSort" :options="sortOptions" optionLabel="label" optionValue="value" class="shop-sort-select" />
        </div>
        <div class="shop-filter-actions"><Button label="اعمال فیلترها" icon="pi pi-filter" @click="applyFilters" /><button type="button" @click="resetFilters">پاک کردن فیلترها</button></div>
      </aside>

      <section class="shop-products-area" aria-label="محصولات فروشگاه" aria-live="polite" :aria-busy="loading">
        <div class="shop-results-toolbar">
          <div><span class="shop-results-kicker">کاتالوگ عمومی</span><h2>جدیدترین محصولات</h2><p><span class="products-count-number">{{ totalItems.toLocaleString('fa-IR') }}</span> محصول منتشرشده در بازارگاه</p></div>
          <div class="shop-results-tools"><span><i class="pi pi-th-large"></i> نمایش شبکه‌ای</span><Select v-model="selectedSort" :options="sortOptions" optionLabel="label" optionValue="value" aria-label="مرتب‌سازی محصولات" @change="applyFilters" /></div>
        </div>

        <div v-if="loading" class="shop-state"><ProgressSpinner /><span>در حال دریافت محصولات…</span></div>
        <div v-else-if="error" class="shop-state shop-state--error" role="alert"><i class="pi pi-exclamation-circle"></i><b>بارگذاری محصولات ناموفق بود</b><span>{{ error }}</span><Button label="تلاش دوباره" @click="loadProducts" /></div>
        <div v-else-if="!products.length" class="shop-state"><i class="pi pi-search"></i><b>هیچ محصولی یافت نشد</b><span>فیلترها را تغییر دهید یا همه محصولات را مشاهده کنید.</span><Button label="حذف فیلترها" severity="secondary" @click="resetFilters" /></div>
        <template v-else>
          <div class="shop-product-grid">
            <article v-for="product in remainingProducts" :key="product.id" class="shop-product-card">
              <router-link :to="productRoute(product)" class="shop-product-image product-card">
                <img v-if="imageOf(product)?.url" :src="imageOf(product).url" :alt="productName(product)" loading="lazy" width="480" height="360" />
                <i v-else class="pi pi-box"></i>
                <span v-if="categoryName(product)" class="shop-product-category">{{ categoryName(product) }}</span>
                <span v-if="product.isFeatured" class="shop-product-featured"><i class="pi pi-star-fill"></i> ویژه</span>
              </router-link>
              <div class="shop-product-info">
                <div class="shop-product-brand">{{ product.brand || product.company?.name || 'تجهیزات شبکه' }}</div>
                <span v-if="product.company?.isVerified" class="product-verified"><i class="pi pi-verified"></i> تأمین‌کننده تأییدشده</span>
                <router-link :to="productRoute(product)" class="shop-product-title">{{ productName(product) }}</router-link>
                <div class="shop-product-specs product-meta"><span v-if="product.brand">{{ product.brand }}</span><span v-if="product.model">{{ product.model }}</span><span v-if="product.sku">شناسه: {{ product.sku }}</span></div>
                <div class="shop-product-bottom product-card-footer"><div class="product-card-price"><small>{{ product.prices?.length ? 'شروع قیمت از' : 'قیمت' }}</small><b>{{ productPrice(product) }}</b></div><router-link :to="productRoute(product)" aria-label="مشاهده جزئیات"><i class="pi pi-arrow-left"></i><span>جزئیات محصول</span></router-link></div>
              </div>
            </article>
          </div>
          <div v-if="totalPages > 1" class="shop-pagination"><Paginator aria-label="صفحه‌بندی محصولات" :rows="filters.limit" :totalRecords="totalItems" :rowsPerPageOptions="[24, 48, 96]" @page="onPageChange" /></div>
        </template>
      </section>
    </div>
  </main>
</template>

<style scoped>
.shop-page{direction:rtl;max-width:1920px;margin-inline:auto;padding:0 clamp(14px,1.8vw,28px) 40px;color:var(--tm-ink)}
.shop-feature-stage{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px;align-items:stretch;margin:18px 0 22px}
.shop-hero{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.82fr);gap:28px;align-items:center;min-height:316px;margin:0;padding:28px 30px;background:linear-gradient(116deg,#0b2548 0%,#103c69 58%,#176a91 100%);border-radius:5px;box-shadow:0 12px 30px rgba(13,43,83,.17);color:#fff;overflow:hidden}
.shop-hero:before{content:"";position:absolute;width:390px;height:390px;inset-inline-end:-145px;top:-210px;border:1px solid rgba(255,255,255,.12);border-radius:50%;box-shadow:0 0 0 34px rgba(255,255,255,.035),0 0 0 72px rgba(255,255,255,.025);pointer-events:none}
.shop-hero-copy,.shop-hero-media{z-index:1}
.shop-hero-copy{animation:shop-hero-enter .42s cubic-bezier(.2,.7,.2,1) both}
.shop-hero-media{animation:shop-hero-enter .5s cubic-bezier(.2,.7,.2,1) both}
@keyframes shop-hero-enter{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
.shop-company-banner{position:relative;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:10px;min-width:0;padding:25px 23px;background:linear-gradient(145deg,#f4f1ff 0%,#e7edff 100%);border:1px solid #e0ddf7;border-radius:5px;overflow:hidden}
.shop-company-banner-icon{display:grid;place-items:center;width:44px;height:44px;background:#fff;color:#7164db;border-radius:5px;font-size:20px;box-shadow:0 4px 14px rgba(73,67,150,.1)}
.shop-company-banner-kicker{color:#7669d7;font-size:11px;font-weight:700}
.shop-company-banner h2{position:relative;z-index:1;margin:0;color:#1d2d50;font-size:19px;font-weight:700;line-height:1.65}
.shop-company-banner p{position:relative;z-index:1;margin:0;color:#65718b;font-size:12px;line-height:2}
.shop-company-banner>a{position:relative;z-index:1;display:inline-flex;align-items:center;gap:9px;margin-top:8px;padding:10px 12px;background:#fff;color:#5145b8;border:1px solid #e3dfff;border-radius:4px;font-size:11px;font-weight:700;text-decoration:none}
.shop-company-banner-orbit{position:absolute;width:170px;height:170px;inset-inline-end:-72px;bottom:-82px;border:1px solid rgba(113,100,219,.18);border-radius:50%;box-shadow:0 0 0 22px rgba(113,100,219,.05),0 0 0 46px rgba(113,100,219,.04);pointer-events:none}
.shop-hero-copy{min-width:0}.shop-eyebrow{display:inline-flex;align-items:center;gap:8px;color:#b8d9f4;font-size:12px;font-weight:600}.shop-hero h1{margin:14px 0 9px;color:#fff;font-size:clamp(22px,2.2vw,30px);font-weight:600;line-height:1.5}.shop-hero p{max-width:620px;margin:0;color:#d8e7f6;font-size:13px;line-height:2}
.shop-hero-meta{display:flex;flex-wrap:wrap;gap:16px;margin-top:14px;color:#d8e7f6;font-size:12px}.shop-hero-meta span{display:flex;align-items:center;gap:6px}.shop-hero-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.shop-primary-btn,.shop-secondary-btn{display:inline-flex;align-items:center;gap:9px;padding:10px 15px;border-radius:4px;font-size:13px;font-weight:600;text-decoration:none}.shop-primary-btn{background:#fff;color:#0d2b53}.shop-secondary-btn{border:1px solid rgba(255,255,255,.35);color:#fff}.shop-hero-media{position:relative;display:grid;place-items:center;height:250px;min-width:0;padding:12px;background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,.055));border:1px solid rgba(255,255,255,.2);border-radius:5px;overflow:hidden}
.shop-hero-media:after{content:"";position:absolute;inset:10px;border:1px solid rgba(255,255,255,.12);border-radius:3px;pointer-events:none}
.shop-hero-media img{position:relative;z-index:1;filter:drop-shadow(0 14px 18px rgba(0,0,0,.2));transition:transform .45s ease}
.shop-hero-media:hover img{transform:scale(1.045)}.shop-hero-media img{width:100%;height:100%;object-fit:contain}.shop-hero-media>i{font-size:90px;color:#d6e8fa}.shop-hero-label{position:absolute;top:12px;inset-inline-start:12px;padding:5px 9px;background:#7c6cf6;color:#fff;border-radius:3px;font-size:11px}.shop-slider-controls{display:flex;align-items:center;gap:10px;margin-top:18px}.shop-slider-controls>button{width:29px;height:29px;border:1px solid rgba(255,255,255,.35);border-radius:3px;background:transparent;color:#fff}.shop-slider-dots{display:flex;gap:6px}.shop-slider-dots button{width:7px;height:7px;padding:0;border:0;border-radius:50%;background:#9eb6d0}.shop-slider-dots button.active{width:21px;border-radius:4px;background:#fff}
.shop-hero--loading{display:flex;justify-content:center;gap:14px;color:#fff;min-height:316px}
.shop-feature-stage:has(.shop-hero--loading) .shop-hero--loading{grid-column:1}
.shop-benefits{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px}.shop-benefits>div{display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--tm-surface);border:1px solid var(--tm-line);border-radius:4px;box-shadow:var(--tm-card-shadow)}.shop-benefits>div>i{display:grid;place-items:center;width:38px;height:38px;background:#eeecfd;color:#7c6cf6;border-radius:4px;font-size:17px}.shop-benefits b,.shop-benefits small{display:block}.shop-benefits b{font-size:13px;font-weight:600}.shop-benefits small{margin-top:4px;color:var(--tm-muted);font-size:11px}
.shop-category-section,.shop-featured-section{margin-bottom:28px}.shop-section-heading{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:13px}.shop-section-heading>div>span,.shop-results-kicker{color:#7c6cf6;font-size:11px;font-weight:600}.shop-section-heading h2{margin:4px 0 0;font-size:17px;font-weight:600}.shop-section-heading>a{color:#7c6cf6;font-size:12px;text-decoration:none}.shop-section-heading>a i{margin-inline-start:5px}.shop-section-note{color:var(--tm-muted);font-size:11px}
.shop-category-strip{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:10px}.shop-category-tile{display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-width:0;min-height:102px;padding:14px;background:var(--tm-surface);border:1px solid var(--tm-line);border-radius:4px;box-shadow:var(--tm-card-shadow);text-align:start;cursor:pointer;transition:border-color .15s,background .15s}.shop-category-tile>i{display:grid;place-items:center;width:32px;height:32px;background:#eeecfd;color:#7c6cf6;border-radius:4px}.shop-category-tile span{font-size:12px;font-weight:600;overflow-wrap:anywhere}.shop-category-tile small{color:var(--tm-muted);font-size:10px}.shop-category-tile.active,.shop-category-tile:hover{border-color:#7c6cf6;background:#f8f7ff}
.shop-featured-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.shop-mini-product{display:flex;align-items:center;gap:10px;min-width:0;padding:10px;background:var(--tm-surface);border:1px solid var(--tm-line);border-radius:4px;color:inherit;text-decoration:none;box-shadow:var(--tm-card-shadow)}.shop-mini-image{display:grid;place-items:center;flex:none;width:68px;height:68px;background:#f4f5fa;border-radius:3px;overflow:hidden}.shop-mini-image img{width:100%;height:100%;object-fit:contain;padding:5px}.shop-mini-image i{font-size:23px;color:#7c6cf6}.shop-mini-content{display:flex;flex:1;flex-direction:column;gap:4px;min-width:0}.shop-mini-content b{font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.shop-mini-content small{color:var(--tm-muted);font-size:10px}.shop-mini-content strong{font-size:11px;color:#7c6cf6}.shop-mini-arrow{color:#9aa0b4}
.shop-catalog-layout{display:grid;grid-template-columns:310px minmax(0,1fr);grid-template-areas:"filters products";gap:22px;align-items:start;direction:rtl}
.shop-filter-sidebar{grid-area:filters;display:block!important;visibility:visible;min-width:0}
.shop-products-area{grid-area:products;min-width:0}
.shop-filter-head{background:#fbfbfe}
.shop-filter-section h3{color:var(--tm-ink)}
.shop-search :deep(.p-inputtext){text-align:right}
.shop-search :deep(.p-inputtext)::placeholder{color:#9aa1b3}.shop-filter-sidebar{position:sticky;top:82px;background:var(--tm-surface);border:1px solid var(--tm-line);border-radius:4px;box-shadow:var(--tm-card-shadow);overflow:hidden}.shop-filter-head{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid var(--tm-line)}.shop-filter-head>div{display:flex;align-items:center;gap:9px;font-size:14px}.shop-filter-head>div i{color:#7c6cf6}.shop-filter-head button,.shop-filter-actions>button{border:0;background:none;color:#7c6cf6;font-size:11px;cursor:pointer}.shop-filter-section{padding:17px 16px;border-bottom:1px solid var(--tm-line)}.shop-filter-section h3{display:flex;justify-content:space-between;margin:0 0 12px;font-size:13px;font-weight:600}.shop-filter-section h3 small{color:var(--tm-muted);font-size:10px;font-weight:400}.shop-search{display:flex;gap:6px}.shop-search :deep(.p-inputtext){width:100%;min-width:0;height:38px;font-size:11px}.shop-search :deep(.p-button){flex:none;width:40px;background:#7c6cf6;border-color:#7c6cf6}.shop-filter-option{display:flex;align-items:center;gap:9px;width:100%;padding:8px 0;border:0;background:none;color:var(--tm-ink-soft);text-align:start;font-size:12px;cursor:pointer}.shop-filter-option small{margin-inline-start:auto;color:var(--tm-muted);font-size:10px}.shop-check{width:15px;height:15px;flex:none;border:1px solid #cfd3e0;border-radius:3px}.shop-filter-option.active{color:#7c6cf6;font-weight:600}.shop-filter-option.active .shop-check{border-color:#7c6cf6;background:#7c6cf6;box-shadow:inset 0 0 0 3px #fff}.shop-price-inputs{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:6px}.shop-price-inputs :deep(.p-inputnumber),.shop-price-inputs :deep(.p-inputtext){width:100%;min-width:0}.shop-price-inputs :deep(.p-inputtext){height:36px;padding:7px;font-size:11px}.shop-price-inputs>span{color:var(--tm-muted);font-size:10px}.shop-sort-select{width:100%}.shop-filter-actions{display:grid;gap:9px;padding:14px 16px}.shop-filter-actions :deep(.p-button){height:39px;background:#7c6cf6;border-color:#7c6cf6;font-size:12px}.shop-filter-actions>button{padding:5px}
.shop-results-toolbar{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:14px;padding:15px 17px;background:var(--tm-surface);border:1px solid var(--tm-line);border-radius:4px;box-shadow:var(--tm-card-shadow)}.shop-results-toolbar h2{margin:3px 0;font-size:17px;font-weight:600}.shop-results-toolbar p{margin:0;color:var(--tm-muted);font-size:11px}.shop-results-tools{display:flex;align-items:center;gap:12px}.shop-results-tools>span{display:flex;align-items:center;gap:5px;color:var(--tm-muted);font-size:11px}.shop-results-tools :deep(.p-select){min-width:145px;font-size:11px}
.shop-product-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.shop-product-card{display:flex;flex-direction:column;min-width:0;background:var(--tm-surface);border:1px solid var(--tm-line);border-radius:4px;box-shadow:var(--tm-card-shadow);overflow:hidden;transition:box-shadow .18s,border-color .18s}.shop-product-card:hover{border-color:#c8c1f7;box-shadow:0 5px 16px rgba(20,20,60,.09)}.shop-product-image{position:relative;display:grid;place-items:center;height:190px;background:#f4f5fa;overflow:hidden}.shop-product-image img{width:100%;height:100%;object-fit:contain;padding:13px}.shop-product-image>i{font-size:42px;color:#a5a9bb}.shop-product-category,.shop-product-featured{position:absolute;top:10px;padding:4px 7px;border-radius:3px;background:#fff;color:#525a70;font-size:10px}.shop-product-category{inset-inline-start:10px}.shop-product-featured{inset-inline-end:10px;background:#eeecfd;color:#7c6cf6}.shop-product-info{display:flex;flex:1;flex-direction:column;padding:12px}.shop-product-brand{margin-bottom:5px;color:#7c6cf6;font-size:10px;font-weight:600}.shop-product-title{display:-webkit-box;min-height:42px;overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical;color:var(--tm-ink);font-size:13px;font-weight:600;line-height:1.7;text-decoration:none}.shop-product-specs{display:flex;flex-wrap:wrap;gap:5px 12px;margin-top:8px;color:var(--tm-muted);font-size:10px}.shop-product-bottom{display:flex;align-items:end;justify-content:space-between;gap:8px;margin-top:auto;padding-top:12px;border-top:1px solid var(--tm-line)}.shop-product-bottom small,.shop-product-bottom b{display:block}.shop-product-bottom small{color:var(--tm-muted);font-size:10px}.shop-product-bottom b{margin-top:4px;color:var(--tm-ink);font-size:12px;font-weight:700}.shop-product-bottom>a{display:grid;place-items:center;width:32px;height:32px;background:#eeecfd;color:#7c6cf6;border-radius:3px;text-decoration:none}
.shop-state{display:flex;min-height:300px;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:30px;background:var(--tm-surface);border:1px dashed var(--tm-line-strong);border-radius:4px;color:var(--tm-muted);text-align:center}.shop-state>i{font-size:30px;color:#7c6cf6}.shop-state>b{color:var(--tm-ink);font-size:14px}.shop-state>span{font-size:12px}.shop-state--error>i{color:#d94848}.shop-pagination{margin-top:18px;background:var(--tm-surface);border:1px solid var(--tm-line);border-radius:4px;overflow:hidden}
@media(max-width:1200px){.shop-feature-stage{grid-template-columns:minmax(0,1fr) 260px}.shop-hero{gap:18px;padding:22px}.shop-catalog-layout{grid-template-columns:280px minmax(0,1fr)}.shop-category-strip{grid-template-columns:repeat(4,minmax(0,1fr))}.shop-featured-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.shop-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.shop-catalog-layout{grid-template-columns:260px minmax(0,1fr)}}
@media(max-width:820px){.shop-feature-stage{grid-template-columns:1fr}.shop-hero{grid-template-columns:minmax(0,1fr) minmax(220px,.75fr);padding:20px}.shop-hero-media{height:210px}.shop-company-banner{min-height:210px}.shop-benefits{grid-template-columns:1fr}.shop-catalog-layout{grid-template-columns:1fr;grid-template-areas:"filters" "products"}.shop-filter-sidebar{position:static}.shop-results-toolbar{align-items:flex-start;flex-direction:column}.shop-results-tools{width:100%;justify-content:space-between}}
@media(max-width:520px){.shop-feature-stage{gap:10px}.shop-hero{grid-template-columns:1fr;padding:17px}.shop-hero-media{grid-row:1;height:190px}.shop-company-banner{padding:19px}.shop-page{padding-inline:12px}.shop-category-strip{grid-template-columns:repeat(2,minmax(0,1fr))}.shop-featured-grid{grid-template-columns:1fr}.shop-product-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.shop-product-image{height:135px}.shop-product-info{padding:9px}.shop-product-title{font-size:11px}.shop-product-bottom b{font-size:10px}.shop-results-tools>span{display:none}}
@media(prefers-reduced-motion:reduce){.shop-product-card,.shop-category-tile,.shop-hero-media img{transition:none}.shop-hero-copy,.shop-hero-media{animation:none}}
</style>