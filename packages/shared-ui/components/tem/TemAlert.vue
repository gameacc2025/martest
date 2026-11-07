<script setup>

defineProps({tone:{type:String,default:'info'},title:String,dismissible:Boolean});const emit=defineEmits(['dismiss'])
</script>
<template><div class="tem-alert" :class="'tone-'+tone" role="status"><i class="pi" :class="'pi-'+(tone==='success'?'check-circle':tone==='warning'?'exclamation-triangle':tone==='danger'?'times-circle':'info-circle')"/><div><strong v-if="title">{{title}}</strong><slot/></div><button v-if="dismissible" @click="emit('dismiss')" aria-label="بستن">×</button></div></template>
<style scoped>
.tem-alert{direction:rtl;display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid transparent;border-radius:5px;font-size:11px;line-height:1.8}.tem-alert>i{font-size:15px}.tem-alert strong{display:block;margin-bottom:3px}.tem-alert button{margin-inline-start:auto;border:0;background:none;font-size:18px;cursor:pointer}.tone-info{background:#DBEAFE;border-color:#BFDBFE;color:#1D4ED8}.tone-success{background:#DCFCE7;border-color:#BBF7D0;color:#15803D}.tone-warning{background:#FEF3C7;border-color:#FDE68A;color:#B45309}.tone-danger{background:#FEE2E2;border-color:#FECACA;color:#DC2626}
</style>
