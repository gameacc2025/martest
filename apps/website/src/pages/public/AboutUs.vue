<script setup>
import { ref, onMounted } from 'vue'
import { productsApi } from '@telecom/api-client'
import { formatPrice } from '../../utils/helpers'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'

const home = { icon: 'pi pi-home', to: '/' }
const breadcrumbItems = [{ label: 'درباره ما' }]

const featuredProducts = ref([])
const productsLoading = ref(false)
const productsError = ref('')

const values = [
  {
    title: 'اعتماد و بررسی',
    text: 'فرآیندهای بررسی شرکت‌ها و محصولات به ایجاد یک فضای تجاری قابل اتکاتر کمک می‌کنند.',
  },
  {
    title: 'تأمین تخصصی',
    text: 'دسته‌بندی تجهیزات مخابراتی و شبکه، پیدا کردن محصولات متناسب با نیاز سازمان را ساده‌تر می‌کند.',
  },
  {
    title: 'ارتباط مستقیم',
    text: 'درخواست استعلام به خریداران واجد دسترسی کمک می‌کند پیشنهادهای تأمین‌کنندگان را دریافت و مقایسه کنند.',
  },
  {
    title: 'شفافیت در تصمیم‌گیری',
    text: 'اطلاعات محصول و پیشنهادهای موجود، پایه‌ای برای مقایسه و انتخاب آگاهانه فراهم می‌کنند.',
  },
]

const steps = [
  {
    number: '۱',
    title: 'محصول موردنیاز را پیدا کنید',
    text: 'در دسته‌بندی‌ها و فهرست محصولات جستجو کنید و مشخصات محصول را بررسی کنید.',
  },
  {
    number: '۲',
    title: 'در صورت داشتن دسترسی، استعلام ثبت کنید',
    text: 'خریداران مجاز می‌توانند درخواست استعلام ثبت کنند و پیشنهادهای تأمین‌کنندگان را دریافت کنند.',
  },
  {
    number: '۳',
    title: 'پیشنهادها را مقایسه کنید',
    text: 'اطلاعات و شرایط پیشنهادهای دریافت‌شده را بررسی کنید و گزینه مناسب را انتخاب کنید.',
  },
]

onMounted(fetchProducts)

async function fetchProducts() {
  productsLoading.value = true
  productsError.value = ''
  try {
    const response = await productsApi.list({ page: 1, limit: 6, status: 'PUBLISHED' })
    const items = response?.data?.items
      ?? response?.data?.data?.items
      ?? (Array.isArray(response?.data) ? response.data : [])
    featuredProducts.value = Array.isArray(items) ? items.slice(0, 6) : []
  } catch (error) {
    console.error('Error loading featured products:', error)
    featuredProducts.value = []
    productsError.value = 'دریافت محصولات ویژه ممکن نشد. دوباره تلاش کنید.'
  } finally {
    productsLoading.value = false
  }
}

function getProductImage(product) {
  const images = Array.isArray(product?.images) ? product.images : []
  const primaryImage = images.find(image => typeof image === 'object' && image?.isPrimary && image?.url)
    || images.find(image => typeof image === 'object' && image?.url)
    || images.find(image => typeof image === 'string' && image)
  return typeof primaryImage === 'string' ? primaryImage : primaryImage?.url || ''
}

</script>

