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
import StoreSectionHeading from '@telecom/shared-ui/components/store/StoreSectionHeading.vue'
import StoreCategoryCard from '@telecom/shared-ui/components/store/StoreCategoryCard.vue'
import StoreProductCard from '@telecom/shared-ui/components/store/StoreProductCard.vue'

const router = useRouter()
const productsStore = useProductsStore()
const authStore = useAuthStore()
const showMyInquiriesLink = computed(() => authStore.isAuthenticated && authStore.isCustomer)

const featuredProducts = ref([])
const recentProducts = ref([])
const retailLatestProducts = ref([])
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
const searchMode = ref('retail')
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
function prefersReducedMotion() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}
// Pause the two autoplay loops while the tab is hidden so off-screen work stops.
function handleVisibilityChange() {
  if (typeof document !== 'undefined' && document.hidden) { stopSlider(); stopBannerSlider() }
  else { startSlider(); startBannerSlider() }
}
// Entrance choreography for the storefront sections. The hidden state lives under
// `prefers-reduced-motion: no-preference` in CSS, so the reduced/no-JS page is the
// finished page; the observer only adds the revealed class once per element.
let revealObserver = null
function getRevealObserver() {
  if (revealObserver || typeof IntersectionObserver === 'undefined') return revealObserver
  revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('is-revealed')
      revealObserver.unobserve(entry.target)
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 })
  return revealObserver
}
const vReveal = {
  mounted(el) {
    if (prefersReducedMotion()) { el.classList.add('is-revealed'); return }
    el.classList.add('home-reveal')
    const observer = getRevealObserver()
    if (!observer) { el.classList.add('is-revealed'); return }
    observer.observe(el)
  },
  unmounted(el) { if (revealObserver) revealObserver.unobserve(el) },
}
// Bound the stagger so the last card in a long shelf never waits long.
function revealDelay(index, step = 45) {
  return Math.min(index, 9) * step + 'ms'
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
      const retailResponse = await productsApi.list({ page: 1, limit: 8, status: 'PUBLISHED', retailEnabled: true, sortBy: 'createdAt', sortOrder: 'desc' })
      const retailItems = retailResponse?.data?.data ?? []
      retailLatestProducts.value = Array.isArray(retailItems) ? retailItems.slice(0, 8) : []
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
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', handleVisibilityChange)
})
onUnmounted(() => { stopSlider(); stopBannerSlider() })
onUnmounted(() => {
  if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (revealObserver) { revealObserver.disconnect(); revealObserver = null }
})
</script>
<template>
  <main class="home-page" dir="rtl">
    <section class="home-hero" aria-label="بازارگاه تخصصی تجهیزات شبکه و مخابرات">
      <div class="home-container home-hero__inner">
        <div class="home-hero__copy">
          <span class="home-hero__tag">{{ activeBanner?.eyebrow || 'بازارگاه تخصصی تجهیزات شبکه و مخابرات' }}</span>
          <h1>تجهیزات پروژه‌تان را<br />سریع و مطمئن تأمین کنید</h1>
          <p>{{ activeBanner?.description || 'هم خرید فوری با قیمت مشخص، هم استعلام و پیش‌فاکتور سازمانی از تأمین‌کنندگان بازارگاه.' }}</p>

          <div class="home-hero__tabs" role="group" aria-label="نوع جستجو">
            <button type="button" :class="{ 'is-active': searchMode === 'retail' }" @click="searchMode = 'retail'">خرید فوری</button>
            <button type="button" :class="{ 'is-active': searchMode === 'inquiry' }" @click="searchMode = 'inquiry'">خرید سازمانی / استعلام</button>
          </div>

          <form class="home-hero__search" role="search" aria-label="جستجوی محصولات" @submit.prevent="heroSearch">
            <i class="pi pi-search" aria-hidden="true"></i>
            <label class="sr-only" for="home-hero-search">جستجوی محصول</label>
            <input id="home-hero-search" v-model="searchQuery" type="search" :placeholder="searchMode === 'retail' ? 'نام محصول، برند، مدل یا SKU را جستجو کنید…' : 'نام تجهیز یا مشخصات مورد نیاز پروژه را بنویسید…'" autocomplete="off" />
            <button type="submit">جستجو</button>
          </form>

          <div class="home-hero__chips">
            <span>پرتکرار:</span>
            <button type="button" @click="searchQuery = 'OTDR'; heroSearch()">OTDR</button>
            <button type="button" @click="searchQuery = 'Power Meter'; heroSearch()">Power Meter</button>
            <button type="button" @click="searchQuery = 'Fusion Splicer'; heroSearch()">Fusion Splicer</button>
            <button type="button" @click="searchQuery = 'آنتن'; heroSearch()">آنتن</button>
          </div>

          <div class="home-hero__actions">
            <router-link :to="{ name: 'my-inquiries' }" class="home-btn home-btn--primary">ثبت درخواست استعلام</router-link>
            <router-link :to="{ name: 'products' }" class="home-btn home-btn--outline">مشاهده همه محصولات</router-link>
          </div>

          <div v-if="promotionalBanners.length > 1" class="home-hero__dots" aria-label="اسلایدهای کمپین">
            <button v-for="(banner, index) in promotionalBanners" :key="banner.id" type="button" :class="{ 'is-active': index === activeBannerIndex }" :aria-label="'نمایش اسلاید ' + (index + 1)" @click="activeBannerIndex = index; stopBannerSlider()" />
          </div>
        </div>

        <router-link v-if="activeFeaturedProduct" :to="productRoute(activeFeaturedProduct)" class="home-hero__featured">
          <div class="home-hero__featured-image">
            <img v-if="getProductImage(activeFeaturedProduct)?.url" :src="getProductImage(activeFeaturedProduct).url" :alt="activeFeaturedProduct.name || activeFeaturedProduct.title" width="720" height="460" fetchpriority="high" />
            <span v-else>{{ activeFeaturedProduct.brand || activeFeaturedProduct.company?.name || 'Telecom' }}</span>
          </div>
          <strong>{{ activeFeaturedProduct.name || activeFeaturedProduct.title }}</strong>
          <small>{{ productCategoryName(activeFeaturedProduct) || 'تجهیزات شبکه و مخابرات' }}</small>
          <div class="home-hero__featured-foot">
            <b>{{ productPriceLabel(activeFeaturedProduct) }}</b>
            <span>مشاهده محصول <i class="pi pi-arrow-left" aria-hidden="true"></i></span>
          </div>
        </router-link>
        <div v-else class="home-hero__featured home-hero__featured--empty">
          <i class="pi pi-box" aria-hidden="true"></i>
          <strong>کاتالوگ تجهیزات شبکه و مخابرات</strong>
          <small>برای مشاهده محصولات منتشرشده وارد کاتالوگ شوید.</small>
          <router-link :to="{ name: 'products' }">مشاهده محصولات <i class="pi pi-arrow-left" aria-hidden="true"></i></router-link>
        </div>
      </div>
    </section>

    <div class="home-container home-content">
      <section class="home-section" aria-labelledby="home-categories">
        <StoreSectionHeading heading-id="home-categories" title="دسته‌بندی محصولات" action-label="همه دسته‌بندی‌ها" :action-to="{ name: 'categories' }" />
        <div v-if="categoriesLoading" class="home-category-track" aria-busy="true"><div v-for="i in 6" :key="i" class="home-loading-card" /></div>
        <div v-else-if="categoriesError" class="home-state" role="alert"><i class="pi pi-exclamation-circle" aria-hidden="true" /><span>دریافت دسته‌بندی‌ها با مشکل روبه‌رو شد.</span><button type="button" @click="fetchCategories">تلاش دوباره</button></div>
        <div v-else-if="!categories.length" class="home-state"><i class="pi pi-folder-open" aria-hidden="true" /><span>دسته‌بندی فعالی برای نمایش وجود ندارد.</span></div>
        <div v-else class="home-category-track">
          <StoreCategoryCard v-for="(category, index) in visibleCategories" :key="category.id" as="button" variant="tile" :category="category" :icon="categoryIcon(category)" :count="categoryProductCount(category)" @select="viewCategoryProducts(category.id)" />
        </div>
      </section>

      <section class="home-section" aria-labelledby="home-latest">
        <StoreSectionHeading heading-id="home-latest" title="تازه‌ترین محصولات" action-label="مشاهده همه" :action-to="{ name: 'products' }" />
        <div v-if="loading" class="home-product-grid" aria-busy="true"><div v-for="i in 4" :key="i" class="home-loading-product" /></div>
        <div v-else-if="error" class="home-state" role="alert"><i class="pi pi-exclamation-circle" aria-hidden="true" /><span>{{ error }}</span><button type="button" @click="fetchProducts">تلاش دوباره</button></div>
        <div v-else-if="!recentProducts.length" class="home-state"><i class="pi pi-box" aria-hidden="true" /><span>هنوز محصول منتشرشده‌ای برای نمایش وجود ندارد.</span></div>
        <div v-else class="home-product-grid">
          <StoreProductCard v-for="product in recentProducts.slice(0, 4)" :key="product.id" :product="product" :to="productRoute(product)" :category="productCategoryName(product)" :verified="Boolean(product.company?.isVerified)" :mode="productSalesMode(product)" :price-label="productPriceLabel(product)" :availability="productAvailabilityLabel(product)">
            <template #action>
              <router-link :to="productRoute(product)" class="home-product-action">مشاهده محصول <i class="pi pi-arrow-left" aria-hidden="true" /></router-link>
            </template>
          </StoreProductCard>
        </div>
      </section>

      <section class="home-section" aria-labelledby="home-why">
        <StoreSectionHeading heading-id="home-why" title="چرا Telecom Market؟" />
        <div class="home-benefits">
          <article><i class="pi pi-verified" aria-hidden="true" /><b>تأمین‌کننده قابل بررسی</b><p>اطلاعات شرکت عرضه‌کننده و وضعیت تأیید آن را در صفحه محصول ببینید.</p></article>
          <article><i class="pi pi-shield" aria-hidden="true" /><b>اطلاعات شفاف محصول</b><p>مشخصات و شرایط ارائه محصول را پیش از ثبت درخواست بررسی کنید.</p></article>
          <article><i class="pi pi-wrench" aria-hidden="true" /><b>تجهیزات تخصصی</b><p>محصولات شبکه و مخابرات را در دسته‌بندی‌های تخصصی مرور کنید.</p></article>
          <article><i class="pi pi-file-edit" aria-hidden="true" /><b>استعلام سازمانی</b><p>برای نیازهای پروژه‌ای، درخواست استعلام خود را ثبت و پیگیری کنید.</p></article>
        </div>
      </section>

      <section class="home-section" aria-labelledby="home-retail-latest">
        <StoreSectionHeading heading-id="home-retail-latest" title="جدیدترین محصولات خرده‌فروشی" action-label="همه محصولات خرده‌فروشی" :action-to="{ name: 'products', query: { retail: '1' } }" />
        <div v-if="retailLatestProducts.length" class="home-product-grid">
          <StoreProductCard v-for="product in retailLatestProducts.slice(0, 4)" :key="product.id" :product="product" :to="productRoute(product)" :category="productCategoryName(product)" :verified="Boolean(product.company?.isVerified)" :mode="{ kind: 'fixed', label: 'فروش خرده‌فروشی' }" price-caption="قیمت" :price-label="productPriceLabel(product)">
            <template #action><router-link :to="productRoute(product)" class="home-product-action">مشاهده محصول <i class="pi pi-arrow-left" aria-hidden="true" /></router-link></template>
          </StoreProductCard>
        </div>
        <div v-else class="home-state"><i class="pi pi-shopping-bag" aria-hidden="true" /><span>در حال حاضر محصول خرده‌فروشی منتشرشده‌ای برای نمایش وجود ندارد.</span></div>
      </section>

      <section class="home-section" aria-labelledby="home-bestsellers">
        <StoreSectionHeading heading-id="home-bestsellers" title="پرفروش‌ترین محصولات خرده‌فروشی" action-label="مشاهده محصولات" :action-to="{ name: 'products', query: { retail: '1' } }" />
        <div class="home-state"><i class="pi pi-chart-bar" aria-hidden="true" /><span>رتبه‌بندی فروش تا زمان فراهم‌شدن دادهٔ واقعی سفارش و فروش نمایش داده نمی‌شود.</span></div>
      </section>

      <section class="home-faq home-section" aria-labelledby="home-faq">
        <StoreSectionHeading heading-id="home-faq" title="سؤالات متداول" />
        <details open><summary>چطور درخواست استعلام ثبت کنم؟</summary><p>از طریق دکمه ثبت درخواست استعلام وارد مسیر مربوط شوید و اطلاعات نیاز پروژه را ثبت کنید.</p></details>
        <details><summary>چطور محصول مناسب را پیدا کنم؟</summary><p>از جستجو و دسته‌بندی محصولات استفاده کنید و مشخصات محصول را در صفحه جزئیات بررسی کنید.</p></details>
        <details><summary>خرید فوری با استعلام چه تفاوتی دارد؟</summary><p>برای محصولاتی که قیمت و امکان خرده‌فروشی آن‌ها فعال است، شرایط خرید در صفحه محصول نمایش داده می‌شود؛ سایر موارد از مسیر استعلام پیگیری می‌شوند.</p></details>
        <details><summary>اطلاعات تأمین‌کننده را کجا ببینم؟</summary><p>اطلاعات عمومی شرکت عرضه‌کننده در صفحه جزئیات محصول در دسترس است.</p></details>
      </section>

      <section class="home-rfq">
        <div><h2>محصول مورد نظر را پیدا نکردید؟</h2><p>درخواست استعلام ثبت کنید تا نیاز پروژه‌تان از مسیر تأمین‌کنندگان پیگیری شود.</p></div>
        <router-link :to="{ name: 'my-inquiries' }" class="home-btn home-btn--primary">ثبت درخواست استعلام <i class="pi pi-arrow-left" aria-hidden="true" /></router-link>
      </section>
    </div>
  </main>
