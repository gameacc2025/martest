<template>
  <main class="product-page" dir="rtl">
    <div class="product-shell">
      <Breadcrumb :home="home" :model="breadcrumbItems" class="product-breadcrumb" />

      <section v-if="loading" class="page-state" aria-live="polite">
        <ProgressSpinner />
        <h1>در حال دریافت اطلاعات محصول</h1>
        <p>چند لحظه صبر کنید...</p>
      </section>

      <section v-else-if="notFound" class="page-state">
        <span class="state-icon"><i class="pi pi-box"></i></span>
        <h1>محصول پیدا نشد</h1>
        <p>این محصول در دسترس نیست یا ممکن است حذف شده باشد.</p>
        <Button label="بازگشت به محصولات" icon="pi pi-arrow-left" @click="goBack" />
      </section>

      <section v-else-if="loadError" class="page-state">
        <span class="state-icon state-icon--error"><i class="pi pi-exclamation-triangle"></i></span>
        <h1>دریافت محصول با مشکل مواجه شد</h1>
        <p>{{ loadError }}</p>
        <div class="state-actions">
          <Button label="تلاش دوباره" icon="pi pi-refresh" @click="loadProduct" />
          <Button label="بازگشت به محصولات" severity="secondary" outlined @click="goBack" />
        </div>
      </section>

      <template v-else>
        <div class="product-heading">
          <div class="heading-copy">
            <h1 class="product-title">
              {{ product.title || 'بدون عنوان' }}
              <span v-if="categoryName" class="category-chip">{{ categoryName }}</span>
            </h1>
            <div class="product-meta">
              <span v-if="product.brand"><i class="pi pi-tag"></i>{{ product.brand }}</span>
              <span v-if="product.model"><i class="pi pi-box"></i>مدل {{ product.model }}</span>
              <span v-if="product.sku" class="sku"><i class="pi pi-hashtag"></i>{{ product.sku }}</span>
            </div>
          </div>
        </div>

        <div class="product-layout">
          <section class="product-main">
            <div class="gallery-card">
              <div class="main-image-frame">
                <img
                  v-if="activeImage"
                  :src="activeImage"
                  :alt="product.title || 'تصویر محصول'"
                  class="main-image"
                  @error="imageFailed = true"
                  v-show="!imageFailed"
                />
                <div v-if="!activeImage || imageFailed" class="image-placeholder">
                  <i class="pi pi-image"></i>
                  <span>تصویری برای این محصول ثبت نشده است</span>
                </div>
                <span v-if="product.brand" class="image-brand">{{ product.brand }}</span>
              </div>
              <div v-if="galleryImages.length > 1" class="thumbnail-list" aria-label="تصاویر محصول">
                <button
                  v-for="(image, index) in galleryImages"
                  :key="image.url || index"
                  type="button"
                  class="thumbnail-button"
                  :class="{ 'thumbnail-button--active': image.url === activeImage }"
                  :aria-label="'نمایش تصویر ' + (index + 1)"
                  @click="selectImage(image.url)"
                >
                  <img :src="image.url" :alt="'تصویر ' + (index + 1)" />
                </button>
              </div>
            </div>

            <section v-if="product.shortDescription || product.description" class="content-card description-card">
              <div class="section-heading">
                <span class="section-icon"><i class="pi pi-align-right"></i></span>
                <div>
                  <h2>درباره محصول</h2>
                  <p>معرفی و توضیحات تکمیلی</p>
                </div>
              </div>
              <div v-if="product.shortDescription" class="short-description">
                {{ product.shortDescription }}
              </div>
              <div v-if="product.description" class="full-description">{{ product.description }}</div>
            </section>

            <section v-if="specRows.length" class="content-card specifications-card">
              <div class="section-heading">
                <span class="section-icon"><i class="pi pi-sliders-h"></i></span>
                <div>
                  <h2>مشخصات فنی</h2>
                  <p>جزئیات و ویژگی‌های ثبت‌شده محصول</p>
                </div>
                <span class="spec-count">{{ specRows.length }} مورد</span>
              </div>
              <dl class="specification-list">
                <div v-for="(row, index) in specRows" :key="row.title + '-' + index" class="specification-row">
                  <dt>{{ row.title }}</dt>
                  <dd>{{ row.value }}</dd>
                </div>
              </dl>
            </section>
          </section>

          <aside class="product-sidebar">
            <section class="purchase-card">
              <div class="availability-line">
                <span class="availability-dot"></span>
                <span>اطلاعات محصول</span>
                <span class="availability-label">ثبت‌شده</span>
              </div>

              <div class="price-block">
                <span class="price-caption">قیمت محصول</span>
                <template v-if="prices.length">
                  <strong class="product-price">{{ minPriceText }}</strong>
                  <span v-if="prices.length > 1" class="price-note">{{ prices.length }} سطح قیمت ثبت شده</span>
                </template>
                <div v-else class="price-unavailable">
                  <i class="pi pi-info-circle"></i>
                  <span>برای اطلاع از قیمت و شرایط فروش، استعلام بگیرید.</span>
                </div>
              </div>

              <div class="price-icon-actions" aria-label="عملیات قیمت محصول">
                <Button v-if="canCreateInquiry" icon="pi pi-file-edit" rounded outlined severity="secondary"
                  aria-label="ثبت استعلام قیمت" title="ثبت استعلام قیمت" :disabled="inquirySubmitting"
                  @click="inquiryDialogOpen = true" />
                <Button :icon="isInWishlist ? 'pi pi-heart-fill' : 'pi pi-heart'" rounded outlined
                  :class="['icon-action', { 'icon-action--active': isInWishlist }]"
                  :aria-label="isInWishlist ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'"
                  :title="isInWishlist ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'" @click="addToWishlist" />
                <Button icon="pi pi-chart-line" rounded outlined severity="secondary"
                  aria-label="نمودار قیمت شش ماه اخیر" title="نمودار قیمت شش ماه اخیر"
                  @click="priceHistoryDialogOpen = true" />
              </div>
              <div v-if="prices.length > 1" class="price-tiers">
                <div v-for="(tier, index) in sortedPrices" :key="tier.id || index" class="price-tier">
                  <span>{{ tier.label || tier.name || ('سطح قیمت ' + (index + 1)) }}</span>
                  <strong>{{ formatPrice(tier.price) }}</strong>
                </div>
              </div>

              <div class="purchase-actions">
                <Button
                  label="افزودن به سبد خرید"
                  icon="pi pi-shopping-cart"
                  class="primary-action"
                  @click="addToCart"
                />
                <Button
                  label="مشاهده سبد خرید"
                  icon="pi pi-arrow-left"
                  severity="secondary"
                  outlined
                  class="secondary-action"
                  @click="router.push('/cart')"
                />
              </div>

              <div class="purchase-assurance">
                <div><i class="pi pi-building"></i><span>عرضه‌شده توسط شرکت تأمین‌کننده</span></div>
                <div><i class="pi pi-info-circle"></i><span>شرایط نهایی فروش را بررسی کنید</span></div>
              </div>
            </section>

            <section class="company-card">
              <div class="company-card-heading">
                <span class="company-avatar"><i class="pi pi-building"></i></span>
                <div class="company-title">
                  <span>تأمین‌کننده محصول</span>
                  <h2>{{ product.company?.name || 'شرکت نامشخص' }}</h2>
                </div>
              </div>
              <div v-if="product.company?.type" class="company-type">{{ product.company.type }}</div>
              <Button
                v-if="product.company?.id"
                label="مشاهده صفحه شرکت"
                icon="pi pi-arrow-left"
                iconPos="left"
                severity="secondary"
                outlined
                class="company-profile-button"
                @click="viewCompanyProfile"
              />
            </section>

            <section v-if="productTags.length" class="tags-card" aria-label="برچسب‌های محصول">
              <h2>برچسب‌ها</h2>
              <div class="product-tags">
                <span v-for="tag in productTags" :key="tag" class="product-tag">#{{ tag }}</span>
              </div>
            </section>
            <div class="help-card">
              <span class="help-icon"><i class="pi pi-comments"></i></span>
              <div>
                <strong>نیاز به اطلاعات بیشتر دارید؟</strong>
                <p>برای جزئیات قیمت یا مشخصات، با تأمین‌کننده محصول آشنا شوید.</p>
              </div>
            </div>
          </aside>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import { useCartStore } from '../../stores/cart'
