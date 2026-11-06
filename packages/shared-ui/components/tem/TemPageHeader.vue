<script setup>

defineProps({title:String,description:String,breadcrumbs:{type:Array,default:()=>[]}})
</script>
<template><header class="tem-page-header"><div><h1>{{title}}</h1><p v-if="description">{{description}}</p><nav v-if="breadcrumbs.length"><template v-for="(crumb,i) in breadcrumbs" :key="i"><span v-if="i">/</span><router-link v-if="crumb.to" :to="crumb.to">{{crumb.label}}</router-link><b v-else>{{crumb.label}}</b></template></nav></div><div class="actions"><slot name="actions"/></div></header></template>
<style scoped>
.tem-page-header{direction:rtl;display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:18px}.tem-page-header h1{margin:0;font-size:20px}.tem-page-header p{margin:5px 0;color:var(--tm-muted,#8c97b2);font-size:11px}.tem-page-header nav{display:flex;gap:7px;margin-top:6px;color:var(--tm-muted,#8c97b2);font-size:10px}.tem-page-header a{color:inherit;text-decoration:none}.actions{display:flex;gap:8px}@media(max-width:640px){.tem-page-header{align-items:flex-start;flex-direction:column}}
</style>
