<template>
  <div class="review-card">
    <Card class="review-card-inner">
      <template #content>
        <div class="review-layout">
          <!-- User Info -->
          <div class="review-user">
            <Avatar
              :image="review.user?.avatar || '/placeholder-avatar.jpg'"
              class="review-avatar"
              shape="circle"
            />
            <div class="review-user-name">
              <p>{{ review.user?.name || 'کاربر ناشناس' }}</p>
            </div>
          </div>

          <!-- Review Content -->
          <div class="review-content">
            <div class="review-head">
              <div>
                <div class="review-title-row">
                  <Rating :modelValue="review.rating" :cancel="false" readonly />
                  <span class="review-title">{{ review.title }}</span>
                </div>
                <p class="review-date">{{ formatDate(review.createdAt) }}</p>
              </div>
              <div v-if="review.verified" class="review-verified">
                <i class="pi pi-check-circle"></i>
                <span>تایید شده</span>
              </div>
            </div>

            <p class="review-comment">{{ review.comment }}</p>

            <!-- Review Images -->
            <div v-if="review.images && review.images.length > 0" class="review-images">
              <img
                v-for="(image, index) in review.images.slice(0, 4)"
                :key="index"
                :src="image"
                class="review-image"
                @click="openImage(image)"
              />
            </div>

            <!-- Pros and Cons -->
            <div v-if="review.pros || review.cons" class="review-pros-cons">
              <div v-if="review.pros" class="pros-section">
                <h4>نقاط قوت:</h4>
                <ul>
                  <li v-for="(pro, index) in review.pros" :key="index">{{ pro }}</li>
                </ul>
              </div>
              <div v-if="review.cons" class="cons-section">
                <h4>نقاط ضعف:</h4>
                <ul>
                  <li v-for="(con, index) in review.cons" :key="index">{{ con }}</li>
                </ul>
              </div>
            </div>

            <!-- Helpful Actions -->
            <div class="review-actions">
              <Button
                icon="pi pi-thumbs-up"
                class="p-button-text p-button-sm"
                :class="{ 'is-active': review.isHelpful }"
                label="مفید بود"
                @click="$emit('mark-helpful', review)"
              />
              <Button
                icon="pi pi-flag"
                class="p-button-text p-button-sm review-report-btn"
                label="گزارش"
                @click="$emit('report', review)"
              />
              <span v-if="review.helpfulCount > 0" class="review-helpful-count">
                {{ review.helpfulCount }} نفر این نظر را مفید دانستند
              </span>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import Card from 'primevue/card'
import Avatar from 'primevue/avatar'
import Rating from 'primevue/rating'
import Button from 'primevue/button'

const props = defineProps({
  review: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      user: null,
      rating: 0,
      title: '',
      comment: '',
      createdAt: '',
      verified: false,
      images: [],
      pros: [],
      cons: [],
      isHelpful: false,
      helpfulCount: 0
    })
  }
})

defineEmits(['mark-helpful', 'report', 'open-image'])

const formatDate = (date) => {
  if (!date) return 'نامشخص'
  return new Date(date).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const openImage = (imageUrl) => {
  // Emit event to open image in modal
  // Parent component should handle the modal display
}
</script>

<style scoped>
.review-card {
  direction: rtl;
  margin-bottom: 1rem;
}

.review-card :deep(.p-card) {
  padding: 1rem;
}

.review-card :deep(.p-card-content) {
  padding: 0;
}

.review-layout {
  display: flex;
  gap: 1rem;
}

.review-user {
  flex-shrink: 0;
  text-align: center;
}

.review-avatar {
  width: 3rem;
  height: 3rem;
}

.review-user-name {
  margin-top: 0.5rem;
}

.review-user-name p {
  font-weight: 500;
  font-size: 0.875rem;
  margin: 0;
}

.review-content {
  flex: 1;
  min-width: 0;
}

.review-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.review-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.review-title {
  font-size: 0.875rem;
  font-weight: 500;
}

.review-date {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin: 0;
}

.review-verified {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--p-green-600);
}

.review-verified i {
  color: var(--p-green-500);
  font-size: 0.875rem;
}

.review-comment {
  font-size: 0.875rem;
  color: var(--text-color);
  margin: 0 0 0.75rem 0;
}

.review-images {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

@media (min-width: 768px) {
  .review-images {
    grid-template-columns: repeat(4, 1fr);
  }
}

.review-image {
  width: 100%;
  height: 5rem;
  object-fit: cover;
  border-radius: var(--content-border-radius);
  cursor: pointer;
}

.review-pros-cons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  font-size: 0.875rem;
}

@media (min-width: 768px) {
  .review-pros-cons {
    grid-template-columns: repeat(2, 1fr);
  }
}

.pros-section h4,
.cons-section h4 {
  font-weight: 500;
  margin: 0 0 0.25rem 0;
}

.pros-section h4 {
  color: var(--p-green-600);
}

.cons-section h4 {
  color: var(--p-red-600);
}

.pros-section ul,
.cons-section ul {
  list-style: disc;
  list-style-position: inside;
  color: var(--text-color-secondary);
  padding-inline-end: 1rem;
  margin: 0;
}

.pros-section li {
  color: var(--p-green-500);
}

.cons-section li {
  color: var(--p-red-500);
}

.review-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--surface-border);
  flex-wrap: wrap;
}

.review-actions :deep(.is-active) {
  color: var(--p-blue-500);
}

.review-report-btn {
  color: var(--text-color-secondary);
}

.review-helpful-count {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}
</style>
