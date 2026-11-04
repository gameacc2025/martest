<script setup>
/**
 * Website homepage — unified "tem" storefront composition.
 *
 * Data comes exclusively from the live marketplace APIs: the product list
 * (recent + featured flag) and the category store used by /categories.
 * There is no mock data and no fabricated marketplace statistic.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { productsApi } from '@telecom/api-client'
import { useProductsStore } from '../../stores/products'
import { formatPrice } from '../../utils/helpers'

const router = useRouter()
const productsStore = useProductsStore()

const featuredProducts = ref([])
const recentProducts = ref([])
const categories = ref([])
const loading = ref(false)
const categoriesLoading = ref(false)
const error = ref(null)

const searchQuery = ref('')

const features = [
  { icon: 'pi pi-box', title: 'کاتالوگ تخصصی', text: 'تجهیزات مخابراتی و شبکه در یک فضای یکپارچه' },
  { icon: 'pi pi-search', title: 'جستجو و فیلتر', text: 'یافتن محصولات بر اساس دسته‌بندی و محدوده قیمت' },
  { icon: 'pi pi-file-edit', title: 'استعلام قیمت', text: 'ثبت درخواست برای دریافت پیشنهاد تأمین‌کنندگان' },
  { icon: 'pi pi-sliders-h', title: 'مشخصات فنی', text: 'بررسی جزئیات و ویژگی‌های ثبت‌شده محصولات' }
]

const visibleCategories = computed(() => categories.value.slice(0, 8))

async function fetchProducts() {
  try {
    loading.value = true
    error.value = null
    const params = { page: 1, limit: 12, status: 'PUBLISHED' }

    const response = await productsApi.list(params)
    const items = response?.data?.data ?? []
    recentProducts.value = (Array.isArray(items) ? items : []).slice(0, 4)

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
  <div class="home-page" dir="rtl">
    <div class="home-container">

      <!-- Hero -->
      <section class="site-hero home-hero" aria-labelledby="home-title">
        <div class="home-hero__copy">
          <span class="home-hero__eyebrow">
            <i class="pi pi-broadcast" aria-hidden="true"></i>
            بازارگاه تخصصی تجهیزات مخابراتی
          </span>
          <h1 id="home-title">تجهیزات مخابراتی و شبکه را دقیق پیدا کنید</h1>
          <p>
            محصولات، مشخصات فنی و تأمین‌کنندگان بازارگاه را جستجو کنید و برای دریافت
            قیمت، مسیر استعلام را دنبال کنید.
          </p>

          <form class="home-hero__search" role="search" @submit.prevent="heroSearch">
            <i class="pi pi-search" aria-hidden="true"></i>
            <input
              v-model="searchQuery"
              type="search"
              name="homepage-search"
              autocomplete="off"
              placeholder="نام محصول، برند یا دسته‌بندی را جستجو کنید…"
              aria-label="جستجوی محصولات"
            />
            <button type="submit" class="tm-btn tm-btn--accent">جستجو</button>
          </form>

          <div class="home-hero__links">
            <router-link :to="{ name: 'products' }">مشاهده همه محصولات</router-link>
            <router-link :to="{ name: 'categories' }">دسته‌بندی‌ها</router-link>
            <router-link :to="{ name: 'my-inquiries' }">استعلام‌های من</router-link>
          </div>
        </div>

        <div class="home-hero__aside" aria-hidden="true">
          <span class="home-hero__badge"><i class="pi pi-shield"></i> اطلاعات ثبت‌شده تأمین‌کنندگان</span>
          <span class="home-hero__badge"><i class="pi pi-chart-line"></i> مقایسه مشخصات فنی</span>
          <span class="home-hero__badge"><i class="pi pi-send"></i> ثبت درخواست استعلام</span>
        </div>
      </section>

      <!-- Categories -->
      <section class="home-section" aria-labelledby="home-categories">
        <div class="site-section-title">
          <h2 id="home-categories">دسته‌بندی محصولات</h2>
          <router-link :to="{ name: 'categories' }">همه دسته‌بندی‌ها</router-link>
        </div>

        <div v-if="categoriesLoading" class="home-category-grid" aria-busy="true">
          <div v-for="i in 8" :key="i" class="home-category-card home-skeleton"></div>
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
            <span class="category-card__icon" aria-hidden="true"><i class="pi pi-th-large"></i></span>
            <span class="category-card__name">{{ category.nameFa || category.nameEn || category.name }}</span>
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
        </div>

        <div v-else-if="featuredProducts.length === 0" class="home-empty">
          <i class="pi pi-box" aria-hidden="true"></i>
          <p>هنوز محصول ویژه‌ای منتشر نشده است. همه محصولات منتشرشده را ببینید.</p>
          <router-link :to="{ name: 'products' }" class="tm-btn tm-btn--sm">مشاهده محصولات</router-link>
        </div>

        <div v-else class="home-product-grid">
          <router-link
            v-for="product in featuredProducts"
            :key="product.id"
            :to="productRoute(product)"
            class="product-card"
          >
            <span class="product-card__media">
              <img
                v-if="getProductImage(product)"
                :src="getProductImage(product).url"
                :alt="product.name"
                width="320"
                height="240"
                loading="lazy"
                decoding="async"
              />
              <i v-else class="pi pi-box" aria-hidden="true"></i>
            </span>

            <span class="product-card__body">
              <span v-if="product.company?.isVerified" class="tm-pill tm-pill--success">
                <i class="pi pi-verified" aria-hidden="true"></i> تأمین‌کننده احرازشده
              </span>

              <span class="product-card__name">{{ product.name }}</span>
              <span v-if="product.company?.name" class="product-card__company">{{ product.company.name }}</span>
              <span v-if="product.sku" class="product-sku">کد: {{ product.sku }}</span>

              <span class="product-card__foot">
                <span v-if="product.finalPrice || product.price" class="product-card__price">
                  {{ formatPrice(product.finalPrice || product.price) }}
                </span>
                <span v-else class="product-card-cta">استعلام از تأمین‌کننده</span>
              </span>
            </span>
          </router-link>
        </div>
      </section>

      <!-- Recent products -->
      <section v-if="recentProducts.length" class="home-section" aria-labelledby="home-recent">
        <div class="site-section-title">
          <h2 id="home-recent">تازه‌ترین محصولات</h2>
          <router-link :to="{ name: 'products' }">همه محصولات</router-link>
        </div>

        <div class="tm-table-wrap">
          <div class="tm-table-scroll">
            <table class="tm-table">
              <caption class="sr-only">تازه‌ترین محصولات منتشرشده در بازارگاه</caption>
              <thead>
                <tr>
                  <th scope="col">محصول</th>
                  <th scope="col">تأمین‌کننده</th>
                  <th scope="col" class="tm-table__num">قیمت</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in recentProducts" :key="product.id">
                  <td>
                    <router-link :to="productRoute(product)" class="home-recent__name">{{ product.name }}</router-link>
                  </td>
                  <td>{{ product.company?.name || '—' }}</td>
                  <td class="tm-table__num">
                    {{ product.finalPrice || product.price ? formatPrice(product.finalPrice || product.price) : 'استعلامی' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Capabilities -->
      <section class="home-section" aria-labelledby="home-features">
        <div class="site-section-title">
          <h2 id="home-features">امکانات بازارگاه</h2>
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

    </div>
  </div>
</template>

<style scoped>
.home-page { background: var(--tm-canvas); }
.home-container {
  width: 100%;
  max-width: 1240px;
  margin-inline: auto;
  padding-inline: clamp(14px, 2vw, 28px);
  display: flex;
  flex-direction: column;
  gap: 34px;
}

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
  color: #bdf3fb;
  font-size: 11.5px;
  font-weight: 600;
}
.home-hero h1 { margin: 16px 0 12px; font-size: clamp(24px, 3vw, 38px); line-height: 1.35; color: #fff; }
.home-hero p { margin: 0 0 22px; max-width: 56ch; color: #cfe6f2; font-size: 14px; line-height: 1.9; }

.home-hero__search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 14px;
  background: #fff;
  border-radius: var(--tm-radius);
  max-width: 620px;
}
.home-hero__search i { color: var(--tm-muted); font-size: 14px; }
.home-hero__search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-family: inherit;
  font-size: 13.5px;
  color: var(--tm-ink);
  padding: 9px 0;
}
.home-hero__search .tm-btn { flex: none; }

.home-hero__links { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 16px; }
.home-hero__links a { color: #bdf3fb; font-size: 12.5px; font-weight: 600; text-decoration: none; }
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
  color: #e6f4fb;
  font-size: 12.5px;
  font-weight: 500;
}
.home-hero__badge i { color: var(--tm-cyan); }

/* Sections */
.home-section { min-width: 0; }

