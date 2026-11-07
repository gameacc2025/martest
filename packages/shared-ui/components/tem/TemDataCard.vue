<script setup>

defineProps({title:String,padding:{type:Boolean,default:true}})
</script>
<template><section class="tem-data-card"><header v-if="title||$slots.header||$slots.action"><slot name="header"><h3>{{title}}</h3></slot><slot name="action"/></header><div :class="{body:padding}"><slot/></div><footer v-if="$slots.footer"><slot name="footer"/></footer></section></template>
<style scoped>
.tem-data-card{direction:rtl;overflow:hidden;border:1px solid var(--tm-line,#DCE8EF);border-radius:6px;background:var(--tm-surface,#fff)}header,footer{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 17px;border-bottom:1px solid var(--tm-line,#DCE8EF)}h3{margin:0;font-size:14px}.body{padding:17px}footer{border-top:1px solid var(--tm-line,#DCE8EF);border-bottom:0}
</style>
