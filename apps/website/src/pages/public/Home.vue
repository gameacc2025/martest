<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { productsApi, bannersApi } from '@telecom/api-client'
import { useProductsStore } from '../../stores/products'
import { useCartStore } from '../../stores/cart'
import { productSalesMode, productPriceLabel } from './homePresentation.js'

const router = useRouter()
const productsStore = useProductsStore()
const cartStore = useCartStore()
const cartMessage = ref('')
const products = ref([])
const retailProducts = ref([])
const featuredProducts = ref([])
const categories = ref([])
const categoryProductCounts = ref({})
const banners = ref([])
const loading = ref(false)
const categoriesLoading = ref(false)
const error = ref('')
const categoryError = ref(false)
const searchQuery = ref('')
const searchMode = ref('retail')
const activeSlide = ref(0)
let slideTimer = null

const slides = [
  { title: 'بازارگاه تخصصی تجهیزات شبکه و مخابرات', headline: 'تجهیزات پروژه‌تان را<br>سریع و مطمئن تأمین کنید', description: 'هم خرید فوری با قیمت مشخص، هم استعلام و پیش‌فاکتور سازمانی از تأمین‌کنندگان.', brand: 'Telecom Market', product: 'تجهیزات شبکه و مخابرات' },
  { title: 'تجهیزات تست فیبر نوری', headline: 'تست و عیب‌یابی فیبر<br>با تجهیزات تخصصی', description: 'OTDR، پاورمتر و تجهیزات اندازه‌گیری را در کاتالوگ محصولات بررسی کنید.', brand: 'Fiber Optic', product: 'تجهیزات تست و اندازه‌گیری' },
  { title: 'خرید سازمانی', headline: 'استعلام ثبت کنید،<br>پیشنهاد تأمین بگیرید', description: 'نیاز پروژه را ثبت کنید و پاسخ تأمین‌کنندگان را از مسیر استعلام پیگیری کنید.', brand: 'B2B', product: 'تأمین سازمانی' },
]
const activeBanner = computed(() => banners.value[activeSlide.value] || null)
const activeSlideContent = computed(() => {
  const fallback = slides[activeSlide.value % slides.length]
  const banner = activeBanner.value
  return banner ? { ...fallback, title: banner.title || fallback.title, description: banner.description || fallback.description } : fallback
})
const featuredProduct = computed(() => featuredProducts.value[0] || products.value[0] || null)
const latestProducts = computed(() => products.value.slice(0, 4))
const retailLatest = computed(() => retailProducts.value.slice(0, 4))
const selectedProducts = computed(() => featuredProducts.value.slice(0, 4))
const brandNames = ['VIAVI', 'Anritsu', 'Yokogawa', 'EXFO', 'Huawei', 'Ubiquiti']
const demoArticles = [
  { kind: 'آموزش', date: 'نمونه نمایشی', title: 'راهنمای انتخاب OTDR مناسب برای پروژه فیبر نوری', description: 'این جایگاه برای نمایش مطالب آموزشی منتشرشده در وبلاگ در نظر گرفته شده است.' },
  { kind: 'معرفی', date: 'نمونه نمایشی', title: 'تفاوت OTDR و Power Meter در عیب‌یابی شبکه', description: 'محتوای واقعی پس از اتصال سرویس وبلاگ نمایش داده می‌شود.' },
  { kind: 'خبر', date: 'نمونه نمایشی', title: 'معرفی تجهیزات و فناوری‌های مخابراتی', description: 'این کارت صرفاً نمونه چیدمان بخش مطالب است.' },
]

