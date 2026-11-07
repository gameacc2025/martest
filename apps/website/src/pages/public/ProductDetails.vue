<template>
  <main class="product-page ds-page" dir="rtl" :aria-busy="loading">
    <div class="product-shell ds-container">
      <Breadcrumb :home="home" :model="breadcrumbItems" class="product-breadcrumb" />

      <section v-if="loading" class="page-state" role="status" aria-live="polite">
        <ProgressSpinner />
        <h1>در حال دریافت اطلاعات محصول</h1>
        <p>چند لحظه صبر کنید...</p>
      </section>

      <section v-else-if="notFound" class="page-state" role="status">
        <span class="state-icon"><i class="pi pi-box"></i></span>
        <h1>محصول پیدا نشد</h1>
        <p>این محصول در دسترس نیست یا ممکن است حذف شده باشد.</p>
        <Button label="بازگشت به محصولات" icon="pi pi-arrow-left" @click="goBack" />
      </section>

      <section v-else-if="loadError" class="page-state" role="alert">
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
              <span v-if="product.sku" class="sku"><i class="pi pi-hashtag"></i>کد فروشنده: {{ product.sku }}</span>
              <span v-if="product.catalogCode" class="catalog-code"><i class="pi pi-clone"></i>کد کالای مشترک: {{ product.catalogCode }}</span>
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
                  width="1200"
                  height="750"
                  fetchpriority="high"
                  decoding="async"
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
              <div v-if="galleryImages.length > 1" class="thumbnail-list" role="group" aria-label="تصاویر محصول">
                <button
                  v-for="(image, index) in galleryImages"
                  :key="image.url || index"
                  type="button"
                  class="thumbnail-button"
                  :class="{ 'thumbnail-button--active': image.url === activeImage }"
                  :aria-label="'نمایش تصویر ' + (index + 1)"
                  :aria-pressed="image.url === activeImage"
                  @click="selectImage(image.url)"
                >
                  <img :src="image.url" :alt="'تصویر ' + (index + 1)" width="160" height="100" loading="lazy" decoding="async" />
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

            <section v-if="similarProductsLoading || similarProducts.length" class="content-card similar-products-card">
              <div class="section-heading">
                <span class="section-icon"><i class="pi pi-clone"></i></span>
                <div>
                  <h2>همین کالا نزد تأمین‌کنندگان دیگر</h2>
                  <p>عرضه‌های دیگر با کد سازنده و مدل یکسان</p>
                </div>
                <span v-if="similarProducts.length" class="spec-count">{{ similarProducts.length }} عرضه</span>
              </div>

              <div v-if="similarProductsLoading" class="similar-products-loading" role="status">
                در حال بررسی عرضه‌کنندگان دیگر...
              </div>
              <div v-else class="similar-products-list">
                <article v-for="item in similarProducts" :key="item.id" class="similar-product-row">
                  <div class="similar-product-image">
                    <img v-if="item.images?.[0]?.url" :src="item.images[0].url" :alt="item.title" loading="lazy" />
                    <i v-else class="pi pi-box"></i>
                  </div>
                  <div class="similar-product-copy">
                    <strong>{{ item.title }}</strong>
                    <span>{{ item.company?.name || 'تأمین‌کننده' }}</span>
                    <small>{{ item.brand }} · {{ item.model }}</small>
                  </div>
                  <div class="similar-product-action">
                    <strong>{{ similarPrice(item) }}</strong>
                    <Button label="مشاهده" size="small" severity="secondary" outlined @click="viewSimilarProduct(item.id)" />
                  </div>
                </article>
              </div>
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

              <div class="price-icon-actions" role="group" aria-label="عملیات قیمت محصول">
                <Button v-if="canCreateInquiry" icon="pi pi-file-edit" rounded outlined severity="secondary"
                  aria-label="ثبت استعلام قیمت" title="ثبت استعلام قیمت" :disabled="inquirySubmitting"
                  @click="inquiryDialogOpen = true" />
                <Button icon="pi pi-chart-line" rounded outlined severity="secondary"
                  aria-label="نمودار قیمت خرده‌فروشی شش ماه اخیر" title="نمودار قیمت خرده‌فروشی شش ماه اخیر"
                  @click="openPriceHistory" />
              </div>
              <div v-if="prices.length > 1" class="price-tiers">
                <div v-for="(tier, index) in sortedPrices" :key="tier.id || index" class="price-tier">
                  <span>{{ tier.label || tier.name || ('سطح قیمت ' + (index + 1)) }}</span>
                  <strong>{{ formatPrice(tier.price) }}</strong>
                </div>
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


            <div class="help-card">
              <span class="help-icon"><i class="pi pi-comments"></i></span>
              <div>
                <strong>نیاز به اطلاعات بیشتر دارید؟</strong>
                <p>برای جزئیات قیمت یا مشخصات، با تأمین‌کننده محصول آشنا شوید.</p>
              </div>
            </div>
            <section v-if="productTags.length" class="tags-card" aria-label="برچسب‌های محصول">
              <h2>برچسب‌ها</h2>
              <div class="product-tags">
                <span v-for="tag in productTags" :key="tag" class="product-tag">#{{ tag }}</span>
              </div>
            </section>
          </aside>
        </div>
        <div v-if="inquiryDialogOpen" class="product-dialog-backdrop" @click.self="inquiryDialogOpen = false">
          <section class="product-dialog" role="dialog" aria-modal="true" aria-labelledby="inquiry-dialog-title">
            <div class="dialog-heading">
              <h2 id="inquiry-dialog-title">استعلام قیمت محصول</h2>
              <Button icon="pi pi-times" text rounded severity="secondary" aria-label="بستن" @click="inquiryDialogOpen = false" />
            </div>
            <p class="dialog-product-name">{{ product.title }}</p>
            <label class="dialog-field">
              <span>تعداد موردنیاز</span>
              <input v-model.number="inquiryQuantity" type="number" min="1" step="1" />
            </label>
            <label class="dialog-field">
              <span>توضیحات (اختیاری)</span>
              <textarea v-model="inquiryDescription" rows="3" maxlength="2000" placeholder="شرایط تحویل یا توضیحات تکمیلی"></textarea>
            </label>
            <p v-if="inquiryError" class="dialog-error" role="alert">{{ inquiryError }}</p>
            <p v-if="inquirySuccess" class="dialog-success" role="status">{{ inquirySuccess }}</p>
            <Button v-if="inquirySuccess" label="مشاهده استعلام‌های من" icon="pi pi-list" text @click="router.push('/my-inquiries')" />
            <div class="dialog-actions">
              <Button :label="inquirySuccess ? 'بستن' : 'انصراف'" severity="secondary" outlined @click="inquiryDialogOpen = false" />
              <Button v-if="!inquirySuccess" label="ثبت استعلام" icon="pi pi-send" :loading="inquirySubmitting" @click="submitInquiry" />
            </div>
          </section>
        </div>

        <div v-if="priceHistoryDialogOpen" class="product-dialog-backdrop" @click.self="priceHistoryDialogOpen = false">
          <section class="product-dialog price-history-dialog" role="dialog" aria-modal="true" aria-labelledby="price-history-title">
            <div class="dialog-heading">
              <h2 id="price-history-title">نمودار قیمت خرده‌فروشی شش ماه اخیر</h2>
              <Button icon="pi pi-times" text rounded severity="secondary" aria-label="بستن" @click="priceHistoryDialogOpen = false" />
            </div>
            <p class="history-disclaimer">این نمودار فقط تغییرات قیمت خرده‌فروشی (قیمت برای حداقل تعداد ۱) را در شش ماه اخیر نشان می‌دهد. سابقه‌ای پیش از فعال‌شدن ثبت تاریخچه به‌صورت خودکار ساخته نمی‌شود.</p>
            <p v-if="priceHistoryLoading" class="history-empty" role="status">در حال دریافت تاریخچه قیمت...</p>
            <p v-else-if="priceHistoryError" class="history-empty" role="alert">{{ priceHistoryError }}</p>
            <div v-else-if="priceHistoryPoints.length" class="price-history-list">
              <div v-for="point in priceHistoryPoints" :key="point.key" class="price-history-point">
                <span class="history-date">{{ point.label }} · قیمت خرده‌فروشی</span>
                <div class="history-bar-track"><span class="history-bar" :style="{ width: point.width + '%' }"></span></div>
                <strong>{{ formatPrice(point.price) }}</strong>
              </div>
            </div>
            <p v-else class="history-empty">برای شش ماه اخیر، سابقهٔ ثبت‌شده‌ای از قیمت خرده‌فروشی برای رسم نمودار وجود ندارد.</p>
          </section>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { apiGet } from '@telecom/shared-core/http/apiClient'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import { useAuthStore } from '../../stores/auth'
