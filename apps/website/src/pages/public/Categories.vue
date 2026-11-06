<script setup>
import { ref, onMounted } from 'vue'
import { useProductsStore } from '../../stores/products'
import StoreCategoryCard from '@telecom/shared-ui/components/store/StoreCategoryCard.vue'
import ProgressSpinner from 'primevue/progressspinner'

const productsStore = useProductsStore()
const categories = ref([])
const loading = ref(false)
const error = ref(null)

function categoryIcon(category) {
  const name = [category?.nameFa, category?.name, category?.nameEn, category?.slug].filter(Boolean).join(' ').toLowerCase()
  if (name.includes('فیبر') || name.includes('fiber') || name.includes('fibre')) return 'pi pi-share-alt'
  if (name.includes('شبکه') || name.includes('data')) return 'pi pi-sitemap'
  if (name.includes('موبایل') || name.includes('mobile')) return 'pi pi-mobile'
  if (name.includes('رادیو') || name.includes('آنتن') || name.includes('radio')) return 'pi pi-wifi'
  if (name.includes('انتقال') || name.includes('transmission')) return 'pi pi-arrows-h'
  if (name.includes('ماهواره') || name.includes('satellite')) return 'pi pi-globe'
  return 'pi pi-box'
}

onMounted(loadCategories)

async function loadCategories() {
  try {
    loading.value = true
    error.value = null
    const data = await productsStore.getCategories()
    categories.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = 'دریافت دسته‌بندی‌ها ناموفق بود. دوباره تلاش کنید.'
    console.error('Error loading categories:', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="reference-categories-page" dir="rtl">
    <div class="reference-categories-container">
      <nav class="reference-breadcrumb" aria-label="مسیر صفحه">
        <router-link :to="{ name: 'home' }">صفحه اصلی</router-link>
        <i class="pi pi-angle-left" aria-hidden="true" />
        <span>همه دسته‌بندی‌ها</span>
      </nav>

      <header class="reference-page-heading">
        <h1>همه دسته‌بندی‌ها</h1>
        <p>تجهیزات را بر اساس حوزه کاربرد مرور کنید</p>
      </header>

      <div v-if="loading" class="reference-categories-state" role="status"><ProgressSpinner /><span>در حال دریافت دسته‌بندی‌ها…</span></div>
      <div v-else-if="error" class="reference-categories-state" role="alert"><i class="pi pi-exclamation-circle" /><span>{{ error }}</span><button type="button" @click="loadCategories">تلاش دوباره</button></div>
      <div v-else-if="!categories.length" class="reference-categories-state"><i class="pi pi-folder-open" /><span>دسته‌بندی فعالی برای نمایش وجود ندارد.</span></div>
      <section v-else class="reference-category-grid" aria-label="همه دسته‌بندی‌های محصولات">
        <StoreCategoryCard v-for="category in categories" :key="category.id" variant="panel" :category="category" :icon="categoryIcon(category)" :to="{ name: 'products', query: { category: category.id } }" />
      </section>
    </div>
  </main>
</template>

<style scoped>
.reference-categories-page{--tm-canvas:#f4f5fa;--tm-surface:#fff;--tm-ink:#12182b;--tm-muted:#6b7390;--tm-line:#e4e7f2;--tm-blue:#6c5ce7;--tm-cyan:#2aa7e8;--tm-chip:#eceaff;--tm-card-shadow:0 2px 10px rgba(20,30,70,.06);min-height:60vh;background:var(--tm-canvas);color:var(--tm-ink);font-family:Vazirmatn,Tahoma,sans-serif}
.reference-categories-container{width:100%;max-width:1240px;margin-inline:auto;padding:0 20px 40px}
.reference-breadcrumb{display:flex;align-items:center;gap:7px;padding:18px 0 4px;color:var(--tm-muted);font-size:13px}.reference-breadcrumb a{color:var(--tm-blue);text-decoration:none}.reference-breadcrumb i{font-size:11px}
.reference-page-heading{padding:6px 0 4px}.reference-page-heading h1{margin:0;color:var(--tm-ink);font-size:28px;line-height:1.6;font-weight:800}.reference-page-heading p{margin:0;color:var(--tm-muted);font-size:14px}
.reference-category-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:18px 0}
.reference-category-grid :deep(.store-category-card){border:0;border-radius:16px;background:var(--tm-surface);box-shadow:var(--tm-card-shadow)}
.reference-categories-state{display:flex;min-height:250px;flex-direction:column;align-items:center;justify-content:center;gap:10px;margin-top:18px;padding:30px;border:1px dashed var(--tm-line);border-radius:14px;background:var(--tm-surface);color:var(--tm-muted);text-align:center;font-size:13px}
.reference-categories-state>i{color:var(--tm-blue);font-size:28px}.reference-categories-state button{border:0;background:transparent;color:var(--tm-blue);font:inherit;font-weight:700;cursor:pointer}
@media(max-width:900px){.reference-category-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.reference-categories-container{padding-inline:14px}.reference-page-heading h1{font-size:24px}.reference-category-grid{grid-template-columns:1fr;gap:10px}}
</style>
