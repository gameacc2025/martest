<script setup>
/**
 * InquiryPipeline — horizontal funnel of inquiry stages.
 *
 * Presentational: the parent maps real inquiry stats into a stages array and
 * passes them in. Each stage shows a count and is optionally clickable (to a
 * filtered list route). No fabricated data or business logic. Token-driven.
 *
 * stage shape: { key, label, value, tone?, icon?, to? }
 */
defineProps({
  stages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const faNumber = (v) => (Number(v) || 0).toLocaleString('fa-IR')
</script>

<template>
  <div class="inquiry-pipeline">
    <component
      :is="stage.to ? 'router-link' : 'div'"
      v-for="(stage, i) in stages"
      :key="stage.key"
      :to="stage.to || undefined"
      class="pipeline-stage"
      :class="[`pipeline-stage--${stage.tone || 'primary'}`, { 'pipeline-stage--link': stage.to }]"
    >
      <div class="pipeline-stage-top">
        <span class="pipeline-stage-icon">
          <i :class="stage.icon || 'pi pi-circle-fill'"></i>
        </span>
        <span v-if="loading" class="pipeline-stage-value pipeline-stage-value--skeleton"></span>
        <span v-else class="pipeline-stage-value">{{ faNumber(stage.value) }}</span>
      </div>
      <span class="pipeline-stage-label">{{ stage.label }}</span>
      <i v-if="i < stages.length - 1" class="pi pi-angle-left pipeline-stage-connector" aria-hidden="true"></i>
    </component>
  </div>
</template>

<style scoped>
.inquiry-pipeline {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--ds-space-3);
}

.pipeline-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  text-decoration: none;
  color: inherit;
  border-top: 3px solid var(--stage-accent);
  transition: box-shadow var(--ds-transition), transform var(--ds-transition);
}

.pipeline-stage--link:hover {
  box-shadow: var(--ds-shadow-md);
  transform: translateY(-2px);
}

.pipeline-stage-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-2);
}

.pipeline-stage-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--ds-radius-sm);
  background: var(--stage-soft);
  color: var(--stage-accent);
  font-size: 0.85rem;
}

.pipeline-stage-value {
  font-size: var(--ds-font-size-2xl);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-text);
  line-height: 1;
}

.pipeline-stage-value--skeleton {
  width: 2.5rem;
  height: 1.5rem;
  border-radius: var(--ds-radius-sm);
  background: var(--ds-color-surface-alt);
  animation: pipeline-pulse 1.2s ease-in-out infinite;
}

@keyframes pipeline-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.pipeline-stage-label {
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
  font-weight: var(--ds-font-weight-medium);
}

/* Chevron connector between stages (RTL: points left toward next stage). */
.pipeline-stage-connector {
  position: absolute;
  inset-inline-start: calc(-1 * var(--ds-space-3) - 0.35rem);
  top: 50%;
  transform: translateY(-50%);
  color: var(--ds-color-text-muted);
  font-size: 0.9rem;
}

.pipeline-stage--primary { --stage-accent: var(--ds-color-primary); --stage-soft: var(--ds-color-info-soft); }
.pipeline-stage--info    { --stage-accent: var(--ds-color-info);    --stage-soft: var(--ds-color-info-soft); }
.pipeline-stage--success { --stage-accent: var(--ds-color-success); --stage-soft: var(--ds-color-success-soft); }
.pipeline-stage--warning { --stage-accent: var(--ds-color-warning); --stage-soft: var(--ds-color-warning-soft); }
.pipeline-stage--danger  { --stage-accent: var(--ds-color-danger);  --stage-soft: var(--ds-color-danger-soft); }

@media (max-width: 640px) {
  .inquiry-pipeline {
    grid-template-columns: repeat(2, 1fr);
  }
  .pipeline-stage-connector {
    display: none;
  }
}
</style>
