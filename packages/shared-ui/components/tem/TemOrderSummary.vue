<script setup>

defineProps({title:{type:String,default:'خلاصه سفارش'},rows:{type:Array,default:()=>[]},totalLabel:{type:String,default:'مبلغ نهایی'},total:[String,Number]})
</script>
<template><aside class="tem-order-summary"><header><h3>{{title}}</h3><slot name="header"/></header><div class="rows"><slot><div v-for="(row,i) in rows" :key="i" class="row"><span>{{row.label}}</span><strong>{{row.value}}</strong></div></slot></div><div v-if="total!==undefined&&total!==''" class="total"><span>{{totalLabel}}</span><strong>{{total}}</strong></div><slot name="footer"/></aside></template>
<style scoped>
.tem-order-summary{direction:rtl;padding:18px;border:1px solid var(--tm-line,#DCE8EF);border-radius:6px;background:var(--tm-surface,#FFFFFF)}header,.row,.total{display:flex;align-items:center;justify-content:space-between;gap:10px}h3{margin:0 0 12px;font-size:14px}.rows{display:grid;gap:5px}.row,.total{padding:8px 0;font-size:11px}.row span{color:var(--tm-muted,#627D98)}.total{margin-top:7px;border-top:1px solid var(--tm-line,#DCE8EF);font-weight:700}.total strong{font-size:16px}
</style>
