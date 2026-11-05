<template>
  <main class="products-page" aria-labelledby="products-page-title">

    <WorkspacePageHeading
      eyebrow="بازارگاه تجهیزات مخابراتی"
      title="محصولات"
      description="محصولات را با جستجو، دسته‌بندی و محدوده قیمت پیدا کنید."
      icon="pi pi-box"
      heading-id="products-page-title"
    >
      <template #actions>
        <span class="tm-pill tm-pill--accent">
          <i class="pi pi-check-circle" aria-hidden="true"></i>
          فقط محصولات منتشرشده
        </span>
      </template>
    </WorkspacePageHeading>

    <!-- Two Column Layout: Filters (right) + Products (left) -->
    <div class="products-grid-layout">

      <!-- Right: Filters Sidebar -->
      <aside class="filters-sidebar" aria-label="فیلتر محصولات">
        <TemPanel title="فیلتر محصولات" subtitle="نتایج را دقیق‌تر محدود کنید" icon="pi pi-filter">

          <!-- Search -->
          <div class="filter-group">
            <label for="product-search">جستجو</label>
            <div class="filter-search">
              <InputText
                id="product-search"
                v-model="searchQuery"
                placeholder="نام محصول..."
                @keyup.enter="applyFilters"
                class="w-full"
              />
              <Button icon="pi pi-search" aria-label="اجرای جستجو" @click="applyFilters" />
            </div>
          </div>

          <!-- Category -->
          <div class="filter-group">
            <label for="product-category">دسته‌بندی</label>
            <Select
              inputId="product-category"
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
            <label>محدوده قیمت</label>
            <div class="price-range">
              <InputNumber
                inputId="minimum-price"
                aria-label="حداقل قیمت"
                v-model="minPrice"
                placeholder="از"
                class="w-full"
                @keyup.enter="applyFilters"
              />
              <span class="price-separator">تا</span>
              <InputNumber
                inputId="maximum-price"
                aria-label="حداکثر قیمت"
                v-model="maxPrice"
                placeholder="تا"
                class="w-full"
                @keyup.enter="applyFilters"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="filter-actions">
            <Button label="اعمال فیلتر" icon="pi pi-filter" class="w-full" @click="applyFilters" />
            <Button label="پاک کردن" icon="pi pi-times" severity="secondary" text class="w-full" @click="resetFilters" />
          </div>
        </TemPanel>
      </aside>

      <!-- Left: Products -->
      <section class="products-main" aria-label="فهرست محصولات" aria-live="polite" :aria-busy="loading">

        <!-- Loading -->
        <div v-if="loading" class="state-box" role="status">
          <ProgressSpinner />
          <p>در حال دریافت محصولات...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-box error" role="alert">
          <i class="pi pi-exclamation-circle"></i>
          <h3>خطا</h3>
          <p>{{ error }}</p>
        </div>

        <!-- Empty -->
        <div v-else-if="products.length === 0" class="state-box" role="status">
          <i class="pi pi-search"></i>
          <h3>هیچ محصولی یافت نشد</h3>
          <p>با فیلترهای فعلی هیچ محصولی یافت نشد</p>
          <Button label="حذف فیلترها" icon="pi pi-times" severity="secondary" text @click="resetFilters" />
        </div>

        <!-- Products Grid -->
        <template v-else>
          <div class="products-results-heading">
            <div class="products-count">
              <span class="products-count-number">{{ totalItems.toLocaleString('fa-IR') }}</span>
              <span>محصول در کاتالوگ</span>
            </div>
            <span class="products-results-context">
              <i class="pi pi-sliders-h" aria-hidden="true"></i>
              {{ filters.category ? 'فیلترشده بر اساس دسته‌بندی' : 'همه دسته‌بندی‌ها' }}
            </span>
          </div>

          <div class="products-grid">
            <router-link
              v-for="product in products"
              :key="product.id"
              :to="{ name: 'product-details', params: { id: product.id } }"
              class="product-card"
              :aria-label="'مشاهده جزئیات ' + product.title"
            >
              <div class="product-image">
                <img
                  v-if="getProductImage(product)?.url"
                  :src="getProductImage(product).url"
                  :alt="product.title"
                  width="640"
                  height="480"
                  loading="lazy"
                  decoding="async"
                />
                <div v-else class="empty-image">
                  <i class="pi pi-image"></i>
                </div>
                <span v-if="product.category?.nameFa || product.category?.name" class="product-category-badge">
                  {{ product.category.nameFa || product.category.name }}
                </span>
                <span v-if="product.prices && product.prices[0]" class="product-price-badge">
                  {{ formatPrice(product.prices[0].price) }}
                </span>
              </div>
              <div class="product-info">
                <div class="product-identity">
                  <h3 class="product-title">{{ product.title }}</h3>
                  <span v-if="product.company?.isVerified" class="product-verified" title="شرکت تأیید شده">
                    <i class="pi pi-verified" aria-hidden="true"></i> تأمین‌کننده تأییدشده
                  </span>
                </div>
                <p v-if="product.company?.name" class="product-company"><i class="pi pi-building" aria-hidden="true"></i>{{ product.company.name }}</p>
                <div v-if="product.brand || product.model || product.sku" class="product-meta">
                  <span v-if="product.brand"><i class="pi pi-tag" aria-hidden="true"></i>{{ product.brand }}</span>
                  <span v-if="product.model"><i class="pi pi-box" aria-hidden="true"></i>{{ product.model }}</span>
                  <span v-if="product.sku" class="product-sku"><i class="pi pi-hashtag" aria-hidden="true"></i>{{ product.sku }}</span>
                </div>
                <p v-if="product.shortDescription" class="product-desc">{{ product.shortDescription }}</p>
                <div class="product-card-footer">
                  <span v-if="product.prices?.length" class="product-card-price">
                    <small>شروع قیمت از</small>
                    <strong>{{ formatPrice(product.prices[0].price) }}</strong>
                  </span>
                  <span v-else class="product-card-price product-card-price--inquiry">
                    <small>قیمت</small>
                    <strong>استعلام از تأمین‌کننده</strong>
                  </span>
                  <span class="product-card-link">جزئیات محصول <i class="pi pi-arrow-left" aria-hidden="true"></i></span>
                </div>
              </div>
            </router-link>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination-wrap">
            <Paginator
              aria-label="صفحه‌بندی محصولات"
              :rows="filters.limit"
              :totalRecords="totalItems"
              :rowsPerPageOptions="[24, 48, 96]"
              @page="onPageChange"
            />
          </div>
        </template>
      </section>
    </div>
  </main>
