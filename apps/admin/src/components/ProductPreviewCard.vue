<template>
  <div class="product-preview">
    <div v-if="!hasProduct" class="preview-empty">
      <i class="pi pi-inbox" />
      <p>محصولی برای نمایش در دسترس نیست.</p>
    </div>

    <template v-else>
    <div class="preview-banner">
      <i class="pi pi-eye" />
      پیش‌نمایش — این نمایش صرفاً برای بازبینی است و نسخه نهایی صفحه Marketplace نیست.
    </div>

    <div class="preview-grid">
      <!-- Image -->
      <div class="preview-image">
        <img v-if="primaryImage" :src="primaryImage" :alt="product.title" />
        <div v-else class="image-placeholder">
          <i class="pi pi-image" />
          بدون تصویر
        </div>
      </div>

      <!-- Main info -->
      <div class="preview-info">
        <div class="preview-tags">
          <Tag :value="statusLabel(product.status)" :severity="statusSeverity(product.status)" />
          <Tag v-if="unreviewedEdits > 0" severity="info" :value="`${unreviewedEdits} ویرایش پس از تأیید`" />
          <Tag v-if="product.visibility === 'PRIVATE'" severity="secondary" value="خصوصی" />
          <Tag v-if="product.visibility === 'COMPANY_ONLY'" severity="secondary" value="فقط شرکت" />
        </div>

        <h2>{{ product.title }}</h2>
        <p v-if="product.brand || product.model" class="meta">
          {{ [product.brand, product.model].filter(Boolean).join(' · ') }}
        </p>
        <p v-if="product.sku" class="meta sku">SKU: {{ product.sku }}</p>

        <p class="company">{{ product.company?.name || '-' }}</p>
        <p class="category">
          {{ product.category?.name || '-' }}
          <span v-if="product.subcategory?.name">› {{ product.subcategory.name }}</span>
        </p>

        <div v-if="prices.length" class="prices">
          <div v-for="tier in prices" :key="tier.id" class="price-row">
            <span class="qty">{{ tier.minQuantity }}{{ tier.maxQuantity ? ` تا ${tier.maxQuantity}` : '+' }} عدد</span>
            <span class="price">{{ formatPrice(tier.price) }} ریال</span>
          </div>
        </div>
        <p v-else class="no-price">بدون ردیف قیمت</p>
      </div>
    </div>

    <!-- Description -->
    <div v-if="product.shortDescription || product.description" class="section">
      <h3>توضیحات</h3>
      <p class="description">{{ product.shortDescription || product.description }}</p>
    </div>

    <!-- Specifications -->
    <div v-if="hasSpecifications" class="section">
      <h3>مشخصات فنی</h3>
      <table class="spec-table">
        <tbody>
          <tr v-for="entry in specEntries" :key="entry.title">
            <td class="spec-title">{{ entry.title }}</td>
            <td>{{ entry.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Tag from 'primevue/tag'
import { getStatusLabel, getStatusSeverity, getUnreviewedEditCount } from '../config/product'

const props = defineProps({
  product: { type: Object, required: true },
})

const statusLabel = getStatusLabel
const statusSeverity = getStatusSeverity

const hasProduct = computed(() => {
  const p = props.product
  return Boolean(p && typeof p === 'object' && (p.id != null || p.title || p.name))
})

const unreviewedEdits = computed(() => getUnreviewedEditCount(props.product))

const primaryImage = computed(() => {
  const image = [...(props.product.images || [])].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))[0]
  return image?.url || null
})

const prices = computed(() => (props.product.prices || []).filter((t) => t.price != null))

const hasSpecifications = computed(() => {
  const specs = props.product.specifications || {}
  const standard = specs.standard || {}
  return Object.keys(standard).length > 0 || (specs.attributes || []).length > 0
})

const specEntries = computed(() => {
  const specs = props.product.specifications || {}
  const entries = []
  for (const [key, value] of Object.entries(specs.standard || {})) {
    if (value === '' || value == null) continue
    entries.push({ title: key, value: String(value) })
  }
  for (const attr of specs.attributes || []) {
    if (attr?.title && attr.value !== '' && attr.value != null) {
      entries.push({ title: attr.title, value: String(attr.value) })
    }
  }
  return entries
})

function formatPrice(value) {
  return Number(value).toLocaleString('fa-IR')
}
</script>

<style scoped>
.product-preview {
  direction: rtl;
  text-align: right;
}

.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem 1.5rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  text-align: center;
}

.preview-empty i {
  font-size: 2.5rem;
  opacity: 0.4;
}

.preview-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--p-primary-50, #eef2ff);
  color: var(--p-primary-600, #1d4ed8);
  font-size: 0.85rem;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  border: 1px solid var(--p-primary-200, #c7d2fe);
  margin-bottom: 1.25rem;
}

.preview-grid {
  display: flex;
  gap: 1.5rem;
}

.preview-image {
  flex: 0 0 220px;
  height: 220px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--surface-border);
  background: var(--surface-hover);
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.image-placeholder i {
  font-size: 2.2rem;
  opacity: 0.5;
}

.preview-info {
  flex: 1;
  min-width: 0;
}

.preview-info h2 {
  margin: 0.5rem 0 0.25rem;
  font-size: 1.3rem;
  color: var(--text-color);
}

.meta {
  margin: 0.15rem 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.meta.sku {
  font-size: 0.78rem;
  color: var(--text-color-secondary);
}

.company {
  margin: 0.5rem 0 0;
  font-weight: 600;
  color: var(--p-primary-600, #1d4ed8);
}

.category {
  margin: 0.15rem 0 0.9rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.prices {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.75rem;
  background: var(--surface-hover);
  border-radius: 8px;
  font-size: 0.9rem;
}

.price-row .price {
  font-weight: 700;
  color: var(--p-primary-700, #1e40af);
}

.no-price {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.section {
  margin-top: 1.5rem;
}

.section h3 {
  font-size: 1rem;
  margin: 0 0 0.5rem;
  color: var(--text-color);
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 0.4rem;
}

.description {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.9;
  font-size: 0.92rem;
  white-space: pre-line;
  max-height: 160px;
  overflow-y: auto;
}

.spec-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.spec-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--surface-border);
  color: var(--text-color);
}

.spec-table td.spec-title {
  width: 40%;
  font-weight: 600;
  color: var(--text-color-secondary);
  background: var(--surface-hover);
}

@media (max-width: 640px) {
  .preview-grid {
    flex-direction: column;
  }

  .preview-image {
    flex-basis: auto;
    height: 180px;
  }
}
</style>