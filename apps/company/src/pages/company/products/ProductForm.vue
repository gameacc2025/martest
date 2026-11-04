<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { productsApi, companiesApi, categoriesApi, API_BASE_URL } from '@telecom/api-client'
import { useAuthStore } from '../../../stores/auth'




import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import SpecificationTitleAutoComplete from '@telecom/shared-ui/components/products/SpecificationTitleAutoComplete.vue'
import { isReservedSpecTitle } from '@telecom/shared-ui/config/productReservedSpecificationKeys'

import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import Calendar from 'primevue/calendar'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import FileUpload from 'primevue/fileupload'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import RequiredFieldsProgress from '@telecom/shared-ui/components/common/RequiredFieldsProgress.vue'
import FormSectionHeader from '@telecom/shared-ui/components/common/FormSectionHeader.vue'
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

// Only SUPER_ADMIN picks a company explicitly. Company representatives
// have their product auto-assigned to their own company by the backend.
const canChooseCompany = computed(() => auth.isSuperAdmin)
const canFeature = computed(() => auth.isSuperAdmin || auth.hasPermission('products.feature'))

// A presentation-only completion summary derived from the same required fields
// enforced by validate(); it does not replace validation or alter the payload.
const requiredFormChecks = computed(() => {
  const checks = [
    { key: 'title', label: 'عنوان محصول', complete: !!form.value.title?.trim() },
    { key: 'category', label: 'دسته‌بندی', complete: !!form.value.categoryId },
    { key: 'subcategory', label: 'زیردسته', complete: !!form.value.subcategoryId },
  ]
  if (canChooseCompany.value) {
    checks.splice(1, 0, { key: 'company', label: 'شرکت', complete: !!form.value.companyId })
  }
  return checks
})

// Derive the backend origin from the API base URL (strip the /api/... suffix)
// so relative upload paths like "/uploads/..." resolve to the API server.
const mediaOrigin = computed(() => {
  const base = API_BASE_URL || ''
  if (/^https?:\/\//i.test(base)) {
    try { return new URL(base).origin } catch { return '' }
  }
  return ''
})

// Resolve a stored media URL (which is relative, e.g. /uploads/...) to a
// fully-qualified URL the browser can load from the backend.
function resolveMediaUrl(url) {
  if (!url) return url
  if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) return url
  return `${mediaOrigin.value}${url.startsWith('/') ? '' : '/'}${url}`
}

const isEditMode = computed(() => !!route.params.id)

const pageLoading = ref(false)
const saving = ref(false)

// Form data
const form = ref({
  title: '',
  shortDescription: '',
  description: '',
  sku: '',
  brand: '',
  model: '',
  companyId: null,
  categoryId: null,
  subcategoryId: null,
  visibility: 'PUBLIC',
  isFeatured: false,
})

// Change reason (for edits)
const changeReason = ref('')

// Related data
const companies = ref([])
const categories = ref([])
const subcategories = ref([])

// Specifications
// `templateFields` holds the standard spec fields for the selected subcategory.
// `specValues` maps field.key -> value (bound to inputs) → saved under `standard`.
// `customSpecs` holds user-defined { fieldId, title, value } entries → saved under `attributes`.
const templateFields = ref([])

const templateLoading = ref(false)
const specValues = ref({})
const customSpecs = ref([])
// Loaded specifications from an existing product, applied once the template arrives.
const pendingSpecifications = ref(null)


// Price tiers
const priceTiers = ref([])

// Images
const productImages = ref([])
const newImages = ref([])

// Documents
const productDocuments = ref([])
const newDocuments = ref([])

// Validation
const errors = ref({})

onMounted(async () => {
  pageLoading.value = true
  try {
    // Only SUPER_ADMIN may list companies (company users are auto-assigned
    // their own company by the backend, and GET /companies 403s for them).
    const initial = [loadCategories()]
    if (canChooseCompany.value) initial.push(loadCompanies())
    await Promise.all(initial)
    if (isEditMode.value) {
      await loadProduct(route.params.id)
    }
  } finally {
    pageLoading.value = false
  }
})


async function loadCompanies() {
  try {
    const response = await companiesApi.list({ limit: 100 })
    const body = response.data
    companies.value = body?.data || body || []
  } catch (err) {
    console.error('Error loading companies:', err)
  }
}

async function loadCategories() {
  try {
    const response = await categoriesApi.list()
    const body = response.data
    categories.value = body?.data || body || []
  } catch (err) {
    console.error('Error loading categories:', err)
  }
}

async function loadSubcategories(categoryId) {
  if (!categoryId) {
    subcategories.value = []
    return
  }
  try {
    const response = await categoriesApi.getById(categoryId)
    const body = response.data
    const category = body?.data || body
    subcategories.value = category?.subcategories || []
  } catch (err) {
    console.error('Error loading subcategories:', err)
    subcategories.value = []
  }
}

// The `specifications` JSON has two top-level keys:
//   - `standard`:   template-driven values keyed by field.key
//   - `attributes`: user-defined { fieldId, title, value } entries
const STANDARD_KEY = 'standard'
const ATTRIBUTES_KEY = 'attributes'


/**
 * Load the specification template (standard fields) for the selected
 * subcategory and rebuild the spec inputs. Applies any pending values
 * loaded from an existing product.
 */