import { useWishlistStore } from '../../stores/wishlist'
import { useAuthStore } from '../../stores/auth'
import { inquiriesApi } from '@telecom/api-client'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const authStore = useAuthStore()

const product = ref({})
const loading = ref(false)
const loadError = ref('')
const selectedImage = ref('')
const imageFailed = ref(false)
const wishlistVersion = ref(0)
const inquiryDialogOpen = ref(false)
const inquirySubmitting = ref(false)
const inquiryQuantity = ref(1)
const inquiryDescription = ref('')
const inquiryError = ref('')
const priceHistoryDialogOpen = ref(false)

const canCreateInquiry = computed(() => authStore.isAuthenticated
  && authStore.hasAnyPermission(['inquiries.create', 'leads.create']))
const productTags = computed(() => {
  const tags = Array.isArray(product.value.tags) ? product.value.tags : []
  return tags.map(tag => String(typeof tag === 'object' ? (tag.name || tag.label || '') : tag).trim()).filter(Boolean)
})
const priceHistoryPoints = computed(() => {
  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() - 6)
  const entries = prices.value.map((tier, index) => {
    const date = new Date(tier.updatedAt || tier.validFrom || tier.createdAt)
    return { key: tier.id ?? index, date, price: Number(tier.price) }
  }).filter(point => Number.isFinite(point.price) && !Number.isNaN(point.date.getTime()) && point.date >= cutoff && point.date <= now)
    .sort((a, b) => a.date - b.date)
  const maxPrice = Math.max(...entries.map(point => point.price), 0)
  return entries.map(point => ({
    ...point,
    label: point.date.toLocaleDateString('fa-IR', { month: 'short', year: 'numeric' }),
    width: maxPrice > 0 ? Math.max(3, point.price / maxPrice * 100) : 0,
  }))
})

