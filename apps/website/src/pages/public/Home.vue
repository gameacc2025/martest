<script setup>
/**
 * Website homepage — unified "tem" storefront composition.
 *
 * Data comes exclusively from the live marketplace APIs: the product list
 * (recent + featured flag) and the category store used by /categories.
 * There is no mock data and no fabricated marketplace statistic.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { productsApi, bannersApi } from '@telecom/api-client'
import { useProductsStore } from '../../stores/products'
import { productSalesMode, productPriceLabel } from './homePresentation.js'

const router = useRouter()
const productsStore = useProductsStore()
const authStore = useAuthStore()
const showMyInquiriesLink = computed(() => authStore.isAuthenticated && authStore.isCustomer)

const featuredProducts = ref([])
const recentProducts = ref([])
const promotionalBanners = ref([])
const activeBannerIndex = ref(0)
let bannerTimer = null
const activeBanner = computed(() => promotionalBanners.value[activeBannerIndex.value] || promotionalBanners.value[0] || null)
const categories = ref([])
const loading = ref(false)
const categoriesLoading = ref(false)
const categoriesError = ref(false)
const error = ref(null)

const searchQuery = ref('')
const activeSlide = ref(0)
let slideTimer = null
const featuredSlides = computed(() => featuredProducts.value.slice(0, 5))
const activeFeaturedProduct = computed(() => featuredSlides.value[activeSlide.value] || featuredSlides.value[0] || null)

function goToSlide(index) {
  const total = featuredSlides.value.length
  if (!total) return
  activeSlide.value = (index + total) % total
}
function nextSlide() { goToSlide(activeSlide.value + 1) }
function previousSlide() { goToSlide(activeSlide.value - 1) }
function startSlider() {
  if (slideTimer) clearInterval(slideTimer)
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!reducedMotion && featuredSlides.value.length > 1) slideTimer = setInterval(nextSlide, 6500)
}
function handleSliderFocusOut(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) startSlider()
}
function stopSlider() {
  if (slideTimer) clearInterval(slideTimer)
  slideTimer = null
}
function startBannerSlider() {
  if (bannerTimer) clearInterval(bannerTimer)
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!reducedMotion && promotionalBanners.value.length > 1) bannerTimer = setInterval(() => { activeBannerIndex.value = (activeBannerIndex.value + 1) % promotionalBanners.value.length }, 7000)
}
function stopBannerSlider() {
  if (bannerTimer) clearInterval(bannerTimer)
  bannerTimer = null
}
async function fetchPromotionalBanners() {
  try {
    const response = await bannersApi.listActive('HOME_HERO')
    const data = response?.data?.data ?? response?.data ?? []
    promotionalBanners.value = Array.isArray(data) ? data : []
    activeBannerIndex.value = 0
    startBannerSlider()
  } catch (error) {
    promotionalBanners.value = []
  }
}

const features = [
  { icon: 'pi pi-file-edit', title: 'استعلام برای پروژه‌ها', text: 'درخواست قیمت را برای نیازهای سازمانی ثبت کنید و پاسخ تأمین‌کنندگان را پیگیری کنید.' },
  { icon: 'pi pi-list-check', title: 'بررسی مشخصات فنی', text: 'اطلاعات فنی ثبت‌شده محصولات را پیش از انتخاب بررسی کنید.' },
  { icon: 'pi pi-building', title: 'شناخت تأمین‌کننده', text: 'مشخصات شرکت و وضعیت احراز آن را در صورت ثبت و تأیید مشاهده کنید.' },
  { icon: 'pi pi-shopping-cart', title: 'خرید یا استعلام', text: 'نوع ارائه، قیمت و شرایط هر محصول را پیش از مشاهده جزئیات بررسی کنید.' },
]
const visibleCategories = computed(() => categories.value)

async function fetchProducts() {
  try {
    loading.value = true
    error.value = null
    const params = { page: 1, limit: 8, status: 'PUBLISHED' }

    const response = await productsApi.list(params)
    const items = response?.data?.data ?? []
    recentProducts.value = (Array.isArray(items) ? items : []).slice(0, 8)

    // Featured is a server-side product flag, not a slice of recent results.
    try {
      const featuredResponse = await productsApi.list({ ...params, limit: 8, featured: true })
      const featuredItems = featuredResponse?.data?.data ?? []
      featuredProducts.value = Array.isArray(featuredItems) ? featuredItems.slice(0, 8) : []
      activeSlide.value = 0
      startSlider()
    } catch (featuredError) {
      featuredProducts.value = []
    }
  } catch (err) {
    error.value = 'خطا در دریافت محصولات'
    featuredProducts.value = []
    recentProducts.value = []
  } finally {
    loading.value = false
  }
}

function categoryIcon(category) {
  const name = [category?.nameFa, category?.name, category?.nameEn, category?.slug].filter(Boolean).join(' ').toLowerCase()
  if (name.includes('کابل') || name.includes('cable')) return 'pi pi-bolt'
  if (name.includes('روتر') || name.includes('سوئیچ') || name.includes('switch') || name.includes('router')) return 'pi pi-sitemap'
  if (name.includes('فیبر') || name.includes('fiber') || name.includes('fibre')) return 'pi pi-share-alt'
  if (name.includes('بی‌سیم') || name.includes('بیسیم') || name.includes('wireless')) return 'pi pi-wifi'
  if (name.includes('نوری') || name.includes('optical')) return 'pi pi-sun'
  if (name.includes('موبایل') || name.includes('mobile') || name.includes('cellular')) return 'pi pi-mobile'
  if (name.includes('دیتا') || name.includes('data')) return 'pi pi-database'
  return 'pi pi-box'
}

function categoryProductCount(category) {
  const count = Number(category?.productCount ?? category?.productsCount ?? category?._count?.products)
  return Number.isFinite(count) && count >= 0 ? count : null
}

function productAvailabilityLabel(product) {
  const status = String(product?.stockStatus || product?.availability || '').toUpperCase()
  if (['IN_STOCK', 'AVAILABLE'].includes(status)) return 'موجود'
  if (['OUT_OF_STOCK', 'UNAVAILABLE'].includes(status)) return 'ناموجود'
  if (['PREORDER', 'PRE_ORDER'].includes(status)) return 'پیش‌فروش'
  return ''
}

function productCategoryName(product) {
  return product?.category?.nameFa || product?.category?.name || product?.category?.nameEn || ''
}


function getProductImage(product) {
  return product?.images?.find((image) => image?.isPrimary && image?.url)
    || product?.images?.find((image) => image?.url)
    || null
}

function productRoute(product) {
  return { name: 'product-details', params: { id: product.id } }
}

// Hero search follows the marketplace convention: it takes the visitor to the
// dedicated search-results page (same target as the header search).
function heroSearch() {
  const q = searchQuery.value.trim()
  router.push({ name: 'search', query: q ? { q } : {} })
  searchQuery.value = ''
}

function viewCategoryProducts(categoryId) {
  router.push({ name: 'products', query: { category: categoryId } })
}

async function fetchCategories() {
  try {
    categoriesLoading.value = true
    categoriesError.value = false
    // Use the same store method as the Categories page so the data shape matches.
    const data = await productsStore.getCategories()
    categories.value = Array.isArray(data) ? data : []
  } catch (err) {
    categoriesError.value = true
    categories.value = []
  } finally {
    categoriesLoading.value = false
  }
}

onMounted(() => {
  fetchProducts()
  fetchCategories()
  fetchPromotionalBanners()
})
onUnmounted(() => { stopSlider(); stopBannerSlider() })
</script>

<template>
  <div class="home-page" dir="rtl">
    <section class="home-campaign-hero" aria-label="پیشنهادهای ویژه بازارگاه">
      <div v-if="activeBanner" class="home-campaign-hero__slide">
        <img class="home-campaign-hero__image" :src="activeBanner.imageUrl" :alt="activeBanner.title" fetchpriority="high" decoding="async" />
        <div class="home-campaign-hero__shade"></div>
        <div class="home-container home-campaign-hero__inner">
          <div class="home-campaign-hero__copy">
            <span class="home-campaign-hero__eyebrow"><i class="pi pi-bolt" aria-hidden="true"></i> پیشنهادهای ویژه بازارگاه</span>
            <h1>{{ activeBanner.title }}</h1>
            <p v-if="activeBanner.description">{{ activeBanner.description }}</p>
            <a v-if="activeBanner.targetUrl" :href="activeBanner.targetUrl" class="tm-btn tm-btn--accent">{{ activeBanner.ctaLabel || 'مشاهده پیشنهاد' }} <i class="pi pi-arrow-left" aria-hidden="true"></i></a>
            <router-link v-else :to="{ name: 'products' }" class="tm-btn tm-btn--accent">{{ activeBanner.ctaLabel || 'مشاهده محصولات' }} <i class="pi pi-arrow-left" aria-hidden="true"></i></router-link>
            <form class="home-hero__search" role="search" aria-label="جستجوی محصولات" @submit.prevent="heroSearch">
              <i class="pi pi-search" aria-hidden="true"></i>
              <label class="sr-only" for="home-hero-search">جستجوی محصول</label>
              <input id="home-hero-search" v-model="searchQuery" type="search" placeholder="نام محصول، برند یا مدل را جستجو کنید…" autocomplete="off" />
              <button type="submit" class="tm-btn tm-btn--accent tm-btn--sm">جستجو</button>
            </form>
          </div>
          <div v-if="promotionalBanners.length > 1" class="home-campaign-hero__controls" aria-label="کنترل اسلایدهای تبلیغاتی">
            <button type="button" aria-label="اسلاید قبلی" @click="activeBannerIndex = (activeBannerIndex - 1 + promotionalBanners.length) % promotionalBanners.length"><i class="pi pi-chevron-right"></i></button>
            <button v-for="(banner, index) in promotionalBanners" :key="banner.id" type="button" :class="{ 'is-active': index === activeBannerIndex }" :aria-label="'نمایش اسلاید ' + (index + 1)" @click="activeBannerIndex = index; stopBannerSlider()"></button>
            <button type="button" aria-label="اسلاید بعدی" @click="activeBannerIndex = (activeBannerIndex + 1) % promotionalBanners.length"><i class="pi pi-chevron-left"></i></button>
          </div>
        </div>
      </div>
      <div v-else class="home-campaign-hero__fallback">
        <div class="home-container home-campaign-hero__fallback-inner">
          <div class="home-campaign-hero__fallback-copy">
            <span class="home-campaign-hero__eyebrow"><i class="pi pi-sitemap" aria-hidden="true"></i> بازارگاه تخصصی تجهیزات شبکه و مخابرات</span>
            <h1>تجهیزات حرفه‌ای پروژه‌تان را هوشمندانه پیدا کنید</h1>
            <p>محصولات تخصصی، مشخصات فنی و اطلاعات تأمین‌کنندگان را مقایسه کنید؛ برای خریدهای سازمانی هم درخواست استعلام ثبت کنید.</p>
            <form class="home-hero__search" role="search" aria-label="جستجوی محصولات" @submit.prevent="heroSearch">
              <i class="pi pi-search" aria-hidden="true"></i>
              <label class="sr-only" for="home-hero-search-fallback">جستجوی محصول</label>
              <input id="home-hero-search-fallback" v-model="searchQuery" type="search" placeholder="نام محصول، برند یا مدل را جستجو کنید…" autocomplete="off" />
              <button type="submit" class="tm-btn tm-btn--accent tm-btn--sm">جستجو</button>
            </form>
            <div class="home-campaign-hero__quick-links">
              <router-link :to="{ name: 'products' }">مشاهده همه محصولات <i class="pi pi-arrow-left" aria-hidden="true"></i></router-link>
              <router-link :to="{ name: 'categories' }">مرور دسته‌بندی‌ها <i class="pi pi-th-large" aria-hidden="true"></i></router-link>
            </div>
          </div>
          <router-link v-if="activeFeaturedProduct" :to="productRoute(activeFeaturedProduct)" class="home-campaign-hero__spotlight">
            <span class="home-campaign-hero__spotlight-label"><i class="pi pi-star-fill" aria-hidden="true"></i> محصول منتخب</span>
            <img v-if="getProductImage(activeFeaturedProduct)" :src="getProductImage(activeFeaturedProduct).url" :alt="activeFeaturedProduct.name || activeFeaturedProduct.title" />
            <i v-else class="pi pi-box home-campaign-hero__spotlight-placeholder" aria-hidden="true"></i>
            <strong>{{ activeFeaturedProduct.name || activeFeaturedProduct.title }}</strong>
            <span>{{ productPriceLabel(activeFeaturedProduct) }}</span>
          </router-link>
          <div v-else class="home-campaign-hero__spotlight home-campaign-hero__spotlight--empty" aria-hidden="true">
            <i class="pi pi-box"></i><span>کاتالوگ تخصصی تجهیزات</span>
          </div>
        </div>
      </div>
    </section>
    <div class="home-marketplace-benefits" aria-label="امکانات بازارگاه">
      <div><i class="pi pi-verified" aria-hidden="true"></i><span><strong>تأمین‌کنندگان قابل بررسی</strong><small>مشاهده مشخصات و وضعیت تأیید شرکت</small></span></div>
      <div><i class="pi pi-file-check" aria-hidden="true"></i><span><strong>اطلاعات تخصصی محصول</strong><small>بررسی مدل، شناسه و جزئیات فنی</small></span></div>
      <div><i class="pi pi-comments" aria-hidden="true"></i><span><strong>استعلام برای پروژه‌ها</strong><small>ثبت درخواست و دریافت پیشنهاد</small></span></div>
    </div>
    <div class="home-container">
      <!-- Categories -->
      <section class="home-section" aria-labelledby="home-categories">
        <div class="site-section-title">
          <h2 id="home-categories">دسته‌بندی محصولات</h2>
          <router-link :to="{ name: 'categories' }">همه دسته‌بندی‌ها</router-link>
        </div>

        <div v-if="categoriesLoading" class="home-category-grid" aria-busy="true">
          <div v-for="i in 8" :key="i" class="home-category-card home-skeleton"></div>
        </div>

        <div v-else-if="categoriesError" class="home-empty">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i><p>دریافت دسته‌بندی‌ها با مشکل روبه‌رو شد.</p>
          <button type="button" class="tm-btn tm-btn--sm" @click="fetchCategories">تلاش دوباره</button>
        </div>
        <div v-else-if="categories.length === 0" class="home-empty">
          <i class="pi pi-th-large" aria-hidden="true"></i>
          <p>دسته‌بندی‌ای برای نمایش ثبت نشده است.</p>
        </div>

        <div v-else class="home-category-track" aria-label="دسته‌بندی‌های محصولات">
          <button
            v-for="category in visibleCategories"
            :key="category.id"
            type="button"
            class="category-card"
            @click="viewCategoryProducts(category.id)"
          >
            <span class="category-card__icon" aria-hidden="true"><i :class="categoryIcon(category)"></i></span>
            <span class="category-card__content"><span class="category-card__name">{{ category.nameFa || category.nameEn || category.name }}</span><small v-if="categoryProductCount(category) !== null">{{ categoryProductCount(category).toLocaleString('fa-IR') }} محصول</small></span>
          </button>
        </div>
      </section>

      <!-- Featured products -->
      <section class="home-section" aria-labelledby="home-featured">
        <div class="site-section-title">
          <h2 id="home-featured">محصولات منتخب</h2>
          <router-link :to="{ name: 'products' }">همه محصولات</router-link>
        </div>

        <div v-if="loading" class="home-product-grid" aria-busy="true">
          <div v-for="i in 8" :key="i" class="product-card home-product-skeleton home-skeleton"></div>
        </div>

        <div v-else-if="error" class="home-empty">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <p>{{ error }}</p>
          <button type="button" class="tm-btn tm-btn--sm" @click="fetchProducts">تلاش دوباره</button>
        </div>

        <div v-else-if="featuredProducts.length === 0" class="home-empty">
          <i class="pi pi-box" aria-hidden="true"></i>
          <p>هنوز محصول ویژه‌ای منتشر نشده است. همه محصولات منتشرشده را ببینید.</p>
          <router-link :to="{ name: 'products' }" class="tm-btn tm-btn--sm">مشاهده محصولات</router-link>
        </div>

        <div v-else class="home-product-grid">
          <article v-for="product in featuredProducts.slice(0, 8)" :key="product.id" class="product-card">
            <router-link :to="productRoute(product)" class="product-card__main">
              <span class="product-card__media">
                <span v-if="productCategoryName(product)" class="product-card__media-category">{{ productCategoryName(product) }}</span>
                <img v-if="getProductImage(product)" :src="getProductImage(product).url" :alt="product.name || product.title || 'تصویر محصول'" width="320" height="240" loading="lazy" decoding="async" />
                <i v-else class="pi pi-box" aria-hidden="true"></i>
              </span>
              <span class="product-card__body">
                <span class="product-card__brand">{{ product.brand || product.company?.name || 'تجهیزات شبکه و مخابرات' }}</span>
                <span v-if="product.company?.isVerified" class="product-card__verified"><i class="pi pi-verified" aria-hidden="true"></i> تأمین‌کننده تأییدشده</span>
                <span class="product-card__mode" :class="'product-card__mode--' + productSalesMode(product).kind">{{ productSalesMode(product).label }}</span>
                <span class="product-card__name">{{ product.name || product.title }}</span>
                <span class="product-card__specs"><b v-if="product.model">{{ product.model }}</b><b v-if="product.sku" dir="ltr">{{ product.sku }}</b><b v-if="productCategoryName(product)">{{ productCategoryName(product) }}</b></span>
                <span v-if="product.company?.name" class="product-card__company">{{ product.company.name }}</span>
                <span v-if="productAvailabilityLabel(product)" class="product-card__availability">{{ productAvailabilityLabel(product) }}</span>
              </span>
            </router-link>
            <div class="product-card__foot">
              <span class="product-card__price"><small>{{ product.prices?.length ? 'شروع قیمت از' : 'قیمت' }}</small><b>{{ productPriceLabel(product) }}</b></span>
              <button v-if="productSalesMode(product).kind === 'fixed'" type="button" class="tm-btn tm-btn--accent tm-btn--sm" disabled :aria-label="'افزودن به سبد برای ' + (product.name || product.title) + ' غیرفعال است؛ سرویس سفارش و موجودی هنوز آماده نیست'" title="خرید مستقیم پس از راه‌اندازی سرویس سفارش و موجودی فعال می‌شود">افزودن به سبد</button>
              <router-link v-else :to="productRoute(product)" class="product-card-cta" :aria-label="(productSalesMode(product).kind === 'volume' ? 'استعلام عمده: ' : 'درخواست استعلام: ') + (product.name || product.title)">{{ productSalesMode(product).kind === 'volume' ? 'استعلام عمده' : 'درخواست استعلام' }} <i class="pi pi-arrow-left" aria-hidden="true"></i></router-link>
            </div>
          </article>
        </div>
      </section>

      <!-- Recent products -->
      <section class="home-section" aria-labelledby="home-recent">
        <div class="site-section-title">
          <h2 id="home-recent">تازه‌ترین محصولات</h2>
          <router-link :to="{ name: 'products' }">مشاهده همه محصولات</router-link>
        </div>

        <div v-if="loading" class="home-product-grid" aria-busy="true">
          <div v-for="n in 8" :key="n" class="product-card home-product-skeleton home-skeleton"></div>
        </div>
        <div v-else-if="error" class="home-empty">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i><p>{{ error }}</p>
          <button type="button" class="tm-btn tm-btn--sm" @click="fetchProducts">تلاش دوباره</button>
        </div>
        <div v-else-if="recentProducts.length === 0" class="home-empty">
          <i class="pi pi-box" aria-hidden="true"></i><p>هنوز محصول تازه‌ای برای نمایش منتشر نشده است.</p>
          <router-link :to="{ name: 'products' }" class="tm-btn tm-btn--sm">مشاهده همه محصولات</router-link>
        </div>
        <div v-else class="home-product-grid home-product-grid--recent">
          <article v-for="product in recentProducts.slice(0, 8)" :key="product.id" class="product-card">
            <router-link :to="productRoute(product)" class="product-card__main">
              <span class="product-card__media">
                <span v-if="productCategoryName(product)" class="product-card__media-category">{{ productCategoryName(product) }}</span>
                <img v-if="getProductImage(product)" :src="getProductImage(product).url" :alt="product.name || product.title || 'تصویر محصول'" width="320" height="240" loading="lazy" decoding="async" />
                <i v-else class="pi pi-box" aria-hidden="true"></i>
              </span>
              <span class="product-card__body">
                <span class="product-card__brand">{{ product.brand || product.company?.name || 'تجهیزات شبکه و مخابرات' }}</span>
                <span v-if="product.company?.isVerified" class="product-card__verified"><i class="pi pi-verified" aria-hidden="true"></i> تأمین‌کننده تأییدشده</span>
                <span class="product-card__mode" :class="'product-card__mode--' + productSalesMode(product).kind">{{ productSalesMode(product).label }}</span>
                <span class="product-card__name">{{ product.name || product.title }}</span>
                <span class="product-card__specs"><b v-if="product.model">{{ product.model }}</b><b v-if="product.sku" dir="ltr">{{ product.sku }}</b><b v-if="productCategoryName(product)">{{ productCategoryName(product) }}</b></span>
                <span v-if="product.company?.name" class="product-card__company">{{ product.company.name }}</span>
                <span v-if="productAvailabilityLabel(product)" class="product-card__availability">{{ productAvailabilityLabel(product) }}</span>
              </span>
            </router-link>
            <div class="product-card__foot">
              <span class="product-card__price"><small>{{ product.prices?.length ? 'شروع قیمت از' : 'قیمت' }}</small><b>{{ productPriceLabel(product) }}</b></span>
              <router-link :to="productRoute(product)" class="product-card-cta">مشاهده محصول <i class="pi pi-arrow-left" aria-hidden="true"></i></router-link>
            </div>
          </article>
        </div>
      </section>

      <!-- Capabilities -->
      <section class="home-section" aria-labelledby="home-features">
        <div class="site-section-title">
          <h2 id="home-features">چرا Telecom Market؟</h2>
        </div>
        <div class="home-feature-grid">
          <article v-for="feature in features" :key="feature.title" class="home-feature">
            <span class="feature-icon" aria-hidden="true"><i :class="feature.icon"></i></span>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.text }}</p>
          </article>
        </div>
      </section>

      <!-- Inquiry CTA -->
      <section class="home-cta">
        <div>
          <h2>محصول مورد نظر را پیدا نکردید؟</h2>
          <p>ثبت درخواست برای دریافت پیشنهاد تأمین‌کنندگان، بدون نیاز به خرید مستقیم.</p>
        </div>
        <router-link :to="{ name: 'my-inquiries' }" class="tm-btn tm-btn--accent">
          <i class="pi pi-file-edit" aria-hidden="true"></i>
          ثبت درخواست استعلام
        </router-link>
      </section>

      <!-- Promotional discovery cards -->
      <section class="home-promo-grid" aria-label="راهکارهای بازارگاه">
        <article class="home-promo-card home-promo-card--catalog">
          <span class="home-promo-card__icon" aria-hidden="true"><i class="pi pi-box"></i></span>
          <span class="home-promo-card__eyebrow">کاتالوگ تخصصی</span>
          <h2>تجهیزات مناسب پروژه‌تان را دقیق‌تر پیدا کنید</h2>
          <p>دسته‌بندی‌ها و مشخصات محصولات منتشرشده را کنار هم بررسی کنید.</p>
          <router-link :to="{ name: 'categories' }">مرور دسته‌بندی‌ها <i class="pi pi-arrow-left"></i></router-link>
        </article>
        <article class="home-promo-card home-promo-card--suppliers">
          <span class="home-promo-card__icon" aria-hidden="true"><i class="pi pi-building"></i></span>
          <span class="home-promo-card__eyebrow">شبکه تأمین</span>
          <h2>اطلاعات تأمین‌کننده را کنار محصول بررسی کنید</h2>
          <p>نام شرکت عرضه‌کننده و وضعیت تأیید آن را در اطلاعات هر محصول ببینید.</p>
          <router-link :to="{ name: 'products' }">مشاهده کاتالوگ محصولات <i class="pi pi-arrow-left"></i></router-link>
        </article>
        <article class="home-promo-card home-promo-card--inquiry">
          <span class="home-promo-card__icon" aria-hidden="true"><i class="pi pi-file-edit"></i></span>
          <span class="home-promo-card__eyebrow">نیازهای سازمانی</span>
          <h2>برای خریدهای پروژه‌ای استعلام بگیرید</h2>
          <p>نیاز خود را ثبت کنید و پاسخ تأمین‌کنندگان را از مسیر استعلام پیگیری کنید.</p>
          <router-link :to="{ name: 'my-inquiries' }">ثبت درخواست استعلام <i class="pi pi-arrow-left"></i></router-link>
        </article>
      </section>

      <section class="home-cta home-cta--retail">
        <div><h2>برای خرید مستقیم آماده‌اید؟</h2><p>محصولات دارای قیمت ثابت را در کاتالوگ پیدا کنید و جزئیات شرایط ارائه را بررسی کنید.</p></div>
        <router-link :to="{ name: 'products' }" class="tm-btn tm-btn--accent">جستجوی محصولات قیمت‌دار</router-link>
      </section>

    </div>
  </div>
</template>

<style scoped>
.home-page { background: var(--tm-canvas); }
.home-hero-band { width: 100%; padding-block: clamp(1rem, 2vw, 2rem); background: var(--tm-canvas); }
.home-hero-band .home-container { padding-block: 0; }
.home-hero { border:1px solid var(--tm-line); border-radius:4px; background:var(--tm-surface); box-shadow:var(--tm-card-shadow); padding:24px; }
.home-hero__actions { display: flex; flex-wrap: wrap; gap: .65rem; margin-top: 1rem; }
.home-hero__actions .tm-btn { min-height: 44px; }
.home-hero__visual { display: grid; grid-template-columns: minmax(0,.92fr) minmax(0,1.08fr); gap: 1rem; align-items: stretch; }
.home-hero__visual--no-banner .home-featured-slider,
.home-hero__visual--no-banner .home-hero__product { grid-column: 1 / -1; }
.home-hero__visual .home-hero__benefits { grid-column: 1 / -1; }
.home-promo-banner { position:relative; display:block; min-width:0; min-height:330px; overflow:hidden; border:1px solid var(--tm-line); border-radius:4px; background:var(--tm-surface-alt); color:#fff; text-decoration:none; box-shadow:var(--tm-card-shadow); isolation:isolate; }
.home-promo-banner > img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:-2; }
.home-promo-banner__shade { position:absolute; inset:0; z-index:-1; background:linear-gradient(90deg,rgba(5,18,39,.78),rgba(5,18,39,.12) 100%); }
.home-promo-banner__hitarea { position:absolute; inset:0; z-index:0; }
.home-promo-banner__content { position:absolute; pointer-events:none; inset:0; display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end; gap:.65rem; padding:clamp(1.25rem,2.2vw,2rem); }
.home-promo-banner__eyebrow { font-size:.75rem; font-weight:800; color:#d7f8ff; }
.home-promo-banner__content strong { max-width:24ch; font-size:clamp(1.35rem,2vw,2rem); line-height:1.65; font-weight:900; }
.home-promo-banner__content > span:not(.home-promo-banner__eyebrow):not(.home-promo-banner__cta) { max-width:38ch; font-size:.9rem; line-height:1.9; color:rgba(255,255,255,.9); }
.home-promo-banner__cta { display:inline-flex; align-items:center; gap:.5rem; margin-top:.3rem; padding:.65rem 1rem; border-radius:4px; background:#fff; color:#132c4c; font-size:.8rem; font-weight:800; }
.home-promo-banner__dots { position:absolute; z-index:2; inset-inline-start:1rem; top:1rem; display:flex; gap:.4rem; }
.home-promo-banner__dots button { width:7px; height:7px; padding:0; border:0; border-radius:10px; background:rgba(255,255,255,.55); cursor:pointer; }
.home-promo-banner__dots button.is-active { width:22px; background:#fff; }
.home-hero__product { min-width: 0; min-height: 250px; display: grid; place-items: center; gap: .5rem; padding: 1rem; border: 1px solid var(--tm-line); border-radius: 4px; background: var(--tm-canvas); color: var(--tm-ink); }
.home-hero__product img { width: 100%; max-height: 230px; object-fit: contain; }
.home-hero__product > i { font-size: 5rem; color: var(--tm-violet); }
.home-hero__product-caption { max-width: 100%; color: var(--tm-ink); font-size: .8125rem; text-align: center; overflow-wrap: anywhere; }
.home-hero__benefits { display: grid; gap: .85rem; list-style: none; margin: 0; padding: 0; color: var(--tm-muted); font-size: .875rem; }
.home-hero__benefits li { display: flex; gap: .55rem; align-items: flex-start; }
.home-hero__benefits i { color: var(--tm-green); margin-top: .2rem; }
.home-container {
  width: 100%;
  max-width: var(--ds-container-max-wide);
  margin-inline: auto;
  padding-inline: var(--ds-container-pad);
  display: flex;
  flex-direction: column;
  gap: 34px;
}


.home-featured-slider { position: relative; display: grid; grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr); min-height: 300px; overflow: hidden; border: 1px solid var(--tm-line); border-radius: 4px; background: var(--tm-surface); box-shadow: var(--tm-card-shadow); }
.home-featured-slider__media { position: relative; display: grid; place-items: center; min-width: 0; padding: 1.25rem; background: var(--tm-blue-soft); }
.home-featured-slider__media img { width: 100%; height: 230px; object-fit: contain; filter: drop-shadow(0 12px 14px rgba(0,0,0,.16)); }
.home-featured-slider__media > i { font-size: 5rem; color: var(--tm-violet); }
.home-featured-slider__flag { position: absolute; top: 12px; inset-inline-start: 12px; display: inline-flex; gap: 6px; align-items: center; padding: 5px 10px; border-radius: 3px; background: var(--tm-surface); color: var(--tm-blue); font-size: 12px; font-weight: 700; }
.home-featured-slider__content { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: .7rem; min-width: 0; padding: 1.5rem; color: var(--tm-ink); }
.home-featured-slider__eyebrow { color: var(--tm-blue); font-size: 12px; font-weight: 700; }
.home-featured-slider__content h2 { margin: 0; color: var(--tm-ink); font-size: clamp(17px, 1.6vw, 23px); line-height: 1.7; overflow-wrap: anywhere; }
.home-featured-slider__content p { margin: 0; color: var(--tm-muted); font-size: 13px; }
.home-featured-slider__content strong { color: var(--tm-ink); font-size: 15px; }
.home-featured-slider__controls { position: absolute; inset-inline: 14px; bottom: 12px; display: flex; align-items: center; justify-content: space-between; pointer-events: none; }
.home-featured-slider__controls > button,.home-featured-slider__dots button { pointer-events: auto; }
.home-featured-slider__controls > button { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid rgba(255,255,255,.3); border-radius: 4px; background: var(--tm-blue); color: var(--tm-surface); cursor: pointer; }
.home-featured-slider__dots { display: flex; align-items: center; gap: 6px; }
.home-featured-slider__dots button { width: 7px; height: 7px; padding: 0; border: 0; border-radius: 99px; background: var(--tm-line-strong); cursor: pointer; transition: width .18s ease, background .18s ease; }
.home-featured-slider__dots button.is-active { width: 22px; background: var(--tm-blue); }
.home-product-grid--recent { grid-template-columns: inherit; }

/* Hero */
.home-hero { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 0.9fr); gap: 32px; align-items: center; }
.home-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border-radius: 3px;
  background: var(--tm-blue-soft);
  border: 1px solid var(--tm-line-strong);
  color: var(--tm-blue);
  font-size: 13px;
  font-weight: 600;
}
.home-hero h1 { margin: 12px 0 10px; font-size: clamp(20px, 2vw, 28px); line-height: 1.45; color: var(--tm-ink); }
.home-hero p { margin: 0 0 22px; max-width: 56ch; color: var(--tm-muted); font-size: 14px; line-height: 1.9; }