import { buildPriceHistoryPoints } from '../../utils/priceHistory'
import { inquiriesApi } from '@telecom/api-client'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const authStore = useAuthStore()

const product = ref({})
const loading = ref(false)
const loadError = ref('')
const selectedImage = ref('')
const imageFailed = ref(false)
const inquiryDialogOpen = ref(false)
const inquirySubmitting = ref(false)
const inquiryQuantity = ref(1)
const inquiryDescription = ref('')
const inquiryError = ref('')
const inquirySuccess = ref('')
const priceHistoryDialogOpen = ref(false)
const priceHistoryRecords = ref([])
const priceHistoryLoading = ref(false)
const priceHistoryError = ref('')
const priceHistoryLoaded = ref(false)
const similarProducts = ref([])
const similarProductsLoading = ref(false)

const canCreateInquiry = computed(() => authStore.isAuthenticated
  && authStore.hasAnyPermission(['inquiries.create', 'leads.create']))
const productTags = computed(() => {
  const tags = Array.isArray(product.value.tags) ? product.value.tags
    : Array.isArray(product.value.specifications?.tags) ? product.value.specifications.tags
      : []
  return [...new Set(tags.map(tag => String(typeof tag === 'object' ? (tag.name || tag.label || '') : tag).trim()).filter(Boolean))]
})
const priceHistoryPoints = computed(() => buildPriceHistoryPoints(priceHistoryRecords.value))

