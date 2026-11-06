<script setup>

defineProps({name:String,description:String,detail:String,users:[String,Number],permissions:[String,Number],system:Boolean});const emit=defineEmits(['permissions','users'])
</script>
<template><article class="tem-role-card"><header><span class="icon"><slot name="icon"><i class="pi pi-shield"/></slot></span><div><strong>{{name}}</strong><small>{{description}}</small></div><TemBadge v-if="system" tone="neutral">سیستمی</TemBadge></header><p>{{detail}}</p><div class="metrics"><span>کاربران <b>{{users}}</b></span><span>دسترسی‌ها <b>{{permissions}}</b></span></div><footer><button @click="emit('permissions')">مشاهده دسترسی‌ها</button><button @click="emit('users')">مشاهده کاربران</button></footer></article></template>
<style scoped>
.tem-role-card{direction:rtl;padding:16px;border:1px solid var(--tm-line,#eceff5);border-radius:6px;background:var(--tm-surface,#fff)}header{display:flex;align-items:center;gap:9px}.icon{display:grid;place-items:center;width:38px;height:38px;border-radius:6px;background:#eeebfe;color:#8c7bf7}header>div{display:grid;gap:3px}header strong{font-size:12px}header small,.role-badge{color:var(--tm-muted,#8c97b2);font-size:10px}p{min-height:38px;color:var(--tm-muted,#8c97b2);font-size:10px;line-height:1.8}.metrics{display:flex;gap:22px;font-size:10px}.metrics b{display:block;font-size:17px}footer{display:flex;gap:7px;margin-top:12px}footer button{flex:1;padding:7px;border:1px solid var(--tm-line,#eceff5);border-radius:4px;background:none;font:inherit;font-size:10px;cursor:pointer}
</style>
