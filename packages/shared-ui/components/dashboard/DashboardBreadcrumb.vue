<script setup>
/**
 * DashboardBreadcrumb
 *
 * Derives a breadcrumb trail from the current route's meta titles. It reads
 * existing `route.meta.title` values (already defined across the router), so it
 * introduces no new routing config and touches no API/auth logic.
 *
 * A "home" crumb (dashboard) is prepended, followed by the matched route
 * segments that carry a title. RTL is handled via logical separators.
 *
 * This component is shared across apps (admin + company), so every named link
 * target is checked against THIS app's router first — a `{ name }` that isn't
 * registered here would throw "No match" at render time and crash the page.
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  homeRoute: { type: Object, default: () => ({ name: 'home' }) },
})

const route = useRoute()
const router = useRouter()

// True when a `{ name }` target is actually registered in this app's router.
function routeIsResolvable(to) {
  if (!to || !to.name) return true // path targets / null are always fine
  return router.hasRoute(to.name)
}

// Where the "home" crumb points. Fall back to the app root "/" if the provided
// home route name isn't registered in this app, so the crumb never crashes.
const homeCrumb = computed(() => ({
  label: 'داشبورد',
  to: routeIsResolvable(props.homeRoute) ? props.homeRoute : '/',
}))

const crumbs = computed(() => {
  const matched = route.matched.filter((r) => r.meta && r.meta.title)
  const items = matched.map((r) => ({
    label: r.meta.title,
    // Only link crumbs whose route name exists in this app's router.
    to: r.name && router.hasRoute(r.name) ? { name: r.name } : null,
  }))

  // Fall back to the current route's own title if nothing matched.
  if (items.length === 0 && route.meta?.title) {
    items.push({ label: route.meta.title, to: null })
  }
  return items
})
</script>

<template>
  <nav class="dash-breadcrumb" aria-label="مسیر صفحه">
    <ol class="dash-breadcrumb-list">
      <li class="dash-breadcrumb-item">
        <router-link :to="homeCrumb.to" class="dash-breadcrumb-link">
          <i class="pi pi-home"></i>
        </router-link>
      </li>
      <li
        v-for="(crumb, index) in crumbs"
        :key="index"
        class="dash-breadcrumb-item"
      >
        <i class="pi pi-angle-left dash-breadcrumb-sep"></i>
        <router-link
          v-if="crumb.to && index < crumbs.length - 1"
          :to="crumb.to"
          class="dash-breadcrumb-link"
        >
          {{ crumb.label }}
        </router-link>
        <span v-else class="dash-breadcrumb-current" aria-current="page">
          {{ crumb.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.dash-breadcrumb {
  padding: 0.85rem 0;
}

.dash-breadcrumb-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.dash-breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.dash-breadcrumb-link {
  color: var(--text-color-secondary);
  text-decoration: none;
  font-size: 0.85rem;
  transition: color var(--transition-duration, 0.2s);
}

.dash-breadcrumb-link:hover {
  color: var(--primary-color);
}

.dash-breadcrumb-current {
  color: var(--text-color);
  font-size: 0.85rem;
  font-weight: 600;
}

.dash-breadcrumb-sep {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
}

/* Flip the chevron for LTR contexts so it always points "forward". */
[dir='ltr'] .dash-breadcrumb-sep {
  transform: rotate(180deg);
}
</style>
