<script setup>
defineProps({title:String,tags:String,tone:{type:String,default:'#8c7bf7'}})
</script>
<template><section class="tem-card-border"><header><h3>{{title}}</h3><slot name="action"><i class="pi pi-plus"/></slot></header><div class="content"><slot/></div><footer><div><slot name="avatars"/></div><span>{{tags}}</span></footer></section></template>
<style scoped>
.tem-card-border{direction:rtl;padding:16px;border:1px solid var(--tm-line,#eceff5);border-inline-start:3px solid v-bind(tone);border-radius:6px;background:var(--tm-surface,#fff)}header,footer{display:flex;align-items:center;justify-content:space-between;gap:10px}h3{margin:0;font-size:13px}header>i{color:v-bind(tone)}.content{padding:12px 0;color:var(--tm-muted,#8c97b2);font-size:11px}footer{font-size:10px;color:var(--tm-muted,#8c97b2)}
</style>