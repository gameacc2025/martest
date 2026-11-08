<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <nav class="breadcrumb app-breadcrumb" aria-label="مسیر راهنما" dir="rtl">
    <ol class="breadcrumb-list">
      <li class="breadcrumb-item breadcrumb-home">
        <RouterLink :to="{ name: 'home' }" aria-label="صفحه اصلی">
          <i class="pi pi-home" aria-hidden="true"></i>
          <span>صفحه اصلی</span>
        </RouterLink>
      </li>
      <li v-for="(item, index) in items" :key="item.key || item.label || index" class="breadcrumb-item">
        <i class="pi pi-angle-left breadcrumb-separator" aria-hidden="true"></i>
        <RouterLink v-if="item.to" :to="item.to">{{ item.label }}</RouterLink>
        <span v-else class="breadcrumb-current" aria-current="page">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.app-breadcrumb {
  width: 100%;
  min-width: 0;
  margin: 0 0 18px;
  color: var(--ds-text-secondary, #64748b);
  font-family: var(--ds-font-family, inherit);
  font-size: 12px;
  line-height: 1.8;
}
.breadcrumb-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
}
.breadcrumb-item a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--ds-color-link, var(--ds-brand-primary, #0891b2));
  text-decoration: none;
  transition: color .18s ease;
}
.breadcrumb-item a:hover { color: var(--ds-brand-primary-hover, #06b6d4); }
.breadcrumb-home a { white-space: nowrap; }
.breadcrumb-home i { font-size: 13px; }
.breadcrumb-separator {
  flex: 0 0 auto;
  color: var(--ds-text-muted, #94a3b8);
  font-size: 11px;
}
.breadcrumb-current {
  display: inline-block;
  min-width: 0;
  max-width: min(52vw, 520px);
  overflow: hidden;
  color: var(--ds-text-primary, #1e293b);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 575px) {
  .app-breadcrumb { margin-bottom: 14px; font-size: 11px; }
  .breadcrumb-list, .breadcrumb-item { gap: 4px; }
  .breadcrumb-current { max-width: 58vw; }
}
</style>