const loadSimilarProducts = async (productId) => {
  if (!product.value.catalogCode) {
    similarProducts.value = []
    return
  }
  similarProductsLoading.value = true
  try {
    const response = await apiGet(`/products/${productId}/similar`)
    const payload = response?.data?.data ?? response?.data ?? response
    if (String(route.params.id) !== String(productId)) return
    similarProducts.value = Array.isArray(payload) ? payload : []
  } catch {
    // Similar listings are supplementary; a failed lookup must not break product details.
    similarProducts.value = []
  } finally {
    similarProductsLoading.value = false
  }
}

const similarPrice = (item) => {
  const tiers = Array.isArray(item?.prices) ? item.prices : []
  const retail = tiers.find(tier => Number(tier.minQuantity ?? tier.minOrderQty ?? 1) === 1) || tiers[0]
  return retail?.price != null ? formatPrice(retail.price) : 'قیمت با استعلام'
}

const viewSimilarProduct = (productId) => router.push(`/products/${productId}`)

const openPriceHistory = async () => {
  priceHistoryDialogOpen.value = true
  if (priceHistoryLoaded.value || priceHistoryLoading.value) return
  priceHistoryLoading.value = true
  priceHistoryError.value = ''
  try {
    const response = await apiGet(`/products/${route.params.id}/price-history`)
    const payload = response?.data?.data ?? response?.data ?? response
    priceHistoryRecords.value = Array.isArray(payload) ? payload : []
    priceHistoryLoaded.value = true
  } catch (error) {
    priceHistoryError.value = error?.serverMessage || 'دریافت تاریخچه قیمت با مشکل مواجه شد.'
  } finally {
    priceHistoryLoading.value = false
  }
}

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

