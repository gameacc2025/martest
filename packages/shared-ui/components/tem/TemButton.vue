<script setup>

defineProps({variant:{type:String,default:'primary'},size:{type:String,default:'md'},loading:Boolean,disabled:Boolean,block:Boolean,type:{type:String,default:'button'}})
</script>
<template><button :type="type" class="tem-button" :class="['v-'+variant,'s-'+size,{block}]" :disabled="disabled||loading"><i v-if="loading" class="pi pi-spin pi-spinner"/><slot/></button></template>
<style scoped>
.tem-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:0 13px;border:1px solid transparent;border-radius:4px;font:inherit;font-size:11px;font-weight:650;cursor:pointer}.tem-button:disabled{opacity:.55;cursor:not-allowed}.s-sm{min-height:29px;padding:0 9px}.s-lg{min-height:43px;padding:0 17px}.block{width:100%}.v-primary{background:#8c7bf7;color:white}.v-secondary{background:#ff5c39;color:white}.v-soft{background:#eeebfe;color:#7564dc}.v-outline{border-color:var(--tm-line,#eceff5);background:transparent;color:inherit}.v-danger{background:#ff3a3a;color:white}.v-ghost{background:transparent;color:var(--tm-muted,#8c97b2)}
</style>