async function loadSpecificationTemplate(categoryId, subcategoryId) {
  templateFields.value = []
  if (!categoryId || !subcategoryId) {
    rebuildSpecValues()
    return
  }
  templateLoading.value = true
  try {
    const response = await categoriesApi.getSubcategory(categoryId, subcategoryId)
    const body = response.data
    const subcategory = body?.data || body
    const template = subcategory?.specificationTemplate
    // Brand / Model / Category / Subcategory are PRODUCT CORE fields (edited at
    // the top of the form). If a subcategory's spec template also defines them,
    // drop those entries so they are NOT rendered a second time inside
    // "Technical Specifications" — the top-level fields stay the single source
    // of truth (see productReservedSpecificationKeys).
    const rawFields = template?.isActive ? (template.fields || []) : []
    templateFields.value = rawFields.filter(
      (field) => !isReservedSpecTitle(field.key) && !isReservedSpecTitle(field.name)
    )
  } catch (err) {
    console.error('Error loading specification template:', err)
    templateFields.value = []
  } finally {
    templateLoading.value = false
    rebuildSpecValues()
  }
}

/**
 * Initialize `specValues` for the current template fields, seeding from
 * any pending (loaded) specifications. MULTI_SELECT defaults to [].
 */
function rebuildSpecValues() {
  const source = pendingSpecifications.value || {}
  const next = {}
  for (const field of templateFields.value) {
    const existing = source[field.key]
    if (existing !== undefined) {
      next[field.key] = existing
    } else {
      next[field.key] = field.type === 'MULTI_SELECT' ? [] : null
    }
  }
  specValues.value = next
}

function specFieldOptions(field) {
  if (!Array.isArray(field.options)) return []
  return field.options.map((opt) => {
    if (opt && typeof opt === 'object') {
      const value = String(opt.value ?? opt.key ?? opt.label ?? opt.name ?? '')
      return { label: String(opt.label ?? opt.name ?? value), value }
    }
    return { label: String(opt), value: String(opt) }
  }).filter((o) => o.value)
}

function addCustomSpec() {
  // fieldId is null for brand-new user-defined attributes.
  customSpecs.value.push({ fieldId: null, title: '', value: '' })
}


function removeCustomSpec(index) {
  customSpecs.value.splice(index, 1)
}

/**
 * Titles used by all OTHER custom attribute rows (excluding `currentSpec`),
 * passed to the autocomplete so it can prevent picking a duplicate title.
 */
function otherCustomTitles(currentSpec) {
  return customSpecs.value
    .filter((s) => s !== currentSpec)
    .map((s) => s.title)
    .filter(Boolean)
}

/**
 * The autocomplete emits `invalid` when the user tries to pick/type a reserved
 * (Brand / Model / Category / Subcategory) or duplicate title. Surface a toast
 * so the reason is clear; the component already cleared the field.
 */
function onSpecInvalid({ reason, title }) {
  if (reason === 'reserved') {
    toast.add({
      severity: 'warn',
      summary: 'عنوان غیرمجاز',
      detail: `"${title}" یک فیلد اصلی محصول است و نمی‌تواند به‌عنوان ویژگی استفاده شود`,
      life: 4000,
    })
  } else if (reason === 'duplicate') {
    toast.add({
      severity: 'warn',
      summary: 'عنوان تکراری',
      detail: `ویژگی "${title}" قبلاً اضافه شده است`,
      life: 4000,
    })
  }
}



/**
 * Build the `specifications` JSON payload:
 *   {
 *     "standard":   { "<field.key>": <value>, ... },   // template-driven
 *     "attributes": [ { fieldId, title, value }, ... ] // user-defined
 *   }
 * - Empty standard values are omitted so we don't send nulls.
 * - Attributes carry fieldId (existing SpecificationField id) or null (new).
 */
function buildSpecificationsPayload() {
  const standard = {}
  for (const field of templateFields.value) {
    const value = specValues.value[field.key]
    if (value === null || value === undefined || value === '') continue
    if (Array.isArray(value) && value.length === 0) continue
    standard[field.key] = value
  }

  const attributes = customSpecs.value
    .map((c) => ({
      fieldId: c.fieldId ?? null,
      title: (c.title || '').trim(),
      value: c.value,
    }))
    .filter((c) => c.title !== '' && c.value !== null && c.value !== undefined && c.value !== '')

  const specs = {}
  specs[STANDARD_KEY] = standard
  specs[ATTRIBUTES_KEY] = attributes
  return specs
}

