<template>
  <main class="products-page ds-page" aria-labelledby="products-page-title">

    <!-- Breadcrumb as page title -->
    <WorkspacePageHeading
      eyebrow="بازارگاه تجهیزات مخابراتی"
      title="محصولات"
      description="محصولات را با جستجو، دسته‌بندی و محدوده قیمت پیدا کنید."
      icon="pi pi-box"
      heading-id="products-page-title"
    >
      <template #actions><Breadcrumb :home="home" :model="items" class="breadcrumb-wrap" /></template>
    </WorkspacePageHeading>

    <!-- Two Column Layout: Filters (right) + Products (left) -->
    <div class="products-grid-layout">

      <!-- Right: Filters Sidebar -->
      <aside class="filters-sidebar" aria-label="فیلتر محصولات">
        <Card class="filters-card ds-card">
          <template #content>
            <div class="filters-inner">
              <div class="filters-heading">
                <div class="filters-heading-icon"><i class="pi pi-sliders-h"></i></div>
                <div><h2>فیلتر محصولات</h2><p>نتایج را دقیق‌تر محدود کنید</p></div>
              </div>
              <!-- Search -->
              <div class="filter-group">
                <label for="product-search">جستجو</label>
                <div class="p-inputgroup">
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
            </div>
          </template>
        </Card>
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
            <span class="products-results-context"><i class="pi pi-check-circle"></i> فقط محصولات منتشرشده</span>
          </div>
          <div class="products-grid">
            <div
              v-for="product in products"
              :key="product.id"
              class="product-card"
              role="link"
              tabindex="0"
              :aria-label="`مشاهده جزئیات ${product.title}`"
              @click="goToProduct(product)"
              @keydown.enter.prevent="goToProduct(product)"
              @keydown.space.prevent="goToProduct(product)"
            >
              <div class="product-image">
                <img
                  v-if="getProductImage(product)?.url"
                  :src="getProductImage(product).url"
                  :alt="product.title"
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
                <p class="product-company"><i class="pi pi-building" aria-hidden="true"></i>{{ product.company?.name || 'تأمین‌کننده' }}</p>
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
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination-wrap">
            <Paginator
              aria-label="صفحه‌بندی محصولات"
              :rows="filters.limit"
              :totalRecords="totalItems"
              :rowsPerPageOptions="[12, 24, 48]"
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
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import Paginator from 'primevue/paginator'

const route = useRoute()
const router = useRouter()
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
  limit: 12
})

const home = ref({ icon: 'pi pi-home', to: '/' })
const items = ref([{ label: 'محصولات' }])

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
    limit: 12
  }
  loadProducts()
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = null
  minPrice.value = null
  maxPrice.value = null
  filters.value = { search: '', category: null, minPrice: null, maxPrice: null, page: 1, limit: 12 }
  loadProducts()
}

const onPageChange = (event) => {
  filters.value.page = event.page + 1
  filters.value.limit = event.rows
  loadProducts()
}

const goToProduct = (product) => {
  router.push({ name: 'product-details', params: { id: product.id } })
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
  background:
    radial-gradient(ellipse at 8% 0%, color-mix(in srgb, var(--ds-color-primary) 6%, transparent), transparent 32rem),
    var(--ds-color-background);
  max-width: var(--ds-container-max-wide);
  margin-inline: auto;
  padding-inline: var(--ds-container-pad);
  padding-block: var(--ds-space-6);
}

@media (min-width: 768px) {
  .products-page {
    padding-inline: var(--ds-container-pad-lg);
    padding-block: var(--ds-space-8);
  }
}

@media (min-width: 1920px) {
  .products-page {
    padding-inline: var(--ds-container-pad-xl);
  }
}

@media (min-width: 1920px) {
  .products-page {
    padding-inline: var(--ds-container-pad-xl);
  }
}

/* Page header */
.listing-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ds-space-4);
  margin-bottom: var(--ds-space-6);
}
.listing-heading-copy { min-width: 0; }
.listing-heading-copy .ds-h1 { margin: 0; }
.listing-heading-copy .ds-lead { max-width: 42rem; }
.breadcrumb-wrap { margin-top: var(--ds-space-2); }

/* Two Column Layout */
.products-grid-layout {
  display: grid;
  grid-template-columns: minmax(240px, 280px) 1fr;
  gap: var(--ds-space-6);
  align-items: start;
}

/* Filters Sidebar */
.filters-sidebar {
  position: sticky;
  top: 5rem;
  align-self: start;
}
.filters-card {
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-sm);
}
.filters-card :deep(.p-card-content) { padding: var(--ds-space-5); }
.filters-inner {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}
.filter-group label {
  display: block;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-muted);
  margin-bottom: var(--ds-space-2);
}
.price-range {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--ds-space-2);
}
.price-separator {
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
  text-align: center;
}
.filter-actions {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding-top: var(--ds-space-3);
  border-top: 1px solid var(--ds-color-border);
}