function normalizeList(response) {
  const data = response?.data?.data ?? response?.data ?? response
  if (Array.isArray(data)) return data
  return data?.products ?? data?.items ?? []
}
function productTitle(product) { return product?.title || product?.name || 'محصول بدون عنوان' }
function productBrand(product) { return product?.brand || product?.company?.name || '—' }
function productSku(product) { return product?.sku || product?.SKU || product?.catalogCode || '—' }
function productCategory(product) { return product?.category?.nameFa || product?.category?.name || product?.category?.nameEn || '—' }
function productImage(product) {
  return product?.images?.find(image => image?.isPrimary && image?.url)?.url || product?.images?.find(image => image?.url)?.url || ''
}
function productLink(product) { return { name: 'product-details', params: { id: product.id } } }
function productMode(product) { return productSalesMode(product)?.kind === 'fixed' ? 'قیمت مشخص' : 'قیمت با استعلام' }
function productPrice(product) { const label = productPriceLabel(product); return !label || label === 'استعلامی' ? 'قیمت با استعلام' : label }
function productIsRetail(product) { return productSalesMode(product)?.kind === 'fixed' }
function categoryTitle(category) { return category?.nameFa || category?.name || category?.nameEn || category?.slug || 'دسته‌بندی' }
function categoryCount(category) {
  const value = Number(categoryProductCounts.value[String(category?.id)] ?? category?.productCount ?? category?.productsCount ?? category?._count?.products)
  return Number.isFinite(value) && value >= 0 ? value.toLocaleString('fa-IR') : '—'
}
async function loadCategoryProductCounts(list) {
  const entries = await Promise.all(list.map(async category => {
    try {
      const result = await productsStore.getProducts({
        page: 1, limit: 1, status: 'PUBLISHED', categoryId: Number(category.id),
      })
      const total = Number(result?.meta?.total ?? result?.meta?.totalItems ?? result?.total)
      return [String(category.id), Number.isFinite(total) && total >= 0 ? total : null]
    } catch {
      return [String(category.id), null]
    }
  }))
  categoryProductCounts.value = Object.fromEntries(entries)
}
function categoryIcon(category) {
  const value = categoryTitle(category).toLowerCase()
  if (value.includes('فیبر') || value.includes('fiber')) return '◎'
  if (value.includes('شبکه') || value.includes('data')) return '▤'
  if (value.includes('موبایل') || value.includes('mobile')) return '▯'
  if (value.includes('انتقال')) return '⇄'
  if (value.includes('ماهواره')) return '◉'
  if (value.includes('رادیو') || value.includes('آنتن')) return '⌁'
  return '⌘'
}
function addToCart(product) {
  const price = Number(product?.finalPrice ?? product?.price ?? product?.prices?.[0]?.price ?? product?.priceTiers?.[0]?.unitPrice)
  const added = cartStore.addItem({ ...product, price })
  cartMessage.value = added ? 'محصول به سبد خرید اضافه شد.' : 'امکان افزودن این محصول به سبد خرید وجود ندارد.'
}
function goSearch(value = searchQuery.value) {
  const query = String(value || '').trim()
  router.push({ name: 'search', query: query ? { q: query } : {} })
}
function chooseCategory(category) {
  router.push({ name: 'products', query: { category: category.id } })
}
function setSlide(index) {
  const count = banners.value.length || slides.length
  activeSlide.value = (index + count) % count
  restartSlider()
}
function restartSlider() {
  if (slideTimer) clearInterval(slideTimer)
  slideTimer = setInterval(() => {
    const count = banners.value.length || slides.length
    activeSlide.value = (activeSlide.value + 1) % count
  }, 6000)
}
async function loadProducts() {
  loading.value = true
  error.value = ''
  try {
    const params = { page: 1, limit: 8, status: 'PUBLISHED', sortBy: 'createdAt', sortOrder: 'desc' }
    const [latest, retail, featured] = await Promise.allSettled([
      productsApi.list(params),
      productsApi.list({ ...params, retailEnabled: true }),
      productsApi.list({ ...params, featured: true }),
    ])
    if (latest.status === 'rejected') throw latest.reason
    products.value = normalizeList(latest.value)
    retailProducts.value = retail.status === 'fulfilled' ? normalizeList(retail.value) : []
    featuredProducts.value = featured.status === 'fulfilled' ? normalizeList(featured.value) : []
  } catch {
    error.value = 'دریافت محصولات با مشکل روبه‌رو شد.'
    products.value = []
    retailProducts.value = []
    featuredProducts.value = []
  } finally { loading.value = false }
}
async function loadCategories() {
  categoriesLoading.value = true
  categoryError.value = false
  try {
    const result = await productsStore.getCategories()
    categories.value = Array.isArray(result) ? result : []
    await loadCategoryProductCounts(categories.value.slice(0, 9))
  } catch {
    categoryError.value = true
    categories.value = []
  } finally { categoriesLoading.value = false }
}
async function loadBanners() {
  try {
    const response = await bannersApi.listActive('HOME_HERO')
    banners.value = normalizeList(response)
    activeSlide.value = 0
  } catch { banners.value = [] }
  restartSlider()
}
onMounted(() => { loadProducts(); loadCategories(); loadBanners(); restartSlider() })
onUnmounted(() => { if (slideTimer) clearInterval(slideTimer) })
</script>

