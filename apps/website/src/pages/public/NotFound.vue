<template>
  <div class="notfound-page">
    <NotFoundState :home-to="{ name: 'home' }" />
  </div>
</template>

<script setup>
/**
 * 404 route — thin page wrapper around the shared NotFoundState component so
 * the "page not found" screen matches the app-wide enterprise state UX.
 */
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
