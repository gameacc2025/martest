<script setup>
/**
 * DashboardPanel — section frame used across Admin and Company dashboards.
 *
 * Renders the shared `.tm-panel` surface so every dashboard section shares one
 * border, radius and header rhythm. `icon` and `to` remain compatibility
 * props so existing pages keep working unchanged.
 */
defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  to: { type: [String, Object], default: null },
  toLabel: { type: String, default: 'مشاهده همه' },
})
</script>

<template>
  <section class="tm-panel dash-panel">
    <header class="tm-panel__head dash-panel-header">
      <div class="tm-panel__heading dash-panel-heading">
        <h2 class="tm-panel__title dash-panel-title">
          <i v-if="icon" class="tm-panel__icon dash-panel-title-icon" :class="icon" aria-hidden="true"></i>
          {{ title }}
        </h2>
        <p v-if="subtitle" class="tm-panel__subtitle">{{ subtitle }}</p>
      </div>
      <div class="tm-panel__actions dash-panel-actions">
        <slot name="actions"></slot>
        <router-link v-if="to" :to="to" class="tm-btn tm-btn--ghost tm-btn--sm dash-panel-link">
          {{ toLabel }}<i class="pi pi-arrow-left" aria-hidden="true"></i>
        </router-link>
      </div>
    </header>
    <div class="tm-panel__body dash-panel-body"><slot></slot></div>
  </section>
</template>

<style scoped>
.dash-panel { height: 100%; display: flex; flex-direction: column; min-width: 0; }
.dash-panel-heading { min-width: 0; }
.dash-panel-title-icon { font-size: 0.9em; }
.dash-panel-actions { flex-wrap: wrap; }
.dash-panel-body { min-width: 0; flex: 1; }
.dash-panel-link { text-decoration: none; }
</style>