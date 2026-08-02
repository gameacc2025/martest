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

function toggleCategory(cat) {
  if (activeCategory.value?.id === cat.id) {
    activeCategory.value = null
  } else {
    activeCategory.value = cat
  }
}

function goToCategory(slug) {
  activeCategory.value = null
  isMenuOpen.value = false
  router.push({ name: 'products', query: { category: slug } })
}

function goToSubcategory(categorySlug, subcategorySlug) {
  activeCategory.value = null
  isMenuOpen.value = false
  router.push({ name: 'products', query: { category: categorySlug, subcategory: subcategorySlug } })
}
</script>

<template>
  <div class="mega-menu-wrapper" ref="menuRef">
    <!-- Trigger Button -->
    <button class="mega-trigger" @click="isMenuOpen = !isMenuOpen">
      <i class="pi pi-bars"></i>
      <span>دسته‌بندی محصولات</span>
      <i class="pi" :class="isMenuOpen ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
    </button>

    <!-- Dropdown -->
    <Transition name="mega">
      <div v-show="isMenuOpen" class="mega-dropdown">
        <div class="mega-content">
          <!-- Category List (right side in RTL) -->
          <div class="mega-categories">
            <div
              v-for="cat in props.categories"
              :key="cat.id"
              class="mega-cat-item"
              :class="{ 'is-active': activeCategory?.id === cat.id }"
              @mouseenter="toggleCategory(cat)"
              @click="goToCategory(cat.slug)"
            >
              <span class="mega-cat-name">{{ cat.nameFa }}</span>
              <i class="pi pi-chevron-left mega-cat-arrow"></i>
            </div>
          </div>

          <!-- Subcategory Panel -->
          <div class="mega-subcats">
            <template v-if="activeCategory">
              <div class="mega-subcat-header">
                <h3>{{ activeCategory.nameFa }}</h3>
                <button class="mega-view-all" @click="goToCategory(activeCategory.slug)">
                  مشاهده همه
                  <i class="pi pi-arrow-left"></i>
                </button>
              </div>
              <div class="mega-subcat-grid">
                <div
                  v-for="sub in activeCategory.subcategories"
                  :key="sub.id"
                  class="mega-subcat-item"
                  @click="goToSubcategory(activeCategory.slug, sub.slug)"
                >
                  <span class="mega-subcat-name">{{ sub.nameFa }}</span>
                </div>
              </div>
            </template>
            <div v-else class="mega-subcat-empty">
              <i class="pi pi-arrow-left"></i>
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
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 0.85rem;
  color: var(--text-color);
}

.mega-cat-item:hover,
.mega-cat-item.is-active {
  background: var(--surface-hover);
}

.mega-cat-item.is-active {
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
  color: var(--primary-color);
  font-weight: 600;
}

.mega-cat-arrow {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

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
  padding: 0.5rem 0.75rem;
  border-radius: var(--content-border-radius);
  cursor: pointer;
  transition: background 0.15s;
  font-size: 0.825rem;
  color: var(--text-color);
}

.mega-subcat-item:hover {
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
</style>
