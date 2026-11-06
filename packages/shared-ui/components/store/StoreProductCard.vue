<script setup>
/**
 * StoreProductCard — product tile extracted from `Telecom Market.html` (`.p`).
 *
 * Structure (RTL): portrait media with category/rank badges → brand + verified
 * supplier → sales-mode chip → product name → model/SKU meta → price or an
 * explicit inquiry label → action slot.
 *
 * All values come from the caller / live API. The component never invents a
 * price, discount, sold count or ranking; the optional `rank` is only rendered
 * when the caller has real ranking data to pass.
 */
import { computed } from 'vue'

const props = defineProps({
  product: { type: Object, required: true },
  to: { type: [String, Object], default: null },
  category: { type: String, default: '' },
  verified: { type: Boolean, default: false },
  /** { kind: 'fixed' | 'inquiry' | 'volume', label: string } */
  mode: { type: Object, default: null },
  priceLabel: { type: String, default: '' },
  priceCaption: { type: String, default: '' },
  availability: { type: String, default: '' },
  brand: { type: String, default: '' },
  rank: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
})

const emit = defineEmits(['action'])

const name = computed(() => props.product?.name || props.product?.title || 'محصول')
const brandLabel = computed(
  () => props.brand || props.product?.brand || props.product?.company?.name || 'تجهیزات شبکه و مخابرات',
)
const companyName = computed(() => props.product?.company?.name || '')
const imageEntry = computed(
  () => props.product?.images?.find((image) => image?.isPrimary && image?.url)
    || props.product?.images?.find((image) => image?.url)
    || null,
)
const imageUrl = computed(() => {
  if (imageEntry.value?.url) return imageEntry.value.url
  const fallback = props.product?.image || props.product?.imageUrl
  return typeof fallback === 'string' ? fallback : fallback?.url || ''
})
const caption = computed(
  () => props.priceCaption || (props.product?.prices?.length ? 'شروع قیمت از' : 'قیمت'),
)
const rankLabel = computed(() => (props.rank > 0 ? `#${props.rank.toLocaleString('fa-IR')}` : ''))

function setAction(event) {
  emit('action', props.product, event)
}
</script>

<template>
  <article class="product-card store-product-card">
    <component :is="to ? 'router-link' : 'span'" :to="to || undefined" class="product-card__main">
      <span class="product-card__media">
        <span v-if="rankLabel" class="store-product-card__rank">{{ rankLabel }}</span>
        <span v-if="category" class="product-card__media-category">{{ category }}</span>
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="name"
          width="320"
          height="240"
          loading="lazy"
          decoding="async"
        />
        <i v-else class="pi pi-box" aria-hidden="true"></i>
      </span>
      <span class="product-card__body">
        <span class="product-card__brand">{{ brandLabel }}</span>
        <span v-if="verified" class="product-card__verified product-verified">
          <i class="pi pi-verified" aria-hidden="true"></i> تأمین‌کننده تأییدشده
        </span>
        <span v-if="featured" class="product-card__featured"><i class="pi pi-star-fill" aria-hidden="true"></i> ویژه</span>
        <span v-if="mode" class="product-card__mode" :class="`product-card__mode--${mode.kind}`">{{ mode.label }}</span>
        <span class="product-card__name">{{ name }}</span>
        <span class="product-card__specs product-meta">
          <b v-if="product.model">{{ product.model }}</b>
          <b v-if="product.sku" class="product-sku" dir="ltr">{{ product.sku }}</b>
          <slot name="meta" />
        </span>
        <span v-if="companyName && companyName !== brandLabel" class="product-card__company">{{ companyName }}</span>
        <span v-if="availability" class="product-card__availability">{{ availability }}</span>
      </span>
    </component>

    <div class="product-card__foot product-card-footer">
      <span class="product-card__price product-card-price">
        <small>{{ caption }}</small>
        <b>{{ priceLabel }}</b>
      </span>
      <slot name="action">
        <button v-if="!to" type="button" class="product-card-cta" @click="setAction">
          جزئیات محصول <i class="pi pi-arrow-left" aria-hidden="true"></i>
        </button>
        <router-link v-else :to="to" class="product-card-cta">
          جزئیات محصول <i class="pi pi-arrow-left" aria-hidden="true"></i>
        </router-link>
      </slot>
    </div>
  </article>