/* Products Main */
.products-main {
  min-height: 400px;
}
.products-count {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 2.5rem;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-muted);
  margin-bottom: var(--ds-space-3);
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
  gap: var(--ds-space-5);
}

.product-card {
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow var(--ds-transition), transform var(--ds-transition), border-color var(--ds-transition);
}
.product-card:hover,
.product-card:focus-visible {
  box-shadow: var(--ds-shadow-md);
  transform: translateY(-3px);
  border-color: var(--ds-color-primary);
}
.product-card:focus-visible {
  outline: 3px solid var(--ds-color-focus);
  outline-offset: 3px;
}

.product-image {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--surface-ground);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--ds-transition);
}
.product-card:hover .product-image img {
  transform: scale(1.05);
}
.empty-image i {
  font-size: 2.5rem;
  color: var(--text-color-secondary);
  opacity: 0.3;
}
.product-price-badge {
  position: absolute;
  bottom: 0.75rem;
  inset-inline-end: 0.75rem;
  background: var(--ds-color-brand-dark);
  color: var(--ds-color-on-brand);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
}

.product-info {
  padding: 0.75rem;
}
.product-title {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.product-company {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}
.product-desc {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* State boxes */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--text-color-secondary);
  text-align: center;
}
.state-box i { font-size: 2.5rem; opacity: 0.3; }
.state-box h3 { margin: 0; font-size: 1.1rem; color: var(--text-color); }
.state-box p { margin: 0; font-size: 0.9rem; }

/* Pagination */
.pagination-wrap {
  margin-top: var(--ds-space-6);
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}

/* Responsive */
@media (max-width: 900px) {
  .products-grid-layout {
    grid-template-columns: 1fr;
    gap: var(--ds-space-4);
  }
  .filters-sidebar {
    position: static;
    order: -1;
  }
}

@media (max-width: 576px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}