async function loadProduct(id) {
  try {
    // Use the authenticated management fetch so DRAFT/PENDING_REVIEW/REJECTED
    // products (which the public getById would 404 on) load correctly for
    // their owner / SUPER_ADMIN.
    const response = await productsApi.getForEdit(id)
    const body = response.data
    const product = body?.data || body

    form.value = {
      title: product.title || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      sku: product.sku || '',
      brand: product.brand || '',
      model: product.model || '',
      companyId: product.companyId || null,
      categoryId: product.categoryId || null,
      subcategoryId: product.subcategoryId || null,
      visibility: product.visibility || 'PUBLIC',
      isFeatured: product.isFeatured || false,
    }

    priceTiers.value = (product.prices || []).map(p => ({
      id: p.id,
      minQuantity: p.minQuantity,
      maxQuantity: p.maxQuantity,
      price: p.price,
      unit: p.unit || '',
    }))

    productImages.value = (product.images || []).map(img => ({
      id: img.id,
      url: img.url,
      altText: img.altText || '',
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    }))

    productDocuments.value = (product.documents || []).map(doc => ({
      id: doc.id,
      url: doc.url,
      title: doc.title || '',
      type: doc.type,
    }))

    // Stash existing specifications; template load will seed the inputs.
    // New structure: { standard: {...}, attributes: [{ fieldId, title, value }] }
    const loadedSpecs = product.specifications && typeof product.specifications === 'object'
      ? product.specifications
      : {}
    const loadedAttributes = Array.isArray(loadedSpecs[ATTRIBUTES_KEY]) ? loadedSpecs[ATTRIBUTES_KEY] : []
    customSpecs.value = loadedAttributes.map((a) => ({
      fieldId: a?.fieldId ?? null,
      title: a?.title || '',
      value: a?.value ?? '',
    }))
    pendingSpecifications.value = loadedSpecs[STANDARD_KEY] && typeof loadedSpecs[STANDARD_KEY] === 'object'
      ? { ...loadedSpecs[STANDARD_KEY] }
      : {}


    if (product.categoryId) {
      await loadSubcategories(product.categoryId)
    }
    if (product.categoryId && product.subcategoryId) {
      await loadSpecificationTemplate(product.categoryId, product.subcategoryId)
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'خطا در دریافت اطلاعات محصول',
      detail: extractApiError(err, 'خطا در دریافت اطلاعات محصول'),
      life: 5000,
    })
    router.push({ name: 'manage-products' })
  }
}

watch(() => form.value.categoryId, (newVal) => {
  form.value.subcategoryId = null
  loadSubcategories(newVal)
})

// When the subcategory changes, (re)load its spec template.
// In create mode we drop any pending values so inputs start clean.
watch(() => form.value.subcategoryId, (newVal, oldVal) => {
  if (newVal === oldVal) return
  if (!isEditMode.value) pendingSpecifications.value = null
  loadSpecificationTemplate(form.value.categoryId, newVal)
})

function addPriceTier() {
  priceTiers.value.push({
    minQuantity: 1,
    maxQuantity: null,
    price: 0,
    unit: '',
  })
}

function removePriceTier(index) {
  priceTiers.value.splice(index, 1)
}

function validate() {
  errors.value = {}
  if (!form.value.title?.trim()) errors.value.title = 'عنوان الزامی است'
  // Company is only required (and selectable) for SUPER_ADMIN. For company
  // representatives, the backend auto-assigns their own company.
  if (canChooseCompany.value && !form.value.companyId) errors.value.companyId = 'شرکت الزامی است'
  if (!form.value.categoryId) errors.value.categoryId = 'دسته‌بندی الزامی است'

  if (!form.value.subcategoryId) errors.value.subcategoryId = 'زیردسته الزامی است'
  return Object.keys(errors.value).length === 0
}

/**
 * Build the request body for create/update, matching the backend schema
 * (which uses `additionalProperties: false`). We must NOT send:
 *   - `companyId: null` (schema requires a positive integer; company users
 *     have it auto-assigned by the backend, so we omit it entirely).
 *   - empty-string text fields as required values — they're fine as strings,
 *     but we trim and omit blanks to keep the payload clean.
 *   - `changeReason` on create (it's edit-only and rejected by the create schema).
 */
function buildProductPayload() {
  const payload = {
    title: form.value.title.trim(),
    categoryId: form.value.categoryId,
    subcategoryId: form.value.subcategoryId,
    visibility: form.value.visibility,
    specifications: buildSpecificationsPayload(),
  }

  // Feature promotion is a separate privilege. Omitting this field preserves
  // the stored value for callers who cannot manage featured placement.
  if (canFeature.value) payload.isFeatured = !!form.value.isFeatured

  // Optional text fields — only include non-empty values.
  for (const key of ['shortDescription', 'description', 'sku', 'brand', 'model']) {
    const value = (form.value[key] || '').trim()
    if (value) payload[key] = value
  }

  // companyId: only SUPER_ADMIN sends it (company users are auto-assigned).
  // Never send null — that fails the integer schema.
  if (canChooseCompany.value && form.value.companyId) {
    payload.companyId = form.value.companyId
  }

  // Price tiers — omit empty maxQuantity/unit (schema forbids null on these).
  payload.priceTiers = priceTiers.value.map((t) => {
    const tier = { minQuantity: Number(t.minQuantity), price: Number(t.price) }
    if (isEditMode.value && t.id) tier.id = Number(t.id)
    if (t.maxQuantity !== null && t.maxQuantity !== undefined && t.maxQuantity !== '') {
      tier.maxQuantity = Number(t.maxQuantity)
    } else if (isEditMode.value && t.id) {
      tier.maxQuantity = null
    }
    if (t.unit && t.unit.trim()) tier.unit = t.unit.trim()
    else if (isEditMode.value && t.id) tier.unit = null
    return tier
  })

  // changeReason is edit-only.
  if (isEditMode.value && changeReason.value.trim()) {
    payload.changeReason = changeReason.value.trim()
  }

  return payload
}

