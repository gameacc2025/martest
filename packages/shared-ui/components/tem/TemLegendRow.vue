<script setup>

defineProps({label:String,value:[String,Number],color:{type:String,default:'#0891B2'}})
</script>
<template><div class="tem-legend-row"><span><i :style="{background:color}"/>{{label}}</span><strong :style="{color}">{{value}}</strong></div></template>
<style scoped>
.tem-legend-row{direction:rtl;display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:11px}.tem-legend-row span{display:flex;align-items:center;gap:8px}.tem-legend-row i{width:9px;height:9px;border-radius:50%}
</style>
