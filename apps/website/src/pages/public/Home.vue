<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

import { useRouter } from 'vue-router'
import { productsApi } from '@telecom/api-client'
import { useCartStore } from '../../stores/cart'
import { useProductsStore } from '../../stores/products'
import { formatPrice } from '../../utils/helpers'

import Carousel from 'primevue/carousel'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ProductCard from '@telecom/shared-ui/components/products/ProductCard.vue'

const router = useRouter()
const cartStore = useCartStore()
const productsStore = useProductsStore()

const featuredProducts = ref([])
const recentProducts = ref([])
const categories = ref([])
const loading = ref(false)
const categoriesLoading = ref(false)
const error = ref(null)

// ── Filters (right sidebar) ──────────────────────────────
const searchQuery = ref('')
const selectedCategory = ref(null)
const minPrice = ref(null)
const maxPrice = ref(null)
const categoryOptions = computed(() => [
  { id: null, name: 'همه دسته‌ها' },
  ...categories.value.map((category) => ({
    ...category,
    name: category.nameFa || category.nameEn || category.name || category.slug,
  }))
])

// ── Category carousel responsive breakpoints ─────────────
const carouselResponsiveOptions = [
  { breakpoint: '1400px', numVisible: 5, numScroll: 2 },
  { breakpoint: '1100px', numVisible: 4, numScroll: 2 },
  { breakpoint: '900px', numVisible: 3, numScroll: 1 },
  { breakpoint: '640px', numVisible: 2, numScroll: 1 },
  { breakpoint: '480px', numVisible: 1, numScroll: 1 }
]

const features = [
  { icon: 'pi pi-box', title: 'کاتالوگ تخصصی', text: 'تجهیزات مخابراتی و شبکه در یک فضای یکپارچه' },
  { icon: 'pi pi-search', title: 'جستجو و فیلتر', text: 'یافتن محصولات بر اساس دسته‌بندی و محدوده قیمت' },
  { icon: 'pi pi-file-edit', title: 'استعلام قیمت', text: 'ثبت درخواست برای دریافت پیشنهاد تأمین‌کنندگان' },
  { icon: 'pi pi-sliders-h', title: 'مشخصات فنی', text: 'بررسی جزئیات و ویژگی‌های ثبت‌شده محصولات' }
]

// ── Hero slideshow (banner carousel) ─────────────────────
const slides = [
  {
    icon: 'pi pi-server',
    badge: 'بازارگاه تخصصی تجهیزات مخابراتی',
    title: 'بازارگاه تجهیزات مخابراتی',
    desc: 'کاتالوگ تخصصی تجهیزات مخابراتی و شبکه؛ محصولات و مشخصات ثبت‌شده را یکجا بررسی کنید.',
    primary: { label: 'مشاهده محصولات', to: { name: 'products' } },
    outline: { label: 'دسته‌بندی محصولات', to: { name: 'categories' } }
  },
  {
    icon: 'pi pi-wifi',
    badge: 'جستجوی دقیق محصولات',
    title: 'تجهیزات فیبر نوری و شبکه',
    desc: 'محصولات حوزه فیبر نوری و شبکه را بر اساس دسته‌بندی، برند و مشخصات فنی جستجو کنید.',
    primary: { label: 'مشاهده محصولات', to: { name: 'products' } },
    outline: { label: 'دسته‌بندی محصولات', to: { name: 'categories' } }
  },
  {
    icon: 'pi pi-verified',
    badge: 'مسیر استعلام و تأمین',
    title: 'همکاری با تأمین‌کنندگان معتبر',
    desc: 'درخواست قیمت ثبت کنید و پیشنهادهای تأمین‌کنندگان را در مسیر استعلام دنبال کنید.',
    primary: { label: 'مشاهده محصولات', to: { name: 'products' } },
    outline: { label: 'دسته‌بندی محصولات', to: { name: 'categories' } }
  }
]
const currentSlide = ref(0)
const slideshowPaused = ref(false)
const slideshowHovered = ref(false)
const slideshowFocused = ref(false)
let slideTimer = null