<template>
<main class="reference-home" dir="rtl">
  <section class="hero">
  <svg class="hero-bg-network" viewBox="0 0 1200 400" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <path d="M100 200 Q300 100 600 200 T1100 200" stroke="#1E3A5F" stroke-width="2"/>
    <path d="M50 100 Q400 300 800 100 T1150 250" stroke="#1E3A5F" stroke-width="2"/>
    <path d="M100 200 Q300 100 600 200 T1100 200" class="fiber-wave fiber-wave--cyan" stroke="#22D3EE" stroke-width="4" stroke-linecap="round" stroke-dasharray="20 180"/>
    <path d="M50 100 Q400 300 800 100 T1150 250" class="fiber-wave fiber-wave--violet" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round" stroke-dasharray="16 200"/>
    <circle class="fiber-node-pulse fiber-node-pulse--cyan" cx="100" cy="200" r="5" fill="#22D3EE"/>
    <circle class="fiber-node-pulse fiber-node-pulse--violet" cx="600" cy="200" r="5" fill="#8B5CF6"/>
    <circle class="fiber-node-pulse fiber-node-pulse--cyan" cx="1100" cy="200" r="5" fill="#22D3EE"/>
  </svg>
  <div class="w">
    <div class="hero-copy" :key="activeSlide">
      <div class="tag">{{ activeSlideContent.title }}</div>
      <h1 v-html="activeSlideContent.headline"></h1>
      <p>{{ activeSlideContent.description }}</p>
      <div class="tabs"><button :class="{ on: searchMode === 'retail' }" type="button" @click="searchMode = 'retail'">خرید فوری</button><button :class="{ on: searchMode === 'inquiry' }" type="button" @click="searchMode = 'inquiry'">استعلام سازمانی</button></div>
      <form class="search" @submit.prevent="goSearch()"><input v-model="searchQuery" :placeholder="searchMode === 'retail' ? 'نام محصول، برند، مدل یا SKU را جستجو کنید…' : 'نام تجهیز یا مشخصات مورد نیاز پروژه را بنویسید…'"><button class="btn b1" type="submit">جستجو</button></form>
      <div class="chips">پرتکرار: <button class="c" type="button" @click="goSearch('OTDR')">OTDR</button><button class="c" type="button" @click="goSearch('Power Meter')">Power Meter</button><button class="c" type="button" @click="goSearch('Fusion Splicer')">Fusion Splicer</button><button class="c" type="button" @click="goSearch('آنتن')">آنتن</button></div>
      <div class="cta2"><router-link class="btn b1" :to="{ name: 'my-inquiries' }">ثبت درخواست استعلام</router-link><router-link class="btn b2" :to="{ name: 'products' }">مشاهده همه محصولات</router-link></div>
    </div>
    <router-link v-if="featuredProduct" class="feat" :to="productLink(featuredProduct)">
      <div class="img"><img v-if="productImage(featuredProduct)" :src="productImage(featuredProduct)" :alt="productTitle(featuredProduct)"><span v-else>{{ productBrand(featuredProduct) }}</span></div>
      <h3>{{ productTitle(featuredProduct) }}</h3><small>{{ productCategory(featuredProduct) }}</small>
      <div class="row"><b>{{ productPrice(featuredProduct) }}</b><span class="btn b1" style="padding:8px 16px">مشاهده</span></div>
    </router-link>
    <div v-else class="feat"><div class="img">Telecom Market</div><h3>تجهیزات شبکه و مخابرات</h3><small>برای مشاهده محصولات منتشرشده وارد کاتالوگ شوید.</small><div class="row"><b>کاتالوگ محصولات</b><router-link class="btn b1" :to="{ name: 'products' }">مشاهده</router-link></div></div>
  </div>
  <div class="dots"><button v-for="(_, index) in (banners.length || slides.length)" :key="index" :class="{ on: activeSlide === index }" type="button" :aria-label="'اسلاید ' + (index + 1)" @click="setSlide(index)"></button></div>
  <button class="ha pv" type="button" aria-label="اسلاید قبلی" @click="setSlide(activeSlide - 1)">›</button><button class="ha nx" type="button" aria-label="اسلاید بعدی" @click="setSlide(activeSlide + 1)">‹</button>
