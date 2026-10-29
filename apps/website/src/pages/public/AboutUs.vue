<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { productsApi } from '@telecom/api-client'
import { formatPrice } from '../../utils/helpers'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'

const router = useRouter()
const home = { icon: 'pi pi-home', to: '/' }
const breadcrumbItems = [{ label: 'درباره ما' }]

const featuredProducts = ref([])
const productsLoading = ref(false)
const productsError = ref('')

const values = [
  {
    icon: 'pi pi-shield',
    title: 'اعتماد و بررسی',
    text: 'فرآیندهای بررسی شرکت‌ها و محصولات به ایجاد یک فضای تجاری قابل اتکاتر کمک می‌کنند.',
  },
  {
    icon: 'pi pi-sitemap',
    title: 'تأمین تخصصی',
    text: 'دسته‌بندی تجهیزات مخابراتی و شبکه، پیدا کردن محصولات متناسب با نیاز سازمان را ساده‌تر می‌کند.',
  },
  {
    icon: 'pi pi-comments',
    title: 'ارتباط مستقیم',
    text: 'درخواست استعلام به خریداران واجد دسترسی کمک می‌کند پیشنهادهای تأمین‌کنندگان را دریافت و مقایسه کنند.',
  },
  {
    icon: 'pi pi-eye',
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

function openProduct(product) {
  router.push({ name: 'product-details', params: { id: product.id } })
}
</script>

<template>
  <main class="about-page ds-page" aria-labelledby="about-title">
    <div class="about-container ds-container ds-stack">
      <Breadcrumb :home="home" :model="breadcrumbItems" aria-label="مسیر صفحه" />

      <section class="about-hero ds-card" aria-labelledby="about-title">
        <div class="about-hero__copy">
          <span class="ds-eyebrow">بازارگاه تخصصی تجهیزات مخابراتی</span>
          <h1 id="about-title" class="ds-h1">تأمین تجهیزات مخابراتی؛ ساده‌تر و شفاف‌تر</h1>
          <p class="ds-lead">
            بستری برای پیدا کردن تجهیزات، آشنایی با تأمین‌کنندگان و مقایسه پیشنهادها در زنجیره تأمین مخابرات و شبکه.
          </p>
          <div class="about-hero__actions">
            <router-link :to="{ name: 'products' }" class="ds-btn ds-btn--primary">مشاهده محصولات</router-link>
            <router-link :to="{ name: 'contact' }" class="ds-btn ds-btn--outline">تماس با ما</router-link>
          </div>
        </div>
        <div class="about-hero__visual" aria-hidden="true">
          <span class="about-hero__orb about-hero__orb--one"></span>
          <span class="about-hero__orb about-hero__orb--two"></span>
          <i class="pi pi-server"></i>
          <span class="about-hero__visual-label">Telecom Market</span>
        </div>
      </section>

      <section class="about-section" aria-labelledby="about-mission-title">
        <header class="ds-section-head">
          <div>
            <span class="ds-eyebrow">ماموریت ما</span>
            <h2 id="about-mission-title" class="ds-h2">اتصال نیازهای واقعی به تأمین‌کنندگان مناسب</h2>
          </div>
        </header>
        <p class="about-mission">
          بازارگاه مخابرات با تمرکز بر نیازهای کسب‌وکارها، مسیر کشف محصولات و ارتباط با تأمین‌کنندگان را در یک تجربه واحد جمع می‌کند.
          هدف، کمک به مقایسه بهتر گزینه‌ها و پشتیبانی از تصمیم‌گیری آگاهانه در خرید تجهیزات تخصصی است.
        </p>
      </section>

      <section class="about-section" aria-labelledby="about-values-title">
        <header class="ds-section-head">
          <div>
            <span class="ds-eyebrow">اصول کار ما</span>
            <h2 id="about-values-title" class="ds-h2">چه چیزی برای ما مهم است؟</h2>
          </div>
        </header>
        <div class="about-values">
          <article v-for="value in values" :key="value.title" class="about-value ds-card">
            <span class="about-value__icon"><i :class="value.icon" aria-hidden="true"></i></span>
            <h3>{{ value.title }}</h3>
            <p>{{ value.text }}</p>
          </article>
        </div>
      </section>

      <section class="about-section" aria-labelledby="about-steps-title">
        <header class="ds-section-head">
          <div>
            <span class="ds-eyebrow">مسیر استفاده</span>
            <h2 id="about-steps-title" class="ds-h2">از جستجو تا مقایسه پیشنهادها</h2>
          </div>
        </header>
        <ol class="about-steps">
          <li v-for="step in steps" :key="step.number" class="about-step ds-card">
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
          <div>
            <span class="ds-eyebrow">از بازارگاه دیدن کنید</span>
            <h2 id="featured-products-title" class="ds-h2">محصولات منتشرشده</h2>
          </div>
          <router-link :to="{ name: 'products' }" class="ds-link">همه محصولات <i class="pi pi-arrow-left" aria-hidden="true"></i></router-link>
        </header>

        <div v-if="productsLoading" class="about-state ds-card" role="status" aria-live="polite" aria-busy="true">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          <p>در حال دریافت محصولات...</p>
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
            <button type="button" class="about-product__open" @click="openProduct(product)">
              <span class="about-product__image">
                <img v-if="getProductImage(product)" :src="getProductImage(product)" :alt="product.title || product.name || 'تصویر محصول'" loading="lazy" />
                <i v-else class="pi pi-image" aria-hidden="true"></i>
              </span>
              <span class="about-product__name">{{ product.title || product.name || 'محصول بدون عنوان' }}</span>
            </button>
            <p class="about-product__vendor">{{ product.company?.name || product.vendor || 'تأمین‌کننده' }}</p>
            <div class="about-product__footer">
              <span v-if="product.prices?.[0]" class="about-product__price">
                {{ formatPrice(product.prices[0].price, product.prices[0].currency) }}
              </span>
              <Button label="مشاهده محصول" icon="pi pi-arrow-left" text @click="openProduct(product)" />
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
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(16rem, 0.8fr);
  gap: var(--ds-space-8);
  align-items: center;
  padding: clamp(1.25rem, 4vw, 3rem);
  overflow: hidden;
  background: linear-gradient(120deg, var(--ds-color-surface) 0%, var(--ds-color-surface-hover) 100%);
}
.about-hero__copy { min-width: 0; }
.about-hero__copy .ds-h1 { max-width: 16ch; }
.about-hero__actions { display: flex; flex-wrap: wrap; gap: var(--ds-space-3); margin-top: var(--ds-space-6); }
.about-hero__visual {
  position: relative;
  display: flex;
  min-height: 15rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-3);
  overflow: hidden;
  border-radius: var(--ds-radius-xl);
  background: linear-gradient(135deg, var(--ds-color-brand-deep), var(--ds-color-brand-dark));
  color: var(--ds-color-on-brand);
}
.about-hero__visual > i { position: relative; z-index: 1; font-size: clamp(3.5rem, 8vw, 5.5rem); }
.about-hero__visual-label { position: relative; z-index: 1; font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-bold); letter-spacing: 0.08em; }
.about-hero__orb { position: absolute; width: 13rem; height: 13rem; border: 1px solid rgb(255 255 255 / 22%); border-radius: 50%; }
.about-hero__orb--one { inset-block-start: -5rem; inset-inline-start: -3rem; }
.about-hero__orb--two { inset-block-end: -7rem; inset-inline-end: -4rem; width: 17rem; height: 17rem; }
.about-section { display: flex; flex-direction: column; gap: var(--ds-space-4); }
.about-mission { max-width: 78ch; margin: 0; color: var(--ds-color-text-muted); line-height: var(--ds-line-height-relaxed); }
.about-values { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--ds-space-4); }
.about-value { padding: var(--ds-space-5); }
.about-value__icon {
  display: inline-flex; width: 3rem; height: 3rem; align-items: center; justify-content: center;
  margin-bottom: var(--ds-space-4); border-radius: var(--ds-radius-lg);
  background: var(--ds-color-primary-subtle); color: var(--ds-color-primary-text); font-size: 1.25rem;
}
.about-value h3, .about-step h3 { margin: 0 0 var(--ds-space-2); color: var(--ds-color-text); font-size: var(--ds-font-size-md); font-weight: var(--ds-font-weight-bold); }
.about-value p, .about-step p { margin: 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: var(--ds-line-height-relaxed); }
.about-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--ds-space-4); margin: 0; padding: 0; list-style: none; }
.about-step { display: flex; align-items: flex-start; gap: var(--ds-space-4); padding: var(--ds-space-5); }
.about-step__number {
  display: inline-flex; flex: 0 0 2.5rem; width: 2.5rem; height: 2.5rem; align-items: center; justify-content: center;
  border-radius: var(--ds-radius-pill); background: var(--ds-color-brand-dark); color: var(--ds-color-on-brand); font-weight: 800;
}
.about-products { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--ds-space-4); }
.about-product { min-width: 0; padding: var(--ds-space-3); }
.about-product__open { display: flex; width: 100%; flex-direction: column; gap: var(--ds-space-3); padding: 0; border: 0; background: transparent; color: inherit; text-align: right; cursor: pointer; }
.about-product__image { display: flex; width: 100%; aspect-ratio: 16 / 10; align-items: center; justify-content: center; overflow: hidden; border-radius: var(--ds-radius-md); background: var(--ds-color-surface-hover); color: var(--ds-color-text-muted); font-size: 2rem; }
.about-product__image img { width: 100%; height: 100%; object-fit: cover; }
.about-product__name { color: var(--ds-color-text); font-weight: var(--ds-font-weight-bold); line-height: var(--ds-line-height-relaxed); }
.about-product__vendor { margin: var(--ds-space-2) 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
.about-product__footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--ds-space-2); border-top: 1px solid var(--ds-color-border); padding-top: var(--ds-space-3); }
.about-product__price { color: var(--ds-color-primary-text); font-weight: var(--ds-font-weight-bold); }
.about-state { display: flex; min-height: 10rem; flex-direction: column; align-items: center; justify-content: center; gap: var(--ds-space-3); padding: var(--ds-space-6); text-align: center; color: var(--ds-color-text-muted); }
.about-state > i { font-size: 2rem; }
.about-state p { margin: 0; }
.about-state--error { border-color: var(--ds-status-danger-fg); }
@media (max-width: 1000px) {
  .about-values { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .about-products { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .about-hero { grid-template-columns: minmax(0, 1fr); }
  .about-hero__visual { min-height: 11rem; }
  .about-steps { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 520px) {
  .about-values, .about-products { grid-template-columns: minmax(0, 1fr); }
}
</style>