function goToSlide(i) {
  currentSlide.value = i
}
function nextSlide() {
  currentSlide.value = (currentSlide.value + 1) % slides.length
}
function startSlideshow(force = false) {
  stopSlideshow()
  if (slideshowPaused.value || slideshowHovered.value || (slideshowFocused.value && !force)) return
  slideTimer = setInterval(nextSlide, 5000)
}
function stopSlideshow() {
  if (slideTimer) {
    clearInterval(slideTimer)
    slideTimer = null
  }
}
function onSlideshowEnter() {
  slideshowHovered.value = true
  stopSlideshow()
}
function onSlideshowLeave() {
  slideshowHovered.value = false
  startSlideshow()
}
function onSlideshowFocusIn() {
  slideshowFocused.value = true
  stopSlideshow()
}
function onSlideshowFocusOut(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    slideshowFocused.value = false
    startSlideshow()
  }
}
function toggleSlideshow() {
  slideshowPaused.value = !slideshowPaused.value
  if (slideshowPaused.value) stopSlideshow()
  else startSlideshow(true)
}


async function fetchProducts() {
  try {
    loading.value = true
    error.value = null
    const params = { page: 1, limit: 12, status: 'PUBLISHED' }
    if (searchQuery.value) params.search = searchQuery.value
    if (selectedCategory.value) params.categoryId = Number(selectedCategory.value)
    if (minPrice.value != null) params.minPrice = Number(minPrice.value)
    if (maxPrice.value != null) params.maxPrice = Number(maxPrice.value)

    const response = await productsApi.list(params)
    const items = response?.data?.data ?? []
    const recent = Array.isArray(items) ? items : []
    recentProducts.value = recent.slice(0, 4)

    // Featured is a server-side product flag, not a slice of recent results.
    try {
      const featuredResponse = await productsApi.list({ ...params, limit: 8, featured: true })
      const featuredItems = featuredResponse?.data?.data ?? []
      featuredProducts.value = Array.isArray(featuredItems) ? featuredItems : []
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

function applyFilters() {
  fetchProducts()
}

function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = null
  minPrice.value = null
  maxPrice.value = null
  fetchProducts()
}

function getProductImage(product) {
  return product?.images?.find((image) => image?.isPrimary && image?.url)
    || product?.images?.find((image) => image?.url)
    || null
}

function goToProduct(product) {
  router.push({ name: 'product-details', params: { id: product.id } })
}

// Hero search follows the marketplace convention: it takes the visitor to the
// dedicated search-results page (same target as the header search), rather than
// silently re-filtering the homepage grid.
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
    // Use the same store method as the Categories page so the data shape matches.
    const data = await productsStore.getCategories()
    categories.value = Array.isArray(data) ? data : []
  } catch (err) {
    categories.value = []
  } finally {
    categoriesLoading.value = false
  }
}

onMounted(() => {
  fetchProducts()
  fetchCategories()
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    slideshowPaused.value = true
  }
  startSlideshow()
})

onBeforeUnmount(() => {
  stopSlideshow()
})
</script>


