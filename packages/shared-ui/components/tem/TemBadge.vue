<script setup>

defineProps({tone:{type:String,default:'neutral'},size:{type:String,default:'md'},rounded:Boolean})
</script>
<template><span class="tem-badge" :class="['tone-'+tone,'size-'+size,{rounded}]"><slot/></span></template>
<style scoped>
.tem-badge{display:inline-flex;align-items:center;justify-content:center;padding:4px 9px;border:1px solid transparent;border-radius:6px;font-size:11px;font-weight:650;white-space:nowrap;line-height:1.5}
.rounded{border-radius:999px}.size-sm{padding:2px 7px;font-size:10px}.size-lg{padding:6px 11px;font-size:12px}
.tone-neutral{background:var(--ds-status-muted-bg);color:var(--ds-status-muted-fg)}
.tone-primary{background:var(--ds-color-primary-soft);color:var(--ds-color-primary-text)}
.tone-success{background:var(--ds-status-success-bg);color:var(--ds-status-success-fg)}
.tone-info{background:var(--ds-status-info-bg);color:var(--ds-status-info-fg)}
.tone-warning{background:var(--ds-status-warning-bg);color:var(--ds-status-warning-fg)}
.tone-danger{background:var(--ds-status-danger-bg);color:var(--ds-status-danger-fg)}
</style>