// Show the retail price first when present; bulk tiers must not make the
// headline price look cheaper than the price for a single item.
const sortedPrices = computed(() => [...prices.value].sort((a, b) => {
  const quantityDelta = Number(a.minQuantity ?? a.minOrderQty ?? 1) - Number(b.minQuantity ?? b.minOrderQty ?? 1)
  return quantityDelta || Number(a.price) - Number(b.price)
}))
const retailPrice = computed(() => prices.value.find(tier => Number(tier.minQuantity ?? tier.minOrderQty ?? 1) === 1))
const minPrice = computed(() => retailPrice.value
  ? Number(retailPrice.value.price)
  : (sortedPrices.value.length ? Number(sortedPrices.value[0].price) : null))
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
    if (product.value.catalogCode) void loadSimilarProducts(productId)
    else similarProducts.value = []
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

const submitInquiry = async () => {
  if (!canCreateInquiry.value || !product.value.id) return
  const quantity = Number(inquiryQuantity.value)
  if (!Number.isInteger(quantity) || quantity < 1) {
    inquiryError.value = 'تعداد باید عدد صحیح و حداقل ۱ باشد.'
    return
  }
  inquirySubmitting.value = true
  inquiryError.value = ''
  inquirySuccess.value = ''
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
    inquirySuccess.value = 'درخواست استعلام قیمت با موفقیت ثبت شد.'
    inquiryQuantity.value = 1
    inquiryDescription.value = ''
  } catch (err) {
    inquiryError.value = err?.response?.data?.message || err?.response?.data?.error?.message || err?.serverMessage || err?.message || 'ثبت استعلام انجام نشد. لطفاً دوباره تلاش کنید.'
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
.product-page { direction: rtl; }

.product-shell {
  width: 100%;
  max-width: 1240px;
  margin-inline: auto;
  padding-inline: clamp(14px, 2vw, 28px);
}

.product-breadcrumb { margin-bottom: 14px; }

/* ---------- States ---------- */
.page-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 22rem;
  padding: 40px 18px;
  border: 1px dashed var(--tm-line-strong);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
  color: var(--tm-muted);
  text-align: center;
}
.page-state h1 { margin: 0; color: var(--tm-ink); font-size: var(--tm-fs-h2); }
.page-state p { margin: 0; font-size: var(--tm-fs-sm); max-width: 46ch; }
.state-icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  margin-bottom: 6px;
  border-radius: 8px;
  background: var(--tm-cyan-soft);
  color: var(--tm-cyan-deep);
  font-size: 24px;
}
.state-icon--error { background: var(--tm-red-soft); color: var(--tm-red); }
.state-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }

/* ---------- Heading ---------- */
.product-heading {
  padding: 18px 20px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
  box-shadow: var(--tm-shadow-xs);
  margin-bottom: 16px;
}
.heading-copy { min-width: 0; }
.product-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0;
  color: var(--tm-ink);
  font-size: var(--tm-fs-h1);
  font-weight: 700;
  line-height: 1.45;
}
.category-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 11px;
  border-radius: var(--tm-radius-pill);
  background: var(--tm-cyan-soft);
  color: var(--tm-cyan-deep);
  font-size: 11.5px;
  font-weight: 700;
}
.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 10px;
  color: var(--tm-muted);
  font-size: 12.5px;
}
.product-meta span { display: inline-flex; align-items: center; gap: 5px; }
.product-meta i { color: var(--tm-blue); font-size: 12px; }
.product-meta .sku { direction: ltr; unicode-bidi: isolate; }
.product-meta .catalog-code { direction: ltr; unicode-bidi: isolate; color: var(--tm-blue-strong); }