const home = { icon: 'pi pi-home', to: '/' }
const breadcrumbItems = computed(() => [
  { label: 'محصولات', to: '/products' },
  { label: product.value.title || 'جزئیات محصول' }
])

const notFound = computed(() =>
  !loading.value && !loadError.value && !(product.value && (product.value.id != null || product.value.title))
)

const galleryImages = computed(() => {
  const list = Array.isArray(product.value.images) ? product.value.images : []
  return [...list]
    .filter((image) => image?.url)
    .sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)))
})

const activeImage = computed(() => {
  if (selectedImage.value && galleryImages.value.some((image) => image.url === selectedImage.value)) {
    return selectedImage.value
  }
  return galleryImages.value[0]?.url || ''
})

const categoryName = computed(() =>
  product.value.category?.nameFa || product.value.category?.nameEn || ''
)
const subcategoryName = computed(() =>
  product.value.subcategory?.nameFa || product.value.subcategory?.nameEn || ''
)

const prices = computed(() => {
  const list = Array.isArray(product.value.prices) ? product.value.prices : []
  return list.filter((tier) => tier.price != null && tier.price !== '' && Number.isFinite(Number(tier.price)))
})

const sortedPrices = computed(() => [...prices.value].sort((a, b) => Number(a.price) - Number(b.price)))
const minPrice = computed(() => sortedPrices.value.length ? Number(sortedPrices.value[0].price) : null)
const minPriceText = computed(() => minPrice.value == null ? '' : formatPrice(minPrice.value))

const specRows = computed(() => {
  const rows = []
  const specs = product.value.specifications && typeof product.value.specifications === 'object'
    ? product.value.specifications
    : {}

  for (const [key, value] of Object.entries(specs.standard || {})) {
    if (value !== '' && value != null) rows.push({ title: key, value: String(value) })
  }
  for (const attr of specs.attributes || []) {
    if (attr?.title && attr.value !== '' && attr.value != null) {
      rows.push({ title: attr.title, value: String(attr.value) })
    }
  }
  return rows
})

const isInWishlist = computed(() => {
  wishlistVersion.value
  return product.value.id != null && wishlistStore.isInWishlist(product.value.id)
})

const loadProduct = async () => {
  const productId = route.params.id
  if (productId == null || productId === '') {
    loadError.value = 'شناسه محصول معتبر نیست.'
    product.value = {}
    loading.value = false
    return
  }

  loading.value = true
  loadError.value = ''
  imageFailed.value = false
  selectedImage.value = ''

  try {
    const data = await productsStore.getProductById(productId)
    const resolved = data?.data && typeof data.data === 'object' && 'id' in data.data
      ? data.data
      : data
    product.value = resolved && typeof resolved === 'object' ? resolved : {}
    selectedImage.value = product.value.images?.find((image) => image?.isPrimary && image?.url)?.url
      || product.value.images?.find((image) => image?.url)?.url
      || ''
  } catch (err) {
    const status = err.status ?? err.response?.status
    loadError.value = err.response?.data?.error?.message
      || err.serverMessage
      || (status ? (err.message || 'خطا در دریافت محصول') : 'ارتباط با سرور برقرار نشد.')
    product.value = {}
  } finally {
    loading.value = false
  }
}