/* Catalog composition: compact filter rail and product-first results area. */
.products-page { padding-block: clamp(1.5rem, 3vw, 2.75rem); }
.listing-page-header {
  align-items: center;
  margin-bottom: 1.75rem;
  padding: clamp(1.25rem, 2.5vw, 2rem);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: linear-gradient(115deg, color-mix(in srgb, var(--ds-color-primary) 8%, var(--ds-color-surface)), var(--ds-color-surface));
  box-shadow: var(--ds-shadow-xs);
}
.listing-heading-copy .ds-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  margin-bottom: .55rem;
  color: var(--ds-color-primary);
  font-weight: var(--ds-font-weight-bold);
}
.listing-heading-copy .ds-h1 {
  color: var(--ds-color-brand-deep);
  font-size: clamp(1.6rem, 3vw, 2.25rem);
  font-weight: 850;
}
.listing-heading-copy .ds-lead { margin: .5rem 0 0; }
.breadcrumb-wrap { margin: 0; }
.filters-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  box-shadow: var(--ds-shadow-xs);
}
.filters-card::before {
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: 3px;
  background: var(--ds-color-primary);
  content: "";
}
.filters-card :deep(.p-card-content) { padding: 1.25rem; }
.filters-inner { gap: 1.2rem; }
.filters-heading {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ds-color-border);
}
.filters-heading-icon {
  display: grid;
  place-items: center;
  width: 2.65rem;
  height: 2.65rem;
  border-radius: .85rem;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
  font-size: 1.1rem;
}
.filters-heading h2 {
  margin: 0;
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-bold);
}
.filters-heading p {
  margin: .2rem 0 0;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
}
.filter-group label { color: var(--ds-color-text); font-weight: var(--ds-font-weight-semibold); }
.filter-group :deep(.p-inputtext),
.filter-group :deep(.p-inputnumber-input),
.filter-group :deep(.p-select) {
  width: 100%;
  min-height: 2.7rem;
  border-radius: var(--ds-radius-md);
}
.filter-actions :deep(.p-button) { min-height: 2.75rem; }
.filter-group :deep(.p-inputtext:focus-visible),
.filter-group :deep(.p-inputnumber-input:focus-visible),
.filter-group :deep(.p-select:focus-visible),
.filter-actions :deep(.p-button:focus-visible) {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 2px;
}
.filter-actions { gap: .6rem; }
.products-results-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: .75rem;
  margin-bottom: 1rem;
}
.products-count {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  min-height: 0;
  margin: 0;
  color: var(--ds-color-text-muted);
}
.products-count-number {
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-bold);
  font-variant-numeric: tabular-nums;
}
.products-results-context {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  color: var(--ds-color-success);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
}
.products-grid { grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr)); gap: 1.1rem; }
.product-card {
  position: relative;
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
  transition: transform var(--ds-transition), box-shadow var(--ds-transition), border-color var(--ds-transition);
}
.product-card:hover,
.product-card:focus-visible {
  transform: translateY(-4px);
  box-shadow: var(--ds-shadow-lg);
}
.product-card:focus-visible {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 3px;
}
.product-image {
  aspect-ratio: 5 / 4;
  background: linear-gradient(145deg, var(--ds-color-surface-alt), var(--ds-color-surface-hover));
}
.product-image img { object-fit: contain; padding: .75rem; }
.empty-image { display: grid; place-items: center; width: 100%; height: 100%; }
.empty-image i { opacity: .45; color: var(--ds-color-primary); }
.product-category-badge {
  position: absolute;
  top: .8rem;
  inset-inline-start: .8rem;
  max-width: calc(100% - 1.6rem);
  overflow: hidden;
  padding: .3rem .6rem;
  border: 1px solid color-mix(in srgb, var(--ds-color-primary) 18%, transparent);
  border-radius: var(--ds-radius-pill);
  background: color-mix(in srgb, var(--ds-color-surface) 92%, transparent);
  color: var(--ds-color-primary-text);
  font-size: .68rem;
  font-weight: var(--ds-font-weight-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
  backdrop-filter: blur(8px);
}
.product-price-badge {
  bottom: .8rem;
  inset-inline-end: .8rem;
  padding: .45rem .7rem;
  border: 1px solid rgba(255,255,255,.16);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--ds-shadow-sm);
  font-size: .8rem;
}
.product-info {
  display: flex;
  min-height: 13.5rem;
  flex-direction: column;
  padding: 1rem 1rem .85rem;
}
.product-identity { display: flex; align-items: flex-start; justify-content: space-between; gap: .5rem; }
.product-title {
  flex: 1;
  min-width: 0;
  font-size: .98rem;
  line-height: 1.7;
}
.product-verified {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: .25rem;
  padding: .22rem .4rem;
  border-radius: var(--ds-radius-pill);
  background: var(--ds-color-success-soft);
  color: var(--ds-color-success);
  font-size: .65rem;
  font-weight: var(--ds-font-weight-semibold);
}
.product-company {
  display: flex;
  align-items: center;
  gap: .4rem;
  margin: .35rem 0;
  color: var(--ds-color-text-muted);
}
.product-company i { color: var(--ds-color-primary); font-size: .75rem; }
.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: .35rem .65rem;
  margin: .3rem 0 .45rem;
  color: var(--ds-color-text-muted);
  font-size: .7rem;
}
.product-meta span { display: inline-flex; align-items: center; gap: .25rem; }
.product-meta i { color: var(--ds-color-primary); font-size: .68rem; }
.product-sku { direction: ltr; unicode-bidi: isolate; }
.product-desc { line-height: 1.8; }
.product-card-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: .65rem;
  margin-top: auto;
  padding-top: .85rem;
  border-top: 1px solid var(--ds-color-border);
}
.product-card-price { display: flex; min-width: 0; flex-direction: column; gap: .15rem; }
.product-card-price small { color: var(--ds-color-text-muted); font-size: .68rem; }
.product-card-price strong { color: var(--ds-color-text); font-size: .86rem; line-height: 1.5; }
.product-card-price--inquiry strong { color: var(--ds-color-primary); font-size: .78rem; }
.product-card-link {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: .35rem;
  min-height: 2.75rem;
  color: var(--ds-color-primary);
  font-size: .75rem;
  font-weight: var(--ds-font-weight-bold);
}
.product-card-link i { transition: transform var(--ds-transition-fast); }
.product-card:hover .product-card-link i { transform: translateX(-3px); }
.state-box {
  min-height: 20rem;
  border: 1px dashed var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
}
.pagination-wrap { margin-top: 1.5rem; }
.pagination-wrap :deep(.p-paginator-page),
.pagination-wrap :deep(.p-paginator-next),
.pagination-wrap :deep(.p-paginator-prev) {
  min-width: 2.75rem;
  min-height: 2.75rem;
}
@media (max-width: 900px) {
  .filters-sidebar { position: static; }
}
@media (max-width: 576px) {
  .listing-page-header { align-items: flex-start; }
  .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; }
   .product-info { min-height: 13rem; padding: .75rem; }
  .product-title { font-size: .84rem; }
  .product-company, .product-desc { font-size: .7rem; }
  .product-price-badge { font-size: .68rem; }
  .product-verified { font-size: .58rem; }
  .product-card-footer { align-items: flex-start; flex-direction: column; gap: .25rem; }
  .product-card-link { min-height: 2.5rem; }
}
@media (max-width: 360px) {
  .products-grid { grid-template-columns: 1fr; }
}

</style>
