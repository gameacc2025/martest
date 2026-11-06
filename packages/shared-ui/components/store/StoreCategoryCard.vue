<script setup>
/**
 * StoreCategoryCard — category widget extracted from `Telecom Market.html`.
 *
 * Two layouts from the reference:
 *  - `tile`  : the home/product-listing rail card (`.cat`) — icon + name + count.
 *  - `panel` : the categories-page card (`.cb`) — thumbnail/icon + name +
 *              description + count + "view products" affordance.
 *
 * Renders as a router link when `to` is provided, a native button when
 * `as="button"` (used by the homepage rail), or a plain article otherwise.
 * It only shows counts supplied by the live API; it never fabricates them.
 */
import { computed } from 'vue'

const props = defineProps({
  category: { type: Object, default: null },
  to: { type: [String, Object], default: null },
  as: { type: String, default: '' },
  variant: { type: String, default: 'tile' },
  icon: { type: String, default: 'pi pi-box' },
  label: { type: String, default: '' },
  count: { type: Number, default: null },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])

const tag = computed(() => props.as || (props.to ? 'router-link' : 'article'))
const labelText = computed(
  () => props.label || props.category?.nameFa || props.category?.nameEn || props.category?.name || props.category?.slug || 'دسته‌بندی',
)
const descriptionText = computed(() => props.description || props.category?.description || '')
const imageUrl = computed(() => props.image || props.category?.image || '')
const countText = computed(() => {
  const raw = props.count ?? props.category?.productCount ?? props.category?.productsCount ?? props.category?._count?.products
  if (raw === null || raw === undefined || raw === '') return ''
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value.toLocaleString('fa-IR') : ''
})

function select(event) {
  emit('select', props.category, event)
}
</script>

<template>
  <component
    :is="tag"
    :to="tag === 'router-link' ? to : undefined"
    :type="tag === 'button' ? 'button' : undefined"
    class="store-category-card"
    :class="[`store-category-card--${variant}`, { 'is-active': active }]"
    @click="tag === 'button' ? select($event) : undefined"
  >
    <template v-if="variant === 'panel'">
      <div class="cat-thumb">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="labelText"
          width="640"
          height="360"
          loading="lazy"
          decoding="async"
          class="cat-thumb-img"
        />
        <div v-else class="cat-thumb-placeholder"><i :class="icon" aria-hidden="true"></i></div>
      </div>
      <h3 class="cat-name">{{ labelText }}</h3>
      <p v-if="descriptionText" class="cat-desc">{{ descriptionText }}</p>
      <div class="cat-footer-row">
        <span v-if="countText" class="store-category-card__count">{{ countText }} محصول</span>
        <span v-else class="store-category-card__count store-category-card__count--muted">—</span>
        <span class="cat-link">مشاهده محصولات <i class="pi pi-arrow-left" aria-hidden="true"></i></span>
      </div>
    </template>

    <template v-else>
      <span class="category-card__icon" aria-hidden="true"><i :class="icon"></i></span>
      <span class="category-card__content">
        <span class="category-card__name">{{ labelText }}</span>
        <small v-if="countText">{{ countText }} محصول</small>
      </span>
    </template>
  </component>
</template>

<style scoped>
.store-category-card {
  direction: rtl;
  color: var(--tm-ink, #12182b);
  text-decoration: none;
}

/* Tile — home / catalogue rail (reference `.cat`: centered icon above label) */
.store-category-card--tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  min-height: 104px;
  padding: 14px 12px;
  border: 1px solid var(--tm-line, #e4e7f2);
  border-radius: var(--tm-radius-lg, 8px);
  background: var(--tm-surface, #fff);
  box-shadow: var(--tm-card-shadow, 0 2px 8px rgba(9, 38, 67, 0.06));
  color: var(--tm-ink, #12182b);
  cursor: pointer;
  text-align: center;
  font-family: inherit;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}
.store-category-card--tile:hover {
  border-color: var(--tm-line-strong, #d3d9ea);
  box-shadow: var(--tm-card-shadow-hover, 0 8px 22px rgba(9, 38, 67, 0.12));
}
.store-category-card--tile:focus-visible {
  outline: 2px solid var(--tm-cyan, #2bb3e8);
  outline-offset: 2px;
}
.store-category-card--tile.is-active {
  border-color: var(--tm-blue, #7c6cf6);
  background: var(--tm-blue-soft, #e8e6fb);
}
.store-category-card--tile .category-card__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: var(--tm-blue-soft, #e8e6fb);
  color: var(--tm-blue, #7c6cf6);
  font-size: 19px;
  transition: background 0.16s ease, color 0.16s ease;
}
.store-category-card--tile:hover .category-card__icon {
  background: var(--tm-cyan-soft, #d6edfa);
  color: var(--tm-blue-strong, #6c5ce7);
}
.store-category-card--tile .category-card__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;
}
.store-category-card--tile .category-card__name {
  color: var(--tm-ink, #12182b);
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.store-category-card--tile small {
  color: var(--tm-muted, #6b7390);
  font-size: 11px;
  font-weight: 400;
}

/* Panel — categories page */
.store-category-card--panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  padding: 12px;
  border: 1px solid var(--tm-line, #e4e7f2);
  border-radius: var(--tm-radius-lg, 8px);
  background: var(--tm-surface, #fff);
  box-shadow: var(--tm-shadow-xs, 0 2px 8px rgba(9, 38, 67, 0.06));
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}
.store-category-card--panel:hover {
  transform: translateY(-2px);
  border-color: var(--tm-line-strong, #d3d9ea);
  box-shadow: var(--tm-shadow-sm, 0 8px 22px rgba(9, 38, 67, 0.12));
}
.store-category-card--panel:focus-visible {
  outline: 2px solid var(--tm-cyan-strong, #8878f7);
  outline-offset: 2px;
}
.store-category-card--panel .cat-thumb {
  aspect-ratio: 16 / 9;
  margin-bottom: 12px;
  border-radius: var(--tm-radius, 4px);
  background: var(--tm-surface-alt, #f0f2f8);
  overflow: hidden;
}
.store-category-card--panel .cat-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.store-category-card--panel .cat-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--tm-faint, #9aa1b3);
  font-size: 26px;
}
.store-category-card--panel .cat-name {
  margin: 0 0 4px;
  color: var(--tm-ink, #12182b);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.55;
  overflow-wrap: anywhere;
}
.store-category-card--panel .cat-desc {
  display: -webkit-box;
  margin: 0 0 10px;
  overflow: hidden;
  color: var(--tm-muted, #6b7390);
  font-size: 12px;
  line-height: 1.8;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.store-category-card--panel .cat-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--tm-line, #e4e7f2);
}
.store-category-card__count {
  color: var(--tm-blue, #7c6cf6);
  font-size: 11.5px;
  font-weight: 700;
}
.store-category-card__count--muted { color: var(--tm-faint, #9aa1b3); font-weight: 500; }
.store-category-card--panel .cat-link {
  color: var(--tm-blue, #7c6cf6);
  font-size: 11.5px;
  font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
  .store-category-card--tile,
  .store-category-card--panel { transition: none; }
  .store-category-card--panel:hover { transform: none; }
}
</style>