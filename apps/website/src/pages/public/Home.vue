<script setup>
import { ref, computed, onMounted } from 'vue'

import { useRouter } from 'vue-router'
import { productsApi } from '@telecom/api-client'
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
})
</script>


<template>
  <div class="home-page ds-page" dir="rtl">
    <div class="home-container ds-container ds-stack">

      <section class="hero" aria-labelledby="home-title">
        <div class="hero-content">
          <div class="hero-copy">
            <h1 id="home-title" class="hero-title">تجهیزات مخابراتی و شبکه را دقیق پیدا کنید</h1>
            <p class="hero-desc">محصولات، مشخصات فنی و تأمین‌کنندگان بازارگاه را جستجو کنید و برای دریافت قیمت، مسیر استعلام را دنبال کنید.</p>
          </div>
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
            <router-link :to="{ name: 'products' }" class="btn btn-primary">مشاهده کاتالوگ <i class="pi pi-arrow-left" aria-hidden="true"></i></router-link>
            <router-link :to="{ name: 'categories' }" class="btn btn-outline">مرور دسته‌بندی‌ها</router-link>
          </div>
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
              <h2 id="categories-heading" class="section-title ds-h2">دسته‌بندی محصولات</h2>
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
                  <button type="button" class="category-card" :aria-label="'مشاهده محصولات دسته ' + (category.nameFa || category.nameEn || category.slug)" @click="viewCategoryProducts(category.id)">
                      <div class="cat-thumb">
                        <img
                          v-if="category.image"
                          :src="category.image"
                          :alt="category.nameFa || category.nameEn || category.slug"
                          width="160"
                          height="120"
                          loading="lazy"
                          decoding="async"
                          class="cat-thumb-img"
                        />
                        <div v-else class="cat-thumb-placeholder">
                          <i class="pi pi-folder"></i>
                        </div>
                      </div>
                      <h3 class="cat-name">{{ category.nameFa || category.nameEn || category.slug }}</h3>
                      <div class="cat-footer-row">
                        <Badge :value="category.productCount == null ? '—' : Number(category.productCount).toLocaleString('fa-IR')" severity="info" />
                        <span class="cat-link">مشاهده <i class="pi pi-arrow-left"></i></span>
                      </div>
                  </button>
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
              <h2 id="featured-heading" class="section-title ds-h2">محصولات ویژه</h2>
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
              <router-link v-for="product in featuredProducts" :key="product.id" :to="{ name: 'product-details', params: { id: product.id } }" class="product-card" :aria-label="'مشاهده جزئیات ' + product.title">
                <div class="product-image">
                  <img v-if="getProductImage(product)?.url" :src="getProductImage(product).url" :alt="product.title" width="640" height="480" loading="lazy" decoding="async" />
                  <div v-else class="empty-image"><i class="pi pi-image"></i></div>
                </div>
                <div class="product-info">
                  <div class="product-identity">
                    <h3 class="product-title">{{ product.title }}</h3>
                    <span v-if="product.company?.isVerified" class="product-verified" title="شرکت تأیید شده">
                      <i class="pi pi-verified" aria-hidden="true"></i>
                    </span>
                  </div>
                  <p v-if="product.company?.name || product.vendor" class="product-vendor"><i class="pi pi-building" aria-hidden="true"></i>{{ product.company?.name || product.vendor }}</p>
                  <div v-if="product.brand || product.model || product.sku" class="product-meta">
                    <span v-if="product.brand">{{ product.brand }}</span>
                    <span v-if="product.model">{{ product.model }}</span>
                    <span v-if="product.sku" class="product-sku">{{ product.sku }}</span>
                  </div>
                  <div class="home-product-footer">
                    <span v-if="product.prices?.length" class="product-price">
                      <small>شروع قیمت از</small>
                      <strong>{{ formatPrice(product.prices[0].price, product.prices[0].currency) }}</strong>
                    </span>
                    <span v-else class="product-price product-price--inquiry">
                      <small>قیمت</small>
                      <strong>استعلام از تأمین‌کننده</strong>
                    </span>
                    <span class="product-card-cta">جزئیات <i class="pi pi-arrow-left" aria-hidden="true"></i></span>
                  </div>
                </div>
              </router-link>
            </div>
          </section>

          <!-- Recent Products -->
          <section class="section-block ds-card" aria-labelledby="recent-heading">
            <div class="section-head">
              <router-link v-if="recentProducts.length > 0" :to="{ name: 'products' }" class="panel-link">مشاهده همه</router-link>
              <h2 id="recent-heading" class="section-title ds-h2">جدیدترین محصولات</h2>
            </div>
            <div v-if="recentProducts.length === 0 && !loading" class="state-box">
              <i class="pi pi-box"></i>
              <p>در حال حاضر محصولی موجود نیست</p>
            </div>
            <div v-else class="products-grid">
              <router-link v-for="product in recentProducts" :key="product.id" :to="{ name: 'product-details', params: { id: product.id } }" class="product-card" :aria-label="'مشاهده جزئیات ' + product.title">
                <div class="product-image">
                  <img v-if="getProductImage(product)?.url" :src="getProductImage(product).url" :alt="product.title" width="640" height="480" loading="lazy" decoding="async" />
                  <div v-else class="empty-image"><i class="pi pi-image"></i></div>
                  <span class="tile-badge">جدید</span>
                </div>
                <div class="product-info">
                  <div class="product-identity">
                    <h3 class="product-title">{{ product.title }}</h3>
                    <span v-if="product.company?.isVerified" class="product-verified" title="شرکت تأیید شده">
                      <i class="pi pi-verified" aria-hidden="true"></i>
                    </span>
                  </div>
                  <p v-if="product.company?.name || product.vendor" class="product-vendor"><i class="pi pi-building" aria-hidden="true"></i>{{ product.company?.name || product.vendor }}</p>
                  <div v-if="product.brand || product.model || product.sku" class="product-meta">
                    <span v-if="product.brand">{{ product.brand }}</span>
                    <span v-if="product.model">{{ product.model }}</span>
                    <span v-if="product.sku" class="product-sku">{{ product.sku }}</span>
                  </div>
                  <div class="home-product-footer">
                    <span v-if="product.prices?.length" class="product-price">
                      <small>شروع قیمت از</small>
                      <strong>{{ formatPrice(product.prices[0].price, product.prices[0].currency) }}</strong>
                    </span>
                    <span v-else class="product-price product-price--inquiry">
                      <small>قیمت</small>
                      <strong>استعلام از تأمین‌کننده</strong>
                    </span>
                    <span class="product-card-cta">جزئیات <i class="pi pi-arrow-left" aria-hidden="true"></i></span>
                  </div>
                </div>
              </router-link>
            </div>
          </section>
        </div>
      </div>

      <!-- Verified marketplace capabilities; no hard-coded business metrics. -->
      <section class="features-bar" aria-label="امکانات بازارگاه">
        <div v-for="(feature, i) in features" :key="i" class="feature-item">
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
  display: block;
  overflow: hidden;
  padding: clamp(1.5rem, 4vw, 3.25rem);
  border: 0;
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-brand-deep);
  color: var(--ds-color-on-brand);
}
.hero-content { display: flex; max-width: 58rem; flex-direction: column; gap: var(--ds-space-5); }
.hero-copy { display: flex; flex-direction: column; gap: var(--ds-space-3); }
.hero-title {
  max-width: 20ch;
  margin: 0;
  color: inherit;
  font-size: clamp(1.9rem, 3.5vw, 3rem);
  font-weight: 800;
  line-height: 1.35;
  text-wrap: balance;
}
.hero-desc { max-width: 58ch; margin: 0; color: var(--ds-color-on-brand-muted); font-size: var(--ds-font-size-md); line-height: 1.9; }
.hero-search {
  display: grid;
  max-width: 48rem;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--ds-space-2);
  padding: .35rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
}
.hero-search:focus-within {
  border-color: var(--ds-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ds-color-primary) 22%, transparent);
}
.hero-search-icon { padding-inline-start: .65rem; color: var(--ds-color-text-muted); font-size: 1rem; }
.hero-search-input {
  width: 100%; min-width: 0; min-height: 2.75rem; padding: .5rem .35rem;
  border: 0; outline: 0; background: transparent; color: var(--ds-color-text); font: inherit;
}
.hero-search-input::placeholder { color: var(--ds-color-text-muted); }
.hero-search-btn {
  min-height: 2.75rem; padding: .6rem 1.4rem; border: 0; border-radius: var(--ds-radius-sm);
  background: var(--ds-color-accent); color: var(--ds-color-on-accent); font: inherit;
  font-weight: 700; cursor: pointer; transition: background-color var(--ds-transition-fast);
}
.hero-search-btn:hover { background: var(--ds-color-primary-hover); }
.hero-search-btn:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }
.hero-actions { display: flex; flex-wrap: wrap; gap: .65rem; }
/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1.5rem; border-radius: 0.65rem; font-weight: 700;
  font-size: 0.95rem; cursor: pointer; text-decoration: none;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease; border: 1px solid transparent;
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
.panel-link {
  font-size: 0.85rem; color: var(--primary-color); text-decoration: none; font-weight: 600;
}
.panel-link:hover { text-decoration: underline; }

