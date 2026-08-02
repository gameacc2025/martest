<template>
  <div class="about-page">
    <div class="about-container">

      <!-- Breadcrumb -->
      <div class="breadcrumb-wrap">
        <Breadcrumb :home="home" :model="items" />
      </div>

      <!-- Hero Section -->
      <section class="about-hero">
        <div class="hero-content">
          <span class="hero-badge">
            <i class="pi pi-check-circle"></i>
            بازارگاه تخصصی تجهیزات مخابراتی
          </span>
          <h1 class="hero-title">درباره بازارگاه مخابرات</h1>
          <p class="hero-desc">
            بزرگترین پلتفرم خرید و فروش محصولات مخابراتی در ایران
          </p>
        </div>
        <div class="hero-visual">
          <div class="hero-glow"></div>
          <i class="pi pi-server hero-icon"></i>
        </div>
      </section>

      <!-- Our Story -->
      <section class="section-block">
        <div class="section-head">
          <h2 class="section-title"><i class="pi pi-book"></i> داستان ما</h2>
        </div>
        <div class="story-grid">
          <div class="story-text">
            <p>
              بازارگاه مخابرات در سال ۱۳۹۵ با هدف ایجاد بستری امن و کارآمد برای خرید و فروش محصولات مخابراتی تاسیس شد.
              ما با بهره گیری از تکنولوژی های روز دنیا و تیمی مجرب، توانسته ایم به یکی از معتبرترین پلتفرم های
              خرید و فروش در حوزه مخابرات تبدیل شویم.
            </p>
            <p>
              ماموریت ما ارائه بهترین تجربه خرید به مشتریان و فراهم آوردن فرصت های بی نظیر برای فروشندگان است.
              ما معتقدیم که با ایجاد ارتباط مستقیم بین تولید کنندگان و مصرف کنندگان، می توانیم زنجیره تامین را
              کوتاه تر کرده و قیمت های منصفانه تری را ارائه دهیم.
            </p>
          </div>
          <div class="story-image">
            <div class="image-placeholder">
              <i class="pi pi-building"></i>
              <span>بازارگاه مخابرات</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Our Values -->
      <section class="section-block">
        <div class="section-head">
          <h2 class="section-title"><i class="pi pi-star-fill"></i> ارزش های ما</h2>
        </div>
        <div class="values-grid">
          <div class="value-card">
            <div class="value-icon"><i class="pi pi-shield"></i></div>
            <h3>اعتماد و امنیت</h3>
            <p>امنیت اطلاعات کاربران و ایجاد محیطی قابل اعتماد برای معاملات، اولویت اول ماست.</p>
          </div>
          <div class="value-card">
            <div class="value-icon"><i class="pi pi-star"></i></div>
            <h3>کیفیت</h3>
            <p>ما همواره در تلاشیم تا بهترین کیفیت را در محصولات و خدمات خود ارائه دهیم.</p>
          </div>
          <div class="value-card">
            <div class="value-icon"><i class="pi pi-users"></i></div>
            <h3>رضایت مشتری</h3>
            <p>رضایت مشتریان برای ما بسیار مهم است و همواره در تلاشیم تا تجربه کاربری بهتری ایجاد کنیم.</p>
          </div>
          <div class="value-card">
            <div class="value-icon"><i class="pi pi-rocket"></i></div>
            <h3>نوآوری</h3>
            <p>ما با استفاده از آخرین تکنولوژی ها و روش های نوین، همواره در حال بهبود خدمات خود هستیم.</p>
          </div>
        </div>
      </section>

      <!-- Featured Products -->
      <section class="section-block">
        <div class="section-head">
          <router-link :to="{ name: 'products' }" class="panel-link">مشاهده همه</router-link>
          <h2 class="section-title"><i class="pi pi-shopping-bag"></i> محصولات ویژه</h2>
        </div>
        <div v-if="productsLoading" class="state-box">
          <i class="pi pi-spin pi-spinner"></i>
          <p>در حال دریافت محصولات...</p>
        </div>
        <div v-else-if="featuredProducts.length === 0" class="state-box">
          <i class="pi pi-box"></i>
          <p>در حال حاضر محصولی موجود نیست</p>
        </div>
        <div v-else class="products-grid">
          <div v-for="product in featuredProducts" :key="product.id" class="product-card" @click="goToProduct(product)">
            <div class="product-thumb">
              <img
                v-if="product.images && product.images[0]"
                :src="product.images[0]"
                :alt="product.title"
                class="product-thumb-img"
              />
              <div v-else class="product-thumb-placeholder">
                <i class="pi pi-image"></i>
              </div>
            </div>
            <h3 class="product-name">{{ product.title }}</h3>
            <p class="product-vendor">{{ product.company?.name || product.vendor || 'تأمین‌کننده' }}</p>
            <div class="product-footer">
              <span class="product-price" v-if="product.prices && product.prices[0]">
                {{ formatPrice(product.prices[0].price, product.prices[0].currency) }}
              </span>
              <router-link :to="{ name: 'product-details', params: { id: product.id } }" class="product-link">
                مشاهده
                <i class="pi pi-arrow-left"></i>
              </router-link>
            </div>
          </div>
        </div>
      </section>

      <!-- Statistics -->
      <section class="stats-bar">
        <div class="stat-item">
          <div class="stat-icon"><i class="pi pi-users"></i></div>
          <div class="stat-text">
            <span class="stat-value">{{ stats.userCount.toLocaleString('fa-IR') }}</span>
            <span class="stat-label">کاربر فعال</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon"><i class="pi pi-building"></i></div>
          <div class="stat-text">
            <span class="stat-value">{{ stats.companyCount.toLocaleString('fa-IR') }}</span>
            <span class="stat-label">شرکت ثبت شده</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon"><i class="pi pi-shopping-bag"></i></div>
          <div class="stat-text">
            <span class="stat-value">{{ stats.productCount.toLocaleString('fa-IR') }}</span>
            <span class="stat-label">محصول</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-text">
            <span class="stat-value">{{ stats.orderCount.toLocaleString('fa-IR') }}</span>
            <span class="stat-label">سفارش انجام شده</span>
          </div>
        </div>
      </section>

      <!-- Our Team -->
      <section class="section-block">
        <div class="section-head">
          <h2 class="section-title"><i class="pi pi-users"></i> تیم ما</h2>
        </div>
        <div class="team-grid">
          <div v-for="member in teamMembers" :key="member.id" class="team-card">
            <div class="team-avatar">
              <i class="pi pi-user"></i>
            </div>
            <h3 class="team-name">{{ member.name }}</h3>
            <p class="team-position">{{ member.position }}</p>
            <p class="team-desc">{{ member.description }}</p>
            <div class="team-social">
              <a v-if="member.linkedin" :href="member.linkedin" target="_blank" class="social-link">
                <i class="pi pi-linkedin"></i>
              </a>
              <a v-if="member.twitter" :href="member.twitter" target="_blank" class="social-link">
                <i class="pi pi-twitter"></i>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Partners -->
      <section class="section-block">
        <div class="section-head">
          <h2 class="section-title"><i class="pi pi-verified"></i> شریک های تجاری</h2>
        </div>
        <div class="partners-grid">
          <div v-for="partner in partners" :key="partner.id" class="partner-item">
            <i class="pi pi-building"></i>
            <span>{{ partner.name }}</span>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { productsApi } from '@telecom/api-client'