</section>

  <div class="stats"><div class="w"><div class="g">
    <div class="st"><b>—</b><span>تأمین‌کنندگان ثبت‌شده</span></div><div class="st"><b>{{ products.length ? products.length.toLocaleString('fa-IR') + '+' : '—' }}</b><span>محصول در این دریافت</span></div><div class="st"><b>—</b><span>پروژه‌های سازمانی</span></div><div class="st"><b>—</b><span>میانگین زمان پاسخ</span></div>
  </div></div></div>
  <div class="w"><div class="brands"><span v-for="brand in brandNames" :key="brand">{{ brand }}</span></div><small class="demo-note">نام برندها در این نوار، نمونه‌های نمایشی قالب هستند و فهرست تأمین‌کنندگان فعال محسوب نمی‌شوند.</small></div>

  <div class="w">
    <div class="sec"><div class="sh"><h2>دسته‌بندی محصولات</h2><router-link :to="{ name: 'categories' }">همه دسته‌بندی‌ها</router-link></div>
      <div v-if="categoriesLoading" class="cats"><div v-for="i in 6" :key="i" class="cat">…</div></div>
      <div v-else-if="categoryError" class="empty-state"><span>دریافت دسته‌بندی‌ها ناموفق بود.</span><button type="button" @click="loadCategories">تلاش دوباره</button></div>
      <div v-else-if="categories.length" class="cats"><button v-for="category in categories.slice(0, 9)" :key="category.id" class="cat" type="button" @click="chooseCategory(category)"><i>{{ categoryIcon(category) }}</i>{{ categoryTitle(category) }}<small>{{ categoryCount(category) }} محصول</small></button></div>
      <div v-else class="empty-state">دسته‌بندی فعالی برای نمایش وجود ندارد.</div>
    </div>

    <div class="sec"><div class="sh"><h2>تازه‌ترین محصولات</h2><router-link :to="{ name: 'products' }">مشاهده همه</router-link></div>
      <div v-if="loading" class="prods"><div v-for="i in 4" :key="i" class="p loading-card"></div></div>
      <div v-else-if="error" class="empty-state"><span>{{ error }}</span><button type="button" @click="loadProducts">تلاش دوباره</button></div>
      <div v-else-if="latestProducts.length" class="prods"><article v-for="product in latestProducts" :key="product.id" class="p">
        <router-link class="im" :to="productLink(product)"><img v-if="productImage(product)" :src="productImage(product)" :alt="productTitle(product)"><span v-else>{{ productBrand(product) }}</span><em>{{ productCategory(product) }}</em></router-link>
        <div class="bd"><div class="br">{{ productBrand(product) }}<span v-if="product.company?.isVerified">✓ تأییدشده</span></div><h3>{{ productTitle(product) }}</h3><div class="sk">{{ productSku(product) }}</div><div class="pr" :class="{ q: !productIsRetail(product) }">{{ productPrice(product) }}<small>{{ productMode(product) }}</small></div></div>
        <div class="ac"><button v-if="productIsRetail(product)" class="btn b1" type="button" @click.stop="addToCart(product)">افزودن به سبد</button><router-link v-else class="btn b1" :to="productLink(product)">استعلام قیمت</router-link><router-link class="btn b2" :to="productLink(product)">مشاهده</router-link></div>
      </article></div>
      <div v-else class="empty-state">هنوز محصول منتشرشده‌ای برای نمایش وجود ندارد.</div>
    </div>

    <div class="sec"><div class="sh"><h2>جدیدترین محصولات خرده‌فروشی</h2><router-link :to="{ name: 'products', query: { retail: '1' } }">همه محصولات خرده‌فروشی</router-link></div>
      <div v-if="retailLatest.length" class="prods"><article v-for="product in retailLatest" :key="product.id" class="p"><router-link class="im" :to="productLink(product)"><img v-if="productImage(product)" :src="productImage(product)" :alt="productTitle(product)"><span v-else>{{ productBrand(product) }}</span><em>{{ productCategory(product) }}</em></router-link><div class="bd"><div class="br">{{ productBrand(product) }}<span v-if="product.company?.isVerified">✓ تأییدشده</span></div><h3>{{ productTitle(product) }}</h3><div class="sk">{{ productSku(product) }}</div><div class="pr">{{ productPrice(product) }}<small>قیمت ثبت‌شده در کاتالوگ</small></div></div><div class="ac"><button class="btn b1" type="button" @click.stop="addToCart(product)">افزودن به سبد</button><router-link class="btn b2" :to="productLink(product)">مشاهده</router-link></div></article></div>
      <div v-else class="empty-state">در حال حاضر محصول خرده‌فروشی منتشرشده‌ای برای نمایش وجود ندارد.</div>
    </div>

    <div class="sec"><div class="sh"><h2>محصولات منتخب</h2><router-link :to="{ name: 'products' }">مشاهده محصولات</router-link></div>
      <div v-if="selectedProducts.length" class="prods"><article v-for="(product, index) in selectedProducts" :key="product.id" class="p"><router-link class="im" :to="productLink(product)"><img v-if="productImage(product)" :src="productImage(product)" :alt="productTitle(product)"><span v-else>{{ productBrand(product) }}</span><em>{{ productCategory(product) }}</em><i class="rk">#{{ (index + 1).toLocaleString('fa-IR') }}</i></router-link><div class="bd"><div class="br">{{ productBrand(product) }}</div><h3>{{ productTitle(product) }}</h3><div class="sk">{{ productSku(product) }}</div><div class="pr" :class="{ q: !productIsRetail(product) }">{{ productPrice(product) }}<small>محصول منتخب</small></div></div><div class="ac"><button v-if="productIsRetail(product)" class="btn b1" type="button" @click.stop="addToCart(product)">افزودن به سبد</button><router-link v-else class="btn b1" :to="productLink(product)">استعلام قیمت</router-link><router-link class="btn b2" :to="productLink(product)">مشاهده</router-link></div></article></div>
      <div v-else class="empty-state">محصولی با نشان منتخب برای نمایش دریافت نشد.</div>
    </div>

    <div class="sec"><div class="sh"><h2>آخرین اخبار و مطالب آموزشی</h2><span>نمونه چیدمان بخش وبلاگ</span></div><div class="bl"><article class="bf"><div class="im2">BLOG</div><div class="tx"><span class="bt t">نمونه</span> <span class="bd2">وبلاگ</span><h3>مطالب آموزشی تجهیزات شبکه و مخابرات</h3><p>محتوای واقعی پس از اتصال سرویس وبلاگ نمایش داده خواهد شد.</p></div></article><div class="bs"><article v-for="article in demoArticles" :key="article.title" class="bi"><i>✎</i><div><span class="bt">{{ article.kind }}</span> <span class="bd2">{{ article.date }}</span><h4>{{ article.title }}</h4><p>{{ article.description }}</p></div></article></div></div></div>

    <div class="sec"><div class="sh"><h2>نظر مشتریان سازمانی</h2></div><div class="tms"><div class="tc"><q>جایگاه نمایش دیدگاه‌های تأییدشده مشتریان</q><div class="av">۱</div><b>دیدگاه نمونه</b><span>پس از اتصال سرویس نظرات</span></div><div class="tc"><q>متن دیدگاه فقط پس از ثبت و تأیید واقعی نمایش داده می‌شود.</q><div class="av">۲</div><b>دیدگاه نمونه</b><span>پس از اتصال سرویس نظرات</span></div><div class="tc"><q>در این بخش اطلاعات ساختگی مشتری یا شرکت نمایش داده نمی‌شود.</q><div class="av">۳</div><b>دیدگاه نمونه</b><span>پس از اتصال سرویس نظرات</span></div></div></div>

    <div class="rfq"><div><h3>محصول مورد نظر را پیدا نکردید؟</h3><p>درخواست استعلام ثبت کنید تا نیاز پروژه‌تان از مسیر تأمین‌کنندگان پیگیری شود.</p></div><router-link class="btn b1" :to="{ name: 'my-inquiries' }">ثبت درخواست استعلام</router-link></div>
  </div>
