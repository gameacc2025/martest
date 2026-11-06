<script setup>
import {ref} from 'vue';
const p=defineProps({question:String,answer:String,number:[String,Number],initiallyOpen:Boolean});const open=ref(p.initiallyOpen)
</script>
<template><section class="tem-faq-item"><button type="button" :aria-expanded="open" @click="open=!open"><span>{{number?number+'. ':''}}{{question}}</span><i class="pi" :class="open?'pi-minus':'pi-plus'"/></button><div v-if="open" class="answer"><slot>{{answer}}</slot></div></section></template>
<style scoped>
.tem-faq-item{direction:rtl;border-bottom:1px solid var(--tm-line,#eceff5)}.tem-faq-item>button{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;padding:14px 3px;border:0;background:none;color:inherit;text-align:right;font:inherit;font-size:12px;cursor:pointer}.tem-faq-item i{color:#8c7bf7}.answer{padding:0 3px 14px;color:var(--tm-muted,#8c97b2);font-size:11px;line-height:1.9}
</style>