import { formatPrice } from '../../utils/helpers'
import Breadcrumb from 'primevue/breadcrumb'

const router = useRouter()

const home = ref({ icon: 'pi pi-home', to: '/' })
const items = ref([{ label: 'درباره ما' }])

const featuredProducts = ref([])
const productsLoading = ref(false)

async function fetchProducts() {
  try {
    productsLoading.value = true
    const response = await productsApi.list({ page: 1, limit: 6, status: 'PUBLISHED' })
    const items = response?.data?.items ?? response?.data?.data?.items ?? []
    featuredProducts.value = Array.isArray(items) ? items.slice(0, 6) : []
  } catch (err) {
    featuredProducts.value = []
  } finally {
    productsLoading.value = false
  }
}

function goToProduct(product) {
  router.push({ name: 'product-details', params: { id: product.id } })
}

onMounted(() => { fetchProducts() })

const teamMembers = ref([
  {
    id: 1,
    name: 'مجید محمدی',
    position: 'بنیانگذار و مدیر عامل',
    description: 'متخصص در حوزه مخابرات و فناوری اطلاعات',
    linkedin: 'https://linkedin.com/in/majid-mohammadi',
    twitter: 'https://twitter.com/majid_mohammadi'
  },
  {
    id: 2,
    name: 'فاطمه کریمی',
    position: 'مدیر بازاریابی',
    description: 'متخصص در بازاریابی دیجیتال و استراتژی های فروش',
    linkedin: 'https://linkedin.com/in/fatemeh-karimi'
  },
  {
    id: 3,
    name: 'علی رضایی',
    position: 'مدیر فنی',
    description: 'متخصص در توسعه نرم افزار و معماری سیستم',
    linkedin: 'https://linkedin.com/in/ali-rezaei',
    twitter: 'https://twitter.com/ali_rezaei'
  },
  {
    id: 4,
    name: 'زهرا احمدی',
    position: 'مدیر پشتیبانی مشتریان',
    description: 'متخصص در خدمات مشتریان و حل مسائل',
    linkedin: 'https://linkedin.com/in/zahra-ahmadi'
  }
])

