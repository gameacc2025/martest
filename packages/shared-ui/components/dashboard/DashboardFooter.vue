<script setup>
/**
 * DashboardFooter
 *
 * Minimal shared footer for the dashboard shell. Presentational only.
 */
import { computed } from 'vue'

const year = computed(() => new Date().getFullYear())
</script>

<template>
  <footer class="dash-footer">
    <span class="dash-footer-copy">© {{ year }} Telecom Market</span>
    <span class="dash-footer-note">پنل مدیریت بازارگاه</span>
  </footer>
</template>

<style scoped>
.dash-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem 0;
  margin-top: auto;
  border-top: 1px solid var(--surface-border);
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}
</style>
