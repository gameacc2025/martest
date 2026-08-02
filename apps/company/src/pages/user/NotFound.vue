<template>
  <div class="notfound-page">
    <NotFoundState :home-to="{ name: 'root' }" />
  </div>
</template>

<script setup>
import { NotFoundState } from '@telecom/shared-ui/components/common/feedback'
</script>

<style scoped>
.notfound-page {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