const selectImage = (url) => {
  selectedImage.value = url
  imageFailed.value = false
}

watch(() => route.params.id, () => {
  product.value = {}
  loadError.value = ''
  loadProduct()
})

onMounted(loadProduct)

function formatPrice(value) {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return '—'
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR',
    maximumFractionDigits: 0
  }).format(num)
}

const addToCart = () => {
  if (!product.value.id) return
  cartStore.addItem({
    id: product.value.id,
    title: product.value.title || 'بدون عنوان',
    prices: [{ price: minPrice.value ?? 0, currency: 'IRR' }],
    images: activeImage.value ? [activeImage.value] : []
  }, 1)
}

const addToWishlist = () => {
  if (!product.value.id) return
  wishlistStore.toggleWishlist(product.value)
  wishlistVersion.value += 1
}

const submitInquiry = async () => {
  if (!canCreateInquiry.value || !product.value.id) return
  const quantity = Number(inquiryQuantity.value)
  if (!Number.isInteger(quantity) || quantity < 1) {
    inquiryError.value = 'تعداد باید عدد صحیح و حداقل ۱ باشد.'
    return
  }
  inquirySubmitting.value = true
  inquiryError.value = ''
  try {
    await inquiriesApi.create({
      title: 'استعلام قیمت: ' + (product.value.title || 'محصول'),
      description: inquiryDescription.value.trim() || undefined,
      items: [{
        productId: Number(product.value.id),
        quantity,
        description: inquiryDescription.value.trim() || undefined,
      }],
    })
    inquiryDialogOpen.value = false
    inquiryQuantity.value = 1
    inquiryDescription.value = ''
  } catch (err) {
    inquiryError.value = err?.response?.data?.message || err?.message || 'ثبت استعلام انجام نشد. لطفاً دسترسی حساب را بررسی کنید.'
  } finally {
    inquirySubmitting.value = false
  }
}

const viewCompanyProfile = () => {
  if (product.value.company?.id) {
    router.push({ name: 'company-profile', params: { id: product.value.company.id } })
  }
}

const goBack = () => router.push('/products')
</script>