.home-category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 14px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius);
  background: #fff;
  cursor: pointer;
  text-align: start;
  font-family: inherit;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}
.category-card:hover { border-color: var(--tm-cyan-strong); box-shadow: var(--tm-shadow-sm); transform: translateY(-1px); }
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
.category-card__name { font-size: 12.5px; font-weight: 600; color: var(--tm-ink); line-height: 1.5; }

.home-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.product-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}
.product-card:hover { border-color: var(--tm-line-strong); box-shadow: var(--tm-shadow-sm); transform: translateY(-2px); }
.product-card:focus-visible { outline: 2px solid var(--tm-cyan); outline-offset: 2px; }

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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.product-card__company { font-size: 11.5px; color: var(--tm-muted); }
.product-sku { font-size: 10.5px; color: var(--tm-faint); }
.product-card__foot { margin-top: auto; padding-top: 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.product-card__price { font-size: 13px; font-weight: 700; color: var(--tm-blue); }
.product-card-cta { font-size: 11px; font-weight: 600; color: var(--tm-cyan-deep); }
.product-card__body .tm-pill { align-self: flex-start; }

.home-recent__name { color: var(--tm-ink); font-weight: 600; text-decoration: none; }
.home-recent__name:hover { color: var(--tm-blue); }

.home-feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; }
.home-feature {
  padding: 18px;
  background: #fff;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
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
.home-feature p { margin: 0; font-size: 12px; line-height: 1.8; color: var(--tm-muted); }

.home-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;
  padding: 26px 28px;
  border-radius: var(--tm-radius-lg);
  background:
    radial-gradient(circle at 90% 20%, rgba(46, 211, 238, 0.25), transparent 45%),
    linear-gradient(118deg, #0a1c3f, #12507a);
  color: #fff;
}
.home-cta h2 { margin: 0 0 6px; font-size: 19px; color: #fff; }
.home-cta p { margin: 0; font-size: 12.5px; color: #cfe6f2; }

.home-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 38px 20px;
  background: #fff;
  border: 1px dashed var(--tm-line-strong);
  border-radius: var(--tm-radius-lg);
  color: var(--tm-muted);
  text-align: center;
}
.home-empty i { font-size: 24px; color: var(--tm-faint); }
.home-empty p { margin: 0; font-size: 13px; }

.home-skeleton {
  min-height: 150px;
  background: linear-gradient(90deg, var(--tm-surface-alt) 25%, #eef3fb 37%, var(--tm-surface-alt) 63%);
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

@media (max-width: 900px) {
  .home-hero { grid-template-columns: 1fr; }
  .home-hero__aside { display: none; }
}
@media (max-width: 575px) {
  .home-hero__search { flex-wrap: wrap; }
  .home-hero__search .tm-btn { width: 100%; }
  .home-container { gap: 26px; }
}
@media (prefers-reduced-motion: reduce) {
  .home-skeleton { animation: none; }
  .product-card:hover, .category-card:hover { transform: none; }
}
</style>