const stats = ref({
  userCount: 15000,
  companyCount: 250,
  productCount: 5000,
  orderCount: 35000
})

const partners = ref([
  { id: 1, name: 'شرکت مخابرات ایران' },
  { id: 2, name: 'ایرانسل' },
  { id: 3, name: 'همراه اول' },
  { id: 4, name: 'رایتل' },
  { id: 5, name: 'شاتل' },
  { id: 6, name: 'اپراتور چهارم' }
])
</script>

<style scoped>
.about-page {
  background: var(--surface-ground);
  padding: 1rem 0 2rem;
}
.about-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Breadcrumb */
.breadcrumb-wrap { margin-bottom: 0.25rem; }

/* Hero */
.about-hero {
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
.about-hero .hero-content { text-align: right; }
.hero-badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  color: var(--primary-color); font-weight: 700; font-size: 0.95rem; margin-bottom: 1rem;
}
.hero-title {
  color: var(--p-primary-900); font-size: 2.5rem; font-weight: 800;
  line-height: 1.3; margin: 0 0 1rem;
}
.hero-desc {
  color: var(--text-color-secondary); font-size: 1.05rem; line-height: 1.9; margin: 0;
}
.about-hero .hero-visual {
  position: relative; height: 220px; border-radius: 0.75rem;
  background: linear-gradient(135deg, var(--p-primary-100), var(--p-primary-300));
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.hero-glow {
  position: absolute; inset: -30%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), transparent 60%);
}
.hero-icon { font-size: 5rem; color: var(--primary-color); opacity: 0.85; z-index: 1; }

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

/* Story */
.story-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center;
}
.story-text p {
  color: var(--text-color-secondary); line-height: 1.9; margin: 0 0 1rem;
}
.story-text p:last-child { margin-bottom: 0; }
.story-image {
  border-radius: 0.75rem; overflow: hidden;
}
.image-placeholder {
  height: 240px;
  background: linear-gradient(135deg, var(--p-primary-100), var(--p-primary-200));
  border-radius: 0.75rem;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem;
}
.image-placeholder i { font-size: 3rem; color: var(--primary-color); opacity: 0.7; }
.image-placeholder span { font-size: 0.9rem; font-weight: 700; color: var(--p-primary-700); }

/* Values */
.values-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
}
.value-card {
  text-align: center; padding: 1.5rem 1rem;
  border: 1px solid var(--surface-border); border-radius: 0.75rem;
  transition: box-shadow 0.2s, transform 0.2s;
}
.value-card:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.06); transform: translateY(-2px);
}
.value-icon {
  width: 3rem; height: 3rem; border-radius: 50%;
  background: var(--p-primary-50); display: flex; align-items: center;
  justify-content: center; margin: 0 auto 1rem;
}
.value-icon i { font-size: 1.3rem; color: var(--primary-color); }
.value-card h3 {
  margin: 0 0 0.5rem; font-size: 1rem; font-weight: 700; color: var(--text-color);
}
.value-card p {
  margin: 0; font-size: 0.85rem; color: var(--text-color-secondary); line-height: 1.7;
}

