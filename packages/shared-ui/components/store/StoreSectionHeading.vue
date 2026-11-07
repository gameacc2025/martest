<script setup>
/**
 * StoreSectionHeading — section header extracted from `Telecom Market.html` (`.sh`).
 *
 * A single, reusable storefront heading: title + optional eyebrow/subtitle on the
 * start side, an action link (or custom slot) on the end side, and the reference's
 * short gradient underline under the title.
 *
 * Renders real navigation only; it never invents counts or copy.
 */
defineProps({
  title: { type: String, required: true },
  headingId: { type: String, default: undefined },
  eyebrow: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
  actionTo: { type: [String, Object], default: null },
  actionIcon: { type: String, default: 'pi pi-arrow-left' },
})
</script>

<template>
  <header class="store-section-heading">
    <div class="store-section-heading__copy">
      <span v-if="eyebrow" class="store-section-heading__eyebrow">{{ eyebrow }}</span>
      <h2 :id="headingId" class="store-section-heading__title">{{ title }}</h2>
      <p v-if="subtitle" class="store-section-heading__subtitle">{{ subtitle }}</p>
    </div>
    <div class="store-section-heading__actions">
      <slot name="actions">
        <router-link v-if="actionTo && actionLabel" :to="actionTo" class="store-section-heading__link">
          {{ actionLabel }} <i :class="actionIcon" aria-hidden="true"></i>
        </router-link>
      </slot>
    </div>
  </header>
</template>

<style scoped>
.store-section-heading {
  direction: rtl;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--tm-line, #DCE8EF);
}
.store-section-heading__copy { min-width: 0; }
.store-section-heading__eyebrow {
  display: block;
  margin-bottom: 3px;
  color: var(--tm-blue, #0891B2);
  font-size: 11px;
  font-weight: 700;
}
.store-section-heading__title {
  position: relative;
  margin: 0;
  color: var(--tm-ink, #102A43);
  font-size: clamp(17px, 1.4vw, 21px);
  font-weight: 800;
  line-height: 1.5;
}
.store-section-heading__title::after {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  bottom: -11px;
  width: 46px;
  height: 3px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--tm-cyan, #22D3EE), var(--tm-blue, #0891B2));
}
.store-section-heading__subtitle {
  margin: 8px 0 0;
  color: var(--tm-muted, #627D98);
  font-size: 12px;
  line-height: 1.8;
}
.store-section-heading__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 10px;
}
.store-section-heading__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--tm-blue, #0891B2);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}
.store-section-heading__link:hover { color: var(--tm-blue-strong, #0E7490); }
.store-section-heading__link:focus-visible { outline: 2px solid var(--ds-color-focus, #0891B2); outline-offset: 2px; }

@media (max-width: 640px) {
  .store-section-heading { align-items: flex-start; flex-wrap: wrap; gap: 8px; }
  .store-section-heading__title { font-size: 17px; }
}
</style>