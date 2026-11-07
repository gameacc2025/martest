<script setup>

defineProps({label:String,value:[String,Number],tone:String})
</script>
<template><div class="tem-price-row" :class="tone"><span>{{label}}</span><strong><slot>{{value}}</slot></strong></div></template>
<style scoped>
.tem-price-row{direction:rtl;display:flex;justify-content:space-between;gap:12px;padding:7px 0;font-size:12px}.tem-price-row span{color:var(--tm-muted,#627D98)}.tem-price-row.success strong{color:#15803D}.tem-price-row.danger strong{color:#DC2626}
</style>
