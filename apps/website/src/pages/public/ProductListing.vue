<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import StoreProductCard from '@telecom/shared-ui/components/store/StoreProductCard.vue'
import StoreFilterPanel from '@telecom/shared-ui/components/store/StoreFilterPanel.vue'
import StoreBreadcrumb from '@telecom/shared-ui/components/store/StoreBreadcrumb.vue'
import StorePageHeading from '@telecom/shared-ui/components/store/StorePageHeading.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import Paginator from 'primevue/paginator'

const route = useRoute()
const productsStore = useProductsStore()
const products = ref([])
const categories = ref([])
const loading = ref(false)
const error = ref(null)
const totalPages = ref(1)
const totalItems = ref(0)
const searchQuery = ref('')
const selectedCategory = ref(null)
const minPrice = ref(null)
const maxPrice = ref(null)
const retailOnly = ref(false)
const filters = ref({ search: '', category: null, minPrice: null, maxPrice: null, retailOnly: false, page: 1, limit: 24, sortBy: 'createdAt', sortOrder: 'desc' })
const sortOptions = [
  { label: 'جدیدترین', value: 'createdAt:desc' },
  { label: 'قدیمی‌ترین', value: 'createdAt:asc' },
  { label: 'نام محصول (الف تا ی)', value: 'title:asc' },
  { label: 'نام محصول (ی تا الف)', value: 'title:desc' },
]
const selectedSort = ref('createdAt:desc')
const categoryOptions = computed(() => categories.value.map(category => ({
  ...category,
  label: category.nameFa || category.nameEn || category.name || category.slug,
  count: Number(category.productCount ?? category.productsCount ?? category._count?.products) || null,
})))
const remainingProducts = computed(() => products.value)

function productName(product) { return product?.title || product?.name || 'محصول بدون عنوان' }
function categoryName(product) { return product?.category?.nameFa || product?.category?.name || product?.category?.nameEn || '' }
function formatPrice(price) {
  if (price === null || price === undefined || price === '') return ''
  return new Intl.NumberFormat('fa-IR').format(Number(price)) + ' ریال'
}
function productPrice(product) {
  const price = product?.prices?.[0]?.price
  return price === undefined || price === null ? 'استعلام قیمت' : formatPrice(price)
}
function productRoute(product) { return { name: 'product-details', params: { id: product.id } } }