/**
 * Extract a human-friendly message from an Axios/API error, preferring the
 * backend's structured `{ error: { code, message, errors } }` shape. Falls
 * back to status-specific defaults so users see actionable feedback rather
 * than a generic "خطا".
 */
function extractApiError(err, fallback) {
  const status = err?.response?.status
  const apiError = err?.response?.data?.error
  if (apiError) {
    // Include field-level validation details when the backend provides them.
    if (Array.isArray(apiError.errors) && apiError.errors.length) {
      return `${apiError.message || fallback}: ${apiError.errors.join('، ')}`
    }
    if (apiError.message) return apiError.message
  }
  if (status === 401) return 'برای انجام این عملیات باید وارد شوید.'
  if (status === 403) return 'شما مجوز لازم برای این عملیات را ندارید.'
  if (status === 413) return 'حجم فایل بیش از حد مجاز است.'
  if (status === 400) return 'اطلاعات ارسال‌شده نامعتبر است.'
  return err?.message || fallback
}

async function saveProduct() {
  if (!validate()) {
    toast.add({ severity: 'warn', summary: 'خطا', detail: 'لطفاً فیلدهای الزامی را پر کنید', life: 3000 })
    return
  }

  saving.value = true

  // ── Stage 1: create/update the product ──────────────────────────────
  // We ONLY treat the operation as successful once the backend confirms
  // creation/update. The success toast must never fire before this resolves.
  let productId
  try {
    const payload = buildProductPayload()
    if (isEditMode.value) {
      await productsApi.update(route.params.id, payload)
      productId = route.params.id
    } else {
      const response = await productsApi.create(payload)
      const body = response.data
      const product = body?.data || body
      productId = product?.id
    }
    if (!productId) throw new Error('شناسه محصول از سرور دریافت نشد.')
  } catch (err) {
    // Product was NOT saved — show the precise reason and stop (no success).
    toast.add({
      severity: 'error',
      summary: isEditMode.value ? 'خطا در بروزرسانی محصول' : 'خطا در ایجاد محصول',
      detail: extractApiError(err, 'خطا در ذخیره محصول'),
      life: 6000,
    })
    saving.value = false
    return
  }

  // ── Stage 2: upload media ───────────────────────────────────────────
  // The product already exists at this point. If an upload fails we keep the
  // saved product and tell the user exactly which media failed so they can
  // retry from edit mode, rather than silently claiming full success.
  const mediaErrors = []

  for (const file of newImages.value) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      await productsApi.uploadImage(productId, formData)
    } catch (err) {
      mediaErrors.push(`تصویر «${file.name}»: ${extractApiError(err, 'خطا در بارگذاری')}`)
    }
  }

  for (const doc of newDocuments.value) {
    try {
      const formData = new FormData()
      formData.append('file', doc.file)
      formData.append('type', doc.type)
      formData.append('title', doc.title)
      await productsApi.uploadDocument(productId, formData)
    } catch (err) {
      mediaErrors.push(`سند «${doc.title}»: ${extractApiError(err, 'خطا در بارگذاری')}`)
    }
  }

  saving.value = false

  if (mediaErrors.length) {
    // Product saved, but some media failed — be explicit, do not navigate away
    // so the user can review/retry the failed uploads.
    toast.add({
      severity: 'warn',
      summary: 'محصول ذخیره شد اما بارگذاری برخی فایل‌ها ناموفق بود',
      detail: mediaErrors.join('\n'),
      life: 8000,
    })
    if (!isEditMode.value) {
      // Switch to edit mode for the created product so retries target it.
      router.replace({ name: 'manage-product-edit', params: { id: productId } })
    }
    return
  }

  toast.add({ severity: 'success', summary: 'موفقیت', detail: isEditMode.value ? 'محصول بروزرسانی شد' : 'محصول ایجاد شد', life: 3000 })
  router.push({ name: 'manage-products' })
}


// Build an object URL for a locally-selected (not yet uploaded) image.
// Defined as a method because the global `URL` is not exposed in Vue's
// template render context.
function previewImageUrl(file) {
  try {
    return URL.createObjectURL(file)
  } catch {
    return ''
  }
}

function onImageSelect(event) {
  newImages.value.push(...event.files)

}

function removeNewImage(index) {
  newImages.value.splice(index, 1)
}

function onDocumentSelect(event) {
  for (const file of event.files) {
    newDocuments.value.push({ file, type: 'DATASHEET', title: file.name })
  }
}

function removeNewDocument(index) {
  newDocuments.value.splice(index, 1)
}

async function setPrimaryImage(imageId) {
  try {
    await productsApi.setPrimaryImage(route.params.id, imageId)
    productImages.value = productImages.value.map((img) => ({ ...img, isPrimary: img.id === imageId }))
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: extractApiError(err, 'خطا در انتخاب تصویر اصلی'), life: 4000 })
  }
}

