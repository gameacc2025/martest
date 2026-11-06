<script setup>
defineProps({
  items: { type: Array, required: true },
  label: { type: String, default: 'مسیر صفحه' },
})
</script>

<template>
  <nav class="store-breadcrumb" :aria-label="label">
    <template v-for="(item, index) in items" :key="item.label">
      <router-link v-if="item.to" :to="item.to">{{ item.label }}</router-link>
      <span v-else>{{ item.label }}</span>
      <i v-if="index < items.length - 1" class="pi pi-angle-left" aria-hidden="true"></i>
    </template>
  </nav>
</template>

<style scoped>
.store-breadcrumb{display:flex;align-items:center;gap:7px;padding:18px 0 4px;color:var(--tm-muted,#6b7390);font-size:13px}
.store-breadcrumb a{color:var(--tm-blue,#6c5ce7);text-decoration:none}
.store-breadcrumb i{font-size:11px}
</style>
