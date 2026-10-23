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
import Dropdown from 'primevue/dropdown'
import ProductCard from '@telecom/shared-ui/components/products/ProductCard.vue'

const router = useRouter()
const cartStore = useCartStore()
const productsStore = useProductsStore()

const products = ref([])
const featuredProducts = ref([])
const bestSellers = ref([])
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
  { icon: 'pi pi-shield', title: 'محصولات باکیفیت', text: 'تضمین کیفیت و اصالت' },
  { icon: 'pi pi-verified', title: 'تأمین از بهترین‌ها', text: 'همکاری با برندهای معتبر' },
  { icon: 'pi pi-headphones', title: 'پشتیبانی تخصصی', text: 'مشاوره و راهنمایی حرفه‌ای' },
  { icon: 'pi pi-truck', title: 'ارسال سریع', text: 'تحویل به موقع و مطمئن' }
]

const stats = [
  { icon: 'pi pi-users', value: '+250', label: 'تأمین کننده معتبر' },
  { icon: 'pi pi-box', value: '+1,500', label: 'محصول متنوع' },
  { icon: 'pi pi-user', value: '+5,000', label: 'مشتری راضی' },
  { icon: 'pi pi-trophy', value: '+10 سال', label: 'سابقه درخشان' }
]

// ── Hero slideshow (banner carousel) ─────────────────────
const slides = [
  {
    icon: 'pi pi-server',
    badge: 'کیفیت بالا، اعتماد پایدار',
    title: 'بازارگاه تجهیزات مخابراتی',
    desc: 'طیف وسیعی از تجهیزات مخابراتی و شبکه با بهترین کیفیت از تولیدکنندگان و تأمین‌کنندگان معتبر.',
    primary: { label: 'مشاهده محصولات', to: { name: 'products' } },
    outline: { label: 'دسته‌بندی محصولات', to: { name: 'categories' } }
  },
  {
    icon: 'pi pi-wifi',
    badge: 'جدیدترین تجهیزات شبکه',
    title: 'تجهیزات فیبر نوری و شبکه',
    desc: 'سوییچ، روتر، مودم و کابل‌های فیبر نوری از برندهای معتبر جهانی با گارانتی اصالت.',
    primary: { label: 'مشاهده محصولات', to: { name: 'products' } },
    outline: { label: 'دسته‌بندی محصولات', to: { name: 'categories' } }
  },
  {
    icon: 'pi pi-verified',
    badge: 'تأمین از بهترین برندها',
    title: 'همکاری با تأمین‌کنندگان معتبر',
    desc: 'بیش از ۲۵۰ تأمین‌کننده معتبر و بیش از ۱۵۰۰ محصول متنوع در یک بازارگاه.',
    primary: { label: 'مشاهده محصولات', to: { name: 'products' } },
    outline: { label: 'دسته‌بندی محصولات', to: { name: 'categories' } }
  }
]
const currentSlide = ref(0)
let slideTimer = null

function goToSlide(i) {
  currentSlide.value = i
}
function nextSlide() {
  currentSlide.value = (currentSlide.value + 1) % slides.length
}
function startSlideshow() {
  stopSlideshow()
  slideTimer = setInterval(nextSlide, 5000)
}
function stopSlideshow() {
  if (slideTimer) {
    clearInterval(slideTimer)
    slideTimer = null
  }
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
    products.value = Array.isArray(items) ? items : []
    featuredProducts.value = products.value.slice(0, 8)
    bestSellers.value = products.value.slice(0, 4)
  } catch (err) {
    error.value = 'خطا در دریافت محصولات'
    products.value = []
    featuredProducts.value = []
    bestSellers.value = []
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

function goToProduct(product) {
  router.push({ name: 'product-details', params: { id: product.id } })
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
  startSlideshow()
})

onBeforeUnmount(() => {
  stopSlideshow()
})
</script>


