<script setup>

const emit=defineEmits(['clear','apply']);defineProps({title:{type:String,default:'فیلترها'}})
</script>
<template><aside class="tem-filter-panel"><header><h3>{{title}}</h3><button type="button" @click="emit('clear')">پاک کردن همه</button></header><div class="body"><slot/></div><footer><slot name="actions"><button type="button" @click="emit('apply')">اعمال فیلترها</button></slot></footer></aside></template>
<style scoped>
.tem-filter-panel{direction:rtl;padding:16px;border:1px solid var(--tm-line,#DCE8EF);border-radius:6px;background:var(--tm-surface,#fff)}header,footer{display:flex;align-items:center;justify-content:space-between;gap:8px}h3{margin:0;font-size:14px}header button{border:0;background:none;color:var(--tm-muted,#627D98);font:inherit;font-size:10px;cursor:pointer}.body{display:grid;gap:14px;margin-top:15px}footer{margin-top:16px}footer button{width:100%;min-height:36px;border:0;border-radius:4px;background:#0891B2;color:#fff;font:inherit;font-size:11px;cursor:pointer}
</style>
