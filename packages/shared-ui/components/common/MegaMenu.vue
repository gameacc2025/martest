<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  categories: { type: Array, default: () => [] },
})

const router = useRouter()

const activeCategory = ref(null)
const isMenuOpen = ref(false)
const menuRef = ref(null)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    activeCategory.value = null
    isMenuOpen.value = false
  }
}

function setActiveCategory(cat) {
  activeCategory.value = cat
}

function closeMenu() {
  isMenuOpen.value = false
  activeCategory.value = null
}

function toggleMenu() {
  if (isMenuOpen.value) closeMenu()
  else isMenuOpen.value = true
}

function goToCategory(categoryId) {
  activeCategory.value = null
  isMenuOpen.value = false
  router.push({ name: 'products', query: { category: String(categoryId) } })
}

function goToSubcategory(categoryId, subcategoryId) {
  activeCategory.value = null
  isMenuOpen.value = false
  router.push({ name: 'products', query: { category: String(subcategoryId || categoryId) } })
}

function categoryIcon(category) {
  const label = String(category?.nameFa || category?.slug || '').toLowerCase()
  if (/فیبر|نوری|fiber/.test(label)) return 'pi pi-share-alt'
  if (/شبکه|سوئیچ|روتر|network|switch|router/.test(label)) return 'pi pi-sitemap'
  if (/آنتن|بی.?سیم|wireless|antenna/.test(label)) return 'pi pi-wifi'
  if (/کابل|cable/.test(label)) return 'pi pi-bolt'
  if (/برق|باتری|power|ups/.test(label)) return 'pi pi-battery-full'
  if (/تلفن|مخابرات|phone/.test(label)) return 'pi pi-phone'
  return 'pi pi-tag'
}
</script>

<template>
  <div class="mega-menu-wrapper" ref="menuRef" @keydown.esc.stop.prevent="closeMenu">
    <!-- Trigger Button -->
    <button type="button" class="mega-trigger" :aria-expanded="isMenuOpen" aria-haspopup="true" aria-controls="mega-dropdown" @click="toggleMenu">
      <i class="pi pi-th-large" aria-hidden="true"></i>
      <span>دسته‌بندی محصولات</span>
    </button>

    <!-- Dropdown -->
    <Transition name="mega">
      <div v-if="isMenuOpen" id="mega-dropdown" class="mega-dropdown" role="region" aria-label="دسته‌بندی‌های محصولات">
        <div class="mega-content">
          <!-- Category List (right side in RTL) -->
          <div v-if="props.categories.length" class="mega-categories">
            <button
              v-for="cat in props.categories"
              :key="cat.id"
              type="button"
              class="mega-cat-item"
              :class="{ 'is-active': activeCategory?.id === cat.id }"
              :aria-pressed="activeCategory?.id === cat.id"
              @mouseenter="setActiveCategory(cat)"
              @focus="setActiveCategory(cat)"
              @click="setActiveCategory(cat)"
            >
              <i :class="categoryIcon(cat)" class="mega-cat-icon" aria-hidden="true"></i>
              <span class="mega-cat-name">{{ cat.nameFa || cat.name || cat.nameEn }}</span>
              <i class="pi pi-chevron-left mega-cat-chevron" aria-hidden="true"></i>
            </button>
          </div>
          <div v-else class="mega-categories-empty">دسته‌بندی‌ای برای نمایش وجود ندارد.</div>

          <!-- Subcategory Panel -->
          <div class="mega-subcats">
            <template v-if="activeCategory">
              <div class="mega-subcat-header">
                <h3>{{ activeCategory.nameFa || activeCategory.name || activeCategory.nameEn }}</h3>
                <button class="mega-view-all" @click="goToCategory(activeCategory.id)">
                  مشاهده همه
                </button>
              </div>
              <div class="mega-subcat-grid">
                <button
                  v-for="sub in activeCategory.subcategories"
                  :key="sub.id"
                  type="button"
                  class="mega-subcat-item"
                  @click="goToSubcategory(activeCategory.id, sub.id)"
                >
                  <span class="mega-subcat-name">{{ sub.nameFa || sub.name || sub.nameEn }}</span>
                </button>
              </div>
            </template>
            <div v-else class="mega-subcat-empty">
              <i class="pi pi-th-large"></i>
              <span>یک دسته را انتخاب کنید</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.mega-menu-wrapper {
  position: relative;
}

.mega-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--content-border-radius);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.mega-trigger:hover {
  background: var(--p-primary-600);
}

