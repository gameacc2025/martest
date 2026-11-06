<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  headingId: { type: String, default: undefined },
})
</script>

<template>
  <header class="store-page-heading">
    <h1 :id="headingId">{{ title }}</h1>
    <p v-if="description">{{ description }}</p>
  </header>
</template>

<style scoped>
.store-page-heading{padding:6px 0 4px}
.store-page-heading h1{margin:0;color:var(--tm-ink,#12182b);font-size:28px;line-height:1.6;font-weight:800}
.store-page-heading p{margin:0;color:var(--tm-muted,#6b7390);font-size:14px}
@media(max-width:560px){.store-page-heading h1{font-size:24px}}
</style>
