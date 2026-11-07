<script setup>
import {computed} from 'vue';
const p=defineProps({title:String,value:[String,Number],trend:String,subtitle:String,icon:String,color:{type:String,default:'primary'},variant:{type:String,default:'default'},direction:{type:String,default:'up'}});const trendClass=computed(()=>p.direction==='down'?'down':p.direction==='neutral'?'neutral':'up')
</script>
<template><article class="tem-stat-card" :class="['v-'+variant,'c-'+color]"><template v-if="variant==='icon'"><span class="icon"><slot name="icon"><i v-if="icon" :class="icon"/></slot></span><div class="copy"><strong>{{value}}</strong><small>{{title}}</small></div><b v-if="trend" class="trend" :class="trendClass">{{trend}}</b></template><template v-else><header><span>{{title}}</span><span class="icon"><slot name="icon"><i v-if="icon" :class="icon"/></slot></span></header><div class="value"><strong>{{value}}</strong><b v-if="trend" class="trend" :class="trendClass">{{trend}}</b></div><small v-if="subtitle">{{subtitle}}</small><slot/></template></article></template>
<style scoped>
.tem-stat-card{direction:rtl;display:flex;flex-direction:column;gap:10px;padding:17px 19px;border:1px solid var(--ds-color-border);border-radius:var(--ds-card-radius);background:var(--ds-color-surface);color:var(--ds-color-text);box-shadow:var(--ds-shadow-xs);transition:box-shadow .2s,transform .2s}
.tem-stat-card:hover{box-shadow:var(--ds-shadow-md);transform:translateY(-1px)}
.tem-stat-card header,.value{display:flex;align-items:center;justify-content:space-between;gap:10px}
.icon{display:grid;place-items:center;width:39px;height:39px;border-radius:8px;background:var(--tint,var(--ds-color-primary-soft));color:var(--tone,var(--ds-color-primary))}
.value strong,.copy strong{font-size:24px;font-weight:800;font-variant-numeric:tabular-nums}
.tem-stat-card small,.copy small,header>span:first-child{color:var(--ds-color-text-muted);font-size:11px}
.v-icon{flex-direction:row;align-items:center}.copy{display:grid;flex:1;gap:2px}.trend{font-size:10px}.up{color:var(--ds-status-success-fg)}.down{color:var(--ds-status-danger-fg)}.neutral{color:var(--ds-color-text-muted)}
.v-tint{background:var(--tint);border-color:transparent}.v-edge{border-inline-start:4px solid var(--tone)}.v-center{align-items:center;text-align:center}.v-center .icon{border-radius:50%}.v-gradient{background:linear-gradient(140deg,var(--tint),var(--ds-color-surface));border:0}
.c-primary{--tone:var(--ds-color-primary);--tint:var(--ds-color-primary-soft)}.c-success{--tone:var(--ds-status-success-fg);--tint:var(--ds-status-success-bg)}.c-info{--tone:var(--ds-status-info-fg);--tint:var(--ds-status-info-bg)}.c-warning{--tone:var(--ds-status-warning-fg);--tint:var(--ds-status-warning-bg)}.c-danger{--tone:var(--ds-status-danger-fg);--tint:var(--ds-status-danger-bg)}.c-secondary{--tone:var(--ds-color-secondary);--tint:color-mix(in srgb,var(--ds-color-secondary) 12%,transparent)}
@media(prefers-reduced-motion:reduce){.tem-stat-card{transition:none}.tem-stat-card:hover{transform:none}}
</style>
