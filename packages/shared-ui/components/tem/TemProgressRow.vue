<script setup>

defineProps({label:String,percent:{type:[Number,String],default:0},color:{type:String,default:'#8c7bf7'},icon:String})
</script>
<template><div class="tem-progress-row"><div><span><i v-if="icon" :class="icon"/> {{label}}</span><strong>{{percent}}%</strong></div><div class="track" role="progressbar" :aria-valuenow="Number(percent)" aria-valuemin="0" aria-valuemax="100"><span :style="{width:Math.min(100,Math.max(0,Number(percent)||0))+'%',background:color}"/></div></div></template>
<style scoped>
.tem-progress-row{direction:rtl;margin-bottom:14px}.tem-progress-row>div:first-child{display:flex;justify-content:space-between;margin-bottom:6px;font-size:11px}.track{height:7px;overflow:hidden;border-radius:20px;background:var(--tm-line,#eceff5)}.track span{display:block;height:100%;border-radius:inherit}
</style>
