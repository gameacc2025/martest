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
.dash-panel{display:flex;min-width:0;height:100%;flex-direction:column;overflow:hidden;border:1px solid #dfe9f4;border-radius:15px;background:#fff;box-shadow:0 3px 13px rgba(32,79,130,.035)}
.dash-panel-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.65rem;padding:.8rem 1rem;border-bottom:1px solid #edf2f8;background:#fff}
.dash-panel-heading{display:flex;min-width:0;align-items:center;gap:.55rem}.dash-panel-title-icon{flex:0 0 auto;color:#168fca;font-size:.95rem}.dash-panel-title{min-width:0;margin:0;color:#18385e;font-size:.85rem;font-weight:800;line-height:1.45}
.dash-panel-actions{display:flex;align-items:center;flex-wrap:wrap;gap:.55rem}.dash-panel-link{display:inline-flex;min-height:2rem;align-items:center;gap:.35rem;color:#078eae;font-size:.72rem;font-weight:700;text-decoration:none;white-space:nowrap}.dash-panel-link:hover{text-decoration:underline}.dash-panel-link:focus-visible{outline:2px solid #12b8d0;outline-offset:3px}
.dash-panel-body{min-width:0;flex:1;padding:.85rem 1rem}
</style>
