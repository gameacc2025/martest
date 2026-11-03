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
      <div class="dash-panel-heading">
        <i v-if="icon" class="dash-panel-title-icon" :class="icon" aria-hidden="true"></i>
        <h2 class="dash-panel-title">{{ title }}</h2>
      </div>
      <div class="dash-panel-actions">
        <slot name="actions"></slot>
        <router-link v-if="to" :to="to" class="dash-panel-link">{{ toLabel }}<i class="pi pi-arrow-left" aria-hidden="true"></i></router-link>
      </div>
    </header>
    <div class="dash-panel-body"><slot></slot></div>
  </section>
</template>

<style scoped>
.dash-panel {
  display: flex;
  min-width: 0;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.dash-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: .75rem;
  padding: .85rem 1rem;
  border-bottom: 1px solid #e3edf2;
  background: linear-gradient(100deg, #f7fbfd 0%, #eef8fb 100%);
}
.dash-panel-heading { display: flex; min-width: 0; align-items: center; gap: .6rem; }
.dash-panel-title-icon { flex: 0 0 auto; color: var(--ds-color-primary-text); font-size: 1rem; }
.dash-panel-title { min-width: 0; margin: 0; color: var(--ds-color-text); font-size: .9rem; font-weight: var(--ds-font-weight-bold); line-height: 1.45; }
.dash-panel-actions { display: flex; align-items: center; flex-wrap: wrap; gap: .65rem; }
.dash-panel-link { display: inline-flex; min-height: 2.65rem; align-items: center; gap: .4rem; color: var(--ds-color-primary-text); font-size: .78rem; font-weight: var(--ds-font-weight-semibold); text-decoration: none; white-space: nowrap; }
.dash-panel-link:hover { text-decoration: underline; }
.dash-panel-link:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 3px; }
.dash-panel-body { min-width: 0; flex: 1; padding: 1rem; }
</style>