</template>

<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import TemPanel from '@telecom/shared-ui/components/ui/TemPanel.vue'
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import Paginator from 'primevue/paginator'

const route = useRoute()
const productsStore = useProductsStore()

const products = ref([])
const loading = ref(false)
const error = ref(null)
const totalPages = ref(1)
const totalItems = ref(0)

const searchQuery = ref('')
const selectedCategory = ref(null)
const minPrice = ref(null)
const maxPrice = ref(null)

const filters = ref({
  search: '',
  category: null,
  minPrice: null,
  maxPrice: null,
  page: 1,
  limit: 24
})

const categoryOptions = ref([{ id: null, name: 'همه دسته‌ها' }])

onMounted(async () => {
  if (route.query.category) {
    const categoryId = Number(route.query.category)
    selectedCategory.value = Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null
    filters.value.category = selectedCategory.value
  }
  await Promise.all([loadCategories(), loadProducts()])
})

const loadCategories = async () => {
  try {
    const data = await productsStore.getCategories()
    categoryOptions.value = [{ id: null, name: 'همه دسته‌ها' }, ...(data || []).map((category) => ({
      ...category,
      name: category.nameFa || category.nameEn || category.name || category.slug,
    }))]
  } catch (err) {
    console.error('Error loading categories:', err)
  }
}