<style scoped>
.product-page {
  --pd-accent: var(--primary-color, #01bec2);
  --pd-accent-soft: color-mix(in srgb, var(--pd-accent) 10%, white);
  --pd-text: var(--text-color, #172b3a);
  --pd-muted: var(--text-color-secondary, #718096);
  --pd-border: var(--surface-border, #e7edf0);
  --pd-surface: var(--surface-card, #fff);
  --pd-ground: var(--surface-ground, #f6f9fa);
  direction: rtl;
  min-height: 60vh;
  padding: 1.5rem 0 4rem;
  color: var(--pd-text);
}

.product-shell {
  width: 100%;
  max-width: var(--ds-container-max);
  margin-inline: auto;
  padding-inline: var(--ds-container-pad);
}

@media (min-width: 768px) {
  .product-shell {
    padding-inline: var(--ds-container-pad-lg);
  }
}

.product-breadcrumb {
  margin-bottom: 1.5rem;
  border: 0;
  background: transparent;
  padding: 0;
}

.product-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.heading-copy {
  min-width: 0;
}

.category-list,
.product-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-list {
  margin-bottom: 0.8rem;
}

.category-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: var(--pd-accent-soft);
  color: color-mix(in srgb, var(--pd-accent) 75%, #064c50);
  font-size: 0.78rem;
  font-weight: 700;
}

.category-chip--muted {
  background: var(--pd-ground);
  color: var(--pd-muted);
}

.product-heading h1 {
  margin: 0;
  font-size: clamp(1.5rem, 2.5vw, 2.1rem);
  line-height: 1.55;
  font-weight: 800;
  letter-spacing: -0.025em;
  overflow-wrap: anywhere;
}

.product-meta {
  margin-top: 0.75rem;
  color: var(--pd-muted);
  font-size: 0.88rem;
  gap: 0.65rem 1.1rem;
}

.product-meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.product-meta i {
  color: var(--pd-accent);
  font-size: 0.85rem;
}

.sku {
  direction: ltr;
}

.wishlist-button {
  flex-shrink: 0;
  margin-top: 0.2rem;
  white-space: nowrap;
}

.wishlist-button--active {
  color: #d9485f !important;
  border-color: #f1b8c1 !important;
  background: #fff7f8 !important;
}

.product-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  align-items: start;
  gap: 1.25rem;
}

.product-main,
.product-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}

.gallery-card,
.content-card,
.purchase-card,
.company-card,
.help-card {
  background: var(--pd-surface);
  border: 1px solid var(--pd-border);
  border-radius: 1rem;
  box-shadow: 0 4px 18px rgba(20, 48, 60, 0.035);
}

.gallery-card {
  padding: 1rem;
}

.main-image-frame {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  max-height: 460px;
  aspect-ratio: 1.6 / 1;
  overflow: hidden;
  border-radius: 0.75rem;
  background: linear-gradient(145deg, var(--pd-ground), color-mix(in srgb, var(--pd-accent) 5%, white));
}

.main-image {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 500px;
  object-fit: contain;
  padding: 1rem;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 2rem;
  color: var(--pd-muted);
  text-align: center;
  font-size: 0.9rem;
}

.image-placeholder i {
  font-size: 3.5rem;
  color: color-mix(in srgb, var(--pd-accent) 45%, #a8b7bd);
}

.image-brand {
  position: absolute;
  inset-inline-start: 1rem;
  top: 1rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid rgba(255,255,255,.7);
  border-radius: 0.5rem;
  background: rgba(255,255,255,.9);
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
  backdrop-filter: blur(8px);
}

.thumbnail-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  padding-top: 0.9rem;
}

.thumbnail-button {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  padding: 0.2rem;
  overflow: hidden;
  border: 1px solid var(--pd-border);
  border-radius: 0.65rem;
  background: var(--pd-surface);
  cursor: pointer;
  transition: border-color .18s ease, box-shadow .18s ease;
}

.thumbnail-button:hover,
.thumbnail-button--active {
  border-color: var(--pd-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--pd-accent) 16%, transparent);
}

.thumbnail-button img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 0.4rem;
}

.content-card {
  padding: 1.35rem;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.1rem;
}

.section-icon,
.company-avatar,
.help-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 0.8rem;
  background: var(--pd-accent-soft);
  color: var(--pd-accent);
  font-size: 1.15rem;
}

.section-heading h2 {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
}

.section-heading p {
  margin: 0.2rem 0 0;
  color: var(--pd-muted);
  font-size: 0.8rem;
}

.spec-count {
  margin-inline-start: auto;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  background: var(--pd-ground);
  color: var(--pd-muted);
  font-size: 0.76rem;
  white-space: nowrap;
}

.short-description {
  margin-bottom: 0.85rem;
  color: var(--pd-text);
  font-size: 0.95rem;
  line-height: 2;
  font-weight: 500;
}

.full-description {
  color: var(--pd-muted);
  line-height: 2;
  font-size: 0.92rem;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.specification-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  margin: 0;
  border: 1px solid var(--pd-border);
  border-radius: 0.75rem;
  overflow: hidden;
}

.specification-row {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--pd-border);
  min-width: 0;
}

.specification-row:last-child {
  border-bottom: 0;
}

.specification-row dt {
  color: var(--pd-muted);
  font-size: 0.82rem;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.specification-row dd {
  margin: 0;
  color: var(--pd-text);
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.product-sidebar {
  position: sticky;
  top: 1rem;
}

.purchase-card {
  padding: 1.25rem;
}

.availability-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--pd-border);
  color: var(--pd-muted);
  font-size: 0.83rem;
}

.availability-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pd-accent);
  box-shadow: 0 0 0 4px var(--pd-accent-soft);
}

.availability-label {
  margin-inline-start: auto;
  padding: 0.25rem 0.5rem;
  border-radius: 0.45rem;
  background: var(--pd-ground);
  color: var(--pd-text);
  font-size: 0.74rem;
}

.price-block {
  padding: 1.25rem 0 1rem;
}

.price-caption {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--pd-muted);
  font-size: 0.82rem;
}

