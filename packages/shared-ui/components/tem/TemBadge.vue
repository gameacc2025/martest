<script setup>

defineProps({tone:{type:String,default:'neutral'},size:{type:String,default:'md'},rounded:Boolean})
</script>
<template><span class="tem-badge" :class="['tone-'+tone,'size-'+size,{rounded}]"><slot/></span></template>
<style scoped>
.tem-badge{display:inline-flex;align-items:center;justify-content:center;padding:4px 8px;border-radius:4px;font-size:10px;font-weight:650;white-space:nowrap}.rounded{border-radius:99px}.size-sm{padding:2px 6px;font-size:9px}.size-lg{padding:6px 10px;font-size:11px}.tone-neutral{background:#f1f2f6;color:#69738a}.tone-primary{background:#eeebfe;color:#7564dc}.tone-success{background:#dff8e9;color:#07864b}.tone-info{background:#e3f6fd;color:#1684a9}.tone-warning{background:#fff4de;color:#a66a00}.tone-danger{background:#ffe4e4;color:#d33232}
</style>