<template>
  <main class="about-page ds-page" aria-labelledby="about-title">
    <div class="about-container ds-container ds-stack">
      <Breadcrumb :home="home" :model="breadcrumbItems" aria-label="مسیر صفحه" />

      <section class="about-hero" aria-labelledby="about-title">
        <div class="about-hero__copy">
          <h1 id="about-title" class="ds-h1">تأمین تجهیزات مخابراتی؛ ساده‌تر و شفاف‌تر</h1>
          <p class="ds-lead">
            بستری برای پیدا کردن تجهیزات، آشنایی با تأمین‌کنندگان و مقایسه پیشنهادها در زنجیره تأمین مخابرات و شبکه.
          </p>
          <div class="about-hero__actions">
            <router-link :to="{ name: 'products' }" class="ds-btn ds-btn--primary">مشاهده محصولات</router-link>
            <router-link :to="{ name: 'contact' }" class="ds-btn ds-btn--outline">تماس با ما</router-link>
          </div>
        </div>
      </section>

      <section class="about-section" aria-labelledby="about-mission-title">
        <header class="ds-section-head">
          <h2 id="about-mission-title" class="ds-h2">اتصال نیازهای واقعی به تأمین‌کنندگان مناسب</h2>
        </header>
        <p class="about-mission">
          بازارگاه مخابرات با تمرکز بر نیازهای کسب‌وکارها، مسیر کشف محصولات و ارتباط با تأمین‌کنندگان را در یک تجربه واحد جمع می‌کند.
          هدف، کمک به مقایسه بهتر گزینه‌ها و پشتیبانی از تصمیم‌گیری آگاهانه در خرید تجهیزات تخصصی است.
        </p>
      </section>

      <section class="about-section" aria-labelledby="about-values-title">
        <header class="ds-section-head">
          <h2 id="about-values-title" class="ds-h2">چه چیزی برای ما مهم است؟</h2>
        </header>
        <div class="about-values">
          <article v-for="value in values" :key="value.title" class="about-value">
            <h3>{{ value.title }}</h3>
            <p>{{ value.text }}</p>
          </article>
        </div>
      </section>

      <section class="about-section" aria-labelledby="about-steps-title">
        <header class="ds-section-head">
          <h2 id="about-steps-title" class="ds-h2">از جستجو تا مقایسه پیشنهادها</h2>
        </header>
        <ol class="about-steps">
          <li v-for="step in steps" :key="step.number" class="about-step">
            <span class="about-step__number">{{ step.number }}</span>
            <div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.text }}</p>
            </div>
          </li>
        </ol>
      </section>

      <section class="about-section" aria-labelledby="featured-products-title">
        <header class="ds-section-head">
          <h2 id="featured-products-title" class="ds-h2">محصولات منتشرشده</h2>
          <router-link :to="{ name: 'products' }" class="ds-link">همه محصولات <i class="pi pi-arrow-left" aria-hidden="true"></i></router-link>
        </header>

        <div v-if="productsLoading" class="about-state ds-card" role="status" aria-live="polite" aria-busy="true">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          <p>در حال دریافت محصولات…</p>
        </div>
        <div v-else-if="productsError" class="about-state about-state--error ds-card" role="alert">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <p>{{ productsError }}</p>
          <Button label="تلاش دوباره" icon="pi pi-refresh" @click="fetchProducts" />
        </div>
        <div v-else-if="featuredProducts.length === 0" class="about-state ds-card" role="status">
          <i class="pi pi-box" aria-hidden="true"></i>
          <p>در حال حاضر محصول منتشرشده‌ای برای نمایش وجود ندارد.</p>
        </div>
        <div v-else class="about-products">
          <article v-for="product in featuredProducts" :key="product.id" class="about-product ds-card">
            <router-link :to="{ name: 'product-details', params: { id: product.id } }" class="about-product__open">
              <span class="about-product__image">
                <img v-if="getProductImage(product)" :src="getProductImage(product)" :alt="product.title || product.name || 'تصویر محصول'" width="640" height="400" loading="lazy" decoding="async" />
                <i v-else class="pi pi-image" aria-hidden="true"></i>
              </span>
              <span class="about-product__name">{{ product.title || product.name || 'محصول بدون عنوان' }}</span>
            </router-link>
            <p v-if="product.company?.name || product.vendor" class="about-product__vendor">{{ product.company?.name || product.vendor }}</p>
            <div class="about-product__footer">
              <span v-if="product.prices?.[0]" class="about-product__price">
                {{ formatPrice(product.prices[0].price, product.prices[0].currency) }}
              </span>
              <router-link :to="{ name: 'product-details', params: { id: product.id } }" class="about-product__link">مشاهده محصول <i class="pi pi-arrow-left" aria-hidden="true"></i></router-link>
            </div>
          </article>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.about-page { direction: rtl; }