<template>
  <div class="home-page ds-page" dir="rtl">
    <div class="home-container ds-container ds-stack">

      <!-- Hero Slideshow -->
      <section
        class="hero-slideshow"
        @mouseenter="onSlideshowEnter"
        @mouseleave="onSlideshowLeave"
        @focusin="onSlideshowFocusIn"
        @focusout="onSlideshowFocusOut"
      >
        <div class="hero">
          <div class="hero-content">
            <!-- Rotating headline only. The search bar below stays mounted so
                 typing is never interrupted by a slide change. -->
            <transition name="slide-fade" mode="out-in">
              <div class="hero-copy" :key="currentSlide">
                <span class="hero-badge">
                  <i class="pi pi-check-circle"></i>
                  {{ slides[currentSlide].badge }}
                </span>
                <h1 class="hero-title">{{ slides[currentSlide].title }}</h1>
                <p class="hero-desc">{{ slides[currentSlide].desc }}</p>
              </div>
            </transition>

            <!-- Marketplace pattern: the search bar IS the primary CTA -->
            <form class="hero-search" role="search" @submit.prevent="heroSearch">
              <i class="pi pi-search hero-search-icon" aria-hidden="true"></i>
              <input
                v-model="searchQuery"
                type="search"
                class="hero-search-input"
                placeholder="نام محصول، برند یا دسته‌بندی را جستجو کنید…"
                aria-label="جستجوی محصولات"
              />
              <button type="submit" class="hero-search-btn">جستجو</button>
            </form>

            <div class="hero-actions">
              <router-link :to="slides[currentSlide].primary.to" class="btn btn-primary">
                {{ slides[currentSlide].primary.label }}
                <i class="pi pi-angle-left"></i>
              </router-link>
              <router-link :to="slides[currentSlide].outline.to" class="btn btn-outline">
                <i class="pi pi-th-large"></i>
                {{ slides[currentSlide].outline.label }}
              </router-link>
            </div>
          </div>

          <div class="hero-visual">
            <div class="hero-glow"></div>
            <i :class="slides[currentSlide].icon" class="hero-icon"></i>
          </div>
        </div>

        <!-- Slideshow dots -->
        <div class="hero-dots" aria-label="انتخاب اسلاید معرفی">
          <button
            v-for="(slide, i) in slides"
            :key="i"
            class="hero-dot"
            :class="{ active: currentSlide === i }"
            @click="goToSlide(i)"
            :aria-label="`اسلاید ${i + 1}`"
          ></button>
          <button
            type="button"
            class="hero-play-toggle"
            :aria-pressed="slideshowPaused"
            :aria-label="slideshowPaused ? 'پخش خودکار اسلایدها' : 'توقف پخش خودکار اسلایدها'"
            @click="toggleSlideshow"
          >
            <i :class="slideshowPaused ? 'pi pi-play' : 'pi pi-pause'" aria-hidden="true"></i>
          </button>
        </div>
      </section>


      <!-- Two Column Layout: Filters (right) + Main (left) -->
      <div class="home-layout">

        <!-- Right: Filters Sidebar -->
        <aside class="filters-sidebar" aria-label="فیلتر محصولات">
          <Card class="filters-card">
            <template #title>
              <span class="filters-title"><i class="pi pi-filter"></i> فیلتر محصولات</span>
            </template>
            <template #content>
              <div class="filters-inner">
                <!-- Search -->
                <div class="filter-group">
                  <label for="home-product-search">جستجو</label>
                  <div class="p-inputgroup">
                    <InputText
                      id="home-product-search"
                      v-model="searchQuery"
                      placeholder="نام محصول..."
                      @keyup.enter="applyFilters"
                      class="w-full"
                    />
                    <Button icon="pi pi-search" aria-label="اجرای جستجوی محصولات" @click="applyFilters" />
                  </div>
                </div>

                <!-- Category -->
                <div class="filter-group">
                  <label for="home-category-filter">دسته‌بندی</label>
                  <Select
                    inputId="home-category-filter"
                    v-model="selectedCategory"
                    :options="categoryOptions"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="همه دسته‌ها"
                    class="w-full"
                    @change="applyFilters"
                  />
                </div>

                <!-- Price Range -->
                <div class="filter-group">
                  <label>محدوده قیمت (تومان)</label>
                  <div class="price-range">
                    <InputNumber
                      inputId="home-minimum-price"
                      aria-label="حداقل قیمت"
                      v-model="minPrice"
                      placeholder="حداقل"
                      class="price-input"
                      :min="0"
                      @keyup.enter="applyFilters"
                    />
                    <span class="price-separator">—</span>
                    <InputNumber
                      inputId="home-maximum-price"
                      aria-label="حداکثر قیمت"
                      v-model="maxPrice"
                      placeholder="حداکثر"
                      class="price-input"
                      :min="0"
                      @keyup.enter="applyFilters"
                    />
                  </div>
                </div>


                <!-- Actions -->
                <div class="filter-actions">
                  <Button label="اعمال فیلتر" icon="pi pi-filter" class="w-full" @click="applyFilters" />
                  <Button label="پاک کردن" icon="pi pi-times" severity="secondary" text class="w-full" @click="resetFilters" />
                </div>
              </div>
            </template>
          </Card>
        </aside>

        <!-- Left: Main Content -->
        <div class="home-main">

          <!-- Categories Slider -->
          <section class="section-block ds-card" aria-labelledby="categories-heading">
            <div class="section-head">
              <router-link :to="{ name: 'categories' }" class="panel-link">مشاهده همه</router-link>
              <h2 id="categories-heading" class="section-title ds-h2"><i class="pi pi-folder"></i> دسته‌بندی محصولات</h2>
            </div>
            <div v-if="categoriesLoading" class="state-box">
              <i class="pi pi-spin pi-spinner"></i>
              <p>در حال دریافت دسته‌بندی‌ها...</p>
            </div>
            <div v-else-if="categories.length === 0" class="state-box">
              <i class="pi pi-folder-open"></i>
              <p>دسته‌بندی‌ای موجود نیست</p>
            </div>
            <Carousel
              v-else
              :value="categories"
              :numVisible="4"
              :numScroll="2"
              :responsiveOptions="carouselResponsiveOptions"
              :showIndicators="false"
              class="cat-carousel"
            >
              <template #item="{ data: category }">
                <div class="cat-slide">
                  <Card class="category-card" role="button" tabindex="0" :aria-label="'مشاهده محصولات دسته ' + (category.nameFa || category.nameEn || category.slug)" @click="viewCategoryProducts(category.id)" @keydown.enter.prevent="viewCategoryProducts(category.id)" @keydown.space.prevent="viewCategoryProducts(category.id)">
                    <template #content>
                      <div class="cat-thumb">
                        <img
                          v-if="category.image"
                          :src="category.image"
                          :alt="category.nameFa || category.nameEn || category.slug"
                          class="cat-thumb-img"
                        />
                        <div v-else class="cat-thumb-placeholder">
                          <i class="pi pi-folder"></i>
                        </div>
                      </div>
                      <h3 class="cat-name">{{ category.nameFa || category.nameEn || category.slug }}</h3>
                      <div class="cat-footer-row">
                        <Badge :value="(category.productCount || 0).toLocaleString('fa-IR')" severity="info" />
                        <span class="cat-link">مشاهده <i class="pi pi-arrow-left"></i></span>
                      </div>
                    </template>
                  </Card>
                </div>
              </template>
            </Carousel>
          </section>

          <!-- Featured Products -->
          <section class="section-block ds-card" aria-labelledby="featured-heading">
            <div class="section-head">
              <button class="nav-btn" @click="fetchProducts" :disabled="loading" aria-label="بارگذاری مجدد">
                <i class="pi" :class="loading ? 'pi-spin pi-spinner' : 'pi-refresh'"></i>
              </button>
              <h2 id="featured-heading" class="section-title ds-h2"><i class="pi pi-star-fill"></i> محصولات ویژه</h2>
            </div>

            <div v-if="loading" class="products-grid">
              <ProductCard v-for="n in 6" :key="n" skeleton />
            </div>
            <div v-else-if="error" class="state-box error">
              <i class="pi pi-exclamation-triangle"></i>
              <p>{{ error }}</p>
            </div>
            <div v-else-if="featuredProducts.length === 0" class="state-box">
              <i class="pi pi-box"></i>
              <p>محصول ویژه‌ای با فیلترهای فعلی یافت نشد</p>
              <Button label="حذف فیلترها" icon="pi pi-times" severity="secondary" text @click="resetFilters" />
            </div>
            <div v-else class="products-grid">
              <div v-for="product in featuredProducts" :key="product.id" class="product-card" role="link" tabindex="0" :aria-label="`مشاهده جزئیات ${product.title}`" @click="goToProduct(product)" @keydown.enter.prevent="goToProduct(product)" @keydown.space.prevent="goToProduct(product)">
                <div class="product-image">
                  <img v-if="getProductImage(product)?.url" :src="getProductImage(product).url" :alt="product.title" />
                  <div v-else class="empty-image"><i class="pi pi-image"></i></div>
                </div>
                <div class="product-info">
                  <h3 class="product-title">{{ product.title }}</h3>
                  <p class="product-vendor">{{ product.company?.name || product.vendor || 'تأمین‌کننده' }}</p>
                  <span class="product-price" v-if="product.prices && product.prices[0]">
                    {{ formatPrice(product.prices[0].price, product.prices[0].currency) }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Recent Products -->
          <section class="section-block ds-card" aria-labelledby="recent-heading">
            <div class="section-head">
              <router-link v-if="recentProducts.length > 0" :to="{ name: 'products' }" class="panel-link">مشاهده همه</router-link>
              <h2 id="recent-heading" class="section-title ds-h2"><i class="pi pi-clock"></i> جدیدترین محصولات</h2>
            </div>
            <div v-if="recentProducts.length === 0 && !loading" class="state-box">
              <i class="pi pi-box"></i>
              <p>در حال حاضر محصولی موجود نیست</p>
            </div>
            <div v-else class="products-grid">
              <div v-for="product in recentProducts" :key="product.id" class="product-card" role="link" tabindex="0" :aria-label="`مشاهده جزئیات ${product.title}`" @click="goToProduct(product)" @keydown.enter.prevent="goToProduct(product)" @keydown.space.prevent="goToProduct(product)">
                <div class="product-image">
                  <img v-if="getProductImage(product)?.url" :src="getProductImage(product).url" :alt="product.title" />
                  <div v-else class="empty-image"><i class="pi pi-image"></i></div>
                  <span class="tile-badge">جدید</span>
                </div>
                <div class="product-info">
                  <h3 class="product-title">{{ product.title }}</h3>
                  <p class="product-vendor">{{ product.company?.name || product.vendor || 'تأمین‌کننده' }}</p>
                  <span class="product-price">{{ formatPrice(product.prices?.[0]?.price, product.prices?.[0]?.currency) }}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- Verified marketplace capabilities; no hard-coded business metrics. -->
      <section class="features-bar" aria-label="امکانات بازارگاه">
        <div v-for="(feature, i) in features" :key="i" class="feature-item">
          <div class="feature-icon"><i :class="feature.icon"></i></div>
          <div class="feature-text">
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.text }}</p>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.home-page {
  background:
    radial-gradient(ellipse at 12% 0%, color-mix(in srgb, var(--ds-color-primary) 7%, transparent), transparent 34rem),
    var(--ds-color-background);
  padding: 1.5rem 0 3rem;
}
.home-container {
  width: 100%;
  max-width: var(--ds-container-max-wide);
  margin: 0 auto;
  padding-inline: var(--ds-container-pad);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-8);
}

