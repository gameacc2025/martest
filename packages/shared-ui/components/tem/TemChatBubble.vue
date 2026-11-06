<script setup>

defineProps({side:{type:String,default:'start'},text:String,time:String,author:String})
</script>
<template><div class="tem-chat-bubble" :class="side"><div><strong v-if="author">{{author}}</strong><section><slot>{{text}}</slot></section><small v-if="time">{{time}}</small></div></div></template>
<style scoped>
.tem-chat-bubble{direction:rtl;display:flex;margin:10px 0}.tem-chat-bubble>div{max-width:78%}.tem-chat-bubble strong,.tem-chat-bubble small{display:block;color:var(--tm-muted,#8c97b2);font-size:9px}.tem-chat-bubble section{margin:4px 0;padding:9px 12px;border-radius:9px 9px 3px 9px;background:#f1f2f6;font-size:12px;line-height:1.8}.tem-chat-bubble.end{justify-content:flex-start}.tem-chat-bubble.end>div{margin-inline-start:auto}.tem-chat-bubble.end section{background:#eeebfe;border-radius:9px 9px 9px 3px}
</style>