/* Category Carousel */
.cat-carousel :deep(.p-carousel-item) { padding: 0.25rem; }
.cat-slide { padding: 0.25rem; height: 100%; }
.category-card {
  display: block; width: 100%; height: 100%; padding: 1rem; text-align: start;
  font: inherit; color: var(--ds-color-text); cursor: pointer;
  border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface); transition: border-color var(--ds-transition-fast), background-color var(--ds-transition-fast);
}
.category-card:hover { border-color: var(--ds-color-primary); background: var(--ds-color-surface-hover); }
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
  display: block; min-width: 0; overflow: hidden; border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md); background: var(--ds-color-surface); color: inherit;
  text-decoration: none; transition: border-color var(--ds-transition-fast), background-color var(--ds-transition-fast);
}
.product-card:hover { border-color: var(--ds-color-primary); background: var(--ds-color-surface-hover); }
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
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
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
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0;
  border-block: 1px solid var(--ds-color-border); padding: .5rem 0;
}
.feature-item {
  display: flex; flex-direction: column; align-items: flex-start; gap: .35rem;
  padding: .75rem 1rem; text-align: start; border-inline-start: 1px solid var(--ds-color-border);
}
.feature-item:first-child { border-inline-start: 0; }
.feature-text h3 { margin: 0; font-size: .9rem; font-weight: 700; color: var(--ds-color-text); }
.feature-text p { margin: 0; font-size: .78rem; color: var(--ds-color-text-muted); line-height: 1.7; }
.feature-text h3 { margin: 0 0 0.2rem; font-size: 0.9rem; font-weight: 700; }
.feature-text p { margin: 0; font-size: 0.75rem; color: var(--text-color-secondary); }