@media (min-width: 768px) {
  .home-container {
    padding-inline: var(--ds-container-pad-lg);
  }
}

@media (min-width: 1920px) {
  .home-container {
    padding-inline: var(--ds-container-pad-xl);
  }
}

@media (min-width: 1920px) {
  .home-container {
    padding-inline: var(--ds-container-pad-xl);
  }
}


/* Hero */
.hero {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  gap: var(--ds-space-8);
  background: linear-gradient(125deg, color-mix(in srgb, var(--ds-color-primary) 11%, var(--ds-color-surface)) 0%, var(--hero-center, var(--ds-color-surface)) 55%, color-mix(in srgb, var(--ds-color-accent) 10%, var(--ds-color-surface)) 100%);
  border: 1px solid var(--ds-color-border);
  border-radius: calc(var(--ds-radius-xl) + 0.25rem);
  padding: clamp(1.25rem, 3vw, 2.5rem);
  box-shadow: var(--ds-shadow-sm);
  overflow: hidden;
}

:global(.app-dark) .hero {
  --hero-center: var(--p-surface-800);
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  text-align: start;
  min-width: 0;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}

/* Search-first CTA (marketplace pattern) */
.hero-search {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--ds-space-2);
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--ds-radius-pill);
  padding-block: 0.375rem;
  padding-inline: 1.125rem 0.375rem;
  box-shadow: var(--ds-shadow-md);
  max-width: 36rem;
}

