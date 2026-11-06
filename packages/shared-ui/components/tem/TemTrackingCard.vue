<script setup>

defineProps({title:String,points:String,value:[String,Number],unit:String,goal:String,icon:String})
</script>
<template><section class="tem-tracking-card"><header><div><strong>{{title}}</strong><small>{{points}}</small></div><span><slot name="icon"><i v-if="icon" :class="icon"/></slot></span></header><div class="value"><strong>{{value}}</strong><small>{{unit}}</small><small class="goal">{{goal}}</small></div><div class="chart"><slot/></div></section></template>
<style scoped>
.tem-tracking-card{direction:rtl;overflow:hidden;border:1px solid var(--tm-line,#eceff5);border-radius:6px;background:var(--tm-surface,#fff)}header{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 0}header>div{display:grid;gap:4px}header strong{font-size:12px}header small,.value small{color:var(--tm-muted,#8c97b2);font-size:10px}header>span{display:grid;place-items:center;width:36px;height:36px;border-radius:6px;background:#eeebfe;color:#8c7bf7}.value{display:flex;align-items:baseline;gap:6px;padding:13px 18px}.value strong{font-size:22px}.goal{margin-inline-start:auto}.chart{padding:0 12px 12px}
</style>