</main>
</template>
<style scoped>
.reference-home{--bg:var(--ds-page-bg);--card:var(--ds-card-bg);--text:var(--ds-text-primary);--muted:var(--ds-text-secondary);--line:var(--ds-border);--pri:var(--ds-primary-button);--pri2:var(--ds-brand-primary);--ok:var(--ds-status-success-fg);--chip:var(--ds-color-primary-soft);--hero1:var(--ds-color-brand-dark);--hero2:var(--ds-brand-primary-active);box-sizing:border-box;background:var(--bg);color:var(--text);font-family:var(--ds-font-family);line-height:1.7}
.reference-home .demo-note{display:block;padding:0 0 8px;color:var(--muted);font-size:11px;text-align:center}
.reference-home .empty-state{display:flex;justify-content:center;align-items:center;gap:12px;min-height:90px;padding:18px;border:1px dashed var(--line);border-radius:14px;background:var(--card);color:var(--muted);font-size:13px;text-align:center}
.reference-home .empty-state button{border:0;background:var(--chip);color:var(--pri);border-radius:8px;padding:6px 12px;font:inherit;cursor:pointer}
.reference-home .feat .img img,.reference-home .p .im img{max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain;padding:12px}
.reference-home .p .im{display:grid;text-decoration:none}
.reference-home .p .im span{align-self:center}
.reference-home .loading-card{min-height:290px}
.reference-home .fm button:disabled,.reference-home .fm input:disabled{opacity:.65;cursor:not-allowed}

