<script setup>
/**
 * PageHeader — clean white breadcrumb bar.
 *
 * A single, reusable header rendered once at the layout level (admin + company
 * dashboards). It shows an RTL breadcrumb trail (داشبورد / کاربران) on a clean
 * white surface, reusing DashboardBreadcrumb so it stays in sync with route
 * meta titles. Every dashboard page gets a consistent header with zero
 * per-page markup.
 *
 * Purely presentational; touches no API/auth/business logic.
 */
import DashboardBreadcrumb from '../dashboard/DashboardBreadcrumb.vue'

defineProps({
  // Route the "home" breadcrumb crumb points to (per-app).
  homeRoute: { type: Object, default: () => ({ name: 'home' }) },
})
</script>

<template>
  <header class="page-header-pro">
    <DashboardBreadcrumb
      :home-route="homeRoute"
      class="page-header-pro__breadcrumb"
    />
  </header>
</template>

<style scoped>
.page-header-pro {
  display: flex;
  align-items: center;
  padding: 0.5rem 1.25rem;
  margin-bottom: 1.25rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius, 12px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.page-header-pro__breadcrumb {
  padding: 0;
}

@media (max-width: 640px) {
  .page-header-pro {
    padding: 0.5rem 1rem;
  }
}
</style>
