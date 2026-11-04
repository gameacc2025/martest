<script setup>
/**
 * SpecificationTitleAutoComplete
 *
 * A reusable wrapper around PrimeVue's AutoComplete for choosing (or creating)
 * a product specification attribute title. It:
 *   - searches the specification library (debounced) as the user types
 *   - suggests existing attributes so users reuse the same names
 *   - lets the user type a brand-new title (free text) to create a new attribute
 *   - blocks reserved product-core titles (Brand / Model / Category / Subcategory)
 *   - guards against picking a title that already exists on the current product
 *     (duplicate prevention)
 *
 * v-model contract (kept simple for the parent form):
 *   - v-model         → the title string (bound to the AutoComplete value)
 *   - update:fieldId  → emits the selected library field id, or null for a
 *                       free-text / new attribute.
 *
 * The component never talks to the store or mutates business state; it only
 * reads from specificationLibraryApi for suggestions.
 */
import { ref } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import { specificationLibraryApi } from '@telecom/api-client'
import { isReservedSpecTitle, normalizeSpecTitle } from '../../config/productReservedSpecificationKeys'

const props = defineProps({
  // The bound title string.
  modelValue: { type: String, default: '' },
  // Titles already used by other attributes on the product (for dedupe).
  // Normalized comparison is applied, so pass raw titles.
  existingTitles: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'عنوان ویژگی (مثلاً تعداد پورت)' },
  searchLimit: { type: Number, default: 15 },
  debounceMs: { type: Number, default: 300 },
})

const emit = defineEmits(['update:modelValue', 'update:fieldId', 'invalid'])

const suggestions = ref([])
let searchTimer = null

/**
 * Debounced search against the specification library. Reserved titles are
 * filtered out of the suggestion list so they can never be selected.
 */
function onSearch(event) {
  const query = (event.query || '').trim()
  clearTimeout(searchTimer)
  if (query.length < 1) {
    suggestions.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      const response = await specificationLibraryApi.search(query, props.searchLimit)
      const body = response.data
      const list = body?.data || body || []
      suggestions.value = list.filter((item) => !isReservedSpecTitle(item?.title))
    } catch {
      suggestions.value = []
    }
  }, props.debounceMs)
}

// Is `title` already used by another attribute on this product?
function isDuplicateTitle(title) {
  const normalized = normalizeSpecTitle(title)
  if (!normalized) return false
  return props.existingTitles.some((t) => normalizeSpecTitle(t) === normalized)
}

// AutoComplete emits strings (free text) or objects (selected suggestions).
function extractTitle(value) {
  if (value && typeof value === 'object') return value.title || ''
  return value || ''
}

function onModelUpdate(value) {
  const title = extractTitle(value)
  emit('update:modelValue', title)
  // Free text clears any previously selected library field id.
  if (typeof value === 'string') emit('update:fieldId', null)
}

function onItemSelect(event) {
  const field = event.value
  const title = field?.title || ''

  if (isReservedSpecTitle(title)) {
    emit('invalid', { reason: 'reserved', title })
    emit('update:modelValue', '')
    emit('update:fieldId', null)
    return
  }
  if (isDuplicateTitle(title)) {
    emit('invalid', { reason: 'duplicate', title })
    emit('update:modelValue', '')
    emit('update:fieldId', null)
    return
  }

  emit('update:modelValue', title)
  emit('update:fieldId', field?.id ?? null)
}

// On blur, validate the final free-text value.
function onBlur() {
  const title = (props.modelValue || '').trim()
  if (!title) return
  if (isReservedSpecTitle(title)) {
    emit('invalid', { reason: 'reserved', title })
    emit('update:modelValue', '')
    emit('update:fieldId', null)
    return
  }
  if (isDuplicateTitle(title)) {
    emit('invalid', { reason: 'duplicate', title })
    emit('update:modelValue', '')
    emit('update:fieldId', null)
  }
}
</script>

<template>
  <AutoComplete
    :modelValue="modelValue"
    :suggestions="suggestions"
    optionLabel="title"
    :placeholder="placeholder"
    dropdown
    completeOnFocus
    @complete="onSearch"
    @update:modelValue="onModelUpdate"
    @item-select="onItemSelect"
    @blur="onBlur"
  />
</template>