/* Products */
.panel-link {
  font-size: 0.85rem; color: var(--primary-color); text-decoration: none; font-weight: 600;
}
.panel-link:hover { text-decoration: underline; }
.state-box {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 0.5rem; padding: 2rem 1rem; color: var(--text-color-secondary);
}
.state-box i { font-size: 2rem; }
.state-box p { margin: 0; }
.products-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
}
.product-card {
  border: 1px solid var(--surface-border); border-radius: 0.75rem;
  overflow: hidden; cursor: pointer; background: var(--surface-card);
  transition: box-shadow 0.2s, transform 0.2s; display: flex; flex-direction: column;
}
.product-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }
.product-thumb {
  aspect-ratio: 16 / 9; background: var(--surface-ground);
  overflow: hidden; display: flex; align-items: center; justify-content: center;
}
.product-thumb-img { width: 100%; height: 100%; object-fit: cover; }
.product-thumb-placeholder i { font-size: 2.5rem; color: var(--text-color-secondary); }
.product-name {
  margin: 0; padding: 0.75rem 0.75rem 0.25rem;
  font-size: 0.9rem; font-weight: 700; line-height: 1.4;
}
.product-vendor {
  margin: 0; padding: 0 0.75rem 0.5rem;
  font-size: 0.75rem; color: var(--text-color-secondary); flex: 1;
}
.product-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.5rem 0.75rem; border-top: 1px solid var(--surface-border);
}
.product-price {
  font-weight: 800; color: var(--primary-color); font-size: 0.9rem;
}
.product-link {
  font-size: 0.8rem; color: var(--primary-color); text-decoration: none;
  font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem;
}
.product-link:hover { text-decoration: underline; }

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

/* Team */
.team-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
}
.team-card {
  text-align: center; padding: 1.5rem 1rem;
  border: 1px solid var(--surface-border); border-radius: 0.75rem;
  transition: box-shadow 0.2s, transform 0.2s;
}
.team-card:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.06); transform: translateY(-2px);
}
.team-avatar {
  width: 4.5rem; height: 4.5rem; border-radius: 50%;
  background: var(--p-primary-50); display: flex; align-items: center;
  justify-content: center; margin: 0 auto 1rem;
}
.team-avatar i { font-size: 1.8rem; color: var(--primary-color); }
.team-name {
  margin: 0 0 0.25rem; font-size: 1rem; font-weight: 700; color: var(--text-color);
}
.team-position {
  margin: 0 0 0.5rem; font-size: 0.85rem; color: var(--primary-color); font-weight: 600;
}
.team-desc {
  margin: 0 0 0.75rem; font-size: 0.8rem; color: var(--text-color-secondary); line-height: 1.6;
}
.team-social {
  display: flex; justify-content: center; gap: 0.5rem;
}
.social-link {
  width: 2rem; height: 2rem; border-radius: 50%;
  background: var(--p-primary-50); display: flex; align-items: center;
  justify-content: center; color: var(--primary-color); text-decoration: none;
  transition: all 0.2s;
}
.social-link:hover {
  background: var(--primary-color); color: var(--primary-contrast-color);
}

/* Partners */
.partners-grid {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.75rem;
}
.partner-item {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 1rem; border: 1px solid var(--surface-border); border-radius: 0.75rem;
  font-size: 0.85rem; font-weight: 600; color: var(--text-color-secondary);
  transition: all 0.2s;
}
.partner-item:hover {
  border-color: var(--primary-color); color: var(--primary-color);
}
.partner-item i { font-size: 1.2rem; }

/* Responsive */
@media (max-width: 1100px) {
  .values-grid, .team-grid { grid-template-columns: repeat(2, 1fr); }
  .products-grid { grid-template-columns: repeat(2, 1fr); }
  .partners-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 900px) {
  .about-hero { grid-template-columns: 1fr; padding: 2rem; }
  .about-hero .hero-visual { order: 2; height: 160px; }
  .story-grid { grid-template-columns: 1fr; }
  .stats-bar { grid-template-columns: repeat(2, 1fr); }
  .stat-item { border-inline-start: none; }
}
@media (max-width: 560px) {
  .hero-title { font-size: 1.75rem; }
  .values-grid, .team-grid, .products-grid { grid-template-columns: 1fr; }
  .stats-bar, .partners-grid { grid-template-columns: 1fr; }
}
</style>
