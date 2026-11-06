<script setup>

defineProps({name:String,subtitle:String,avatar:String,initials:String})
</script>
<template><div class="tem-customer-cell"><img v-if="avatar" :src="avatar" :alt="name"><span v-else class="avatar">{{initials||name?.slice(0,1)}}</span><span><strong>{{name}}</strong><small v-if="subtitle">{{subtitle}}</small></span></div></template>
<style scoped>
.tem-customer-cell{direction:rtl;display:flex;align-items:center;gap:9px;min-width:0}.tem-customer-cell img,.avatar{display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:50%;object-fit:cover;background:#eeebfe;color:#7564dc;font-size:12px}.tem-customer-cell>span:last-child{display:grid;gap:2px;min-width:0}.tem-customer-cell strong{font-size:11px}.tem-customer-cell small{color:var(--tm-muted,#8c97b2);font-size:10px}
</style>
