<script setup>
/**
 * TemPanel — flat, bordered content surface with an optional header.
 *
 * Slots: default (body), #actions (header right), #footer.
 */
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  /** Remove body padding for edge-to-edge tables / charts. */
  flush: { type: Boolean, default: false },
})
</script>

<template>
  <section class="tm-panel">
    <header v-if="title || $slots.actions" class="tm-panel__head">
      <div class="tm-panel__heading">
        <h2 class="tm-panel__title">
          <i v-if="icon" :class="icon" aria-hidden="true" class="tm-panel__icon"></i>
          {{ title }}
        </h2>
        <p v-if="subtitle" class="tm-panel__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="tm-panel__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="tm-panel__body" :class="{ 'tm-panel__body--flush': flush }">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="tm-panel__foot">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.tm-panel__heading { min-width: 0; }
.tm-panel__icon { margin-inline-end: 6px; color: var(--tm-cyan-deep); font-size: 0.95em; }
</style>