const loadProducts = async () => {
  try {
    loading.value = true
    error.value = null
    const params = {
      page: filters.value.page,
      limit: filters.value.limit,
      status: 'PUBLISHED'
    }
    if (filters.value.search) params.search = filters.value.search
    if (filters.value.category) params.categoryId = Number(filters.value.category)
    if (filters.value.minPrice) params.minPrice = Number(filters.value.minPrice)
    if (filters.value.maxPrice) params.maxPrice = Number(filters.value.maxPrice)

    const result = await productsStore.getProducts(params) || {}
    // getProducts() returns { data, meta } from apiGetPaginated(); `data` is
    // the product array and pagination totals live under `meta`.
    const list = Array.isArray(result.data)
      ? result.data
      : (result.data?.products ?? result.data?.items ?? result.products ?? result.items ?? [])
    products.value = Array.isArray(list) ? list : []
    totalPages.value = result.meta?.totalPages ?? result.totalPages ?? 1
    totalItems.value = result.meta?.total ?? result.total ?? products.value.length
  } catch (err) {
    error.value = 'خطا در دریافت محصولات'
    products.value = []
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  filters.value = {
    search: searchQuery.value,
    category: selectedCategory.value,
    minPrice: minPrice.value,
    maxPrice: maxPrice.value,
    page: 1,
    limit: 24
  }
  loadProducts()
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = null
  minPrice.value = null
  maxPrice.value = null
  filters.value = { search: '', category: null, minPrice: null, maxPrice: null, page: 1, limit: 24 }
  loadProducts()
}

const onPageChange = (event) => {
  filters.value.page = event.page + 1
  filters.value.limit = event.rows
  loadProducts()
}

const getProductImage = (product) => (
  product?.images?.find((image) => image?.isPrimary && image?.url)
  || product?.images?.find((image) => image?.url)
  || null
)

const formatPrice = (price) => {
  return new Intl.NumberFormat('fa-IR', { style: 'currency', currency: 'IRR' }).format(price)
}

watch(() => route.query.category, (newVal) => {
  const parsed = Number(newVal)
  const categoryId = newVal && Number.isInteger(parsed) && parsed > 0 ? parsed : null
  selectedCategory.value = categoryId
  filters.value.category = categoryId
  filters.value.page = 1
  loadProducts()
})
</script>

<style scoped>
.products-page {
  direction: rtl;
  width: 100%;
  max-width: min(100%, 1920px);
  margin-inline: auto;
  padding-inline: clamp(14px, 2vw, 28px);
}

/* Two Column Layout */
.products-grid-layout {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

/* Filters Sidebar */
.filters-sidebar {
  position: sticky;
  top: 5rem;
  align-self: start;
  min-width: 0;
}
.filter-group { margin-bottom: 14px; }
.filter-group:last-of-type { margin-bottom: 0; }
.filter-group label {
  display: block;
  margin-bottom: 6px;
  color: var(--tm-ink-soft);
  font-size: var(--tm-fs-tiny);
  font-weight: 600;
}
.filter-search { display: flex; align-items: stretch; gap: 6px; }
.filter-search :deep(.p-button) { flex: none; }
.price-range {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 6px;
}
.price-separator {
  color: var(--tm-muted);
  font-size: var(--tm-fs-tiny);
}
.filter-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--tm-line);
}

/* Results */
.products-main { min-height: 400px; min-width: 0; }
.products-results-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}
.products-count {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  color: var(--tm-muted);
  font-size: var(--tm-fs-sm);
}
.products-count-number {
  color: var(--tm-ink);
  font-size: var(--tm-fs-h2);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.products-results-context {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--tm-muted);
  font-size: var(--tm-fs-tiny);
}

/* Products Grid */
 .products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
  gap: 18px;
}

.product-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #eceef5;
  border-radius: 4px;
  background: var(--tm-surface);
  box-shadow: 0 1px 3px rgba(20,20,60,.04);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}
.product-card:hover {
  transform: none;
  border-color: #dcd7fb;
  box-shadow: 0 4px 12px rgba(20,20,60,.08);
}
.product-card:focus-visible { outline: 2px solid var(--tm-cyan-strong); outline-offset: 2px; }

