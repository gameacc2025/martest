<script setup>
/**
 * TemPageHeader — the canonical page title block shared by every screen.
 *
 *   <TemPageHeader title="محصولات" :crumb="[{label:'خانه', to:'/'},{label:'محصولات'}]">
 *     <template #actions> ... </template>
 *   </TemPageHeader>
 *
 * Presentational only: no data fetching, no routing side effects.
 */
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  /** [{ label, to? }] — the last entry is the current page. */
  crumb: { type: Array, default: () => [] },
})
</script>

<template>
  <header class="tm-page-head">
    <div class="tm-page-head__main">
      <h1 class="tm-page-head__title">{{ title }}</h1>

      <p v-if="description" class="tm-page-head__desc">{{ description }}</p>

      <nav v-if="crumb.length" class="tm-page-head__crumb" aria-label="مسیر صفحه">
        <template v-for="(item, index) in crumb" :key="item.label + index">
          <i v-if="index > 0" aria-hidden="true">‹</i>
          <router-link v-if="item.to" :to="item.to">{{ item.label }}</router-link>
          <span v-else aria-current="page">{{ item.label }}</span>
        </template>
      </nav>
    </div>

    <div v-if="$slots.actions" class="tm-page-head__actions">
      <slot name="actions" />
    </div>
  </header>
</template>