:root{--bg:var(--ds-page-bg);--card:var(--ds-card-bg);--text:var(--ds-text-primary);--muted:var(--ds-text-secondary);--line:var(--ds-border);--pri:var(--ds-primary-button);--pri2:var(--ds-brand-primary);--ok:var(--ds-status-success-fg);--hero1:var(--ds-color-brand-dark);--hero2:var(--ds-brand-primary-active);--chip:var(--ds-color-primary-soft);
box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
*{box-sizing:border-box;margin:0}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
body{font-family:var(--ds-font-family);background:var(--bg);color:var(--text);line-height:1.7}
.w{max-width:1240px;margin:auto;padding:0 20px}
.top{background:var(--ds-color-brand-deep);color:var(--ds-color-on-brand-muted);font-size:12px;padding:6px 0}
.top .w,.nav .w{display:flex;justify-content:space-between;align-items:center;gap:16px}
.nav{background:var(--card);border-bottom:1px solid var(--line);padding:12px 0}
.logo{font-weight:800;font-size:18px;display:flex;gap:10px;align-items:center}
.logo i{width:36px;height:36px;border-radius:10px;background:var(--ds-brand-primary);display:block}
.nav ul{display:flex;gap:22px;list-style:none;padding:0;font-size:14px;color:var(--muted)}
.nav li a{color:inherit;text-decoration:none}.nav li.a,.nav li.a a{color:var(--pri);font-weight:700}
.tools{display:flex;gap:10px;align-items:center;font-size:13px}
.btn{border:0;border-radius:10px;padding:10px 18px;font:inherit;font-weight:700;font-size:14px;cursor:pointer}
.b1{background:var(--ds-primary-button);color:var(--ds-primary-button-text)}
.b2{background:transparent;color:var(--pri);border:1px solid var(--pri)}
.hero{background:var(--ds-color-brand-dark);color:var(--ds-color-on-brand);padding:44px 0 56px}
.hero .w{display:grid;grid-template-columns:1.2fr 1fr;gap:36px;align-items:center}
.tag{color:var(--ds-brand-primary);font-size:13px;font-weight:500}
h1{font-size:38px;line-height:1.5;font-weight:800;margin:6px 0 10px}
.hero p{color:var(--ds-color-on-brand-muted);font-size:14px;max-width:560px}
.tabs{display:inline-flex;background:rgba(255,255,255,.12);border-radius:12px;padding:4px;margin:20px 0 12px}
.tabs button{border:0;background:transparent;color:var(--ds-color-on-brand-muted);font:inherit;font-size:13px;font-weight:700;padding:8px 18px;border-radius:9px;cursor:pointer}
.tabs button.on{background:var(--ds-card-bg);color:var(--ds-text-primary)}
.search{display:flex;background:var(--ds-card-bg);border-radius:12px;padding:6px;max-width:600px}
.search input{flex:1;border:0;outline:0;font:inherit;font-size:14px;padding:0 12px;color:var(--ds-text-primary);background:transparent;min-width:0}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;font-size:12px;color:var(--ds-color-on-brand-muted);align-items:center}
.chips span.c{background:rgba(255,255,255,.14);padding:2px 12px;border-radius:99px}
.cta2{display:flex;gap:12px;margin-top:20px;flex-wrap:wrap}
.cta2 .btn.b2{color:var(--ds-color-on-brand);border-color:rgba(255,255,255,.5)}
.feat{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:18px;padding:18px;backdrop-filter:blur(6px)}
.feat .img{height:190px;border-radius:12px;background:var(--ds-color-brand-dark);display:grid;place-items:center;font-size:44px;font-weight:800;opacity:.9;letter-spacing:2px}
.feat h3{margin-top:12px;font-size:16px}.feat small{color:var(--ds-color-on-brand-muted)}
.feat .row{display:flex;justify-content:space-between;align-items:center;margin-top:10px}
.stats{margin-top:-30px;position:relative}
.stats .g{background:var(--card);border-radius:16px;box-shadow:0 8px 30px rgba(20,30,70,.12);display:grid;grid-template-columns:repeat(4,1fr);padding:18px}
.st{text-align:center;border-inline-start:1px solid var(--line)}.st:first-child{border:0}
.st b{font-size:24px;color:var(--pri);display:block}.st span{font-size:12px;color:var(--muted)}
.brands{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;padding:26px 0 6px;color:var(--muted);font-weight:800;font-size:17px}
.brands span{padding:6px 22px;border:1px dashed var(--line);border-radius:10px;letter-spacing:.5px}
.sec{padding:30px 0 4px}
.sh{display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid var(--line);margin-bottom:18px;padding-bottom:8px}
.sh h2{font-size:22px;position:relative;font-weight:800}
.sh h2:after{content:"";position:absolute;right:0;bottom:-10px;width:44px;height:3px;border-radius:3px;background:var(--ds-brand-primary)}
.sh a{font-size:13px;color:var(--pri);text-decoration:none;font-weight:700}
.cats{display:grid;grid-template-columns:repeat(6,1fr);gap:14px}
.cat{background:var(--card);border-radius:14px;padding:16px 12px;text-align:center;box-shadow:0 2px 10px rgba(20,30,70,.06);font-size:13px;font-weight:700}
.cat i{display:grid;place-items:center;width:46px;height:46px;margin:0 auto 8px;border-radius:12px;background:var(--chip);color:var(--pri);font-style:normal;font-size:20px}
.cat small{display:block;color:var(--muted);font-weight:400;font-size:11px}
.prods{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.p{background:var(--card);border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(20,30,70,.06);display:flex;flex-direction:column}
.p .im{height:130px;background:var(--ds-color-surface-alt);display:grid;place-items:center;position:relative;font-weight:800;color:var(--pri);font-size:22px}
.p .im em{position:absolute;top:10px;right:10px;font-style:normal;font-size:11px;background:var(--card);color:var(--muted);padding:1px 10px;border-radius:6px;font-weight:500}
.p .bd{padding:14px;flex:1}
.br{font-size:12px;color:var(--pri);font-weight:700;display:flex;justify-content:space-between}
.br span{color:var(--ok);font-weight:500}
.p h3{font-size:15px;margin:2px 0}
.p .sk{font-size:11px;color:var(--muted)}
.pr{margin-top:10px;font-weight:800}.pr small{font-weight:400;color:var(--muted);font-size:11px;display:block}
.pr.q{color:var(--pri)}
.ac{display:flex;gap:8px;padding:0 14px 14px}
.ac .btn{padding:8px 0;flex:1;font-size:13px}
.rfq{margin:34px 0;border-radius:18px;background:var(--ds-color-surface-alt);padding:26px 30px;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;border:1px solid var(--line)}
.rfq h3{font-size:20px}.rfq p{font-size:13px;color:var(--muted)}
footer{background:var(--ds-color-brand-deep);color:var(--ds-text-secondary);font-size:13px;padding:28px 0;margin-top:20px}
footer .w{display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px}
.rk{position:absolute;top:10px;left:10px;background:var(--pri);color:var(--ds-color-on-brand);border-radius:8px;font-size:12px;padding:0 9px;font-style:normal}.pr small.sold{color:var(--ok)}
.bc{font-size:13px;color:var(--muted);padding:18px 0 4px}.bc a{color:var(--pri);text-decoration:none}
.ph{padding:6px 0 4px}.ph h1{font-size:28px;color:var(--text);margin:0}.ph p{color:var(--muted);font-size:14px}
.lay{display:grid;grid-template-columns:250px 1fr;gap:20px;margin:18px 0}
.fl{background:var(--card);border-radius:14px;padding:18px;box-shadow:0 2px 10px rgba(20,30,70,.06);align-self:start;font-size:13px}
.fl h4{font-size:14px;margin:0 0 8px}.fl label{display:block;padding:3px 0;color:var(--muted);cursor:pointer}.fl hr{border:0;border-top:1px solid var(--line);margin:14px 0}
.bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:13px;color:var(--muted)}
select{font:inherit;font-size:13px;padding:7px 10px;border-radius:9px;border:1px solid var(--line);background:var(--card);color:var(--text)}
.pg .prods{grid-template-columns:repeat(3,1fr)}
.cbig{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:18px 0}
.cb{background:var(--card);border-radius:16px;padding:22px;box-shadow:0 2px 10px rgba(20,30,70,.06)}
.cb .t{display:flex;gap:12px;align-items:center;margin-bottom:12px}.cb .t i{width:50px;height:50px;border-radius:13px;background:var(--chip);color:var(--pri);display:grid;place-items:center;font-style:normal;font-size:22px}
.cb h3{font-size:16px}.cb .t small{color:var(--muted);font-size:12px;display:block}
.cb ul{list-style:none;padding:0;font-size:13px;color:var(--muted)}.cb li{padding:5px 0;border-top:1px solid var(--line)}.cb a{color:var(--pri);font-size:13px;font-weight:700;text-decoration:none;display:inline-block;margin-top:8px}
footer{padding:40px 0 18px}footer .fg{display:grid;grid-template-columns:1.5fr 1fr 1fr 1.2fr 1.4fr;gap:28px}footer h5{color:var(--ds-color-on-brand);font-size:14px;margin:0 0 10px}footer a{display:block;color:var(--ds-color-on-brand-muted);text-decoration:none;padding:3px 0}footer .nl{display:flex;gap:6px;margin-top:8px}footer .nl input{flex:1;min-width:0;border-radius:9px;border:0;padding:8px 10px;font:inherit;font-size:12px}footer .cp{border-top:1px solid var(--ds-border);margin-top:26px;padding-top:14px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:12px}
@media(max-width:900px){.lay{grid-template-columns:1fr}.pg .prods,.cbig{grid-template-columns:repeat(2,1fr)}footer .fg{grid-template-columns:1fr 1fr}}
.hero{position:relative}.hero .w{transition:opacity .25s}.hero .w.fo{opacity:0}
.ha{position:absolute;top:50%;width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:var(--ds-color-on-brand);font-size:18px;cursor:pointer;transform:translateY(-50%)}.ha:hover{background:rgba(255,255,255,.32)}.ha.pv{right:10px}.ha.nx{left:10px}
.dots{position:absolute;bottom:42px;left:50%;transform:translateX(-50%);display:flex;gap:8px}.dots b{width:9px;height:9px;border-radius:9px;background:rgba(255,255,255,.4);cursor:pointer;transition:.25s}.dots b.on{width:26px;background:var(--ds-card-bg)}
.cats{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:14px;scrollbar-width:none;padding:4px 2px 10px}.cats::-webkit-scrollbar{display:none}.cats .cat{flex:0 0 172px;scroll-snap-align:start}
.sn{display:flex;gap:8px}.sn button{width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:var(--card);color:var(--pri);cursor:pointer;font-size:16px}
.bl{display:grid;grid-template-columns:1.2fr 1fr;gap:16px}.bf{background:var(--card);border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(20,30,70,.06)}.bf .im2{height:210px;background:var(--ds-color-brand-dark);display:grid;place-items:center;color:var(--ds-color-on-brand);font-size:40px;font-weight:800;opacity:.95}.bf .tx{padding:18px}
.bt{display:inline-block;font-size:11px;padding:1px 10px;border-radius:99px;background:var(--chip);color:var(--pri);font-weight:700}.bt.n{background:var(--ds-status-danger-bg);color:var(--ds-status-danger-fg)}.bt.t{background:var(--ds-status-success-bg);color:var(--ok)}
.bf h3{font-size:18px;margin:8px 0 4px}.bf p,.bi p{font-size:13px;color:var(--muted)}.bd2{font-size:11px;color:var(--muted)}
.bs{display:flex;flex-direction:column;gap:12px}.bi{background:var(--card);border-radius:14px;padding:14px 16px;box-shadow:0 2px 10px rgba(20,30,70,.06);display:flex;gap:12px;align-items:center;flex:1}.bi i{flex:0 0 64px;height:64px;border-radius:12px;background:var(--chip);color:var(--pri);display:grid;place-items:center;font-style:normal;font-size:24px}.bi h4{font-size:14px;margin:2px 0}
.fab{position:fixed;left:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:20;background:var(--ds-primary-button);color:var(--ds-primary-button-text);border:0;border-radius:99px;padding:12px 20px;font:inherit;font-weight:700;font-size:13px;box-shadow:0 8px 24px rgba(40,60,140,.35);cursor:pointer}
.tm{display:flex;gap:8px;direction:ltr}.tm div{background:rgba(255,255,255,.18);border-radius:10px;padding:6px 12px;text-align:center;min-width:58px}.tm b{display:block;font-size:20px}.tm span{font-size:10px}
.tms{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.tc{background:var(--card);border-radius:14px;padding:18px;box-shadow:0 2px 10px rgba(20,30,70,.06);font-size:13px;color:var(--muted)}.tc q{display:block;color:var(--text);font-size:14px;margin-bottom:12px;quotes:none}.tc b{color:var(--text);display:block}.tc .av{width:38px;height:38px;border-radius:50%;background:var(--chip);color:var(--pri);display:grid;place-items:center;font-weight:800;float:right;margin-left:10px}
.cmp{display:block;padding:0 14px 8px;font-size:12px;color:var(--muted);cursor:pointer}
.cbar{position:fixed;bottom:calc(18px + env(safe-area-inset-bottom,0px));right:50%;transform:translateX(50%);z-index:20;background:var(--text);color:var(--bg);border-radius:99px;padding:10px 22px;font-size:13px;font-weight:700;display:none}
@media(max-width:900px){.bl{grid-template-columns:1fr}.ha{display:none}}
@media(max-width:900px){.hero .w{grid-template-columns:1fr}.cats{grid-template-columns:repeat(3,1fr)}.prods{grid-template-columns:repeat(2,1fr)}.stats .g{grid-template-columns:repeat(2,1fr);gap:12px}.nav ul{display:none}h1{font-size:28px}}


.reference-home .feat{display:block;color:inherit;text-decoration:none}
.reference-home .cat{border:0;color:var(--text);font-family:inherit;font-size:13px;font-weight:700;line-height:inherit;cursor:pointer}
.reference-home .chips button.c{border:0;background:rgba(255,255,255,.14);color:var(--ds-color-on-brand-muted);padding:2px 12px;border-radius:99px;font:inherit;font-size:12px;cursor:pointer}
 .reference-home .cta2 .btn,.reference-home .ac .btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none}