.similar-products-list { display: flex; flex-direction: column; }
.similar-product-row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--tm-line);
}
.similar-product-image {
  display: grid;
  place-items: center;
  width: 64px;
  height: 56px;
  overflow: hidden;
  border-radius: var(--tm-radius-sm);
  background: var(--tm-surface-alt);
  color: var(--tm-muted);
}
.similar-product-image img { width: 100%; height: 100%; object-fit: contain; }
.similar-product-copy { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.similar-product-copy strong { color: var(--tm-ink); font-size: 12.5px; }
.similar-product-copy span { color: var(--tm-ink-soft); font-size: 11.5px; }
.similar-product-copy small { color: var(--tm-muted); font-size: 10.5px; }
.similar-product-action { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.similar-product-action strong { color: var(--tm-ink); font-size: 11.5px; white-space: nowrap; }
.similar-products-loading { padding: 14px 0; color: var(--tm-muted); font-size: 12px; }


/* ---------- Layout ---------- */
.product-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
  align-items: start;
}
.product-main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.product-sidebar { display: flex; flex-direction: column; gap: 16px; min-width: 0; position: sticky; top: 5rem; }

/* ---------- Gallery ---------- */
.gallery-card {
  padding: 14px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
  box-shadow: var(--tm-shadow-xs);
}
.main-image-frame {
  position: relative;
  aspect-ratio: 8 / 5;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: var(--tm-radius);
  background: var(--tm-surface-alt);
}
.main-image { width: 100%; height: 100%; object-fit: contain; padding: 16px; }
.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--tm-faint);
  font-size: var(--tm-fs-tiny);
}
.image-placeholder i { font-size: 34px; }
.image-brand {
  position: absolute;
  top: 12px;
  inset-inline-start: 12px;
  padding: 4px 10px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-pill);
  background: var(--tm-surface);
  color: var(--tm-ink-soft);
  font-size: 11px;
  font-weight: 700;
}
.thumbnail-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.thumbnail-button {
  width: 74px;
  height: 54px;
  padding: 2px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-sm);
  background: var(--tm-surface);
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.thumbnail-button img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
.thumbnail-button:hover { border-color: var(--tm-cyan-strong); }
.thumbnail-button--active { border-color: var(--tm-blue); box-shadow: 0 0 0 2px var(--tm-blue-soft); }
.thumbnail-button:focus-visible { outline: 2px solid var(--tm-cyan-strong); outline-offset: 2px; }

/* ---------- Content cards ---------- */
.content-card {
  padding: 18px 20px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
  box-shadow: var(--tm-shadow-xs);
}
.section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.section-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--tm-radius);
  background: var(--tm-cyan-soft);
  color: var(--tm-cyan-deep);
  font-size: 16px;
}
.section-heading h2 { margin: 0; color: var(--tm-ink); font-size: var(--tm-fs-lg); font-weight: 600; }
.section-heading p { margin: 2px 0 0; color: var(--tm-muted); font-size: 11.5px; }
.spec-count {
  margin-inline-start: auto;
  padding: 3px 9px;
  border-radius: var(--tm-radius-pill);
  background: var(--tm-surface-sunk);
  color: var(--tm-muted);
  font-size: 11px;
  font-weight: 700;
}
.short-description {
  padding: 12px 14px;
  border-inline-start: 3px solid var(--tm-cyan);
  border-radius: var(--tm-radius-sm);
  background: var(--tm-surface-alt);
  color: var(--tm-ink-soft);
  font-size: 13.5px;
  line-height: 1.9;
}
.full-description {
  margin-top: 12px;
  color: var(--tm-ink-soft);
  font-size: 13px;
  line-height: 2;
  white-space: pre-line;
}
.specification-list { margin: 0; display: flex; flex-direction: column; }
.specification-row {
  display: grid;
  grid-template-columns: minmax(120px, 34%) minmax(0, 1fr);
  gap: 12px;
  padding: 11px 12px;
  border-bottom: 1px solid var(--tm-line);
  font-size: 13px;
}
.specification-row:last-child { border-bottom: 0; }
.specification-row:nth-child(odd) { background: var(--tm-surface-alt); border-radius: var(--tm-radius-sm); }
.specification-row dt { margin: 0; color: var(--tm-muted); font-weight: 600; }
.specification-row dd { margin: 0; color: var(--tm-ink); font-weight: 500; }

