<script setup>
/**
 * SystemStatus — service/health indicators for the command center.
 *
 * Presentational: the parent supplies a list of services with their current
 * state. No polling or fabricated health checks here — wire real probes in the
 * parent and pass the results down. Token-driven styling.
 *
 * item shape: { name, status: 'operational'|'degraded'|'down'|'unknown', detail? }
 */
import { computed } from 'vue'

const props = defineProps({
  services: { type: Array, default: () => [] },
})

const statusMeta = {
  operational: { label: 'عملیاتی', tone: 'success', icon: 'pi pi-check-circle' },
  degraded: { label: 'کاهش کارایی', tone: 'warning', icon: 'pi pi-exclamation-triangle' },
  down: { label: 'قطع', tone: 'danger', icon: 'pi pi-times-circle' },
  unknown: { label: 'نامشخص', tone: 'gray', icon: 'pi pi-question-circle' },
}

const meta = (status) => statusMeta[status] || statusMeta.unknown

// Overall banner reflects the worst service state.
const overall = computed(() => {
  if (!props.services.length) return statusMeta.unknown
  if (props.services.some((s) => s.status === 'down')) return statusMeta.down
  if (props.services.some((s) => s.status === 'degraded')) return statusMeta.degraded
  if (props.services.every((s) => s.status === 'operational')) return statusMeta.operational
  return statusMeta.unknown
})
</script>

<template>
  <div class="system-status">
    <div class="system-status-overall" :class="`system-status--${overall.tone}`">
      <i :class="overall.icon"></i>
      <span>{{ overall === statusMeta.operational ? 'همه سرویس‌ها عملیاتی هستند' : overall.label }}</span>
    </div>

    <ul class="system-status-list">
      <li v-for="svc in services" :key="svc.name" class="system-status-item">
        <span class="system-status-dot" :class="`system-status--${meta(svc.status).tone}`"></span>
        <span class="system-status-name">{{ svc.name }}</span>
        <span v-if="svc.detail" class="system-status-detail">{{ svc.detail }}</span>
        <span class="system-status-label" :class="`system-status-label--${meta(svc.status).tone}`">
          {{ meta(svc.status).label }}
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.system-status {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.system-status-overall {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3) var(--ds-space-4);
  border-radius: var(--ds-radius-md);
  font-weight: var(--ds-font-weight-semibold);
  font-size: var(--ds-font-size-sm);
}

.system-status-overall.system-status--success { background: var(--ds-color-success-soft); color: var(--ds-color-success); }
.system-status-overall.system-status--warning { background: var(--ds-color-warning-soft); color: var(--ds-color-warning); }
.system-status-overall.system-status--danger  { background: var(--ds-color-danger-soft);  color: var(--ds-color-danger); }
.system-status-overall.system-status--gray    { background: var(--ds-color-surface-alt);  color: var(--ds-color-text-muted); }

.system-status-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.system-status-item {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) 0;
  border-bottom: 1px solid var(--ds-color-border);
}

.system-status-item:last-child {
  border-bottom: none;
}

.system-status-dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: var(--ds-radius-circle);
  flex-shrink: 0;
}

.system-status-dot.system-status--success { background: var(--ds-color-success); }
.system-status-dot.system-status--warning { background: var(--ds-color-warning); }
.system-status-dot.system-status--danger  { background: var(--ds-color-danger); }
.system-status-dot.system-status--gray    { background: var(--ds-color-text-muted); }

.system-status-name {
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text);
}

.system-status-detail {
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
}

.system-status-label {
  margin-inline-start: auto;
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
}

.system-status-label--success { color: var(--ds-color-success); }
.system-status-label--warning { color: var(--ds-color-warning); }
.system-status-label--danger  { color: var(--ds-color-danger); }
.system-status-label--gray    { color: var(--ds-color-text-muted); }
</style>