.home-hero__search { border:1px solid var(--tm-line-strong);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 14px;
  background: var(--tm-surface);
  border-radius: var(--tm-radius);
  max-width: 620px;
}
.home-hero__search i { color: var(--tm-muted); font-size: 14px; }
.home-hero__search:focus-within { outline: 2px solid var(--ds-color-focus); outline-offset: 3px; }
.home-hero__search input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: 13.5px;
  color: var(--tm-ink);
  padding: 9px 0;
}
.home-hero__search .tm-btn { flex: none; }

.home-hero__links { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 16px; }
.home-hero__links a { color: var(--tm-muted); font-size: 13px; font-weight: 600; text-decoration: none; }
.home-hero__links a:hover { color: var(--tm-blue-strong); text-decoration: underline; }

.home-hero__aside { display: flex; flex-direction: column; gap: 10px; }
.home-hero__badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  border-radius: var(--tm-radius);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: var(--tm-muted);
  font-size: 13px;
  font-weight: 500;
}
.home-hero__badge i { color: var(--tm-cyan); }

/* Sections */
.home-section { min-width: 0; }
.home-promo-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.home-promo-card{position:relative;display:flex;flex-direction:column;align-items:flex-start;min-width:0;min-height:220px;padding:20px;border:1px solid var(--tm-line);border-radius:5px;background:var(--tm-surface);box-shadow:var(--tm-card-shadow);overflow:hidden}
.home-promo-card:before{content:"";position:absolute;inset-inline-start:0;top:0;bottom:0;width:3px;background:var(--tm-cyan)}
.home-promo-card__icon{display:grid;place-items:center;width:38px;height:38px;margin-bottom:12px;border-radius:5px;background:var(--tm-blue-soft);color:var(--tm-blue);font-size:17px}
.home-promo-card__eyebrow{color:var(--tm-blue);font-size:11px;font-weight:700}
.home-promo-card h2{margin:7px 0 5px;color:var(--tm-ink);font-size:15px;font-weight:700;line-height:1.7}
.home-promo-card p{margin:0 0 16px;color:var(--tm-muted);font-size:12px;line-height:1.9}
.home-promo-card>a{display:inline-flex;align-items:center;gap:8px;margin-top:auto;color:var(--tm-blue);font-size:12px;font-weight:700;text-decoration:none}
.home-promo-card>a:hover{text-decoration:underline}
@media(max-width:900px){.home-promo-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:575px){.home-promo-grid{grid-template-columns:1fr}.home-promo-card{min-height:0;padding:16px}}


