<template>
  <main class="categories-page" aria-labelledby="categories-title">
    <div class="cat-container">
      <WorkspacePageHeading
        eyebrow="بازارگاه تجهیزات مخابراتی"
        title="دسته‌بندی محصولات"
        description="برای پیدا کردن تجهیزات موردنیاز، دسته‌بندی مناسب را انتخاب کنید."
        icon="pi pi-th-large"
        heading-id="categories-title"
      >
        <template #actions>
          <span class="tm-pill tm-pill--neutral">
            <i class="pi pi-folder" aria-hidden="true"></i>
            {{ categories.length.toLocaleString('fa-IR') }} دسته‌بندی
          </span>
        </template>
      </WorkspacePageHeading>

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

      <section v-else class="cat-grid" aria-label="دسته‌بندی محصولات">
        <router-link
          v-for="category in categories"
          :key="category.id"
          :to="{ name: 'products', query: { category: category.id } }"
          class="category-card"
          :aria-label="'مشاهده محصولات دسته ' + (category.nameFa || category.nameEn || category.slug)"
        >
          <div class="cat-thumb">
            <img
              v-if="category.image"
              :src="category.image"
              :alt="category.nameFa || category.nameEn || category.slug"
              width="640"
              height="360"
              loading="lazy"
              decoding="async"
              class="cat-thumb-img"
            />
            <div v-else class="cat-thumb-placeholder"><i class="pi pi-folder" aria-hidden="true"></i></div>
          </div>
          <h3 class="cat-name">{{ category.nameFa || category.nameEn || category.slug }}</h3>
          <p v-if="category.description" class="cat-desc">{{ category.description }}</p>
          <div class="cat-footer-row">
            <Badge :value="category.productCount == null ? '—' : Number(category.productCount).toLocaleString('fa-IR')" severity="info" />
            <span class="cat-link">مشاهده محصولات <i class="pi pi-arrow-left" aria-hidden="true"></i></span>
          </div>
        </router-link>
      </section>
    </div>
  </main>
</template>

<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { ref, onMounted } from 'vue'
import { useProductsStore } from '../../stores/products'
import Badge from 'primevue/badge'
import ProgressSpinner from 'primevue/progressspinner'

const productsStore = useProductsStore()

const categories = ref([])
const loading = ref(false)
const error = ref(null)

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
</script>

<style scoped>
.categories-page { direction: rtl; }

.cat-container {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding-inline: clamp(14px, 2vw, 28px);
}

.cat-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 16rem;
  padding: 40px 16px;
  border: 1px dashed var(--tm-line-strong);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
  color: var(--tm-muted);
  text-align: center;
}
.cat-state h2 { margin: 0; color: var(--tm-ink); font-size: var(--tm-fs-title); }
.cat-state p { margin: 0; font-size: var(--tm-fs-sm); }
.cat-empty-icon { font-size: 28px; color: var(--tm-faint); }
.cat-state-text { margin-top: 6px; color: var(--tm-muted); }
.cat-error-icon { font-size: 28px; color: var(--tm-red); }
.cat-error-title { font-size: var(--tm-fs-title); margin: 0; }
.cat-error-text { color: var(--tm-muted); }

.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: 14px;
}
@media (min-width: 992px) {
  .cat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

.category-card {
  display: flex;
  min-width: 0;
  height: 100%;
  flex-direction: column;
  padding: 12px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
  color: var(--tm-ink);
  text-decoration: none;
  box-shadow: var(--tm-shadow-xs);
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}
.category-card:hover {
  transform: translateY(-2px);
  border-color: var(--tm-line-strong);
  box-shadow: var(--tm-shadow-sm);
}
.category-card:focus-visible { outline: 2px solid var(--tm-cyan-strong); outline-offset: 2px; }

.cat-thumb {
  aspect-ratio: 16 / 9;
  margin-bottom: 12px;
  border-radius: var(--tm-radius);
  background: var(--tm-surface-alt);
  overflow: hidden;
}
.cat-thumb-img { width: 100%; height: 100%; object-fit: cover; }
.cat-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--tm-faint);
  font-size: 26px;
}

.cat-name {
  margin: 0 0 4px;
  color: var(--tm-ink);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.55;
  overflow-wrap: anywhere;
}
.cat-desc {
  margin: 0 0 10px;
  color: var(--tm-muted);
  font-size: 12px;
  line-height: 1.8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cat-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--tm-line);
}
.cat-link { color: var(--tm-blue); font-size: 11.5px; font-weight: 700; }

@media (prefers-reduced-motion: reduce) {
  .category-card:hover { transform: none; }
}
</style>