.reference-home .ac button{border:0;font-family:inherit;cursor:pointer}
.reference-home .cart-feedback{margin:10px 0;color:var(--ok);font-size:12px}

.reference-home{font-family:var(--ds-font-family);background:var(--ds-page-bg);color:var(--ds-text-primary)}
.reference-home .top,.reference-home footer{background:var(--ds-color-brand-deep);color:var(--ds-color-on-brand-muted)}
.reference-home .hero,.reference-home .feat .img,.reference-home .bf .im2{background:var(--ds-color-brand-dark);color:var(--ds-color-on-brand)}
.reference-home .b1,.reference-home .fab{background:var(--ds-primary-button);color:var(--ds-primary-button-text)}
.reference-home .b1:hover,.reference-home .fab:hover{background:var(--ds-primary-button-hover)}
.reference-home .search{background:var(--ds-card-bg)}
.reference-home .search input{color:var(--ds-text-primary)}
.reference-home .tabs button.on{background:var(--ds-card-bg);color:var(--ds-text-primary)}
.reference-home .ofr{background:var(--ds-brand-secondary);color:#FFFFFF}
.reference-home .ofr .btn{background:var(--ds-card-bg);color:var(--ds-brand-secondary)}
.reference-home .rfq,.reference-home .p .im{background:var(--ds-surface-secondary)}
.reference-home .bt.n{background:var(--ds-status-danger-bg);color:var(--ds-status-danger-fg)}
.reference-home .bt.t{background:var(--ds-status-success-bg);color:var(--ds-status-success-fg)}
.reference-home footer a,.reference-home footer .nl input{color:var(--ds-color-on-brand-muted)}
.reference-home .sh h2:after{background:var(--ds-brand-primary)}

</style>