/* Dropdown */
.mega-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  inset-inline-start: 0;
  width: 700px;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  box-shadow: var(--ds-shadow-lg);
  z-index: 1000;
  overflow: hidden;
}

.mega-content {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 360px;
}

/* Categories list */
.mega-categories {
  border-inline-end: 1px solid var(--surface-border);
  overflow-y: auto;
  max-height: 400px;
}

.mega-cat-item {
  width:calc(100% - .75rem);
  border:0;
  background:transparent;
  text-align:start;
  font:inherit;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 0.85rem;
  color: var(--text-color);
}

 .mega-cat-item:hover,.mega-cat-item:focus-visible,
.mega-cat-item.is-active {
  background: var(--surface-hover);
}

.mega-cat-item.is-active {
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
  color: var(--primary-color);
  font-weight: 600;
}

.mega-cat-icon { flex: 0 0 18px; color: var(--ds-color-primary-text, var(--primary-color)); font-size: 14px; }
.mega-cat-name { flex: 1; }
.mega-cat-chevron{font-size:10px;color:var(--tm-muted)}
.mega-categories-empty{padding:22px;color:var(--tm-muted);font-size:12px}

/* Subcategories panel */
.mega-subcats {
  padding: 1rem;
  overflow-y: auto;
  max-height: 400px;
}

.mega-subcat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--surface-border);
}

.mega-subcat-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--primary-color);
}

.mega-view-all {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.mega-view-all:hover {
  text-decoration: underline;
}

.mega-subcat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.mega-subcat-item {
  width:100%;
  border:0;
  background:transparent;
  text-align:start;
  font:inherit;
  padding: 0.5rem 0.75rem;
  border-radius: var(--content-border-radius);
  cursor: pointer;
  transition: background 0.15s;
  font-size: 0.825rem;
  color: var(--text-color);
}

 .mega-subcat-item:hover,.mega-subcat-item:focus-visible {
  background: var(--surface-hover);
  color: var(--primary-color);
}

.mega-subcat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  gap: 0.5rem;
}

/* Transition */
.mega-enter-active,
.mega-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.mega-enter-from,
.mega-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 767px) {
  .mega-dropdown {
    position: fixed;
    top: 4rem;
    inset-inline-start: 0;
    inset-inline-end: 0;
    width: auto;
    border-radius: 0;
    max-height: calc(100vh - 4rem);
  }

  .mega-content {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .mega-categories {
    border-inline-end: none;
    border-bottom: 1px solid var(--surface-border);
    max-height: 200px;
  }

  .mega-subcat-grid {
    grid-template-columns: 1fr;
  }
}

/* Production-safe visual refresh: preserve existing menu data and routing contract. */
.mega-menu-wrapper {
  position: relative;
}

.mega-trigger {
  min-height: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 6px 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--tm-ink-soft, var(--ds-color-text, var(--text-color)));
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: color 150ms ease;
}

.mega-trigger:hover { color: var(--tm-blue, var(--ds-color-primary-text, var(--primary-color))); }

.mega-trigger:focus-visible {
  outline: 3px solid var(--ds-color-focus, var(--primary-color));
  outline-offset: 2px;
}

.mega-dropdown {
  border: 1px solid var(--ds-color-border, var(--surface-border));
  border-radius: 16px;
  background: var(--ds-color-surface, var(--surface-card));
  box-shadow: var(--ds-shadow-lg, 0 12px 32px rgba(0, 58, 84, 0.16));
  overflow: hidden;
}

.mega-content {
  grid-template-columns: minmax(220px, 0.85fr) minmax(0, 1.5fr);
}

.mega-categories {
  background: var(--ds-color-surface-alt, var(--surface-ground));
}

.mega-cat-item {
  min-height: var(--ds-touch-target, 44px);
  border-radius: 8px;
  margin: 0.25rem 0.375rem;
}

.mega-cat-item:hover,
.mega-cat-item.is-active {
  background: var(--ds-color-primary-soft, var(--surface-hover));
  color: var(--ds-color-primary-text, var(--primary-color));
}

.mega-subcat-header h3,
.mega-view-all:hover,
.mega-subcat-item:hover {
  color: var(--ds-color-primary-text, var(--primary-color));
}

.mega-subcat-item {
  min-height: var(--ds-touch-target, 44px);
  display: flex;
  align-items: center;
  border-radius: 8px;
}

@media (max-width: 767px) {
  .mega-dropdown {
    border-radius: 0 0 16px 16px;
    box-shadow: var(--ds-shadow-lg, 0 12px 32px rgba(0, 58, 84, 0.16));
  }

  .mega-cat-item {
    margin-inline: 0;
  }
}

</style>
