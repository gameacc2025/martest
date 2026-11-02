<script setup>
import { computed } from 'vue'

const props = defineProps({
  checks: { type: Array, required: true },
  eyebrow: { type: String, default: 'پیشرفت تکمیل فرم' },
  title: { type: String, default: 'اطلاعات ضروری' },
})

const completedCount = computed(() => props.checks.filter((item) => item.complete).length)
const percentage = computed(() => props.checks.length
  ? Math.round((completedCount.value / props.checks.length) * 100)
  : 100)
</script>

<template>
  <section class="required-fields-progress" aria-label="تکمیل اطلاعات ضروری">
    <div class="progress-heading">
      <div>
        <span class="progress-eyebrow">{{ eyebrow }}</span>
        <strong>{{ title }}</strong>
      </div>
      <span class="progress-value" aria-live="polite">
        {{ completedCount.toLocaleString('fa-IR') }} از {{ checks.length.toLocaleString('fa-IR') }}
      </span>
    </div>
    <div
      class="progress-track"
      role="progressbar"
      :aria-valuenow="percentage"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="`تکمیل ${percentage} درصد از اطلاعات ضروری`"
    >
      <span :style="{ width: percentage + '%' }"></span>
    </div>
    <div class="progress-checks">
      <span
        v-for="item in checks"
        :key="item.key"
        class="progress-check"
        :class="{ 'is-complete': item.complete }"
      >
        <i :class="item.complete ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
        {{ item.label }}
      </span>
    </div>
  </section>
</template>

<style scoped>
.required-fields-progress {
  display: grid;
  gap: .85rem;
  padding: 1.1rem 1.35rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.progress-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.progress-heading > div { display: grid; gap: .15rem; }
.progress-eyebrow {
  color: var(--ds-color-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
.progress-heading strong {
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-sm);
}
.progress-value {
  color: var(--ds-color-primary-text);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-bold);
  white-space: nowrap;
}
.progress-track {
  height: .45rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--ds-color-surface-alt);
}
.progress-track > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--ds-color-primary);
  transition: width var(--ds-transition);
}
.progress-checks {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .55rem;
}
.progress-check {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .35rem .65rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-pill);
  color: var(--ds-color-text-muted);
  background: var(--ds-color-surface-alt);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
}
.progress-check.is-complete {
  border-color: color-mix(in srgb, var(--ds-color-success) 30%, var(--ds-color-border));
  color: var(--ds-status-success-fg);
  background: var(--ds-status-success-bg);
}
.progress-check i { font-size: .8rem; }
@media (max-width: 640px) {
  .required-fields-progress { padding: 1rem; }
  .progress-checks { gap: .4rem; }
  .progress-check { flex: 1 1 calc(50% - .4rem); justify-content: center; }
}
</style>
