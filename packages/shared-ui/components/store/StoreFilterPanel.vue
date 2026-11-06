<script setup>
/**
 * StoreFilterPanel — catalogue filter sidebar extracted from
 * `Telecom Market.html` (`.fl`).
 *
 * Provides the reference shell only: a titled card with a "clear" action, a
 * body slot for real filters, and an optional action footer. It does not own
 * filter state, so pages stay in control of API queries.
 */
defineProps({
  title: { type: String, default: 'فیلتر محصولات' },
  clearLabel: { type: String, default: 'حذف همه' },
  showClear: { type: Boolean, default: true },
  icon: { type: String, default: 'pi pi-sliders-h' },
})

defineEmits(['clear', 'apply'])
</script>

<template>
  <aside class="store-filter-panel">
    <header class="store-filter-panel__head">
      <div class="store-filter-panel__title">
        <i :class="icon" aria-hidden="true"></i>
        <b>{{ title }}</b>
      </div>
      <button v-if="showClear" type="button" class="store-filter-panel__clear" @click="$emit('clear')">
        {{ clearLabel }}
      </button>
    </header>

    <div class="store-filter-panel__body">
      <slot />
    </div>

    <footer v-if="$slots.actions" class="store-filter-panel__foot">
      <slot name="actions" :apply="() => $emit('apply')" />
    </footer>
  </aside>
</template>

<style scoped>
.store-filter-panel {
  direction: rtl;
  display: block;
  min-width: 0;
  border: 1px solid var(--tm-line, #e4e7f2);
  border-radius: 4px;
  background: var(--tm-surface, #fff);
  box-shadow: var(--tm-card-shadow, 0 2px 8px rgba(9, 38, 67, 0.06));
  overflow: hidden;
}
.store-filter-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid var(--tm-line, #e4e7f2);
  background: #fbfbfe;
}
.store-filter-panel__title {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--tm-ink, #12182b);
  font-size: 14px;
  font-weight: 700;
}
.store-filter-panel__title i { color: var(--tm-blue, #7c6cf6); }
.store-filter-panel__clear {
  border: 0;
  background: none;
  color: var(--tm-blue, #7c6cf6);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}
.store-filter-panel__clear:hover { color: var(--tm-blue-strong, #6c5ce7); }
.store-filter-panel__clear:focus-visible,
.store-filter-panel__foot :deep(button):focus-visible { outline: 2px solid var(--ds-color-focus, #7c6cf6); outline-offset: 2px; }
.store-filter-panel__body { display: block; min-width: 0; }
.store-filter-panel__foot {
  display: grid;
  gap: 9px;
  padding: 14px 16px;
  border-top: 1px solid var(--tm-line, #e4e7f2);
}
</style>