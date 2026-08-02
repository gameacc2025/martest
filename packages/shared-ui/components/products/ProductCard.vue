<template>
  <div class="product-card">
    <Card class="product-card-inner">
      <template #header>
        <div class="product-media">
          <img
            :src="product.image || '/placeholder-product.jpg'"
            :alt="product.name"
            class="product-image"
          />
          <div v-if="product.discount > 0" class="product-discount">
            <Badge :value="`${product.discount}%`" severity="danger" class="discount-badge" />
          </div>
          <div class="product-wishlist">
            <Button
              icon="pi pi-heart"
              :class="['p-button-rounded', 'p-button-text', 'p-button-plain', { 'is-active': product.isInWishlist }]"
              @click="$emit('toggle-wishlist', product)"
            />
          </div>
        </div>
      </template>
      <template #content>
        <div class="product-info">
          <div class="product-info-head">
            <div>
              <h3 class="product-name">{{ product.name }}</h3>
              <p v-if="product.company" class="product-company">{{ product.company.name }}</p>
            </div>
          </div>

          <div class="product-rating">
            <Rating :modelValue="product.rating || 0" :cancel="false" readonly />
            <span class="product-reviews-count">({{ product.reviewsCount || 0 }})</span>
          </div>

          <div class="price-section">
            <span v-if="product.discount > 0" class="original-price">
              {{ formatPrice(product.price) }}
            </span>
            <span class="final-price">
              {{ formatPrice(product.finalPrice || product.price) }}
            </span>
          </div>

          <div class="product-features">
            <div v-if="product.specs?.ram" class="product-feature">
              <i class="pi pi-memory"></i>
              <span>RAM: {{ product.specs.ram }}</span>
            </div>
            <div v-if="product.specs?.storage" class="product-feature">
              <i class="pi pi-hard-drive"></i>
              <span>حافظه: {{ product.specs.storage }}</span>
            </div>
            <div v-if="product.specs?.cpu" class="product-feature">
              <i class="pi pi-cog"></i>
              <span>پردازنده: {{ product.specs.cpu }}</span>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="product-actions">
          <Button
            label="مشاهده محصول"
            icon="pi pi-eye"
            class="p-button-outlined product-action"
            @click="$emit('view-product', product)"
          />
          <Button
            label="افزودن به سبد"
            icon="pi pi-shopping-cart"
            class="p-button-primary product-action"
            @click="$emit('add-to-cart', product)"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import Card from 'primevue/card'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Rating from 'primevue/rating'

const props = defineProps({
  product: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      name: '',
      image: '',
      price: 0,
      finalPrice: 0,
      discount: 0,
      rating: 0,
      reviewsCount: 0,
      company: null,
      specs: {},
      isInWishlist: false
    })
  }
})

defineEmits(['add-to-cart', 'view-product', 'toggle-wishlist'])

const formatPrice = (price) => {
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR'
  }).format(price)
}
</script>

<style scoped>
.product-card {
  direction: rtl;
  height: 100%;
}

.product-card-inner {
  height: 100%;
}

.product-card :deep(.p-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.product-card :deep(.p-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-card :deep(.p-card-header) {
  padding: 0;
}

.product-card :deep(.p-card-content) {
  padding: 1rem;
  flex: 1;
}

.product-card :deep(.p-card-footer) {
  padding: 1rem;
  border-top: 1px solid var(--surface-border);
}

.product-media {
  position: relative;
}

.product-image {
  width: 100%;
  height: 12rem;
  object-fit: cover;
  border-radius: var(--content-border-radius) var(--content-border-radius) 0 0;
}

.product-discount {
  position: absolute;
  top: 0.5rem;
  inset-inline-start: 0.5rem;
}

.product-wishlist {
  position: absolute;
  top: 0.5rem;
  inset-inline-end: 0.5rem;
}

.product-wishlist :deep(.is-active) {
  color: var(--p-red-500);
}

.discount-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.product-info-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.product-name {
  font-weight: 600;
  font-size: 1.125rem;
  margin: 0 0 0.25rem 0;
}

.product-company {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin: 0;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.product-reviews-count {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.price-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.original-price {
  text-decoration: line-through;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.final-price {
  color: var(--p-red-500);
  font-weight: 700;
  font-size: 1.125rem;
}

.product-features {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.product-feature {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.product-feature i {
  font-size: 0.75rem;
}

.product-actions {
  display: flex;
  gap: 0.5rem;
}

.product-action {
  flex: 1;
}
</style>