.hero-search:focus-within {
  border-color: var(--primary-color);
  box-shadow: var(--ds-shadow-md);
}

.hero-search-icon {
  color: var(--text-color-secondary);
  font-size: 1rem;
}

.hero-search-input {
  border: none;
  background: transparent;
  outline: none;
  font: inherit;
  color: var(--text-color);
  width: 100%;
  min-width: 0;
  padding-block: 0.5rem;
}

.hero-search-input::placeholder {
  color: var(--text-color-secondary);
}

 .hero-search-btn {
  min-height: 2.75rem;
  border: none;
  cursor: pointer;
  background: var(--primary-color);
  color: var(--primary-contrast-color);
  font: inherit;
  font-weight: 700;
  padding: 0.625rem 1.5rem;
  border-radius: var(--ds-radius-pill);
  transition: background var(--ds-transition-fast);
}

.hero-search-btn:hover {
  background: var(--ds-color-primary-hover);
}
.hero-badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  color: var(--primary-color); font-weight: 700; font-size: 0.95rem;
}
.hero-title {
  color: var(--ds-color-text); font-size: clamp(1.8rem, 3.2vw, 2.7rem); font-weight: 850;
  line-height: 1.3; margin: 0;
}

:global(.app-dark) .hero-title {
  color: var(--p-primary-200);
}

.hero-desc {
  color: var(--text-color-secondary); font-size: 1.05rem; line-height: 1.9; margin: 0;
}
.hero-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.hero-visual {
  position: relative; height: 260px; border-radius: 0.75rem;
  background: linear-gradient(145deg, var(--ds-color-brand-dark), var(--ds-color-primary));
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.hero-glow {
  position: absolute; inset: -30%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), transparent 60%);
}
.hero-icon { font-size: clamp(4rem, 7vw, 6.5rem); color: var(--ds-color-on-brand); opacity: 0.95; z-index: 1; filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.16)); }