async function loadCategories() {
  try {
    const result = await productsStore.getCategories()
    categories.value = Array.isArray(result) ? result : []
  } catch { categories.value = [] }
}
async function loadProducts() {
  try {
    loading.value = true
    error.value = null
    const params = { page: filters.value.page, limit: filters.value.limit, status: 'PUBLISHED', sortBy: filters.value.sortBy, sortOrder: filters.value.sortOrder }
    if (filters.value.search) params.search = filters.value.search
    if (filters.value.category) params.categoryId = Number(filters.value.category)
    if (filters.value.minPrice !== null && filters.value.minPrice !== '') params.minPrice = Number(filters.value.minPrice)
    if (filters.value.maxPrice !== null && filters.value.maxPrice !== '') params.maxPrice = Number(filters.value.maxPrice)
    if (filters.value.retailOnly) params.retailEnabled = true
    const result = await productsStore.getProducts(params) || {}
    const list = Array.isArray(result.data) ? result.data : (result.data?.products ?? result.data?.items ?? result.products ?? result.items ?? [])
    products.value = Array.isArray(list) ? list : []
    totalPages.value = result.meta?.totalPages ?? result.totalPages ?? 1
    totalItems.value = result.meta?.total ?? result.total ?? products.value.length
  } catch {
    error.value = 'خطا در دریافت محصولات. دوباره تلاش کنید.'
    products.value = []
    totalItems.value = 0
  } finally { loading.value = false }
}
function applyFilters() {
  const [sortBy, sortOrder] = selectedSort.value.split(':')
  filters.value = {
    search: searchQuery.value.trim(), category: selectedCategory.value,
    minPrice: minPrice.value, maxPrice: maxPrice.value, retailOnly: retailOnly.value,
    page: 1, limit: filters.value.limit, sortBy, sortOrder,
  }
  loadProducts()
}
function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = null
  minPrice.value = null
  maxPrice.value = null
  retailOnly.value = false
  selectedSort.value = 'createdAt:desc'
  filters.value = { search: '', category: null, minPrice: null, maxPrice: null, retailOnly: false, page: 1, limit: 24, sortBy: 'createdAt', sortOrder: 'desc' }
  loadProducts()
}
function onPageChange(event) {
  filters.value.page = event.page + 1
  filters.value.limit = event.rows
  loadProducts()
}
function chooseCategory(id) {
  selectedCategory.value = selectedCategory.value === id ? null : id
  applyFilters()
}
onMounted(async () => {
  retailOnly.value = route.query.retail === '1' || route.query.retail === 'true'
  const id = Number(route.query.category)
  if (route.query.category && Number.isInteger(id) && id > 0) selectedCategory.value = id
  filters.value.category = selectedCategory.value
  filters.value.retailOnly = retailOnly.value
  await Promise.all([loadCategories(), loadProducts()])
})
watch(() => route.query.category, value => {
  const id = Number(value)
  selectedCategory.value = value && Number.isInteger(id) && id > 0 ? id : null
  filters.value.category = selectedCategory.value
  filters.value.page = 1
  loadProducts()
})
watch(() => route.query.retail, value => {
  retailOnly.value = value === '1' || value === 'true'
  filters.value.retailOnly = retailOnly.value
  filters.value.page = 1
  loadProducts()
})
</script>
<template>
  <main class="reference-catalog-page" dir="rtl">
    <div class="reference-container">
      <StoreBreadcrumb class="reference-breadcrumb" :items="[{ label: 'صفحه اصلی', to: { name: 'home' } }, { label: 'همه محصولات' }]" />
      <StorePageHeading class="reference-page-heading" title="همه محصولات" description="محصولات تخصصی تأمین‌کنندگان؛ خرید فوری یا ثبت استعلام" />

      <div class="reference-catalog-layout">
        <StoreFilterPanel class="reference-filter-panel" title="فیلتر محصولات" clear-label="حذف همه" @clear="resetFilters">
          <div class="reference-filter-group">
            <h2>جستجوی محصول</h2>
            <form class="reference-search" @submit.prevent="applyFilters">
              <InputText v-model="searchQuery" placeholder="نام محصول، برند یا مدل…" aria-label="جستجوی محصول" />
              <Button type="submit" icon="pi pi-search" aria-label="جستجو" />
            </form>
          </div>

          <div class="reference-filter-group">
            <h2>نوع خرید</h2>
            <label class="reference-filter-choice"><input v-model="retailOnly" type="checkbox" @change="applyFilters" /><span>فقط محصولات خرده‌فروشی</span></label>
          </div>

          <div class="reference-filter-group">
            <h2>دسته‌بندی</h2>
            <button type="button" class="reference-category-choice" :class="{ 'is-active': !selectedCategory }" @click="chooseCategory(null)">همه دسته‌بندی‌ها</button>
            <button v-for="category in categoryOptions" :key="category.id" type="button" class="reference-category-choice" :class="{ 'is-active': selectedCategory === category.id }" @click="chooseCategory(category.id)">
              <span>{{ category.label }}</span><small v-if="category.count">{{ category.count.toLocaleString('fa-IR') }}</small>
            </button>
          </div>

          <div class="reference-filter-group">
            <h2>محدوده قیمت <small>ریال</small></h2>
            <div class="reference-price-range">
              <InputNumber v-model="minPrice" inputId="reference-min-price" placeholder="از" :useGrouping="true" />
              <span>تا</span>
              <InputNumber v-model="maxPrice" inputId="reference-max-price" placeholder="تا" :useGrouping="true" />
            </div>
            <Button label="اعمال محدوده قیمت" icon="pi pi-filter" class="reference-apply-button" @click="applyFilters" />
          </div>
        </StoreFilterPanel>

        <section class="reference-products-area" aria-label="فهرست محصولات" :aria-busy="loading">
          <div class="reference-products-toolbar">
            <span>{{ totalItems.toLocaleString('fa-IR') }} محصول</span>
            <label>مرتب‌سازی:
              <Select v-model="selectedSort" :options="sortOptions" optionLabel="label" optionValue="value" aria-label="مرتب‌سازی محصولات" @change="applyFilters" />
            </label>
          </div>

          <div v-if="loading" class="reference-state" role="status"><ProgressSpinner /><span>در حال دریافت محصولات…</span></div>
          <div v-else-if="error" class="reference-state" role="alert"><i class="pi pi-exclamation-circle" /><b>دریافت محصولات ناموفق بود</b><span>{{ error }}</span><Button label="تلاش دوباره" @click="loadProducts" /></div>
          <div v-else-if="!products.length" class="reference-state"><i class="pi pi-search" /><b>محصولی یافت نشد</b><span>فیلترها را تغییر دهید یا همه محصولات را مشاهده کنید.</span><Button label="حذف فیلترها" severity="secondary" @click="resetFilters" /></div>
          <template v-else>
            <div class="reference-product-grid">
              <StoreProductCard v-for="product in remainingProducts" :key="product.id" :product="product" :to="productRoute(product)" :category="categoryName(product)" :verified="Boolean(product.company?.isVerified)" :brand="product.brand || product.company?.name || ''" :price-label="productPrice(product)" />
            </div>
            <div v-if="totalPages > 1" class="reference-pagination">
              <Paginator aria-label="صفحه‌بندی محصولات" :rows="filters.limit" :totalRecords="totalItems" :rowsPerPageOptions="[24, 48, 96]" @page="onPageChange" />
            </div>
          </template>
        </section>
      </div>
    </div>
  </main>
