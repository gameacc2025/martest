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
.page-header-pro{display:flex;width:100%;min-width:0;min-height:2.5rem;align-items:center;margin:.45rem 0 .55rem;padding:.4rem clamp(1rem,1.55vw,1.65rem);background:var(--ds-color-surface);border:1px solid var(--ds-color-border);border-radius:var(--ds-card-radius);box-shadow:var(--ds-shadow-xs)}
.page-header-pro__breadcrumb{min-width:0;padding:0}
@media(max-width:640px){.page-header-pro{min-height:2.35rem;padding-inline:.75rem}}
</style>