.home-category-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 14px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius);
  background: var(--tm-surface);
  box-shadow: var(--tm-card-shadow);
  cursor: pointer;
  text-align: start;
  font-family: inherit;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}
.category-card:hover { border-color: var(--tm-line-strong); box-shadow: var(--tm-card-shadow-hover); transform: none; }
.category-card:focus-visible { outline: 2px solid var(--tm-cyan); outline-offset: 2px; }
.category-card__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 4px;
  background: var(--tm-blue-soft);
  color: var(--tm-blue);
  flex: none;
}
.category-card__content { display: flex; flex-direction: column; min-width: 0; gap: .2rem; }
.category-card__name { font-size: 13px; font-weight: 700; color: var(--tm-ink); line-height: 1.5; overflow-wrap: anywhere; }
.category-card__content small { color: var(--tm-muted); font-size: 13px; }

.home-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 168px), 210px));
  justify-content: start;
  align-items: stretch;
  gap: 10px;
}

.product-card {
  display: flex;
  flex-direction: column;
  background: var(--tm-surface);
  border: 1px solid var(--tm-line);
  border-radius: 4px;
  box-shadow: var(--tm-card-shadow);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}
.product-card:hover { border-color: var(--tm-line-strong); box-shadow: var(--tm-card-shadow-hover); transform: none; }
.product-card:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }

.product-card__main { display: flex; flex-direction: column; flex: 1; min-width: 0; color: inherit; text-decoration: none; }
.product-card__main:focus-visible { outline: 2px solid var(--tm-violet); outline-offset: 3px; border-radius: 4px; }
.product-card__media {
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 5;
  background: var(--tm-surface-alt);
  color: var(--tm-faint);
  font-size: 30px;
}
.product-card__media img { width: 100%; height: 100%; object-fit: contain; padding: 10px; }

.product-card__body { display: flex; flex-direction: column; gap: 5px; padding: 11px; flex: 1; }
.product-card__name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--tm-ink);
  line-height: 1.7;
  display: block;
  overflow-wrap: anywhere;
}
.product-card__company { font-size: 11.5px; color: var(--tm-muted); }
.product-sku { font-size: 11px; color: var(--tm-faint); }
.product-card__foot { margin-top: auto; padding: 9px 11px 11px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.product-card__foot .tm-btn { min-height: 44px; }
.product-card__price { font-size: 12px; font-weight: 700; color: var(--tm-blue); }
.product-card-cta { font-size: 11.5px; font-weight: 700; color: var(--tm-blue); }
.product-card-cta i { margin-inline-start: .3rem; }
.product-card__body .tm-pill { align-self: flex-start; }

.home-recent__name { color: var(--tm-ink); font-weight: 600; text-decoration: none; }
.home-recent__product { display: flex; align-items: center; gap: .7rem; color: var(--tm-ink); text-decoration: none; min-width: 220px; }
.home-recent__product img { width: 52px; height: 52px; object-fit: contain; border-radius: 4px; background: var(--tm-surface-alt); }
.home-recent__product-copy { display: flex; flex-direction: column; gap: .15rem; min-width: 0; }
.home-recent__product-copy b { overflow-wrap: anywhere; }
.home-recent__product-copy small { color: var(--tm-muted); font-size: 13px; }
.home-recent__action { display: inline-flex; align-items: center; gap: .35rem; font-weight: 700; text-decoration: none; white-space: nowrap; }
.tm-table tbody tr[role='link'] { cursor: pointer; }
.tm-table tbody tr[role='link']:hover { background: var(--tm-surface-alt); }
.tm-table tbody tr[role='link']:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: -2px; }
.home-recent__name:hover { color: var(--tm-blue); }