/* ---------- Purchase card ---------- */
.purchase-card {
  padding: 18px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
  box-shadow: var(--tm-shadow-xs);
}
.availability-line {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--tm-ink-soft);
  font-size: 12.5px;
  font-weight: 600;
}
.availability-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--tm-green); flex: none; }
.availability-label {
  margin-inline-start: auto;
  padding: 3px 9px;
  border-radius: var(--tm-radius-pill);
  background: var(--tm-green-soft);
  color: var(--tm-green);
  font-size: 11px;
  font-weight: 700;
}
.price-block {
  margin: 16px 0;
  padding: 16px;
  border-radius: var(--tm-radius);
  background:
    radial-gradient(circle at 88% 18%, rgba(34, 211, 238, 0.22), transparent 46%),
    radial-gradient(circle at 12% 90%, rgba(139, 92, 246, 0.16), transparent 48%),
    linear-gradient(118deg, var(--tm-navy), var(--tm-navy-soft));
  color: #fff;
}
.price-caption { display: block; color: rgba(255,255,255,.72); font-size: 11.5px; margin-bottom: 6px; }
.product-price { display: block; font-size: 22px; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; }
.price-note { display: block; margin-top: 6px; color: rgba(255,255,255,.72); font-size: 11px; }
.price-unavailable {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: rgba(255,255,255,.86);
  font-size: 12.5px;
  line-height: 1.8;
}
.price-unavailable i { color: var(--tm-cyan); margin-top: 3px; }

.price-icon-actions { display: flex; gap: 8px; margin-bottom: 6px; }
.price-icon-actions :deep(.p-button) { border-radius: var(--tm-radius); }

.price-tiers { display: flex; flex-direction: column; gap: 8px; margin: 14px 0; }
.price-tier {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-sm);
  background: var(--tm-surface-alt);
  font-size: 12.5px;
}
.price-tier span { color: var(--tm-muted); }
.price-tier strong { color: var(--tm-ink); font-variant-numeric: tabular-nums; }

.purchase-assurance {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--tm-line);
}
.purchase-assurance div { display: flex; align-items: center; gap: 8px; color: var(--tm-muted); font-size: 11.5px; }
.purchase-assurance i { color: var(--tm-blue); font-size: 12px; }

/* ---------- Company card ---------- */
.company-card {
  padding: 18px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
  box-shadow: var(--tm-shadow-xs);
}
.company-card-heading { display: flex; align-items: center; gap: 12px; }
.company-avatar {
  display: grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--tm-radius);
  background: var(--tm-blue-soft);
  color: var(--tm-blue-strong);
  font-size: 18px;
}
.company-title span { color: var(--tm-muted); font-size: 11px; }
.company-title h2 { margin: 2px 0 0; color: var(--tm-ink); font-size: 15px; font-weight: 700; }
.company-type { margin-top: 10px; color: var(--tm-muted); font-size: 12px; }
.company-profile-button { margin-top: 14px; width: 100%; }

/* ---------- Help + tags ---------- */
.help-card {
  display: flex;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid var(--tm-cyan-soft);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-cyan-soft);
}
.help-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: var(--tm-radius);
  background: var(--tm-surface);
  color: var(--tm-cyan-deep);
  font-size: 15px;
}
.help-card strong { display: block; color: var(--tm-ink); font-size: 13px; }
.help-card p { margin: 4px 0 0; color: var(--tm-ink-soft); font-size: 11.5px; line-height: 1.8; }

.tags-card {
  padding: 16px 18px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
}
.tags-card h2 { margin: 0 0 10px; color: var(--tm-ink); font-size: 13px; font-weight: 700; }
.product-tags { display: flex; flex-wrap: wrap; gap: 7px; }
.product-tag {
  padding: 4px 10px;
  border-radius: var(--tm-radius-pill);
  background: var(--tm-surface-sunk);
  color: var(--tm-ink-soft);
  font-size: 11.5px;
  font-weight: 600;
}

