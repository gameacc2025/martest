<script setup>
/** Quiet section frame for operational content; icon remains a compatibility prop. */
defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: '' },
  to: { type: [String, Object], default: null },
  toLabel: { type: String, default: 'مشاهده همه' },
})
</script>

<template>
  <section class="dash-panel">
    <header class="dash-panel-header">
      <h2 class="dash-panel-title">{{ title }}</h2>
      <div class="dash-panel-actions">
        <slot name="actions"></slot>
        <router-link v-if="to" :to="to" class="dash-panel-link">{{ toLabel }}<i class="pi pi-arrow-left" aria-hidden="true"></i></router-link>
      </div>
    </header>
    <div class="dash-panel-body"><slot></slot></div>
  </section>
</template>

<style scoped>
.dash-panel { display: flex; min-width: 0; height: 100%; flex-direction: column; border: 0; border-top: 1px solid var(--ds-color-border); border-radius: 0; background: transparent; box-shadow: none; }
.dash-panel-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ds-space-3); padding: .95rem 0 .8rem; border-bottom: 1px solid var(--ds-color-border); }
.dash-panel-title { min-width: 0; margin: 0; color: var(--ds-color-text); font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); line-height: 1.45; }
.dash-panel-actions { display: flex; align-items: center; flex-wrap: wrap; gap: var(--ds-space-3); }
.dash-panel-link { display: inline-flex; min-height: 2.75rem; align-items: center; gap: var(--ds-space-2); color: var(--ds-color-primary-text); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-semibold); text-decoration: none; white-space: nowrap; }
.dash-panel-link:hover { text-decoration: underline; }
.dash-panel-link:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 3px; }
.dash-panel-body { min-width: 0; flex: 1; padding: var(--ds-space-4) 0 var(--ds-space-6); }
</style>