async function moveExistingImage(imageId, direction) {
  const currentIndex = productImages.value.findIndex((img) => img.id === imageId)
  const targetIndex = currentIndex + direction
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= productImages.value.length) return

  const reordered = [...productImages.value]
  ;[reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]]
  const orderedImages = reordered.map((img, index) => ({ ...img, sortOrder: index }))
  try {
    await productsApi.sortImages(route.params.id, orderedImages.map(({ id, sortOrder }) => ({ id, sortOrder })))
    productImages.value = orderedImages
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: extractApiError(err, 'خطا در تغییر ترتیب تصاویر'), life: 4000 })
  }
}

async function removeExistingImage(imageId) {
  try {
    const wasPrimary = productImages.value.some((img) => img.id === imageId && img.isPrimary)
    await productsApi.deleteImage(route.params.id, imageId)
    const remaining = productImages.value.filter((img) => img.id !== imageId)
    productImages.value = remaining.map((img, index) => ({
      ...img,
      isPrimary: wasPrimary ? index === 0 : img.isPrimary,
    }))
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'تصویر حذف شد', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: extractApiError(err, 'خطا در حذف تصویر'), life: 4000 })
  }
}

async function removeExistingDocument(docId) {
  try {
    await productsApi.deleteDocument(route.params.id, docId)
    productDocuments.value = productDocuments.value.filter(doc => doc.id !== docId)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'سند حذف شد', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در حذف سند', life: 3000 })
  }
}
</script>

