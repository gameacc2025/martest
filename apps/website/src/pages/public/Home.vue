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
import { productsApi } from '@telecom/api-client'
import { useProductsStore } from '../../stores/products'
import { productSalesMode, productPriceLabel } from './homePresentation.js'

const router = useRouter()
const productsStore = useProductsStore()
const authStore = useAuthStore()
const showMyInquiriesLink = computed(() => authStore.isAuthenticated && authStore.isCustomer)

const featuredProducts = ref([])
const recentProducts = ref([])
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

const features = [
  { icon: 'pi pi-file-edit', title: 'استعلام برای پروژه‌ها', text: 'درخواست قیمت را برای نیازهای سازمانی ثبت کنید و پاسخ تأمین‌کنندگان را پیگیری کنید.' },
  { icon: 'pi pi-list-check', title: 'بررسی مشخصات فنی', text: 'اطلاعات فنی ثبت‌شده محصولات را پیش از انتخاب بررسی کنید.' },
  { icon: 'pi pi-building', title: 'شناخت تأمین‌کننده', text: 'مشخصات شرکت و وضعیت احراز آن را در صورت ثبت و تأیید مشاهده کنید.' },
  { icon: 'pi pi-shopping-cart', title: 'خرید یا استعلام', text: 'نوع ارائه، قیمت و شرایط هر محصول را پیش از مشاهده جزئیات بررسی کنید.' },
]
const visibleCategories = computed(() => categories.value.slice(0, 8))