.home-feature-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.home-feature {
  padding: 18px;
  background: var(--tm-surface);
  border: 1px solid var(--tm-line);
  border-radius: 4px;
  box-shadow: var(--tm-card-shadow);
}
.feature-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 4px;
  background: var(--tm-blue-soft);
  color: var(--tm-blue);
  margin-bottom: 12px;
}
.home-feature h3 { margin: 0 0 6px; font-size: 14px; font-weight: 600; }
.home-feature p { margin: 0; font-size: 13px; line-height: 1.8; color: var(--tm-muted); }

.home-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;
  padding: 22px 24px;
  border: 1px solid var(--tm-line);
  border-radius: 4px;
  background: var(--tm-surface);
  box-shadow: var(--tm-card-shadow);
  color: var(--tm-ink);
}
.home-cta h2 { margin: 0 0 6px; font-size: 19px; color: var(--tm-ink); }
.home-cta--retail { background: var(--tm-surface); color: var(--tm-ink); border: 1px solid var(--tm-line); }
.home-cta--retail h2 { color: var(--tm-ink); }
.home-cta--retail p { color: var(--tm-muted); }
.home-cta p { margin: 0; font-size: 13px; color: var(--tm-muted); }

.home-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 38px 20px;
  background: var(--tm-surface);
  border: 1px dashed var(--tm-line-strong);
  border-radius: 4px;
  color: var(--tm-muted);
  text-align: center;
}
.home-empty i { font-size: 24px; color: var(--tm-faint); }
.home-empty p { margin: 0; font-size: 13px; }