<template>
  <div class="product-form-page">
    <WorkspacePageHeading
      heading-id="product-editor-title"
      icon="pi pi-box"
      :title="isEditMode ? 'ویرایش محصول' : 'افزودن محصول جدید'"
      :description="isEditMode ? 'اطلاعات و مشخصات محصول شرکت را بازبینی و اصلاح کنید.' : 'مشخصات محصول را برای ثبت در کاتالوگ شرکت تکمیل کنید.'"
    >
      <template #actions>
        <router-link :to="{ name: 'manage-products' }" class="product-back-link" aria-label="بازگشت به فهرست محصولات"><i class="pi pi-arrow-right" aria-hidden="true"></i></router-link>
        <router-link :to="{ name: 'manage-products' }" class="product-cancel-link">انصراف</router-link>
        <Button label="ذخیره محصول" icon="pi pi-check" :loading="saving" @click="saveProduct" />
      </template>
    </WorkspacePageHeading>

    <RequiredFieldsProgress :checks="requiredFormChecks" title="اطلاعات ضروری" />

    <div v-if="pageLoading" class="text-center py-8">
      <ProgressSpinner aria-label="در حال بارگذاری فرم محصول" />
    </div>

    <div v-else class="form-grid">
      <!-- Left Column: Basic Info -->
      <div class="form-section">
        <FormSectionHeader title="اطلاعات پایه" description="عنوان، شناسه و توضیحات محصول" />

        <div class="field">
          <label for="product-title">عنوان محصول <span class="required">*</span></label>
          <InputText id="product-title"
            name="productTitle" v-model="form.title" :class="{ 'p-invalid': errors.title }" class="w-full" />
          <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
        </div>

        <div class="field">
          <label for="product-short-description">توضیح کوتاه</label>
          <Textarea id="product-short-description"
            name="productShortDescription" v-model="form.shortDescription" rows="2" class="w-full" />
        </div>

        <div class="field">
          <label for="product-description">توضیحات کامل</label>
          <Textarea id="product-description"
            name="productDescription" v-model="form.description" rows="5" class="w-full" />
        </div>

        <div class="field-grid">
          <div class="field">
            <label for="product-sku">شناسه SKU</label>
            <InputText id="product-sku"
            name="productSku" v-model="form.sku" class="w-full" />
          </div>
          <div class="field">
            <label for="product-brand">برند</label>
            <InputText id="product-brand"
            name="productBrand" v-model="form.brand" class="w-full" />
          </div>
        </div>

        <div class="field">
          <label for="product-model">مدل</label>
          <InputText id="product-model"
            name="productModel" v-model="form.model" class="w-full" />
        </div>
      </div>

      <!-- Right Column: Classification -->
      <div class="form-section">
        <FormSectionHeader title="دسته‌بندی و شرکت" description="جایگاه محصول و محدوده نمایش آن در بازارگاه" />

        <div v-if="canChooseCompany" class="field">
          <label for="product-company">شرکت <span class="required">*</span></label>
          <Select inputId="product-company"
            name="productCompany" v-model="form.companyId" :options="companies" optionLabel="name" optionValue="id" placeholder="انتخاب شرکت" class="w-full" :class="{ 'p-invalid': errors.companyId }" />
          <small v-if="errors.companyId" class="p-error">{{ errors.companyId }}</small>
        </div>


        <div class="field">
          <label for="product-category">دسته‌بندی <span class="required">*</span></label>
          <Select inputId="product-category"
            name="productCategory" v-model="form.categoryId" :options="categories" optionLabel="nameFa" optionValue="id" placeholder="انتخاب دسته‌بندی" class="w-full" :class="{ 'p-invalid': errors.categoryId }" />
          <small v-if="errors.categoryId" class="p-error">{{ errors.categoryId }}</small>
        </div>

        <div class="field">
          <label for="product-subcategory">زیردسته <span class="required">*</span></label>
          <Select inputId="product-subcategory"
            name="productSubcategory" v-model="form.subcategoryId" :options="subcategories" optionLabel="nameFa" optionValue="id" placeholder="انتخاب زیردسته" class="w-full" :disabled="!form.categoryId" :class="{ 'p-invalid': errors.subcategoryId }" />
          <small v-if="errors.subcategoryId" class="p-error">{{ errors.subcategoryId }}</small>
        </div>

        <div class="field-grid">
          <div class="field">
            <label for="product-visibility">قابلیت نمایش</label>
            <Select inputId="product-visibility"
            name="productVisibility" v-model="form.visibility" :options="['PUBLIC', 'PRIVATE', 'COMPANY_ONLY']" class="w-full" />
          </div>
          <div v-if="canFeature" class="field">
            <label for="product-featured">محصول ویژه</label>
            <div class="flex align-items-center gap-2 mt-2">
              <InputSwitch inputId="product-featured" v-model="form.isFeatured" aria-label="محصول ویژه" />
              <span>{{ form.isFeatured ? 'بله' : 'خیر' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Change Reason (only in edit mode) -->
      <div v-if="isEditMode" class="form-section full-width">
        <FormSectionHeader title="علت ویرایش" description="دلیل تغییر اطلاعات برای ثبت در سوابق محصول" />
        <div class="field">
          <label for="product-change-reason">توضیح تغییرات <span class="required">*</span></label>
          <Textarea id="product-change-reason"
            name="productChangeReason" v-model="changeReason" placeholder="دلیل ویرایش محصول را وارد کنید (مثلاً تغییر قیمت، اصلاح اطلاعات و...)" rows="2" class="w-full" />
          <small class="text-muted">این توضیحات در لاگ تغییرات محصول ذخیره می‌شوند.</small>
        </div>
      </div>

      <!-- Specifications -->
      <div class="form-section full-width">
        <FormSectionHeader title="مشخصات فنی" description="ویژگی‌های استاندارد و مشخصات تکمیلی محصول" />

        <div v-if="!form.subcategoryId" class="empty-section">
          <p>برای نمایش مشخصات، ابتدا زیردسته را انتخاب کنید</p>
        </div>

        <template v-else>
          <div v-if="templateLoading" class="text-center py-4">
            <ProgressSpinner aria-label="در حال دریافت الگوی مشخصات فنی" style="width: 32px; height: 32px" />
          </div>

          <!-- Standard fields from the subcategory template -->
          <div v-else-if="templateFields.length > 0" class="spec-grid">
            <div v-for="field in templateFields" :key="field.key" class="field">
              <label :for="'product-spec-' + field.key">
                {{ field.name }}
                <span v-if="field.unit" class="spec-unit">({{ field.unit }})</span>
                <span v-if="field.isRequired" class="required">*</span>
              </label>

              <InputText
                v-if="field.type === 'TEXT'"
                :id="'product-spec-' + field.key"
                v-model="specValues[field.key]"
                class="w-full"
              />
              <InputNumber
                v-else-if="field.type === 'NUMBER'"
                :inputId="'product-spec-' + field.key"
                v-model="specValues[field.key]"
                class="w-full"
                :useGrouping="false"
              />
              <div v-else-if="field.type === 'BOOLEAN'" class="flex align-items-center gap-2 mt-2">
                <InputSwitch v-model="specValues[field.key]" :aria-label="field.name" />
                <span>{{ specValues[field.key] ? 'بله' : 'خیر' }}</span>
              </div>
              <Select
                v-else-if="field.type === 'SELECT'"
                :inputId="'product-spec-' + field.key"
                v-model="specValues[field.key]"
                :options="specFieldOptions(field)"
                optionLabel="label"
                optionValue="value"
                placeholder="انتخاب کنید"
                showClear
                class="w-full"
              />
              <MultiSelect
                v-else-if="field.type === 'MULTI_SELECT'"
                :inputId="'product-spec-' + field.key"
                v-model="specValues[field.key]"
                :options="specFieldOptions(field)"
                optionLabel="label"
                optionValue="value"
                placeholder="انتخاب کنید"
                display="chip"
                class="w-full"
              />
              <Calendar
                v-else-if="field.type === 'DATE'"
                :inputId="'product-spec-' + field.key"
                v-model="specValues[field.key]"
                dateFormat="yy-mm-dd"
                showIcon
                class="w-full"
              />
              <InputText v-else :id="'product-spec-' + field.key" v-model="specValues[field.key]" class="w-full" />
            </div>
          </div>

          <div v-else class="empty-section">
            <p>برای این زیردسته مشخصات استانداردی تعریف نشده است</p>
          </div>
        </template>

        <!-- Custom (free-form) specifications -->
        <div class="custom-specs">
          <div class="section-header">
            <h3>ویژگی‌های اضافی</h3>
            <div class="flex align-items-center gap-2">
              <span v-if="customSpecs.length > 0" class="text-sm text-color-secondary">{{ customSpecs.length }} / 20</span>
              <Button label="افزودن ویژگی" icon="pi pi-plus" size="small" text @click="addCustomSpec" :disabled="customSpecs.length >= 20" />
            </div>
          </div>

          <div v-if="customSpecs.length === 0" class="empty-section">
            <p>در صورت نیاز، ویژگی‌های خاص محصول را اینجا اضافه کنید</p>
          </div>

          <div v-else class="custom-specs-list">
            <div v-for="(spec, index) in customSpecs" :key="index" class="custom-spec-row">
              <SpecificationTitleAutoComplete
                v-model="spec.title"
                :existing-titles="otherCustomTitles(spec)"
                class="custom-spec-title"
                @update:fieldId="spec.fieldId = $event"
                @invalid="onSpecInvalid"
              />
              <InputText v-model="spec.value" :name="'customSpecValue-' + index" :aria-label="'مقدار ویژگی سفارشی ' + (index + 1)" placeholder="مقدار (مثلاً 100000 ساعت)" class="custom-spec-value" />
              <Button icon="pi pi-trash" severity="danger" text :aria-label="'حذف ویژگی ' + (index + 1)" @click="removeCustomSpec(index)" />
            </div>

          </div>
        </div>
      </div>

      <!-- Price Tiers -->
      <div class="form-section full-width">
        <FormSectionHeader title="قیمت‌گذاری" description="تعریف قیمت بر اساس بازه تعداد سفارش">
          <template #actions>
            <Button label="افزودن ردیف قیمت" icon="pi pi-plus" size="small" @click="addPriceTier" />
          </template>
        </FormSectionHeader>


        <div v-if="priceTiers.length === 0" class="empty-section">
          <p>هنوز قیمتی تعریف نشده است</p>
        </div>

        <div v-else class="price-tiers-list">
          <div v-for="(tier, index) in priceTiers" :key="index" class="price-tier-row">
            <div class="field-grid-4">
              <div class="field">
                <label :for="'price-min-' + index">حداقل تعداد</label>
                <InputNumber :inputId="'price-min-' + index" v-model="tier.minQuantity" :min="1" class="w-full" />
              </div>
              <div class="field">
                <label :for="'price-max-' + index">حداکثر تعداد</label>
                <InputNumber :inputId="'price-max-' + index" v-model="tier.maxQuantity" :min="1" class="w-full" />
              </div>
              <div class="field">
                <label :for="'price-value-' + index">قیمت (ریال)</label>
                <InputNumber :inputId="'price-value-' + index" v-model="tier.price" :min="0" class="w-full" />
              </div>
              <div class="field">
                <label :for="'price-unit-' + index">واحد</label>
                <InputText :id="'price-unit-' + index" :name="'priceUnit-' + index" v-model="tier.unit" placeholder="مثلاً عدد" class="w-full" />
              </div>
            </div>
            <Button icon="pi pi-trash" severity="danger" text :aria-label="'حذف ردیف قیمت ' + (index + 1)" @click="removePriceTier(index)" />
          </div>
        </div>
      </div>

      <!-- Images -->
      <div class="form-section full-width">
        <FormSectionHeader title="تصاویر محصول" description="تصویر اصلی و گالری تصاویر محصول" />

        <div v-if="isEditMode && productImages.length > 0" class="images-grid">
          <div v-for="(img, index) in productImages" :key="img.id" class="image-item">
            <img :src="resolveMediaUrl(img.url)" :alt="img.altText || form.title || 'تصویر محصول'" width="640" height="480" loading="lazy" decoding="async" />

            <div class="image-actions">
              <Button v-if="!img.isPrimary" icon="pi pi-star" severity="success" rounded text v-tooltip.top="'انتخاب به‌عنوان تصویر اصلی'" aria-label="انتخاب تصویر اصلی" @click="setPrimaryImage(img.id)" />
              <Button icon="pi pi-arrow-up" severity="secondary" rounded text :disabled="index === 0" v-tooltip.top="'انتقال به بالا'" aria-label="انتقال تصویر به بالا" @click="moveExistingImage(img.id, -1)" />
              <Button icon="pi pi-arrow-down" severity="secondary" rounded text :disabled="index === productImages.length - 1" v-tooltip.top="'انتقال به پایین'" aria-label="انتقال تصویر به پایین" @click="moveExistingImage(img.id, 1)" />
              <Button icon="pi pi-times" severity="danger" rounded class="image-remove" aria-label="حذف تصویر" @click="removeExistingImage(img.id)" />
            </div>
            <Tag v-if="img.isPrimary" value="اصلی" severity="success" class="image-badge" />
          </div>
        </div>

        <div v-if="newImages.length > 0" class="images-grid mt-2">
          <div v-for="(file, index) in newImages" :key="index" class="image-item">
            <img :src="previewImageUrl(file)" :alt="file.name || 'پیش‌نمایش تصویر جدید محصول'" width="640" height="480" loading="lazy" decoding="async" />

            <Button icon="pi pi-times" severity="danger" rounded class="image-remove" :aria-label="'حذف تصویر جدید ' + (index + 1)" @click="removeNewImage(index)" />
            <Tag value="جدید" severity="info" class="image-badge" />
          </div>
        </div>

        <FileUpload name="productImages" mode="basic" accept="image/*" :maxFileSize="5000000" @select="onImageSelect" chooseLabel="افزودن تصویر" class="mt-2" />
      </div>

      <!-- Documents -->
      <div class="form-section full-width">
        <FormSectionHeader title="اسناد محصول" description="دیتاشیت، کاتالوگ، راهنما و گواهی‌ها" />

        <div v-if="isEditMode && productDocuments.length > 0" class="documents-list">
          <div v-for="doc in productDocuments" :key="doc.id" class="document-item">
            <i class="pi pi-file-pdf" aria-hidden="true"></i>
            <span>{{ doc.title || doc.url }}</span>
            <Tag :value="doc.type" severity="info" />
            <Button icon="pi pi-trash" severity="danger" text :aria-label="'حذف سند ' + (doc.title || doc.url)" @click="removeExistingDocument(doc.id)" />
          </div>
        </div>

        <div v-if="newDocuments.length > 0" class="documents-list mt-2">
          <div v-for="(doc, index) in newDocuments" :key="index" class="document-item">
            <i class="pi pi-file-pdf"></i>
            <InputText v-model="doc.title" :name="'documentTitle-' + index" :aria-label="'عنوان سند جدید ' + (index + 1)" placeholder="عنوان سند" class="w-6" />
            <Select v-model="doc.type" :name="'documentType-' + index" :aria-label="'نوع سند جدید ' + (index + 1)" :options="['DATASHEET', 'CATALOG', 'MANUAL', 'CERTIFICATE']" class="w-4" />
            <Button icon="pi pi-trash" severity="danger" text :aria-label="'حذف سند جدید ' + (index + 1)" @click="removeNewDocument(index)" />
          </div>
        </div>

        <FileUpload name="productDocuments" mode="basic" accept=".pdf" :maxFileSize="20000000" @select="onDocumentSelect" chooseLabel="افزودن سند" class="mt-2" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* tem-tokenised product editor: two-column section cards on the pale canvas,
   quiet section heads, dense fields, clear touch targets. */
.product-form-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  direction: rtl;
}

.product-back-link,
.product-cancel-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid var(--tm-line-strong);
  border-radius: var(--tm-radius);
  background: #fff;
  color: var(--tm-ink-soft);
  font-size: var(--tm-fs-sm);
  font-weight: 600;
  text-decoration: none;
}
.product-back-link:hover,
.product-cancel-link:hover { background: var(--tm-surface-alt); color: var(--tm-ink); }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  gap: 16px;
}