.product-image {
  position: relative;
  aspect-ratio: 5 / 4;
  background: #f4f5fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.product-image img { width: 100%; height: 100%; object-fit: contain; padding: 10px; }
.empty-image { display: grid; place-items: center; width: 100%; height: 100%; }
.empty-image i { font-size: 28px; color: var(--tm-faint); }

.product-category-badge {
  position: absolute;
  top: 10px;
  inset-inline-start: 10px;
  max-width: calc(100% - 20px);
  padding: 4px 9px;
  border: 1px solid var(--tm-line);
  border-radius: 3px;
  background: var(--tm-surface);
  color: var(--tm-ink);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
  white-space: normal;
  overflow-wrap: anywhere;
}
.product-price-badge {
  position: absolute;
  bottom: 10px;
  inset-inline-end: 10px;
  padding: 5px 9px;
  border-radius: var(--tm-radius);
  background: var(--tm-navy);
  color: #fff;
  font-size: 11.5px;
  font-weight: 700;
}

.product-info {
  display: flex;
  flex: 1;
  min-height: 12.5rem;
  flex-direction: column;
  padding: 12px 12px 10px;
}
.product-identity { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.product-title {
  flex: 1;
  min-width: 0;
  margin: 0 0 4px;
  color: var(--tm-ink);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.product-verified {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: var(--tm-radius-pill);
  background: var(--tm-green-soft);
  color: #0c8a6e;
  font-size: 10px;
  font-weight: 700;
}
.product-company {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 3px 0;
  color: var(--tm-muted);
  font-size: 11.5px;
}
.product-company i { color: var(--tm-blue); font-size: 11px; }
.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin: 4px 0 6px;
  color: var(--tm-muted);
  font-size: 10.5px;
}
.product-meta span { display: inline-flex; align-items: center; gap: 3px; }
.product-meta i { color: var(--tm-blue); font-size: 10px; }
.product-sku { direction: ltr; unicode-bidi: isolate; }
.product-desc {
  margin: 0;
  color: var(--tm-muted);
  font-size: 11.5px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.product-card-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--tm-line);
}
.product-card-price { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.product-card-price small { color: var(--tm-muted); font-size: 10.5px; }
.product-card-price strong { color: var(--tm-ink); font-size: 12.5px; line-height: 1.5; }
.product-card-price--inquiry strong { color: var(--tm-blue); font-size: 11.5px; }
.product-card-link {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  color: var(--tm-blue);
  font-size: 11px;
  font-weight: 700;
}
.product-card-link i { transition: transform 0.15s ease; }
.product-card:hover .product-card-link i { transform: translateX(-3px); }

/* State boxes */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 20rem;
  padding: 40px 16px;
  border: 1px dashed var(--tm-line-strong);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
  color: var(--tm-muted);
  text-align: center;
}
.state-box i { font-size: 28px; color: var(--tm-faint); }
.state-box h3 { margin: 0; color: var(--tm-ink); font-size: 15px; }
.state-box p { margin: 0; font-size: 13px; }
.state-box.error i { color: var(--tm-red); }

/* Pagination */
.pagination-wrap {
  margin-top: 18px;
  overflow: hidden;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
}

@media (max-width: 900px) {
  .products-grid-layout { grid-template-columns: minmax(0, 1fr); }
  .filters-sidebar { position: static; order: -1; }
}
@media (min-width: 1600px) {
  .products-grid { grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); gap: 20px; }
}
@media (min-width: 2200px) {
  .products-page { padding-inline: clamp(24px, 2.2vw, 48px); }
  .products-grid { grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr)); gap: 22px; }
}
@media (max-width: 576px) {
  .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .product-info { min-height: 12rem; padding: 10px; }
  .product-title { font-size: 12.5px; }
  .product-company, .product-desc { font-size: 10.5px; }
  .product-price-badge { font-size: 10px; }
  .product-verified { display: none; }
  .product-card-footer { align-items: flex-start; flex-direction: column; gap: 4px; }
}
@media (max-width: 360px) {
  .products-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .product-card:hover { transform: none; }
  .product-card:hover .product-card-link i { transform: none; }
}
</style>