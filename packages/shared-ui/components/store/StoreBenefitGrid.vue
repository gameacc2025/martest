<script setup>
defineProps({
  items: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="store-benefit-grid">
    <article v-for="item in items" :key="item.title" class="store-benefit-card">
      <i :class="item.icon || 'pi pi-check-circle'" aria-hidden="true"></i>
      <b>{{ item.title }}</b>
      <p>{{ item.description }}</p>
    </article>
  </div>
</template>

<style scoped>
.store-benefit-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.store-benefit-card{min-width:0;padding:18px;border-radius:14px;background:var(--tm-surface,#FFFFFF);box-shadow:var(--tm-card-shadow,0 2px 10px rgba(20,30,70,.06));color:var(--tm-muted,#627D98);font-size:13px}
.store-benefit-card>i{display:grid;place-items:center;width:42px;height:42px;margin-bottom:10px;border-radius:12px;background:var(--tm-chip,#CFFAFE);color:var(--tm-blue,#0E7490);font-size:19px}
.store-benefit-card b{display:block;margin-bottom:4px;color:var(--tm-ink,#102A43);font-size:15px}
.store-benefit-card p{margin:0;font-size:12px;line-height:1.9}
@media(max-width:900px){.store-benefit-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.store-benefit-grid{gap:9px}.store-benefit-card{padding:13px}}
</style>