.form-section {
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface);
}

.form-section.full-width { grid-column: 1 / -1; }

.field { min-width: 0; margin-bottom: 14px; }
.field:last-child { margin-bottom: 0; }
.field > label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  color: var(--tm-ink);
  font-size: 12.5px;
  font-weight: 600;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  gap: 14px;
}

.field-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  flex: 1;
}

.required { color: var(--tm-red); }

.empty-section {
  padding: 28px;
  border: 1px dashed var(--tm-line-strong);
  border-radius: var(--tm-radius-lg);
  background: var(--tm-surface-alt);
  color: var(--tm-muted);
  text-align: center;
}

.spec-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  gap: 14px;
}

.spec-unit {
  margin-inline-start: 4px;
  color: var(--tm-muted);
  font-size: 0.85em;
  font-weight: 400;
}

.custom-specs {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed var(--tm-line);
}
.custom-specs .section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.custom-specs .section-header h3 {
  margin: 0;
  color: var(--tm-ink);
  font-size: 13px;
  font-weight: 700;
}
.custom-specs-list { display: flex; flex-direction: column; gap: 10px; }
.custom-spec-row { display: flex; align-items: center; gap: 10px; }
.custom-spec-title { flex: 0 0 35%; }
.custom-spec-value { flex: 1; }

