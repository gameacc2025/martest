<script setup>

defineProps({wrap:{type:Boolean,default:true}})
</script>
<template><div class="tem-toolbar" :class="{'is-wrap':wrap}"><div v-if="$slots.start"><slot name="start"/></div><slot/><div v-if="$slots.end"><slot name="end"/></div></div></template>
<style scoped>
.tem-toolbar{direction:rtl;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 17px}.tem-toolbar.is-wrap{flex-wrap:wrap}.tem-toolbar>div{display:flex;align-items:center;gap:8px}@media(max-width:640px){.tem-toolbar{align-items:stretch;flex-wrap:wrap}}
</style>