.product-card.home-product-skeleton{min-height:0;aspect-ratio:4 / 6.4}
.home-skeleton {
  min-height: 150px;
  background: linear-gradient(90deg, var(--tm-surface-alt) 25%, var(--tm-canvas) 37%, var(--tm-surface-alt) 63%);
  background-size: 400% 100%;
  animation: home-shimmer 1.4s ease infinite;
  border-radius: 4px;
  border: 1px solid var(--tm-line);
}
@keyframes home-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 820px) {
  .home-featured-slider { grid-template-columns: minmax(0,1fr); }
  .home-featured-slider__media { min-height: 190px; }
  .home-featured-slider__media img { height: 180px; }
  .home-featured-slider__content { padding-bottom: 3.2rem; }
  .home-hero { grid-template-columns: 1fr; }
  .home-category-grid,.home-feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .home-hero__visual { grid-template-columns: minmax(0, 1fr); }
  .home-promo-banner { min-height:260px; }
  .home-hero__visual .home-hero__benefits { grid-column:1; }
  .home-hero__product { min-height: 180px; }
  .home-hero__benefits { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
}
@media (max-width: 700px) {
  .tm-table { display: block; }
  .tm-table thead { display: none; }
  .tm-table tbody,.tm-table tr { display: grid; width: 100%; }
  .tm-table tr { gap: .35rem; padding: .85rem; border-bottom: 1px solid var(--tm-line); }
  .tm-table td { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; border: 0; padding: .25rem 0; text-align: start; }
  .tm-table td::before { content: attr(data-label); color: var(--tm-muted); font-weight: 700; flex: none; }
  .tm-table td:first-child { display: block; }
  .tm-table td:first-child::before { display: none; }
}
@media (max-width: 575px) {
   .home-product-grid { grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 210px)); gap: 8px; }
  .home-featured-slider { min-height: 0; }
  .home-promo-banner { min-height:230px; }
  .home-featured-slider__content { padding: 1rem 1rem 3.2rem; }
  .home-featured-slider__media { min-height: 150px; }
  .home-featured-slider__media img { height: 145px; }
  .home-hero__search { flex-wrap: wrap; }
  .home-hero__search .tm-btn { width: 100%; }
  .home-container { gap: 26px; }
}
@media (prefers-reduced-motion: reduce) {
  .home-skeleton { animation: none; }
  .product-card:hover, .category-card:hover { transform: none; }
}

