<script setup>
/** TemUserCell — avatar + primary/secondary identity line for tables. */
import TemAvatar from './TemAvatar.vue'

defineProps({
  name: { type: String, default: '—' },
  meta: { type: String, default: '' },
  src: { type: String, default: '' },
})
</script>

<template>
  <span class="tm-user-cell">
    <TemAvatar :name="name" :src="src" />
    <span class="tm-user-cell__text">
      <span class="tm-user-cell__name">{{ name }}</span>
      <span v-if="meta" class="tm-user-cell__meta">{{ meta }}</span>
    </span>
  </span>
</template>