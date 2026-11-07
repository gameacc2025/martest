<script setup>

defineProps({variant:{type:String,default:'primary'},size:{type:String,default:'md'},loading:Boolean,disabled:Boolean,block:Boolean,type:{type:String,default:'button'}})
</script>
<template><button :type="type" class="tem-button" :class="['v-'+variant,'s-'+size,{block}]" :disabled="disabled||loading"><i v-if="loading" class="pi pi-spin pi-spinner"/><slot/></button></template>
<style scoped>
.tem-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:var(--ds-button-md-height,36px);padding:0 16px;border:1px solid transparent;border-radius:var(--ds-button-md-radius,8px);font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:transform .2s,background-color .2s,border-color .2s,box-shadow .2s}
.tem-button:hover:not(:disabled){transform:translateY(-1px);box-shadow:var(--ds-shadow-sm)}
.tem-button:active:not(:disabled){transform:scale(.98)}
.tem-button:focus-visible{outline:2px solid var(--ds-color-focus);outline-offset:2px}
.tem-button:disabled{opacity:.55;cursor:not-allowed}
.s-sm{min-height:var(--ds-button-sm-height,32px);padding:0 10px}.s-lg{min-height:var(--ds-button-lg-height,48px);padding:0 20px}.block{width:100%}
.v-primary{background:var(--ds-primary-button);border-color:var(--ds-primary-button);color:var(--ds-primary-button-text)}
.v-primary:hover:not(:disabled){background:var(--ds-primary-button-hover)}
.v-secondary{background:var(--ds-color-secondary);border-color:var(--ds-color-secondary);color:#FFFFFF}
.v-soft{background:var(--ds-color-primary-soft);color:var(--ds-color-primary-text)}
.v-outline{border-color:var(--ds-color-border);background:transparent;color:var(--ds-color-text)}
.v-danger{background:var(--ds-color-danger);border-color:var(--ds-color-danger);color:#FFFFFF}
.v-ghost{background:transparent;color:var(--ds-color-text-muted)}
</style>
