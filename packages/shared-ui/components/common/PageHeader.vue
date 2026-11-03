<script setup>
/** Lightweight breadcrumb row; each page owns its single visible H1. */
import DashboardBreadcrumb from '../dashboard/DashboardBreadcrumb.vue'
defineProps({ homeRoute: { type: Object, default: () => ({ name: 'home' }) } })
</script>

<template>
  <nav class="page-header-pro" aria-label="مسیر صفحه">
    <DashboardBreadcrumb :home-route="homeRoute" class="page-header-pro__breadcrumb" />
  </nav>
</template>

<style scoped>
.page-header-pro { display: flex; min-width: 0; min-height: 2.75rem; align-items: center; margin: .5rem 0 .75rem; padding: 0; background: transparent; }
.page-header-pro__breadcrumb { min-width: 0; padding: 0; }
@media (max-width: 640px) { .page-header-pro { min-height: 2.5rem; margin-block: .35rem .5rem; } }
</style>