.about-container { padding-block: var(--ds-space-8) var(--ds-space-16); }
.about-hero {
  padding: 0 0 var(--ds-space-6);
  border-bottom: 1px solid var(--ds-color-border);
}
.about-hero__copy { max-width: 68ch; min-width: 0; }
.about-hero__copy .ds-h1 { max-width: 18ch; text-wrap: balance; }
.about-hero__actions { display: flex; flex-wrap: wrap; gap: var(--ds-space-3); margin-top: var(--ds-space-5); }
.about-section {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding-top: var(--ds-space-6);
  border-top: 1px solid var(--ds-color-border);
}
.about-mission { max-width: 72ch; margin: 0; color: var(--ds-color-text-muted); line-height: var(--ds-line-height-relaxed); }
.about-values { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 var(--ds-space-6); }
.about-value { padding: var(--ds-space-4) 0; border-top: 1px solid var(--ds-color-border); }
.about-value h3, .about-step h3 { margin: 0 0 var(--ds-space-2); color: var(--ds-color-text); font-size: var(--ds-font-size-md); font-weight: var(--ds-font-weight-bold); }
.about-value p, .about-step p { margin: 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: var(--ds-line-height-relaxed); }
.about-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--ds-space-5); margin: 0; padding: 0; list-style: none; }
.about-step { display: flex; align-items: flex-start; gap: var(--ds-space-3); padding: var(--ds-space-4) 0 0; border-top: 1px solid var(--ds-color-border); }
.about-step__number { display: inline-flex; flex: 0 0 2.25rem; width: 2.25rem; height: 2.25rem; align-items: center; justify-content: center; color: var(--ds-color-primary-text); font-weight: var(--ds-font-weight-bold); font-variant-numeric: tabular-nums; }
.about-products { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--ds-space-4); }
.about-product { min-width: 0; padding: var(--ds-space-3); border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); background: var(--ds-color-surface); box-shadow: none; }
.about-product__open { display: flex; width: 100%; flex-direction: column; gap: var(--ds-space-3); padding: 0; border: 0; background: transparent; color: inherit; text-align: right; text-decoration: none; cursor: pointer; }
.about-product__open:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 3px; }
.about-product__image { display: flex; width: 100%; aspect-ratio: 16 / 10; align-items: center; justify-content: center; overflow: hidden; border-radius: var(--ds-radius-sm); background: var(--ds-color-surface-alt); color: var(--ds-color-text-muted); font-size: 2rem; }
.about-product__image img { width: 100%; height: 100%; object-fit: cover; }
.about-product__name { color: var(--ds-color-text); font-weight: var(--ds-font-weight-bold); line-height: var(--ds-line-height-relaxed); }
.about-product__vendor { margin: var(--ds-space-2) 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
.about-product__footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--ds-space-2); border-top: 1px solid var(--ds-color-border); padding-top: var(--ds-space-3); }
.about-product__price { color: var(--ds-color-primary-text); font-weight: var(--ds-font-weight-bold); font-variant-numeric: tabular-nums; }
.about-product__link { display: inline-flex; align-items: center; gap: var(--ds-space-2); min-height: 2.75rem; color: var(--ds-color-primary-text); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-semibold); text-decoration: none; }
.about-product__link:hover { text-decoration: underline; }
.about-product__link:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 3px; }
.about-state { display: flex; min-height: 10rem; flex-direction: column; align-items: center; justify-content: center; gap: var(--ds-space-3); padding: var(--ds-space-6); text-align: center; color: var(--ds-color-text-muted); }
.about-state > i { font-size: 2rem; }
.about-state p { margin: 0; }
.about-state--error { border-color: var(--ds-status-danger-fg); }
@media (max-width: 1000px) { .about-products { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 760px) {
  .about-values, .about-steps { grid-template-columns: minmax(0, 1fr); }
  .about-steps { gap: var(--ds-space-4); }
}
@media (max-width: 520px) { .about-products { grid-template-columns: minmax(0, 1fr); } }
</style>