/* Hero Slideshow */
.hero-slideshow { position: relative; }
.hero-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: .35rem;
  margin-top: var(--ds-space-4);
}
.hero-dot {
  display: grid;
  place-items: center;
  width: 2.75rem;
  min-width: 2.75rem;
  height: 2.75rem;
  min-height: 2.75rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  padding: 0;
}
.hero-dot::before {
  content: "";
  width: .5rem;
  height: .5rem;
  border-radius: 50%;
  background: var(--ds-color-border, var(--surface-border));
  transition: width var(--ds-transition-fast), background var(--ds-transition-fast);
}
.hero-dot.active::before {
  width: 1.5rem;
  border-radius: var(--ds-radius-pill);
  background: var(--ds-color-primary);
}
.hero-play-toggle {
  display: grid;
  place-items: center;
  width: 2.75rem;
  min-width: 2.75rem;
  height: 2.75rem;
  min-height: 2.75rem;
  border: 1px solid var(--ds-color-border);
  border-radius: 50%;
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  cursor: pointer;
}
.hero-play-toggle:hover { border-color: var(--ds-color-primary); color: var(--ds-color-primary); }
.hero-play-toggle:focus-visible,
.hero-dot:focus-visible {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 2px;
}

/* Slide transition */
.slide-fade-enter-active { transition: all 0.5s ease; }
.slide-fade-leave-active { transition: all 0.35s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateX(-20px); }
.slide-fade-leave-to { opacity: 0; transform: translateX(20px); }


/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1.5rem; border-radius: 0.65rem; font-weight: 700;
  font-size: 0.95rem; cursor: pointer; text-decoration: none;
  transition: all 0.2s ease; border: 1px solid transparent;
}
.btn-primary { background: var(--primary-color); color: var(--primary-contrast-color); }
.btn-primary:hover { background: var(--ds-color-primary-hover); }
.btn-outline { background: transparent; color: var(--btn-outline-color, var(--text-color)); border-color: var(--surface-border); }
.btn-outline:hover { border-color: var(--primary-color); color: var(--primary-color); }

/* Dark mode: outline button needs lighter text on dark backgrounds */
:global(.app-dark) .btn-outline {
  --btn-outline-color: var(--p-primary-300);
}

/* Two Column Layout */
.home-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.25rem;
  align-items: start;
}

/* Filters Sidebar */
.filters-sidebar {
  position: sticky;
  top: 5rem;
  align-self: start;
}
.filters-card {
  border-radius: 1rem;
  box-shadow: var(--ds-shadow-sm);
}
.filters-card :deep(.p-card-body) { padding: 1.25rem; }
.filters-card :deep(.p-card-title) { margin-bottom: 1rem; }
.filters-card :deep(.p-card-content) { padding: 0; }
.filters-title {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-size: 1rem; font-weight: 800; color: var(--text-color);
}
.filters-title i { color: var(--primary-color); }
.filters-inner { display: flex; flex-direction: column; gap: 1.1rem; }
.filter-group label {
  display: block; font-size: 0.8rem; font-weight: 700;
  color: var(--text-color); margin-bottom: 0.5rem;
}
/* Make PrimeVue inputs fill the sidebar width uniformly */
.filters-inner :deep(.p-inputtext),
.filters-inner :deep(.p-select),
.filters-inner :deep(.p-inputnumber),
.filters-inner :deep(.p-inputnumber-input) {
  width: 100%;
}
.filters-inner :deep(.p-inputgroup) { width: 100%; }
.price-range {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.5rem;
}
.price-input :deep(.p-inputnumber-input) { text-align: center; }
.price-separator {
  font-size: 0.9rem; color: var(--text-color-secondary); text-align: center;
}
.filter-actions {
  display: flex; flex-direction: column; gap: 0.5rem;
  margin-top: 0.25rem; padding-top: 1rem; border-top: 1px solid var(--surface-border);
}


/* Main */
.home-main { display: flex; flex-direction: column; gap: 1.25rem; min-width: 0; }

/* Section Block */
.section-block {
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  padding: clamp(1rem, 2vw, 1.5rem);
  box-shadow: var(--ds-shadow-xs);
}
.section-head {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;
}
.section-title {
  display: flex; align-items: center; gap: 0.625rem;
  margin: 0; font-size: clamp(1.1rem, 1.7vw, 1.35rem); font-weight: 800; color: var(--ds-color-text);
}
.section-title i { color: var(--primary-color); }
.panel-link {
  font-size: 0.85rem; color: var(--primary-color); text-decoration: none; font-weight: 600;
}
.panel-link:hover { text-decoration: underline; }