async function fetchProducts() {
  try {
    loading.value = true
    error.value = null
    const params = { page: 1, limit: 24, status: 'PUBLISHED' }

    const response = await productsApi.list(params)
    const items = response?.data?.data ?? []
    recentProducts.value = (Array.isArray(items) ? items : []).slice(0, 12)

    // Featured is a server-side product flag, not a slice of recent results.
    try {
      const featuredResponse = await productsApi.list({ ...params, limit: 12, featured: true })
      const featuredItems = featuredResponse?.data?.data ?? []
      featuredProducts.value = Array.isArray(featuredItems) ? featuredItems.slice(0, 12) : []
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
})
onUnmounted(stopSlider)
</script>

<template>
  <div class="home-page" dir="rtl">
    <section class="home-hero-band">
      <div class="home-container">
        <section class="site-hero home-hero" aria-labelledby="home-title">
          <div class="home-hero__copy">
            <span class="home-hero__eyebrow"><i class="pi pi-broadcast" aria-hidden="true"></i> بازارگاه تخصصی تجهیزات مخابراتی</span>
            <h1 id="home-title">تجهیزات مخابراتی برای خرید و پروژه</h1>
            <p>محصولات شبکه را پیدا کنید، قیمت‌های قابل‌خرید را ببینید یا برای نیازهای سازمانی درخواست استعلام بفرستید.</p>
            <form class="home-hero__search" role="search" @submit.prevent="heroSearch">
              <i class="pi pi-search" aria-hidden="true"></i>
              <input v-model="searchQuery" type="search" name="homepage-search" autocomplete="off" placeholder="نام محصول، برند یا دسته‌بندی را جستجو کنید…" aria-label="جستجوی محصولات" />
              <button type="submit" class="tm-btn tm-btn--accent">جستجو</button>
            </form>
            <div class="home-hero__actions">
              <router-link :to="{ name: 'products' }" class="tm-btn tm-btn--accent">مشاهده محصولات</router-link>
              <router-link :to="{ name: 'my-inquiries' }" class="tm-btn tm-btn--outline">ثبت درخواست استعلام</router-link>
            </div>
            <div class="home-hero__links">
              <router-link :to="{ name: 'products' }">همه محصولات</router-link>
              <router-link :to="{ name: 'categories' }">دسته‌بندی‌ها</router-link>
              <router-link v-if="showMyInquiriesLink" :to="{ name: 'my-inquiries' }">استعلام‌های من</router-link>
            </div>
          </div>
          <div class="home-hero__visual" aria-label="اسلایدر محصولات منتخب فروشگاه">
            <div v-if="activeFeaturedProduct" class="home-featured-slider" @mouseenter="stopSlider" @mouseleave="startSlider" @focusin="stopSlider" @focusout="handleSliderFocusOut">
              <div class="home-featured-slider__media">
                <img v-if="getProductImage(activeFeaturedProduct)" :src="getProductImage(activeFeaturedProduct).url" :alt="activeFeaturedProduct.name || activeFeaturedProduct.title || 'محصول منتخب'" width="560" height="390" fetchpriority="high" decoding="async" />
                <i v-else class="pi pi-box" aria-hidden="true"></i>
                <span class="home-featured-slider__flag"><i class="pi pi-star-fill" aria-hidden="true"></i> منتخب فروشگاه</span>
              </div>
              <div class="home-featured-slider__content">
                <span class="home-featured-slider__eyebrow">{{ productCategoryName(activeFeaturedProduct) || 'تجهیزات تخصصی مخابراتی' }}</span>
                <h2>{{ activeFeaturedProduct.name || activeFeaturedProduct.title }}</h2>
                <p v-if="activeFeaturedProduct.company?.name">{{ activeFeaturedProduct.company.name }}</p>
                <strong>{{ productPriceLabel(activeFeaturedProduct) }}</strong>
                <router-link :to="productRoute(activeFeaturedProduct)" class="tm-btn tm-btn--accent">مشاهده محصول <i class="pi pi-arrow-left" aria-hidden="true"></i></router-link>
              </div>
              <div v-if="featuredSlides.length > 1" class="home-featured-slider__controls" aria-label="کنترل اسلایدر">
                <button type="button" aria-label="اسلاید قبلی" @click="previousSlide"><i class="pi pi-chevron-right" aria-hidden="true"></i></button>
                <div class="home-featured-slider__dots">
                  <button v-for="(slide, index) in featuredSlides" :key="slide.id" type="button" :class="{ 'is-active': index === activeSlide }" :aria-label="'نمایش اسلاید ' + (index + 1)" :aria-pressed="index === activeSlide" @click="goToSlide(index)"></button>
                </div>
                <button type="button" aria-label="اسلاید بعدی" @click="nextSlide"><i class="pi pi-chevron-left" aria-hidden="true"></i></button>
              </div>
            </div>
            <div v-else class="home-hero__product">
              <i class="pi pi-box" aria-hidden="true"></i>
              <span class="home-hero__product-caption">محصولات تخصصی شبکه و مخابرات</span>
            </div>
            <ul class="home-hero__benefits">
              <li><i class="pi pi-check-circle" aria-hidden="true"></i><span>کاتالوگ تخصصی تجهیزات شبکه</span></li>
              <li><i class="pi pi-file-edit" aria-hidden="true"></i><span>مسیر جداگانه برای استعلام پروژه‌ای</span></li>
              <li><i class="pi pi-building" aria-hidden="true"></i><span>اطلاعات تأمین‌کنندگان ثبت‌شده</span></li>
            </ul>
          </div>
        </section>
      </div>
    </section>
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

        <div v-else class="home-category-grid">
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
          <h2 id="home-featured">محصولات ویژه</h2>
          <router-link :to="{ name: 'products' }">همه محصولات</router-link>
        </div>

        <div v-if="loading" class="home-product-grid" aria-busy="true">
          <div v-for="i in 4" :key="i" class="home-product-card home-skeleton"></div>
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
          <article v-for="product in featuredProducts" :key="product.id" class="product-card">
            <router-link :to="productRoute(product)" class="product-card__main">
              <span class="product-card__media">
                <img v-if="getProductImage(product)" :src="getProductImage(product).url" :alt="product.name || product.title || 'تصویر محصول'" width="320" height="240" loading="lazy" decoding="async" />
                <i v-else class="pi pi-box" aria-hidden="true"></i>
              </span>
              <span class="product-card__body">
                <span v-if="product.company?.isVerified" class="tm-pill tm-pill--success"><i class="pi pi-verified" aria-hidden="true"></i> تأمین‌کننده احرازشده</span>
                <span class="product-card__mode" :class="'product-card__mode--' + productSalesMode(product).kind">{{ productSalesMode(product).label }}</span>
                <span class="product-card__name">{{ product.name || product.title }}</span>
                <span v-if="product.sku" class="product-sku">کد محصول: <b dir="ltr">{{ product.sku }}</b></span>
                <span v-if="productCategoryName(product)" class="product-card__category">{{ productCategoryName(product) }}</span>
                <span v-if="product.company?.name" class="product-card__company">{{ product.company.name }}</span>
                <span v-if="productAvailabilityLabel(product)" class="product-card__availability">{{ productAvailabilityLabel(product) }}</span>
              </span>
            </router-link>
            <div class="product-card__foot">
              <span class="product-card__price">{{ productPriceLabel(product) }}</span>
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
          <div v-for="n in 3" :key="n" class="home-skeleton" style="min-height:100px"></div>
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
          <article v-for="product in recentProducts" :key="product.id" class="product-card">
            <router-link :to="productRoute(product)" class="product-card__main">
              <span class="product-card__media">
                <img v-if="getProductImage(product)" :src="getProductImage(product).url" :alt="product.name || product.title || 'تصویر محصول'" width="320" height="240" loading="lazy" decoding="async" />
                <i v-else class="pi pi-box" aria-hidden="true"></i>
              </span>
              <span class="product-card__body">
                <span v-if="product.company?.isVerified" class="tm-pill tm-pill--success"><i class="pi pi-verified" aria-hidden="true"></i> تأمین‌کننده احرازشده</span>
                <span class="product-card__mode" :class="'product-card__mode--' + productSalesMode(product).kind">{{ productSalesMode(product).label }}</span>
                <span class="product-card__name">{{ product.name || product.title }}</span>
                <span v-if="product.sku" class="product-sku">کد محصول: <b dir="ltr">{{ product.sku }}</b></span>
                <span v-if="productCategoryName(product)" class="product-card__category">{{ productCategoryName(product) }}</span>
                <span v-if="product.company?.name" class="product-card__company">{{ product.company.name }}</span>
                <span v-if="productAvailabilityLabel(product)" class="product-card__availability">{{ productAvailabilityLabel(product) }}</span>
              </span>
            </router-link>
            <div class="product-card__foot">
              <span class="product-card__price">{{ productPriceLabel(product) }}</span>
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

      <section class="home-cta home-cta--retail">
        <div><h2>برای خرید مستقیم آماده‌اید؟</h2><p>محصولات دارای قیمت ثابت را در کاتالوگ پیدا کنید و جزئیات شرایط ارائه را بررسی کنید.</p></div>
        <router-link :to="{ name: 'products' }" class="tm-btn tm-btn--accent">جستجوی محصولات قیمت‌دار</router-link>
      </section>

    </div>
  </div>
</template>

<style scoped>
.home-page { background: var(--tm-canvas); }
.home-hero-band { width: 100%; padding-block: clamp(1rem, 2vw, 2rem); background: var(--ds-hero-gradient); }
.home-hero-band .home-container { padding-block: 0; }
.home-hero { border-radius: var(--tm-radius-lg); background: transparent; }
.home-hero__actions { display: flex; flex-wrap: wrap; gap: .65rem; margin-top: 1rem; }
.home-hero__actions .tm-btn { min-height: 44px; }
.home-hero__visual { display: grid; grid-template-columns: minmax(0,1fr); gap: 1rem; align-items: center; }
.home-hero__product { min-width: 0; min-height: 250px; display: grid; place-items: center; gap: .5rem; padding: 1rem; border: 1px solid rgba(255,255,255,.2); border-radius: 6px; background: rgba(255,255,255,.1); color: #fff; }
.home-hero__product img { width: 100%; max-height: 230px; object-fit: contain; }
.home-hero__product > i { font-size: 5rem; color: rgba(255,255,255,.82); }
.home-hero__product-caption { max-width: 100%; color: #fff; font-size: .8125rem; text-align: center; overflow-wrap: anywhere; }
.home-hero__benefits { display: grid; gap: .85rem; list-style: none; margin: 0; padding: 0; color: #f4fbff; font-size: .875rem; }
.home-hero__benefits li { display: flex; gap: .55rem; align-items: flex-start; }
.home-hero__benefits i { color: #8ef3f1; margin-top: .2rem; }
.home-container {
  width: 100%;
  max-width: var(--ds-container-max-wide);
  margin-inline: auto;
  padding-inline: var(--ds-container-pad);
  display: flex;
  flex-direction: column;
  gap: 34px;
}


.home-featured-slider { position: relative; display: grid; grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr); min-height: 300px; overflow: hidden; border: 1px solid rgba(255,255,255,.24); border-radius: 8px; background: linear-gradient(145deg, rgba(255,255,255,.16), rgba(255,255,255,.07)); box-shadow: 0 14px 34px rgba(3,18,45,.22); }
.home-featured-slider__media { position: relative; display: grid; place-items: center; min-width: 0; padding: 1.25rem; background: rgba(255,255,255,.08); }
.home-featured-slider__media img { width: 100%; height: 230px; object-fit: contain; filter: drop-shadow(0 12px 14px rgba(0,0,0,.16)); }
.home-featured-slider__media > i { font-size: 5rem; color: rgba(255,255,255,.8); }
.home-featured-slider__flag { position: absolute; top: 12px; inset-inline-start: 12px; display: inline-flex; gap: 6px; align-items: center; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.94); color: var(--tm-navy); font-size: 12px; font-weight: 700; }
.home-featured-slider__content { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: .7rem; min-width: 0; padding: 1.5rem; color: #fff; }
.home-featured-slider__eyebrow { color: #9af2ee; font-size: 12px; font-weight: 700; }
.home-featured-slider__content h2 { margin: 0; color: #fff; font-size: clamp(17px, 1.6vw, 23px); line-height: 1.7; overflow-wrap: anywhere; }
.home-featured-slider__content p { margin: 0; color: rgba(255,255,255,.72); font-size: 13px; }
.home-featured-slider__content strong { color: #fff; font-size: 15px; }
.home-featured-slider__controls { position: absolute; inset-inline: 14px; bottom: 12px; display: flex; align-items: center; justify-content: space-between; pointer-events: none; }
.home-featured-slider__controls > button,.home-featured-slider__dots button { pointer-events: auto; }
.home-featured-slider__controls > button { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid rgba(255,255,255,.3); border-radius: 50%; background: rgba(5,25,55,.42); color: #fff; cursor: pointer; }
.home-featured-slider__dots { display: flex; align-items: center; gap: 6px; }
.home-featured-slider__dots button { width: 7px; height: 7px; padding: 0; border: 0; border-radius: 99px; background: rgba(255,255,255,.45); cursor: pointer; transition: width .18s ease, background .18s ease; }
.home-featured-slider__dots button.is-active { width: 22px; background: #fff; }
.home-product-grid--recent { grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); }

/* Hero */
.home-hero { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 0.9fr); gap: 32px; align-items: center; }
.home-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border-radius: var(--tm-radius-pill);
  background: rgba(46, 211, 238, 0.14);
  border: 1px solid rgba(46, 211, 238, 0.35);
  color: var(--tm-cyan-soft);
  font-size: 13px;
  font-weight: 600;
}
.home-hero h1 { margin: 16px 0 12px; font-size: clamp(24px, 3vw, 38px); line-height: 1.35; color: #fff; }
.home-hero p { margin: 0 0 22px; max-width: 56ch; color: var(--tm-cyan-soft); font-size: 14px; line-height: 1.9; }

.home-hero__search {
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
.home-hero__links a { color: var(--tm-cyan-soft); font-size: 13px; font-weight: 600; text-decoration: none; }
.home-hero__links a:hover { color: #fff; text-decoration: underline; }

.home-hero__aside { display: flex; flex-direction: column; gap: 10px; }
.home-hero__badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  border-radius: var(--tm-radius);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: var(--tm-cyan-soft);
  font-size: 13px;
  font-weight: 500;
}
.home-hero__badge i { color: var(--tm-cyan); }

/* Sections */
.home-section { min-width: 0; }

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
.category-card:hover { border-color: var(--tm-cyan-strong); box-shadow: var(--tm-card-shadow-hover); transform: translateY(-2px); }
.category-card:focus-visible { outline: 2px solid var(--tm-cyan); outline-offset: 2px; }
.category-card__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--tm-cyan-soft);
  color: var(--tm-cyan-deep);
  flex: none;
}
.category-card__content { display: flex; flex-direction: column; min-width: 0; gap: .2rem; }
.category-card__name { font-size: 13px; font-weight: 700; color: var(--tm-ink); line-height: 1.5; overflow-wrap: anywhere; }
.category-card__content small { color: var(--tm-muted); font-size: 13px; }

.home-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 16px;
}

.product-card {
  display: flex;
  flex-direction: column;
  background: var(--tm-surface);
  border: 1px solid color-mix(in srgb, var(--tm-line-strong) 62%, transparent);
  border-radius: var(--tm-radius-lg);
  box-shadow: 0 4px 16px rgba(9, 38, 67, 0.075), 0 1px 3px rgba(9, 38, 67, 0.045);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}
.product-card:hover { border-color: var(--tm-cyan-strong); box-shadow: 0 12px 28px rgba(9, 38, 67, 0.14), 0 3px 8px rgba(9, 38, 67, 0.07); transform: translateY(-3px); }
.product-card:focus-visible { outline: 2px solid var(--tm-cyan); outline-offset: 2px; }

.product-card__main { display: flex; flex-direction: column; flex: 1; min-width: 0; color: inherit; text-decoration: none; }
.product-card__main:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 3px; border-radius: 6px; }
.product-card__media {
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  background: var(--tm-surface-alt);
  color: var(--tm-faint);
  font-size: 30px;
}
.product-card__media img { width: 100%; height: 100%; object-fit: contain; padding: 10px; }

.product-card__body { display: flex; flex-direction: column; gap: 6px; padding: 14px; flex: 1; }
.product-card__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--tm-ink);
  line-height: 1.7;
  display: block;
  overflow-wrap: anywhere;
}
.product-card__company { font-size: 13px; color: var(--tm-muted); }
.product-sku { font-size: 13px; color: var(--tm-faint); }
.product-card__foot { margin-top: auto; padding: 10px 14px 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.product-card__foot .tm-btn { min-height: 44px; }
.product-card__price { font-size: 13px; font-weight: 700; color: var(--tm-blue); }
.product-card-cta { font-size: 13px; font-weight: 700; color: var(--tm-cyan-deep); }
.product-card-cta i { margin-inline-start: .3rem; }
.product-card__body .tm-pill { align-self: flex-start; }

.home-recent__name { color: var(--tm-ink); font-weight: 600; text-decoration: none; }
.home-recent__product { display: flex; align-items: center; gap: .7rem; color: var(--tm-ink); text-decoration: none; min-width: 220px; }
.home-recent__product img { width: 52px; height: 52px; object-fit: contain; border-radius: 8px; background: var(--tm-surface-alt); }
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
  border-radius: var(--tm-radius-lg);
  box-shadow: var(--tm-card-shadow);
}
.feature-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 9px;
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
  padding: 26px 28px;
  border-radius: var(--tm-radius-lg);
  background:
    radial-gradient(circle at 90% 20%, color-mix(in srgb, var(--ds-accent) 24%, transparent), transparent 45%),
    linear-gradient(118deg, var(--tm-navy), var(--tm-navy-soft));
  color: #fff;
}
.home-cta h2 { margin: 0 0 6px; font-size: 19px; color: #fff; }
.home-cta--retail { background: var(--tm-surface); color: var(--tm-ink); border: 1px solid var(--tm-line); }
.home-cta--retail h2 { color: var(--tm-ink); }
.home-cta--retail p { color: var(--tm-muted); }
.home-cta p { margin: 0; font-size: 13px; color: var(--tm-cyan-soft); }

.home-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 38px 20px;
  background: var(--tm-surface);
  border: 1px dashed var(--tm-line-strong);
  border-radius: var(--tm-radius-lg);
  color: var(--tm-muted);
  text-align: center;
}
.home-empty i { font-size: 24px; color: var(--tm-faint); }
.home-empty p { margin: 0; font-size: 13px; }

.home-skeleton {
  min-height: 150px;
  background: linear-gradient(90deg, var(--tm-surface-alt) 25%, var(--tm-canvas) 37%, var(--tm-surface-alt) 63%);
  background-size: 400% 100%;
  animation: home-shimmer 1.4s ease infinite;
  border-radius: var(--tm-radius-lg);
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

@media (min-width: 1920px) {
  .home-product-grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); }
}

@media (max-width: 900px) {
  .home-featured-slider { grid-template-columns: minmax(0,1fr); }
  .home-featured-slider__media { min-height: 190px; }
  .home-featured-slider__media img { height: 180px; }
  .home-featured-slider__content { padding-bottom: 3.2rem; }
  .home-hero { grid-template-columns: 1fr; }
  .home-category-grid,.home-feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .home-hero__visual { grid-template-columns: minmax(0, 1fr); }
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
  .home-featured-slider { min-height: 0; }
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
</style>