/* ---------- Dialogs ---------- */
.product-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(10, 22, 37, 0.56);
  backdrop-filter: blur(2px);
}
.product-dialog {
  width: min(560px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
  box-shadow: var(--tm-shadow-lg);
}
.dialog-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.dialog-heading h2 { margin: 0; color: var(--tm-ink); font-size: var(--tm-fs-lg); font-weight: 700; }
.dialog-product-name { margin: 4px 0 16px; color: var(--tm-muted); font-size: 12.5px; }
.dialog-field { display: block; margin-bottom: 14px; }
.dialog-field span { display: block; margin-bottom: 6px; color: var(--tm-ink-soft); font-size: 12px; font-weight: 600; }
.dialog-field input,
.dialog-field textarea {
  width: 100%;
  min-height: 40px;
  padding: 9px 12px;
  border: 1px solid var(--tm-line-strong);
  border-radius: var(--tm-radius);
  background: var(--tm-surface);
  color: var(--tm-ink);
  font-family: inherit;
  font-size: 13px;
}
.dialog-field textarea { resize: vertical; }
.dialog-field input:focus-visible,
.dialog-field textarea:focus-visible { outline: 2px solid var(--tm-cyan-strong); outline-offset: 1px; }
.dialog-error {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: var(--tm-radius-sm);
  background: var(--tm-red-soft);
  color: var(--tm-red);
  font-size: 12.5px;
}
.dialog-success {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: var(--tm-radius-sm);
  background: var(--tm-green-soft);
  color: var(--tm-green);
  font-size: 12.5px;
}
.dialog-actions { display: flex; justify-content: flex-start; flex-wrap: wrap; gap: 8px; margin-top: 6px; }

/* ---------- Price history ---------- */
.history-disclaimer {
  margin: 4px 0 16px;
  padding: 10px 12px;
  border-radius: var(--tm-radius-sm);
  background: var(--tm-surface-alt);
  color: var(--tm-muted);
  font-size: 11.5px;
  line-height: 1.9;
}
.history-empty { margin: 0; color: var(--tm-muted); font-size: 12.5px; text-align: center; padding: 20px 0; }
.price-history-list { display: flex; flex-direction: column; gap: 12px; }
.price-history-point { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 12px; align-items: center; }
.history-date { grid-column: 1 / -1; color: var(--tm-muted); font-size: 11.5px; }
.history-bar-track {
  height: 8px;
  border-radius: var(--tm-radius-pill);
  background: var(--tm-surface-sunk);
  overflow: hidden;
}
.history-bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--tm-cyan-strong), var(--tm-cyan));
}
.price-history-point strong { color: var(--tm-ink); font-size: 12.5px; font-variant-numeric: tabular-nums; }

/* ---------- Responsive ---------- */
@media (max-width: 991px) {
  .product-layout { grid-template-columns: minmax(0, 1fr); }
  .product-sidebar { position: static; }
}
@media (max-width: 575px) {
  .product-heading { padding: 14px; }
  .product-title { font-size: var(--tm-fs-h2); }
  .specification-row { grid-template-columns: minmax(0, 1fr); gap: 2px; }
  .similar-product-row { grid-template-columns: 52px minmax(0, 1fr); }
  .similar-product-image { width: 52px; height: 48px; }
  .similar-product-action { grid-column: 2; flex-direction: row; align-items: center; justify-content: space-between; }
  .content-card, .purchase-card, .company-card, .tags-card, .help-card { padding: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .thumbnail-button { transition: none; }
}

/* NewTemp product-detail proportions and compact enterprise surfaces. */
.product-shell{max-width:1200px;padding-inline:24px}
.product-layout{grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr);gap:20px}
.product-heading,.gallery-card,.content-card,.purchase-card,.company-card{border-radius:12px;border-color:var(--ds-color-border);background:var(--ds-color-surface);box-shadow:var(--ds-shadow-xs)}
.product-title{font-size:clamp(1.25rem,2vw,1.65rem);font-weight:800}
.category-chip{border-radius:6px;background:var(--ds-color-primary-soft);color:var(--ds-color-primary-text);padding:3px 9px}
.main-image-frame{border-radius:8px;background:var(--ds-surface-secondary)}
.price-block{background:linear-gradient(135deg,var(--ds-color-brand-deep),var(--ds-color-brand-dark));border-radius:8px}
.price-icon-actions :deep(.p-button){border-radius:8px}
.price-tier{border-radius:6px;background:var(--ds-color-surface-alt);border-color:var(--ds-color-border)}
@media(max-width:991px){.product-layout{grid-template-columns:1fr}.product-sidebar{position:static}}
@media(max-width:640px){.product-shell{padding-inline:16px}.product-heading{padding:14px}.product-title{font-size:1.25rem}}

</style>