/* Category Carousel */
.cat-carousel :deep(.p-carousel-item) { padding: 0.25rem; }
.cat-slide { padding: 0.25rem; height: 100%; }
.category-card {
  cursor: pointer;
  transition: box-shadow var(--ds-transition), transform var(--ds-transition), border-color var(--ds-transition);
  height: 100%;
}
.category-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--ds-shadow-lg);
}
.cat-thumb {
  aspect-ratio: 16 / 9;
  background: var(--surface-ground);
  border-radius: var(--content-border-radius);
  margin-bottom: 0.75rem;
  overflow: hidden;
}
.cat-thumb-img { width: 100%; height: 100%; object-fit: cover; }
.cat-thumb-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
}
.cat-thumb-placeholder i { font-size: 2.5rem; color: var(--text-color-secondary); }
.cat-name {
  font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cat-footer-row {
  display: flex; align-items: center; justify-content: space-between;
}
.cat-link {
  font-size: 0.8rem; color: var(--primary-color); font-weight: 600;
  display: inline-flex; align-items: center; gap: 0.25rem;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  gap: var(--ds-space-4);
}
.product-card {
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg);
  overflow: hidden; cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
}
.product-card:hover,
.product-card:focus-visible {
  box-shadow: var(--ds-shadow-md);
  transform: translateY(-2px);
  border-color: var(--ds-color-primary);
  outline: none;
}
.product-card:focus-visible,
.category-card:focus-visible {
  outline: 3px solid var(--ds-color-focus);
  outline-offset: 3px;
}
.product-image {
  position: relative; aspect-ratio: 4 / 3; background: var(--surface-ground);
  overflow: hidden; display: flex; align-items: center; justify-content: center;
}
.product-image img { width: 100%; height: 100%; object-fit: cover; }
.empty-image i { font-size: 2rem; color: var(--text-color-secondary); opacity: 0.4; }
.tile-badge {
  position: absolute; top: 0.5rem; inset-inline-start: 0.5rem;
  background: var(--primary-color); color: var(--primary-contrast-color);
  font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.625rem; border-radius: var(--ds-radius-pill);
}
.product-info { padding: var(--ds-space-3); }
.product-title {
  margin: 0 0 0.375rem; font-size: 0.95rem; font-weight: 700; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  min-height: 2.85em;
}
.product-vendor { margin: 0 0 0.625rem; font-size: 0.8rem; color: var(--text-color-secondary); }
.product-price { font-weight: 800; color: var(--ds-color-primary); font-size: 1rem; }

/* Nav buttons */
 .nav-btn {
  width: 2.75rem; min-width: 2.75rem; height: 2.75rem; min-height: 2.75rem; border-radius: 0.75rem;
  border: 1px solid var(--surface-border); background: var(--surface-card);
  color: var(--text-color); cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.nav-btn:hover { border-color: var(--primary-color); color: var(--primary-color); }
.nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* State boxes */
.state-box {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 0.5rem; padding: 2rem 1rem; color: var(--text-color-secondary);
}
.state-box i { font-size: 2rem; }
.state-box.error i { color: var(--ds-color-danger); }
.state-box p { margin: 0; }

/* Verified marketplace capabilities */
.features-bar {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem;
  background: var(--surface-card); border: 1px solid var(--surface-border);
  border-radius: 1rem; padding: 1rem 1.25rem;
}
.feature-item {
  display: flex; align-items: center; gap: 0.75rem; justify-content: center;
  text-align: right; padding: 0 0.75rem;
  border-inline-start: 1px solid var(--surface-border);
}
.feature-item:last-child { border-inline-start: none; }
.feature-icon {
  width: 2.5rem; height: 2.5rem; border-radius: 50%;
  background: var(--p-primary-50); display: flex; align-items: center;
  justify-content: center; flex-shrink: 0;
}
.feature-icon i { font-size: 1.1rem; color: var(--primary-color); }
.feature-text h3 { margin: 0 0 0.2rem; font-size: 0.9rem; font-weight: 700; }
.feature-text p { margin: 0; font-size: 0.75rem; color: var(--text-color-secondary); }

/* Responsive */
@media (max-width: 1100px) {
  .products-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 900px) {
  .home-layout { grid-template-columns: 1fr; }
  .filters-sidebar { position: static; }
  .hero { grid-template-columns: 1fr; padding: 2rem; }
  .hero-visual { order: 2; height: 200px; }
  .features-bar { grid-template-columns: repeat(2, 1fr); }
  .feature-item { border-inline-start: none; }
}
@media (max-width: 560px) {
  .hero-title { font-size: 1.75rem; }
  .hero-actions { flex-direction: column; }
  .btn { justify-content: center; }
  .products-grid, .features-bar { grid-template-columns: 1fr; }
  .home-container { gap: var(--ds-space-4); }
  .hero { padding: 1.25rem; }
  .hero-search { grid-template-columns: auto minmax(0, 1fr); border-radius: var(--ds-radius-xl); }
  .hero-search-btn { grid-column: 1 / -1; width: 100%; }
}

/* Home marketplace refinement: stronger hero hierarchy and product imagery. */
.home-page { padding-block: clamp(1.25rem, 2.5vw, 2.5rem) 3.5rem; }
.home-container { gap: clamp(1.25rem, 2.5vw, 2rem); }
.hero {
  min-height: 22rem;
  border-radius: calc(var(--ds-radius-xl) + .35rem);
  background:
    radial-gradient(circle at 84% 18%, color-mix(in srgb, var(--ds-color-primary) 16%, transparent), transparent 22rem),
    linear-gradient(120deg, color-mix(in srgb, var(--ds-navy) 5%, var(--ds-color-surface)), var(--ds-color-surface));
}
.hero-content { max-width: 46rem; }
.hero-badge {
  align-self: flex-start;
  padding: .35rem .7rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 24%, transparent);
  border-radius: var(--ds-radius-pill);
  background: var(--ds-color-primary-soft);
  font-size: var(--ds-font-size-xs);
}
.hero-title { max-width: 14ch; letter-spacing: -.035em; }
.hero-desc { max-width: 42rem; font-size: var(--ds-font-size-md); }
.hero-search {
  border-color: var(--ds-color-border);
  background: var(--ds-color-surface);
  max-width: 40rem;
}
 .hero-search-input { min-height: 2.75rem; }