</template>
<style scoped>
.home-page{--tm-canvas:#f4f5fa;--tm-surface:#fff;--tm-ink:#12182b;--tm-muted:#6b7390;--tm-line:#e4e7f2;--tm-blue:#6c5ce7;--tm-cyan:#2aa7e8;--tm-green:#0f9d73;--tm-chip:#eceaff;--tm-card-shadow:0 2px 10px rgba(20,30,70,.06);background:var(--tm-canvas);color:var(--tm-ink);font-family:Vazirmatn,Tahoma,sans-serif}
.home-container{width:100%;max-width:1240px;margin-inline:auto;padding-inline:20px}
.home-hero{position:relative;overflow:hidden;padding:44px 0 56px;background:linear-gradient(135deg,#0a2540,#126b8a);color:#fff}
.home-hero__inner{display:grid;grid-template-columns:1.2fr 1fr;gap:36px;align-items:center}
.home-hero__copy{min-width:0}.home-hero__tag{color:#7fe3ff;font-size:13px;font-weight:600}
.home-hero h1{margin:6px 0 10px;color:#fff;font-size:clamp(27px,3vw,38px);line-height:1.5;font-weight:800}
.home-hero__copy>p{max-width:560px;margin:0;color:#cfe6f2;font-size:14px;line-height:2}
.home-hero__tabs{display:inline-flex;gap:3px;margin:20px 0 12px;padding:4px;border-radius:12px;background:rgba(255,255,255,.12)}
.home-hero__tabs button{padding:8px 18px;border:0;border-radius:9px;background:transparent;color:#d9ecf6;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.home-hero__tabs button.is-active{background:#fff;color:#12182b}
.home-hero__search{display:flex;align-items:center;gap:4px;max-width:600px;padding:6px;border-radius:12px;background:#fff;color:#12182b}
.home-hero__search>i{padding-inline:9px;color:#6c5ce7}.home-hero__search input{flex:1;min-width:0;height:40px;border:0;outline:0;background:transparent;color:#12182b;font:inherit;font-size:13px}
.home-hero__search button{height:40px;padding:0 18px;border:0;border-radius:9px;background:linear-gradient(90deg,#6c5ce7,#2aa7e8);color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.home-hero__chips{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:12px;color:#bcd9e8;font-size:12px}
.home-hero__chips button{padding:2px 12px;border:0;border-radius:99px;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-size:12px;cursor:pointer}
.home-hero__actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}
.home-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:9px 18px;border:1px solid transparent;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none}
.home-btn--primary{background:linear-gradient(90deg,#6c5ce7,#2aa7e8);color:#fff}
.home-btn--outline{border-color:rgba(255,255,255,.5);background:transparent;color:#fff}
.home-hero__featured{display:flex;flex-direction:column;min-width:0;padding:18px;border:1px solid rgba(255,255,255,.2);border-radius:18px;background:rgba(255,255,255,.1);color:#fff;text-decoration:none;backdrop-filter:blur(6px)}
.home-hero__featured-image{display:grid;place-items:center;height:190px;overflow:hidden;border-radius:12px;background:linear-gradient(135deg,#1c5d7d,#2d8aa8);color:#fff;font-size:38px;font-weight:800}
.home-hero__featured-image img{width:100%;height:100%;object-fit:contain;padding:12px}
.home-hero__featured>strong{margin-top:12px;font-size:16px}.home-hero__featured>small{color:#bcd9e8;font-size:11px}
.home-hero__featured-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;font-size:13px}.home-hero__featured-foot b{font-size:13px}.home-hero__featured-foot span{display:flex;align-items:center;gap:7px;color:#7fe3ff}
.home-hero__featured--empty{min-height:280px;justify-content:center;align-items:center;text-align:center;gap:12px}.home-hero__featured--empty>i{font-size:48px;color:#7fe3ff}.home-hero__featured--empty>small{max-width:28ch}.home-hero__featured--empty>a{color:#fff;font-size:13px}
.home-hero__dots{display:flex;gap:8px;margin-top:16px}.home-hero__dots button{width:9px;height:9px;padding:0;border:0;border-radius:9px;background:rgba(255,255,255,.4);cursor:pointer}.home-hero__dots button.is-active{width:26px;background:#fff}
.home-content{display:flex;flex-direction:column;gap:30px;padding-block:28px 40px}
.home-section{min-width:0}.home-category-track{display:flex;gap:14px;overflow-x:auto;padding:4px 2px 10px;scroll-snap-type:x mandatory;scrollbar-width:none}.home-category-track::-webkit-scrollbar{display:none}.home-category-track>:deep(.store-category-card){flex:0 0 172px;scroll-snap-align:start}
.home-product-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.home-benefits{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.home-benefits article{min-width:0;padding:18px;border-radius:14px;background:#fff;box-shadow:var(--tm-card-shadow);font-size:13px;color:var(--tm-muted)}
.home-benefits article>i{display:grid;place-items:center;width:42px;height:42px;margin-bottom:10px;border-radius:12px;background:var(--tm-chip);color:var(--tm-blue);font-size:19px}
.home-benefits b{display:block;margin-bottom:4px;color:var(--tm-ink);font-size:14px}.home-benefits p{margin:0;font-size:12px;line-height:1.9}
.home-product-action{display:inline-flex;align-items:center;gap:7px;color:var(--tm-blue);font-size:12px;font-weight:700;text-decoration:none}
.home-state{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px;min-height:110px;padding:22px;border:1px dashed var(--tm-line);border-radius:14px;background:#fff;color:var(--tm-muted);font-size:13px;text-align:center}
.home-state>i{color:var(--tm-blue);font-size:22px}.home-state button{border:0;background:transparent;color:var(--tm-blue);font:inherit;font-weight:700;cursor:pointer}
.home-loading-card{flex:0 0 172px;height:108px;border-radius:14px;background:linear-gradient(90deg,#eceef5,#f8f9fc,#eceef5);background-size:200% 100%;animation:home-shimmer 1.4s infinite}
.home-loading-product{height:270px;border-radius:14px;background:linear-gradient(90deg,#eceef5,#f8f9fc,#eceef5);background-size:200% 100%;animation:home-shimmer 1.4s infinite}
@keyframes home-shimmer{to{background-position-x:-200%}}
.home-faq details{margin-bottom:10px;padding:14px 18px;border-radius:12px;background:#fff;box-shadow:var(--tm-card-shadow);font-size:13px}
.home-faq summary{color:var(--tm-ink);font-weight:700;cursor:pointer}.home-faq details p{margin:8px 0 0;color:var(--tm-muted);font-size:12px;line-height:1.9}
.home-rfq{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;margin:4px 0 10px;padding:26px 30px;border:1px solid var(--tm-line);border-radius:18px;background:linear-gradient(90deg,var(--tm-chip),#fff)}
.home-rfq h2{margin:0;color:var(--tm-ink);font-size:20px}.home-rfq p{margin:4px 0 0;color:var(--tm-muted);font-size:13px}
@media(max-width:900px){.home-hero__inner{grid-template-columns:1fr}.home-hero__featured{max-width:560px}.home-benefits{grid-template-columns:repeat(2,minmax(0,1fr))}.home-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.home-container{padding-inline:14px}.home-hero{padding:30px 0 36px}.home-hero h1{font-size:27px}.home-hero__tabs{display:flex;width:100%}.home-hero__tabs button{flex:1;padding-inline:8px;font-size:11px}.home-hero__search input{font-size:11px}.home-hero__search button{padding-inline:10px}.home-benefits{grid-template-columns:1fr 1fr;gap:9px}.home-benefits article{padding:13px}.home-product-grid{gap:9px}.home-rfq{padding:20px}.home-rfq h2{font-size:17px}}
@media(prefers-reduced-motion:reduce){.home-loading-card,.home-loading-product{animation:none}}
</style>
