<script setup>
defineProps({
  items: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="store-faq-list">
    <details v-for="(item, index) in items" :key="item.question" :open="index === 0">
      <summary>{{ item.question }}</summary>
      <p>{{ item.answer }}</p>
    </details>
  </div>
</template>

<style scoped>
.store-faq-list details{margin-bottom:10px;padding:14px 18px;border-radius:12px;background:var(--tm-surface,#fff);box-shadow:var(--tm-card-shadow,0 2px 10px rgba(20,30,70,.05));font-size:14px}
.store-faq-list summary{color:var(--tm-ink,#12182b);font-weight:700;cursor:pointer}
.store-faq-list details p{margin:8px 0 0;color:var(--tm-muted,#6b7390);font-size:13px;line-height:1.9}
</style>