</template>
<style scoped>
.reference-catalog-page{--tm-canvas:#f4f5fa;--tm-surface:#fff;--tm-ink:#12182b;--tm-muted:#6b7390;--tm-line:#e4e7f2;--tm-blue:#6c5ce7;--tm-cyan:#2aa7e8;--tm-green:#0f9d73;--tm-chip:#eceaff;--tm-card-shadow:0 2px 10px rgba(20,30,70,.06);min-height:60vh;background:var(--tm-canvas);color:var(--tm-ink);font-family:Vazirmatn,Tahoma,sans-serif}
.reference-container{width:100%;max-width:1240px;margin-inline:auto;padding:0 20px 40px}
.reference-breadcrumb{display:flex;align-items:center;gap:7px;padding:18px 0 4px;color:var(--tm-muted);font-size:13px}
.reference-breadcrumb a{color:var(--tm-blue);text-decoration:none}.reference-breadcrumb i{font-size:11px}
.reference-page-heading{padding:6px 0 4px}.reference-page-heading h1{margin:0;color:var(--tm-ink);font-size:28px;line-height:1.6;font-weight:800}.reference-page-heading p{margin:0;color:var(--tm-muted);font-size:14px}
.reference-catalog-layout{display:grid;grid-template-columns:250px minmax(0,1fr);gap:20px;margin:18px 0;align-items:start}
.reference-filter-panel{position:sticky;top:82px;min-width:0}.reference-filter-panel :deep(.store-filter-panel){border:0;border-radius:14px;background:var(--tm-surface);box-shadow:var(--tm-card-shadow)}
.reference-filter-panel :deep(.store-filter-panel__head){padding:16px;background:var(--tm-surface);border-bottom:1px solid var(--tm-line)}
.reference-filter-panel :deep(.store-filter-panel__body){padding:0 16px}
.reference-filter-group{padding:14px 0;border-bottom:1px solid var(--tm-line)}
.reference-filter-group:last-child{border-bottom:0}.reference-filter-group h2{display:flex;justify-content:space-between;gap:8px;margin:0 0 9px;color:var(--tm-ink);font-size:14px;font-weight:700}.reference-filter-group h2 small{color:var(--tm-muted);font-size:11px;font-weight:400}
.reference-search{display:flex;gap:6px}.reference-search :deep(.p-inputtext){width:100%;min-width:0;height:38px;font-size:12px;text-align:right}.reference-search :deep(.p-button){flex:none;width:40px;background:var(--tm-blue);border-color:var(--tm-blue)}
.reference-filter-choice{display:flex;align-items:center;gap:8px;color:var(--tm-muted);font-size:12px;cursor:pointer}.reference-filter-choice input{accent-color:var(--tm-blue)}
.reference-category-choice{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:7px 0;border:0;background:transparent;color:var(--tm-muted);font:inherit;font-size:12px;text-align:start;cursor:pointer}.reference-category-choice small{color:var(--tm-muted);font-size:10px}.reference-category-choice.is-active{color:var(--tm-blue);font-weight:700}
.reference-price-range{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:6px}.reference-price-range :deep(.p-inputnumber),.reference-price-range :deep(.p-inputtext){width:100%;min-width:0}.reference-price-range :deep(.p-inputtext){height:36px;padding:7px;font-size:11px}.reference-price-range>span{color:var(--tm-muted);font-size:10px}
.reference-apply-button{width:100%;margin-top:10px;background:var(--tm-blue);border-color:var(--tm-blue);font-size:12px}
.reference-products-area{min-width:0}.reference-products-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;color:var(--tm-muted);font-size:13px}.reference-products-toolbar label{display:flex;align-items:center;gap:8px}.reference-products-toolbar :deep(.p-select){min-width:150px;font-size:12px}
.reference-product-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.reference-pagination{margin-top:18px;overflow:hidden;border:1px solid var(--tm-line);border-radius:12px;background:var(--tm-surface)}
.reference-state{display:flex;min-height:260px;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:30px;border:1px dashed var(--tm-line);border-radius:14px;background:var(--tm-surface);color:var(--tm-muted);text-align:center;font-size:13px}.reference-state>i{color:var(--tm-blue);font-size:28px}.reference-state>b{color:var(--tm-ink);font-size:14px}
@media(max-width:900px){.reference-catalog-layout{grid-template-columns:1fr}.reference-filter-panel{position:static}.reference-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.reference-container{padding-inline:14px}.reference-page-heading h1{font-size:24px}.reference-products-toolbar{align-items:flex-start;flex-direction:column}.reference-product-grid{gap:9px}}
</style>
