<template>
  <main class="categories-page ds-page" aria-labelledby="categories-title">
    <div class="cat-container ds-container">
      <header class="cat-head">
        <div class="cat-heading-copy">
          <span class="ds-eyebrow">بازارگاه تجهیزات مخابراتی</span>
          <h1 id="categories-title" class="ds-h1">دسته‌بندی محصولات</h1>
          <p class="ds-lead">برای پیدا کردن تجهیزات موردنیاز، دسته‌بندی مناسب را انتخاب کنید.</p>
        </div>
        <Breadcrumb :home="home" :model="items" class="cat-breadcrumb" />
      </header>

      <div v-if="loading" class="cat-state" role="status" aria-live="polite">
        <ProgressSpinner />
        <p class="cat-state-text">در حال دریافت دسته بندی ها...</p>
      </div>

      <div v-else-if="error" class="cat-state" role="alert">
        <i class="pi pi-exclamation-circle cat-error-icon"></i>
        <h3 class="cat-error-title">خطا</h3>
        <p class="cat-error-text">{{ error }}</p>
      </div>

      <div v-else-if="categories.length === 0" class="cat-state" role="status">
        <i class="pi pi-folder-open cat-empty-icon"></i>
        <h2>دسته‌بندی‌ای موجود نیست</h2>
        <p>در حال حاضر دسته‌بندی فعالی برای نمایش وجود ندارد.</p>
      </div>

      <div v-else class="cat-grid" aria-label="دسته‌بندی محصولات">
          <Card
            v-for="category in categories"
            :key="category.id"
            class="category-card ds-card"
          >
            <template #content>
              <div class="cat-thumb">
                <img
                  v-if="category.image"
                  :src="category.image"
                  :alt="category.nameFa || category.nameEn || category.slug"
                  class="cat-thumb-img"
                />
                <div v-else class="cat-thumb-placeholder">
                  <i class="pi pi-folder"></i>
                </div>
              </div>
              <h3 class="cat-name">{{ category.nameFa || category.nameEn || category.slug }}</h3>
              <p v-if="category.description" class="cat-desc">{{ category.description }}</p>
              <div class="cat-footer-row">
                <Badge :value="(category.productCount || 0).toLocaleString('fa-IR')" severity="info" />
                <Button
                  label="مشاهده محصولات"
                  icon="pi pi-arrow-left"
                  class="p-button-outlined p-button-sm"
                  @click="viewCategoryProducts(category.id)"
                />
              </div>
            </template>
          </Card>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const productsStore = useProductsStore()

const categories = ref([])
const loading = ref(false)
const error = ref(null)

const home = ref({
  icon: 'pi pi-home',
  to: '/'
})

const items = ref([
  { label: 'دسته بندی ها', to: '/categories' }
])

onMounted(async () => {
  await loadCategories()
})

const loadCategories = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await productsStore.getCategories()
    categories.value = data
  } catch (err) {
    error.value = 'خطا در دریافت دسته بندی ها'
    console.error('Error loading categories:', err)
  } finally {
    loading.value = false
  }
}

const viewCategoryProducts = (categoryId) => {
  router.push({
    name: 'products',
    query: { category: categoryId }
  })
}
</script>

<style scoped>
.categories-page {
  direction: rtl;
  background:
    radial-gradient(ellipse at 8% 0%, color-mix(in srgb, var(--ds-color-primary) 6%, transparent), transparent 32rem),
    var(--ds-color-background);
}

.cat-container {
  max-width: var(--ds-container-max);
  margin: 0 auto;
  padding-inline: var(--ds-container-pad);
  padding-block: var(--ds-space-6);
}

@media (min-width: 768px) {
  .cat-container {
    padding-inline: var(--ds-container-pad-lg);
    padding-block: var(--ds-space-8);
  }
}

.cat-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ds-space-4);
  margin-bottom: var(--ds-space-6);
}

.cat-heading-copy { min-width: 0; }
.cat-heading-copy .ds-h1 { margin: 0; }
.cat-heading-copy .ds-lead { max-width: 42rem; }

.cat-breadcrumb {
  margin-top: var(--ds-space-2);
}

.cat-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-3);
  min-height: 16rem;
  padding: var(--ds-space-8) var(--ds-space-4);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  color: var(--ds-color-text-muted);
  text-align: center;
}
.cat-state h2 { margin: 0; color: var(--ds-color-text); }
.cat-state p { margin: 0; }
.cat-empty-icon { font-size: 2.5rem; }

.cat-state-text {
  margin-top: 1rem;
  color: var(--text-color-secondary);
}

.cat-error-icon {
  font-size: 2.5rem;
  color: var(--ds-color-danger);
  margin-bottom: 1rem;
}

.cat-error-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.cat-error-text {
  color: var(--text-color-secondary);
}

.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: var(--ds-space-5);
}

@media (min-width: 768px) {
  .cat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 992px) {
  .cat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.category-card {
  height: 100%;
  border-radius: var(--ds-radius-xl);
  overflow: hidden;
  transition: box-shadow var(--ds-transition), transform var(--ds-transition), border-color var(--ds-transition);
}

.category-card:hover {
  transform: translateY(-3px);
  border-color: var(--ds-color-primary);
  box-shadow: var(--ds-shadow-md);
}

.cat-thumb {
  aspect-ratio: 16 / 9;
  background: var(--ds-color-background);
  border-radius: var(--ds-radius-lg);
  margin-bottom: var(--ds-space-4);
  overflow: hidden;
}

.cat-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cat-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-thumb-placeholder i {
  font-size: 2.5rem;
  color: var(--text-color-secondary);
}

.cat-name {
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-bold);
  line-height: var(--ds-line-height-tight);
  margin: 0 0 var(--ds-space-2) 0;
  color: var(--ds-color-text);
  overflow-wrap: anywhere;
}

.cat-desc {
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-relaxed);
  margin: 0 0 var(--ds-space-4) 0;
}

.cat-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
}
.category-card :deep(.p-card-content) { height: 100%; }
.category-card :deep(.p-button) { min-height: var(--ds-touch-target); }
.category-card:focus-within {
  outline: 3px solid var(--ds-color-focus);
  outline-offset: 3px;
}
</style>