</template>

<style scoped>
.product-card.store-product-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--tm-line, #e4e7f2);
  border-radius: 4px;
  background: var(--tm-surface, #fff);
  box-shadow: var(--tm-card-shadow, 0 2px 8px rgba(9, 38, 67, 0.06));
  overflow: hidden;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.product-card.store-product-card:hover {
  border-color: var(--tm-line-strong, #d3d9ea);
  box-shadow: 0 5px 16px rgba(20, 20, 60, 0.09);
}
.product-card.store-product-card:focus-within { outline: 2px solid var(--ds-color-focus, #7c6cf6); outline-offset: -2px; }

.product-card__main {
  display: block;
  min-height: 0;
  color: inherit;
  text-decoration: none;
}
.product-card__main:focus-visible { outline: 2px solid var(--ds-color-focus, #7c6cf6); outline-offset: -2px; }

.product-card__media {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 5;
  min-height: 0;
  background: #f4f5fa;
  color: #a5a9bb;
  font-size: 36px;
  overflow: hidden;
}
.product-card__media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 10px;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.store-product-card:hover .product-card__media img { transform: scale(1.04); }
.store-product-card__rank {
  position: absolute;
  top: 10px;
  inset-inline-end: 10px;
  z-index: 1;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--tm-blue, #7c6cf6);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
.product-card__media-category {
  position: absolute;
  z-index: 1;
  top: 10px;
  inset-inline-start: 10px;
  max-width: 70%;
  padding: 4px 7px;
  border-radius: 3px;
  background: #fff;
  color: #525a70;
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.product-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  padding: 11px;
}
.product-card__brand {
  margin-bottom: 2px;
  color: var(--tm-blue, #7c6cf6);
  font-size: 10px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-card__verified {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #14846f;
  font-size: 10px;
}
.product-card__featured {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 3px;
  background: var(--tm-amber-soft, #fff4de);
  color: var(--tm-amber, #a66a00);
  font-size: 10px;
  font-weight: 700;
}
.product-card__mode {
  align-self: flex-start;
  padding: 2px 6px;
  border-radius: 3px;
  background: var(--tm-blue-soft, #e8e6fb);
  color: var(--tm-blue, #7c6cf6);
  font-size: 10px;
  font-weight: 700;
}
.product-card__mode--fixed { background: var(--tm-green-soft, #dff8e9); color: var(--tm-green, #07864b); }
.product-card__mode--inquiry { background: var(--tm-amber-soft, #fff4de); color: var(--tm-amber, #a66a00); }
.product-card__mode--volume { background: var(--tm-cyan-soft, #d6edfa); color: var(--tm-blue-strong, #6c5ce7); }
.product-card__name {
  display: -webkit-box;
  min-height: 44px;
  overflow: hidden;
  color: var(--tm-ink, #12182b);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.8;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.product-card__specs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 10px;
  margin-top: 4px;
  color: var(--tm-muted, #6b7390);
  font-size: 10px;
}
.product-card__specs b { font-weight: 500; }
.product-card__company,
.product-card__availability { color: var(--tm-muted, #6b7390); font-size: 10px; }
.product-card__foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding: 10px 11px 11px;
  border-top: 1px solid var(--tm-line, #e4e7f2);
}
.product-card__price {
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: var(--tm-ink, #12182b);
  font-size: 12px;
}
.product-card__price small {
  color: var(--tm-muted, #6b7390);
  font-size: 10px;
  font-weight: 400;
}
.product-card__price b { font-size: 12px; font-weight: 700; }
.product-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: none;
  color: var(--tm-blue, #7c6cf6);
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}
.product-card-cta i { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
.product-card-cta:hover i { transform: translateX(-4px); }

@media (prefers-reduced-motion: reduce) {
  .product-card.store-product-card,
  .product-card__media img,
  .product-card-cta i { transition: none; }
  .store-product-card:hover .product-card__media img { transform: none; }
}
</style>