<template>
  <div class="home-page">
    <div class="home-container">

      <!-- Hero Slideshow -->
      <section
        class="hero-slideshow"
        @mouseenter="stopSlideshow"
        @mouseleave="startSlideshow"
      >
        <div class="hero-track">
          <transition name="slide-fade" mode="out-in">
            <div class="hero" :key="currentSlide">
              <div class="hero-content">
                <span class="hero-badge">
                  <i class="pi pi-check-circle"></i>
                  {{ slides[currentSlide].badge }}
                </span>
                <h1 class="hero-title">{{ slides[currentSlide].title }}</h1>
                <p class="hero-desc">{{ slides[currentSlide].desc }}</p>
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
          </transition>
        </div>

        <!-- Slideshow dots -->
        <div class="hero-dots">
          <button
            v-for="(slide, i) in slides"
            :key="i"
            class="hero-dot"
            :class="{ active: currentSlide === i }"
            @click="goToSlide(i)"
            :aria-label="`اسلاید ${i + 1}`"
          ></button>
        </div>
      </section>


      <!-- Two Column Layout: Filters (right) + Main (left) -->
      <div class="home-layout">

        <!-- Right: Filters Sidebar -->
        <aside class="filters-sidebar">
          <Card class="filters-card">
            <template #title>
              <span class="filters-title"><i class="pi pi-filter"></i> فیلتر محصولات</span>
            </template>
            <template #content>
              <div class="filters-inner">
                <!-- Search -->
                <div class="filter-group">
                  <label>جستجو</label>
                  <div class="p-inputgroup">
                    <InputText
                      v-model="searchQuery"
                      placeholder="نام محصول..."
                      @keyup.enter="applyFilters"
                      class="w-full"
                    />
                    <Button icon="pi pi-search" @click="applyFilters" />
                  </div>
                </div>

                <!-- Category -->
                <div class="filter-group">
                  <label>دسته‌بندی</label>
                  <Dropdown
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
                      v-model="minPrice"
                      placeholder="حداقل"
                      class="price-input"
                      :min="0"
                      @keyup.enter="applyFilters"
                    />
                    <span class="price-separator">—</span>
                    <InputNumber
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
          <section class="section-block">
            <div class="section-head">
              <router-link :to="{ name: 'categories' }" class="panel-link">مشاهده همه</router-link>
              <h2 class="section-title"><i class="pi pi-folder"></i> دسته‌بندی محصولات</h2>
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
                  <Card class="category-card" @click="viewCategoryProducts(category.id)">
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
          <section class="section-block">
            <div class="section-head">
              <button class="nav-btn" @click="fetchProducts" :disabled="loading" aria-label="بارگذاری مجدد">
                <i class="pi" :class="loading ? 'pi-spin pi-spinner' : 'pi-refresh'"></i>
              </button>
              <h2 class="section-title"><i class="pi pi-star-fill"></i> محصولات</h2>
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
              <p>محصولی با فیلترهای فعلی یافت نشد</p>
              <Button label="حذف فیلترها" icon="pi pi-times" severity="secondary" text @click="resetFilters" />
            </div>
            <div v-else class="products-grid">
              <div v-for="product in featuredProducts" :key="product.id" class="product-card" @click="goToProduct(product)">
                <div class="product-image">
                  <img v-if="product.images && product.images[0]?.url" :src="product.images[0].url" :alt="product.title" />
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

          <!-- Best Sellers -->
          <section class="section-block">
            <div class="section-head">
              <router-link v-if="bestSellers.length > 0" :to="{ name: 'products' }" class="panel-link">مشاهده همه</router-link>
              <h2 class="section-title"><i class="pi pi-bolt"></i> محصولات پرفروش</h2>
            </div>
            <div v-if="bestSellers.length === 0 && !loading" class="state-box">
              <i class="pi pi-box"></i>
              <p>در حال حاضر محصولی موجود نیست</p>
            </div>
            <div v-else class="products-grid">
              <div v-for="product in bestSellers" :key="product.id" class="product-card" @click="goToProduct(product)">
                <div class="product-image">
                  <img v-if="product.images && product.images[0]?.url" :src="product.images[0].url" :alt="product.title" />
                  <div v-else class="empty-image"><i class="pi pi-image"></i></div>
                  <span class="tile-badge">پرفروش</span>
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

      <!-- Stats -->
      <section class="stats-bar">
        <div v-for="(stat, i) in stats" :key="i" class="stat-item">
          <div class="stat-icon"><i :class="stat.icon"></i></div>
          <div class="stat-text">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="features-bar">
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
  background: var(--surface-ground);
  padding: 1rem 0 2rem;
}
.home-container {
  width: 100%;
  max-width: 1720px;
  margin: 0 auto;
  padding: 0 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}


/* Hero */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 2rem;
  background: linear-gradient(135deg, var(--p-primary-50) 0%, #ffffff 55%, var(--p-primary-100) 100%);
  border: 1px solid var(--surface-border);
  border-radius: 1rem;
  padding: 2.5rem 3rem;
  overflow: hidden;
}
.hero-content { text-align: right; }
.hero-badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  color: var(--primary-color); font-weight: 700; font-size: 0.95rem; margin-bottom: 1rem;
}
.hero-title {
  color: var(--p-primary-900); font-size: 2.5rem; font-weight: 800;
  line-height: 1.3; margin: 0 0 1rem;
}
.hero-desc {
  color: var(--text-color-secondary); font-size: 1.05rem; line-height: 1.9; margin: 0 0 1.5rem;
}
.hero-actions { display: flex; gap: 0.75rem; }
.hero-visual {
  position: relative; height: 260px; border-radius: 0.75rem;
  background: linear-gradient(135deg, var(--p-primary-100), var(--p-primary-300));
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.hero-glow {
  position: absolute; inset: -30%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), transparent 60%);
}
.hero-icon { font-size: 6rem; color: var(--primary-color); opacity: 0.85; z-index: 1; }