/* Responsive */
@media (max-width: 1100px) {
  .products-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 900px) {
  .home-layout { grid-template-columns: 1fr; }
  .filters-sidebar { position: static; }
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
  .hero-search { grid-template-columns: auto minmax(0, 1fr); }
  .hero-search-btn { grid-column: 1 / -1; width: 100%; }
}

/* Marketplace surfaces: flat, product-led and consistent with the shared system. */
.home-page { padding-block: clamp(1.25rem, 2.5vw, 2.5rem) 3.5rem; background: var(--ds-color-background); }
.home-container { gap: clamp(1.25rem, 2.5vw, 2rem); }
.hero-search { max-width: 48rem; }
.hero-actions .btn { min-height: 2.75rem; }
.home-page .section-block {
  padding: 1.25rem 0;
  border: 0;
  border-top: 1px solid var(--ds-color-border);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.section-head { gap: 1rem; }
.section-title { font-size: clamp(1.05rem, 1.7vw, 1.3rem); }
.filters-card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  box-shadow: none;
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
.product-card { border-radius: var(--ds-radius-md); box-shadow: none; }
.product-card:hover, .product-card:focus-visible { transform: none; box-shadow: none; }
.product-image {
  aspect-ratio: 5 / 4;
  background: linear-gradient(145deg, var(--ds-color-surface-alt), var(--ds-color-surface-hover));
}
.product-image img { object-fit: contain; padding: .75rem; }
.product-info { padding: .9rem; }
.product-title { color: var(--ds-color-text); line-height: 1.65; }
.product-vendor { display: flex; align-items: center; gap: .35rem; }
 .features-bar { border-radius: 0; background: transparent; box-shadow: none; padding-inline: 0; }
@media (max-width: 900px) {
  .hero { min-height: 0; }
  .hero-content { max-width: none; }
}
@media (max-width: 560px) {
  .hero-title { max-width: none; font-size: 1.65rem; }
  .hero-actions { flex-direction: row; }
  .hero-actions .btn { flex: 1 1 0; padding-inline: .75rem; font-size: .82rem; }
  .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; }
  .features-bar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .feature-item { padding: .75rem .5rem; }
  .feature-item:nth-child(odd) { border-inline-start: 0; }
  .feature-text h3 { font-size: .82rem; }
  .feature-text p { font-size: .72rem; }
}
@media (max-width: 360px) {
  .products-grid { grid-template-columns: 1fr; }
  .hero-actions { flex-direction: column; }
}