.price-tiers-list { display: flex; flex-direction: column; gap: 10px; }
.price-tier-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius);
  background: var(--tm-surface-alt);
}

.documents-list { display: flex; flex-direction: column; gap: 8px; }
.document-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius);
  background: var(--tm-surface-alt);
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}
.image-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid var(--tm-line);
  border-radius: var(--tm-radius);
}
.image-item img { width: 100%; height: 100%; object-fit: cover; }
.image-actions {
  position: absolute;
  top: 4px;
  inset-inline-start: 4px;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, 2.75rem);
  gap: 4px;
}
.image-remove {
  position: absolute;
  top: 4px;
  inset-inline-end: 4px;
  background: rgba(0, 0, 0, 0.5) !important;
  color: #fff !important;
}
.image-badge { position: absolute; bottom: 4px; inset-inline-end: 4px; }

/* 44px touch targets for icon-only row actions. */
.custom-spec-row :deep(.p-button),
.price-tier-row > :deep(.p-button),
.image-actions :deep(.p-button),
.image-remove {
  min-height: 2.75rem;
  min-width: 2.75rem;
  width: 2.75rem;
}

@media (max-width: 767px) {
  .form-grid { grid-template-columns: 1fr; }
  .field-grid-4 { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 520px) {
  .field-grid,
  .field-grid-4,
  .spec-grid { grid-template-columns: minmax(0, 1fr); }
  .custom-spec-row { flex-wrap: wrap; align-items: stretch; }
  .custom-spec-title,
  .custom-spec-value { flex: 1 1 100%; }
  .price-tier-row { flex-direction: column; align-items: stretch; }
  .price-tier-row > :deep(.p-button) { align-self: flex-end; }
}
</style>