.hero-search-btn { min-height: 2.65rem; }
.hero-visual {
  min-height: 17rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 28%, transparent);
  border-radius: var(--ds-radius-xl);
  background:
    radial-gradient(circle at 30% 28%, color-mix(in srgb, var(--ds-brand) 35%, transparent), transparent 50%),
    var(--ds-hero-gradient);
}
.hero-glow { opacity: .6; }
.hero-icon { filter: drop-shadow(0 1rem 1.5rem rgba(0,0,0,.2)); }
.hero-dot { border: 0; }
.section-block {
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.section-head { gap: 1rem; }
.section-title { font-size: clamp(1.05rem, 1.7vw, 1.3rem); }
.filters-card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.filters-inner :deep(.p-inputtext),
.filters-inner :deep(.p-select),
.filters-inner :deep(.p-inputnumber-input) { border-radius: var(--ds-radius-md); }
.filters-inner :deep(.p-inputtext),
.filters-inner :deep(.p-select),
.filters-inner :deep(.p-inputnumber-input) { min-height: 2.75rem; }
.filter-actions :deep(.p-button) { min-height: 2.75rem; }
.hero-actions .btn { min-height: 2.75rem; }
.category-card { min-height: 10rem; cursor: pointer; }
.category-card:focus-visible {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 3px;
}
.category-card {
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface);
}
.cat-thumb { background: var(--ds-color-surface-alt); }
.product-card {
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.product-card:hover,
.product-card:focus-visible {
  transform: translateY(-3px);
  box-shadow: var(--ds-shadow-md);
}
.product-image {
  aspect-ratio: 5 / 4;
  background: linear-gradient(145deg, var(--ds-color-surface-alt), var(--ds-color-surface-hover));
}
.product-image img { object-fit: contain; padding: .75rem; }
.product-info { padding: .9rem; }
.product-title { color: var(--ds-color-text); line-height: 1.65; }
.product-vendor { display: flex; align-items: center; gap: .35rem; }
 .features-bar {
  border-color: var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.feature-icon { background: var(--ds-color-primary-soft); }
.feature-icon i { color: var(--ds-color-primary); }
@media (max-width: 900px) {
  .hero { min-height: 0; }
  .hero-content { max-width: none; }
  .hero-visual { min-height: 13rem; }
}
@media (max-width: 560px) {
  .hero-title { max-width: none; font-size: 1.65rem; }
  .hero-actions { flex-direction: row; }
  .hero-actions .btn { flex: 1 1 0; padding-inline: .75rem; font-size: .82rem; }
  .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; }
  .features-bar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .feature-item { justify-content: flex-start; padding: .5rem; }
  .feature-text h3 { font-size: .78rem; }
  .feature-text p { font-size: .68rem; }
  .hero-visual { min-height: 10rem; }
}
@media (max-width: 360px) {
  .products-grid { grid-template-columns: 1fr; }
  .hero-actions { flex-direction: column; }
}

@media (prefers-reduced-motion: reduce) {
  .slide-fade-enter-active,
  .slide-fade-leave-active,
  .hero-dot::before,
  .product-card,
  .category-card,
  .nav-btn {
    transition: none !important;
    animation: none !important;
  }
  .product-card:hover,
  .product-card:focus-visible,
  .category-card:hover,
  .category-card:focus-visible { transform: none !important; }
}
</style>