@media (prefers-reduced-motion: reduce) {
  .product-card,
  .category-card,
  .nav-btn,
  .product-card-cta i {
    transition: none !important;
    animation: none !important;
  }
  .product-card:hover,
  .product-card:focus-visible,
  .category-card:hover,
  .category-card:focus-visible { transform: none !important; }
}

/* Homepage product cards follow the same supplier/pricing hierarchy as catalogue results. */
.home-page .product-info { display: flex; min-height: 12rem; flex-direction: column; gap: .35rem; }
.home-page .product-identity { display: flex; align-items: flex-start; justify-content: space-between; gap: .5rem; }
.home-page .product-title { flex: 1; min-width: 0; margin: 0; }
.home-page .product-verified {
  display: grid;
  place-items: center;
  flex: 0 0 1.6rem;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background: var(--ds-color-success-soft);
  color: var(--ds-color-success);
  font-size: .8rem;
}
.home-page .product-vendor { margin: .25rem 0; }
.home-page .product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: .25rem .55rem;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
}
.home-page .product-sku { direction: ltr; unicode-bidi: isolate; }
.home-page .home-product-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: .5rem;
  margin-top: auto;
  padding-top: .7rem;
  border-top: 1px solid var(--ds-color-border);
}
.home-page .product-price { display: flex; min-width: 0; flex-direction: column; gap: .1rem; font-size: .9rem; }
.home-page .product-price small { color: var(--ds-color-text-muted); font-size: .65rem; font-weight: var(--ds-font-weight-normal); }
.home-page .product-price strong { color: var(--ds-color-primary); font-size: .85rem; line-height: 1.5; }
.home-page .product-price--inquiry strong { font-size: .75rem; }
.home-page .product-card-cta { display: inline-flex; align-items: center; gap: .3rem; flex: 0 0 auto; min-height: 2.75rem; color: var(--ds-color-primary-text); font-size: .75rem; font-weight: var(--ds-font-weight-bold); }
.home-page .product-card-cta i { transition: transform var(--ds-transition-fast); }
.home-page .product-card:hover .product-card-cta i { transform: translateX(-3px); }
@media (max-width: 560px) {
  .home-page .product-info { min-height: 12.5rem; padding: .7rem; }
  .home-page .home-product-footer { align-items: flex-start; flex-direction: column; }
  .home-page .product-card-cta { min-height: 2.5rem; }
}

</style>