.product-price {
  display: block;
  color: var(--pd-text);
  font-size: clamp(1.25rem, 2vw, 1.65rem);
  font-weight: 850;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.price-note {
  display: block;
  margin-top: 0.2rem;
  color: var(--pd-muted);
  font-size: 0.78rem;
}

.price-unavailable {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.8rem;
  border-radius: 0.7rem;
  background: var(--pd-ground);
  color: var(--pd-muted);
  font-size: 0.85rem;
  line-height: 1.8;
}

.price-unavailable i {
  margin-top: 0.2rem;
  color: var(--pd-accent);
}

.price-tiers {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.9rem 0;
  border-top: 1px solid var(--pd-border);
}

.price-tier {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  color: var(--pd-muted);
  font-size: 0.8rem;
}

.price-tier strong {
  color: var(--pd-text);
  font-size: 0.82rem;
  text-align: left;
}

.purchase-actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.purchase-actions :deep(.p-button) {
  justify-content: center;
  min-height: 44px;
  border-radius: 0.7rem;
  font-weight: 700;
}

.primary-action {
  background: var(--pd-accent);
  border-color: var(--pd-accent);
}

.primary-action:hover {
  background: color-mix(in srgb, var(--pd-accent) 85%, #00585b);
  border-color: color-mix(in srgb, var(--pd-accent) 85%, #00585b);
}

.purchase-assurance {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--pd-border);
}

.purchase-assurance div {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  color: var(--pd-muted);
  font-size: 0.78rem;
  line-height: 1.7;
}

.purchase-assurance i {
  margin-top: 0.2rem;
  color: var(--pd-accent);
}

.company-card {
  padding: 1.1rem;
}

.company-card-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.company-avatar {
  width: 48px;
  height: 48px;
  border: 1px solid color-mix(in srgb, var(--pd-accent) 18%, transparent);
}

.company-title {
  min-width: 0;
}

.company-title > span {
  color: var(--pd-muted);
  font-size: 0.76rem;
}

.company-title h2 {
  margin: 0.2rem 0 0;
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.company-type {
  display: inline-flex;
  margin: 0.9rem 0 0;
  padding: 0.3rem 0.55rem;
  border-radius: 0.45rem;
  background: var(--pd-ground);
  color: var(--pd-muted);
  font-size: 0.76rem;
}

.company-profile-button {
  width: 100%;
  justify-content: center;
  margin-top: 1rem;
  border-radius: 0.65rem;
}

.help-card {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 1rem;
  background: color-mix(in srgb, var(--pd-accent) 5%, var(--pd-surface));
}

.help-icon {
  width: 40px;
  height: 40px;
  font-size: 1rem;
}

.help-card strong {
  display: block;
  font-size: 0.85rem;
  line-height: 1.7;
}

.help-card p {
  margin: 0.25rem 0 0;
  color: var(--pd-muted);
  font-size: 0.78rem;
  line-height: 1.8;
}

.page-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  min-height: 380px;
  padding: 3rem 1.5rem;
  text-align: center;
  background: var(--pd-surface);
  border: 1px solid var(--pd-border);
  border-radius: 1rem;
}

.page-state h1 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
}

.page-state p {
  max-width: 34rem;
  margin: 0;
  color: var(--pd-muted);
  line-height: 1.9;
}

.state-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 1.1rem;
  background: var(--pd-ground);
  color: var(--pd-accent);
  font-size: 1.8rem;
}

.state-icon--error {
  color: #c24141;
  background: #fff1f1;
}

.state-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

@media (max-width: 1000px) {
  .product-layout {
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 1rem;
  }

  .main-image-frame {
    min-height: 300px;
  }

  .specification-list {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 760px) {
  .product-page {
    padding-top: 1rem;
  }

  .product-shell {
    padding-inline: var(--ds-container-pad);
  }

  .product-heading {
    flex-direction: column;
    gap: 0.9rem;
  }

  .wishlist-button {
    align-self: flex-start;
  }

  .product-layout {
    grid-template-columns: 1fr;
  }

  .product-main {
    display: contents;
  }

  .gallery-card {
    order: 1;
  }

  .product-sidebar {
    position: static;
    order: 2;
  }

  .description-card {
    order: 3;
  }

  .specifications-card {
    order: 4;
  }

  .main-image-frame {
    min-height: 230px;
    max-height: 380px;
    aspect-ratio: 1.35 / 1;
  }

  .main-image {
    max-height: 380px;
  }

  .content-card {
    padding: 1rem;
  }

  .purchase-card {
    padding: 1rem;
  }

  .purchase-assurance {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
  }
}

@media (max-width: 440px) {
  .product-heading h1 {
    font-size: 1.4rem;
  }

  .product-meta {
    font-size: 0.8rem;
  }

  .main-image-frame {
    min-height: 200px;
  }

  .thumbnail-button {
    width: 60px;
    height: 60px;
  }

  .specification-row {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .purchase-assurance {
    grid-template-columns: 1fr;
  }

  .section-heading {
    gap: 0.6rem;
  }

  .section-icon {
    width: 38px;
    height: 38px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
