<template>
  <div class="categories-page">
    <div class="cat-container">
      <div class="cat-head">
        <h1>دسته بندی محصولات</h1>
        <Breadcrumb :home="home" :model="items" class="cat-breadcrumb" />
      </div>

      <div v-if="loading" class="cat-state">
        <ProgressSpinner />
        <p class="cat-state-text">در حال دریافت دسته بندی ها...</p>
      </div>

      <div v-else-if="error" class="cat-state">
        <i class="pi pi-exclamation-circle cat-error-icon"></i>
        <h3 class="cat-error-title">خطا</h3>
        <p class="cat-error-text">{{ error }}</p>
      </div>

      <div v-else>
        <div class="cat-grid">
          <Card
            v-for="category in categories"
            :key="category.id"
            class="category-card"
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
    </div>
  </div>
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
  margin-bottom: 1.5rem;
}

.cat-head h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.cat-breadcrumb {
  margin-top: 0.5rem;
}

.cat-state {
  text-align: center;
  padding: 2rem 0;
}

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
  grid-template-columns: 1fr;
  gap: 1.5rem;
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
  transition: all 0.2s ease;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--ds-shadow-lg);
}

.cat-thumb {
  aspect-ratio: 16 / 9;
  background: var(--surface-ground);
  border-radius: var(--content-border-radius);
  margin-bottom: 1rem;
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
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.cat-desc {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}

.cat-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
