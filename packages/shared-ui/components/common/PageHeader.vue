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
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const pageTitle = computed(() => route.meta?.title || 'داشبورد')
const pageContext = computed(() => route.meta?.section || 'فضای کاری')

defineProps({
  // Route the "home" breadcrumb crumb points to (per-app).
  homeRoute: { type: Object, default: () => ({ name: 'home' }) },
})
</script>

<template>
  <header class="page-header-pro">
    <div class="page-header-pro__identity">
      <span class="page-header-pro__eyebrow">{{ pageContext }}</span>
      <span class="page-header-pro__title">{{ pageTitle }}</span>
    </div>
    <div class="page-header-pro__trail">
      <DashboardBreadcrumb :home-route="homeRoute" class="page-header-pro__breadcrumb" />
    </div>
  </header>
</template>

<style scoped>
.page-header-pro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  min-height: 5.25rem;
  margin: 1.25rem 0 1rem;
  padding: .85rem clamp(1rem, 2vw, 1.5rem);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.page-header-pro__identity {
  display: flex;
  flex-direction: column;
  gap: .15rem;
  min-width: 0;
}
.page-header-pro__eyebrow {
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
}
.page-header-pro__title {
  overflow: hidden;
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.page-header-pro__trail {
  min-width: 0;
  padding-inline-start: 1rem;
  border-inline-start: 1px solid var(--ds-color-border);
}
.page-header-pro__breadcrumb { padding: 0; }
@media (max-width: 640px) {
  .page-header-pro {
    align-items: flex-start;
    flex-direction: column;
    gap: .35rem;
    min-height: 0;
    margin-top: .75rem;
    padding: .85rem 1rem;
  }
  .page-header-pro__trail {
    width: 100%;
    padding: .35rem 0 0;
    border-inline-start: 0;
    border-top: 1px solid var(--ds-color-border);
  }
}
</style>