/* Hero Slideshow */
.hero-slideshow { position: relative; }
.hero-track { position: relative; }
.hero-track .hero { margin: 0; }
.hero-dots {
  display: flex; justify-content: center; gap: 0.4rem; margin-top: 0.75rem;
}
.hero-dot {
  width: 0.5rem; height: 0.5rem; border-radius: 50%; border: none;
  background: var(--surface-border); cursor: pointer; transition: all 0.25s;
  padding: 0;
}
.hero-dot.active { background: var(--primary-color); width: 1.5rem; border-radius: 1rem; }

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
.btn-primary { background: var(--p-primary-900); color: #fff; }
.btn-primary:hover { background: var(--p-primary-800); }
.btn-outline { background: transparent; color: var(--p-primary-900); border-color: var(--surface-border); }
.btn-outline:hover { border-color: var(--primary-color); color: var(--primary-color); }

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
.filters-inner :deep(.p-dropdown),
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
  background: var(--surface-card); border: 1px solid var(--surface-border);
  border-radius: 1rem; padding: 1.25rem;
}
.section-head {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;
}
.section-title {
  display: flex; align-items: center; gap: 0.5rem;
  margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-color);
}
.section-title i { color: #f5a623; }
.panel-link {
  font-size: 0.85rem; color: var(--primary-color); text-decoration: none; font-weight: 600;
}
.panel-link:hover { text-decoration: underline; }

/* Category Carousel */
.cat-carousel :deep(.p-carousel-item) { padding: 0.25rem; }
.cat-slide { padding: 0.25rem; height: 100%; }
.category-card {
  cursor: pointer;
  transition: all 0.2s ease;
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
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
}
.product-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border); border-radius: 0.75rem;
  overflow: hidden; cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}
.product-card:hover { box-shadow: var(--ds-shadow-md); transform: translateY(-2px); }
.product-image {
  position: relative; height: 150px; background: var(--surface-ground);
  overflow: hidden; display: flex; align-items: center; justify-content: center;
}
.product-image img { width: 100%; height: 100%; object-fit: cover; }
.empty-image i { font-size: 2rem; color: var(--text-color-secondary); opacity: 0.4; }
.tile-badge {
  position: absolute; top: 0.5rem; inset-inline-start: 0.5rem;
  background: var(--primary-color); color: var(--primary-contrast-color);
  font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 1rem;
}
.product-info { padding: 0.75rem; }
.product-title {
  margin: 0 0 0.25rem; font-size: 0.9rem; font-weight: 700; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.product-vendor { margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--text-color-secondary); }
.product-price { font-weight: 800; color: var(--ds-color-primary); font-size: 0.9rem; }

/* Nav buttons */
.nav-btn {
  width: 1.75rem; height: 1.75rem; border-radius: 0.4rem;
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

/* Stats */
.stats-bar {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem;
  background: var(--surface-card); border: 1px solid var(--surface-border);
  border-radius: 1rem; padding: 1rem 1.25rem;
}
.stat-item {
  display: flex; align-items: center; gap: 0.75rem; justify-content: center;
  border-inline-start: 1px solid var(--surface-border); padding: 0 0.5rem;
}
.stat-item:last-child { border-inline-start: none; }
.stat-icon {
  width: 2.5rem; height: 2.5rem; border-radius: 50%;
  background: var(--p-primary-50); display: flex; align-items: center;
  justify-content: center; flex-shrink: 0;
}
.stat-icon i { font-size: 1.1rem; color: var(--primary-color); }
.stat-text { display: flex; flex-direction: column; }
.stat-value { font-size: 1.2rem; font-weight: 800; color: var(--text-color); line-height: 1.2; }
.stat-label { font-size: 0.75rem; color: var(--text-color-secondary); }

/* Features */
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
  .stats-bar, .features-bar { grid-template-columns: repeat(2, 1fr); }
  .stat-item, .feature-item { border-inline-start: none; }
}
@media (max-width: 560px) {
  .hero-title { font-size: 1.75rem; }
  .hero-actions { flex-direction: column; }
  .btn { justify-content: center; }
  .products-grid, .stats-bar, .features-bar { grid-template-columns: 1fr; }
}
</style>