/* Campaign hero and horizontally browsable category rail */
.home-campaign-hero{position:relative;min-height:clamp(330px,39vw,510px);overflow:hidden;background:#092747}
.home-campaign-hero__slide,.home-campaign-hero__fallback{position:relative;min-height:inherit;display:flex;align-items:center}
.home-campaign-hero__image,.home-campaign-hero__shade{position:absolute;inset:0;width:100%;height:100%}
.home-campaign-hero__image{object-fit:cover}
.home-campaign-hero__shade{background:linear-gradient(270deg,rgba(4,20,39,.9) 0%,rgba(4,20,39,.72) 42%,rgba(4,20,39,.12) 100%)}
.home-campaign-hero__inner{position:relative;z-index:1;display:flex;align-items:center;min-height:inherit;padding-block:44px}
.home-campaign-hero__copy{max-width:610px;color:#fff}
.home-campaign-hero__eyebrow{display:inline-flex;align-items:center;gap:8px;margin-bottom:16px;color:#8ce9e5;font-size:13px;font-weight:700}
.home-campaign-hero__copy h1,.home-campaign-hero__fallback h1{margin:0 0 14px;font-size:clamp(27px,3.4vw,44px);line-height:1.55;font-weight:800}
.home-campaign-hero__copy p,.home-campaign-hero__fallback p{max-width:560px;margin:0 0 24px;color:rgba(255,255,255,.82);font-size:15px;line-height:2.1}
.home-campaign-hero__controls{position:absolute;bottom:28px;inset-inline-start:0;display:flex;align-items:center;gap:9px}
.home-campaign-hero__controls button{display:grid;place-items:center;width:10px;height:10px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.48);cursor:pointer}
.home-campaign-hero__controls button:first-child,.home-campaign-hero__controls button:last-child{width:34px;height:34px;background:rgba(255,255,255,.16);color:#fff}
.home-campaign-hero__controls button.is-active{width:25px;border-radius:8px;background:var(--tm-cyan)}
.home-campaign-hero__fallback{padding-block:52px;background:linear-gradient(115deg,#092747,#0d5770);color:#fff}
.home-category-track{display:flex;gap:14px;overflow-x:auto;padding:4px 2px 14px;scroll-snap-type:x mandatory;scrollbar-width:thin}
.home-category-track .category-card{flex:0 0 clamp(190px,22%,250px);min-height:104px;scroll-snap-align:start}
.home-category-track .category-card:hover{transform:translateY(-3px);border-color:var(--tm-cyan)}
@media(max-width:640px){.home-campaign-hero,.home-campaign-hero__slide,.home-campaign-hero__fallback{min-height:360px}.home-campaign-hero__shade{background:linear-gradient(0deg,rgba(4,20,39,.92),rgba(4,20,39,.26))}.home-campaign-hero__inner{align-items:flex-end;padding-block:34px 74px}.home-campaign-hero__copy h1{font-size:27px}.home-campaign-hero__copy p{font-size:13px}.home-campaign-hero__controls{bottom:20px}.home-category-track .category-card{flex-basis:72vw}}

/* Match the product catalogue card dimensions and content rhythm exactly. */
.home-page .product-card{min-width:0;min-height:0;border-radius:4px;box-shadow:var(--tm-card-shadow);transition:border-color .18s,box-shadow .18s}
.home-page .product-card:hover{border-color:var(--tm-line-strong);box-shadow:0 5px 16px rgba(20,20,60,.09);transform:none}
.home-page .product-card__main{min-height:0}
.home-page .product-card__media{position:relative;aspect-ratio:4 / 5;min-height:0;background:#f4f5fa;color:#a5a9bb;font-size:36px;overflow:hidden}
.home-page .product-card__media img{width:100%;height:100%;object-fit:contain;padding:10px}
.home-page .product-card__media-category{position:absolute;z-index:1;top:10px;inset-inline-start:10px;max-width:70%;padding:4px 7px;border-radius:3px;background:#fff;color:#525a70;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.home-page .product-card__body{display:flex;flex:1;flex-direction:column;gap:4px;padding:11px}
.home-page .product-card__brand{margin-bottom:2px;color:var(--tm-blue);font-size:10px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.home-page .product-card__verified{display:inline-flex;align-items:center;gap:4px;color:#14846f;font-size:10px}
.home-page .product-card__mode{align-self:flex-start;padding:2px 6px;border-radius:3px;background:var(--tm-blue-soft);color:var(--tm-blue);font-size:10px;font-weight:700}
.home-page .product-card__name{display:-webkit-box;min-height:44px;overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical;color:var(--tm-ink);font-size:13px;font-weight:650;line-height:1.8}
.home-page .product-card__specs{display:flex;flex-wrap:wrap;gap:5px 10px;margin-top:4px;color:var(--tm-muted);font-size:10px}
.home-page .product-card__specs b{font-weight:500}
.home-page .product-card__company,.home-page .product-card__availability{color:var(--tm-muted);font-size:10px}
.home-page .product-card__foot{display:flex;align-items:end;justify-content:space-between;gap:8px;margin-top:auto;padding:10px 11px 11px;border-top:1px solid var(--tm-line)}
.home-page .product-card__price{display:flex;flex-direction:column;gap:3px;color:var(--tm-ink);font-size:12px}
.home-page .product-card__price small{color:var(--tm-muted);font-size:10px;font-weight:400}
.home-page .product-card__price b{font-size:12px;font-weight:700}
.home-page .product-card__foot .tm-btn{min-height:32px;padding:6px 9px;font-size:10px}
.home-page .product-card-cta{display:inline-flex;align-items:center;gap:4px;color:var(--tm-blue);font-size:10px;font-weight:700;text-decoration:none}
.home-page .product-card__main:focus-visible{outline:2px solid var(--ds-color-focus);outline-offset:-2px}

/* More intentional storefront composition: campaign, proof points, discovery and product shelves. */
.home-container{gap:30px}
.home-section{padding:0}
.home-section .site-section-title{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--tm-line)}
.home-section .site-section-title h2{position:relative;margin:0;color:var(--tm-ink);font-size:19px;font-weight:800}
.home-section .site-section-title h2:after{content:"";position:absolute;right:0;bottom:-11px;width:48px;height:3px;border-radius:4px;background:var(--tm-cyan)}
.home-section .site-section-title>a{display:inline-flex;align-items:center;gap:7px;color:var(--tm-blue);font-size:12px;font-weight:700;text-decoration:none}
.home-marketplace-benefits{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));max-width:var(--ds-container-max-wide);margin:-18px auto 28px;padding:0 var(--ds-container-pad)}
.home-marketplace-benefits>div{display:flex;align-items:center;gap:12px;min-width:0;padding:16px 20px;background:var(--tm-surface);border-inline-start:1px solid var(--tm-line)}
.home-marketplace-benefits>div:first-child{border-inline-start:0;border-radius:0 5px 5px 0}
.home-marketplace-benefits>div:last-child{border-radius:5px 0 0 5px}
.home-marketplace-benefits i{display:grid;place-items:center;flex:none;width:38px;height:38px;border-radius:50%;background:var(--tm-blue-soft);color:var(--tm-blue);font-size:16px}
.home-marketplace-benefits span{display:grid;gap:3px;min-width:0}
.home-marketplace-benefits strong{color:var(--tm-ink);font-size:12px}
.home-marketplace-benefits small{color:var(--tm-muted);font-size:10px;line-height:1.6}
.home-campaign-hero__fallback{width:100%;background:radial-gradient(circle at 15% 30%,rgba(18,184,166,.28),transparent 32%),linear-gradient(115deg,#082746 0%,#0c4268 58%,#126b83 100%)}
.home-campaign-hero__fallback-inner{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(250px,.8fr);align-items:center;gap:clamp(24px,5vw,72px);padding-block:52px}
.home-campaign-hero__fallback-copy{max-width:680px}
.home-campaign-hero__fallback-copy h1{margin:0 0 12px;color:#fff;font-size:clamp(28px,3.5vw,46px);line-height:1.5;font-weight:850}
.home-campaign-hero__fallback-copy p{margin:0 0 22px;color:rgba(255,255,255,.82);font-size:14px;line-height:2}
.home-campaign-hero__fallback-copy .home-hero__search{max-width:600px;border:0;border-radius:6px;padding:6px;background:#fff;box-shadow:0 12px 30px rgba(0,0,0,.18)}
.home-campaign-hero__fallback-copy .home-hero__search input{color:#17324f}
.home-campaign-hero__fallback-copy .home-hero__search .tm-btn{min-height:42px}
.home-campaign-hero__quick-links{display:flex;flex-wrap:wrap;gap:22px;margin-top:18px}
.home-campaign-hero__quick-links a{display:inline-flex;align-items:center;gap:7px;color:#d6f7f5;font-size:12px;font-weight:700;text-decoration:none}
.home-campaign-hero__spotlight{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-width:0;min-height:300px;padding:22px;border:1px solid rgba(255,255,255,.22);border-radius:8px;background:linear-gradient(145deg,rgba(255,255,255,.19),rgba(255,255,255,.07));color:#fff;text-align:center;text-decoration:none;backdrop-filter:blur(5px)}
.home-campaign-hero__spotlight img{width:100%;height:190px;object-fit:contain;filter:drop-shadow(0 15px 18px rgba(0,0,0,.25))}
.home-campaign-hero__spotlight>strong{max-width:32ch;font-size:14px;line-height:1.8}
.home-campaign-hero__spotlight>span:last-child{color:#a9f2e8;font-size:13px;font-weight:700}
.home-campaign-hero__spotlight-label{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;color:#a9f2e8;font-size:11px;font-weight:700}
.home-campaign-hero__spotlight--empty{color:rgba(255,255,255,.75)}
.home-campaign-hero__spotlight-placeholder{font-size:76px}
.home-promo-card{border-radius:7px;transition:transform .18s,border-color .18s,box-shadow .18s}
.home-promo-card:hover{transform:translateY(-3px);border-color:var(--tm-cyan);box-shadow:var(--tm-card-shadow-hover)}
.home-feature{border-radius:7px;transition:border-color .18s,box-shadow .18s}
.home-feature:hover{border-color:var(--tm-line-strong);box-shadow:var(--tm-card-shadow-hover)}
.home-cta{border-radius:7px;background:linear-gradient(110deg,var(--tm-surface),var(--tm-blue-soft))}
@media(max-width:1200px){.home-marketplace-benefits{margin-top:-12px}.home-campaign-hero__fallback-inner{gap:28px}}
@media(max-width:820px){.home-marketplace-benefits{grid-template-columns:1fr;margin:0 auto 22px}.home-marketplace-benefits>div{border-inline-start:0;border-bottom:1px solid var(--tm-line)}.home-marketplace-benefits>div:first-child,.home-marketplace-benefits>div:last-child{border-radius:0}.home-campaign-hero__fallback-inner{grid-template-columns:1fr;padding-block:36px}.home-campaign-hero__spotlight{min-height:220px}.home-campaign-hero__spotlight img{height:130px}}
@media(prefers-reduced-motion:reduce){.home-promo-card,.home-feature{transition:none}.home-promo-card:hover{transform:none}}
</style>