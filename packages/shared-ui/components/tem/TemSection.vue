<script setup>

defineProps({title:String,subtitle:String,spacing:{type:String,default:'md'}})
</script>
<template><section class="tem-section" :class="'space-'+spacing"><header v-if="title||subtitle||$slots.actions"><div><h2 v-if="title">{{title}}</h2><p v-if="subtitle">{{subtitle}}</p></div><slot name="actions"/></header><slot/></section></template>
<style scoped>
.tem-section{direction:rtl;min-width:0}.tem-section>header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.tem-section h2{margin:0;font-size:16px}.tem-section p{margin:4px 0 0;color:var(--tm-muted,#627D98);font-size:11px}.space-sm{margin-bottom:14px}.space-md{margin-bottom:22px}.space-lg{margin-bottom:30px}
</style>
