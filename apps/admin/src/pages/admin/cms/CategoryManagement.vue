<template>
  <div class="category-management ds-stack" dir="rtl">
    <WorkspacePageHeading title="مدیریت دسته‌بندی‌ها" heading-id="category-management-title" />
    <div class="category-intro">
      <div><span class="category-intro__eyebrow">دسته‌بندی‌ها</span><h2>فهرست دسته‌بندی‌ها</h2><p>دسته‌بندی مقالات را مدیریت کنید.</p></div>
      <Button v-if="canCreate" label="دسته‌بندی جدید" icon="pi pi-plus" @click="openCreate" />
    </div>
    <div class="category-toolbar">
      <InputText v-model="search" placeholder="جستجو در عنوان بنر…" @keyup.enter="load" />
      <Select v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value" placeholder="همه وضعیت‌ها" show-clear @change="load" />
      <Button label="جستجو" icon="pi pi-search" severity="secondary" outlined @click="load" />
    </div>
    <div class="category-table-wrap">
      <DataTable :value="items" :loading="loading" data-key="id" responsive-layout="scroll" striped-rows>
        <Column header="تصویر" style="width: 120px">
          <template #body="{ data }"><img v-if="data.imageUrl" :src="data.imageUrl" :alt="data.title" class="category-thumb" /><span v-else>—</span></template>
        </Column>
        <Column field="title" header="عنوان" />
        <Column field="placement" header="جایگاه" />
        <Column header="وضعیت">
          <template #body="{ data }"><Tag :value="statusLabel(data.status)" :severity="statusTone(data.status)" /></template>
        </Column>
        <Column header="نمایش">
          <template #body="{ data }"><Tag :value="data.isActive ? 'فعال' : 'غیرفعال'" :severity="data.isActive ? 'success' : 'secondary'" /></template>
        </Column>
        <Column header="زمان‌بندی">
          <template #body="{ data }"><small>{{ dateLabel(data.startsAt) }} تا {{ dateLabel(data.endsAt) }}</small></template>
        </Column>
        <Column header="عملیات" style="width: 130px">
          <template #body="{ data }">
            <Button v-if="canUpdate" icon="pi pi-pencil" text rounded aria-label="ویرایش بنر" @click="edit(data)" />
            <Button v-if="canDelete" icon="pi pi-inbox" text rounded severity="danger" aria-label="آرشیو بنر" @click="archive(data)" />
          </template>
        </Column>
        <template #empty><div class="category-empty">هنوز بنر تبلیغاتی ثبت نشده است.</div></template>
      </DataTable>
    </div>

    <Dialog v-model:visible="dialog" :header="editingId ? 'ویرایش بنر' : 'ایجاد بنر تبلیغاتی'" modal :style="{ width: 'min(760px, 94vw)' }" :closable="!saving">
      <div class="category-form">
        <div class="category-form__field"><label for="category-title">عنوان بنر *</label><InputText id="category-title" v-model="form.title" maxlength="120" /></div>
        <div class="category-form__field"><label for="category-description">متن کوتاه</label><Textarea id="category-description" v-model="form.description" rows="2" maxlength="300" auto-resize /></div>
        <div class="category-form__field"><label>نام *</label><div class="category-upload"><input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" @change="uploadImage" /><Button v-if="canUpload" label="انتخاب تصویر" icon="pi pi-upload" severity="secondary" outlined :loading="uploading" @click="fileInput?.click()" /><span>{{ form.imageUrl ? 'تصویر بارگذاری شده است' : 'JPG، PNG یا WebP — حداکثر ۸ مگابایت' }}</span></div><img v-if="form.imageUrl" :src="form.imageUrl" alt="پیش‌نمایش بنر" class="category-preview" /></div>
        <div class="category-form__grid">
          <div class="category-form__field"><label for="category-target">لینک مقصد</label><InputText id="category-target" v-model="form.targetUrl" placeholder="/products یا https://…" /></div>
          <div class="category-form__field"><label for="category-cta">متن دکمه</label><InputText id="category-cta" v-model="form.ctaLabel" maxlength="40" placeholder="مشاهده جشنواره" /></div>
          <div class="category-form__field"><label for="category-order">اولویت نمایش</label><InputNumber id="category-order" v-model="form.sortOrder" :min="0" :max="100000" /></div>
          <div class="category-form__field"><label for="category-status">وضعیت انتشار</label><Select id="category-status" v-model="form.status" :options="statusOptions" option-label="label" option-value="value" /></div>
          <div class="category-form__field"><label for="category-start">شروع نمایش</label><InputText id="category-start" v-model="form.startsAt" type="datetime-local" /></div>
          <div class="category-form__field"><label for="category-end">پایان نمایش</label><InputText id="category-end" v-model="form.endsAt" type="datetime-local" /></div>
        </div>
        <div class="category-form__field category-form__switch"><Checkbox v-model="form.isActive" input-id="category-active" catary /><label for="category-active">بنر فعال باشد</label></div>
      </div>
      <template #footer><Button label="انصراف" severity="secondary" text @click="dialog = false" /><Button v-if="(editingId && canUpdate) || (!editingId && canCreate)" label="ذخیره بنر" icon="pi pi-check" :loading="saving" @click="save" /></template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { categorysApi } from '@telecom/api-client'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../../../stores/auth'
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'

const toast = useToast()
const authStore = useAuthStore()
const canCreate = authStore.hasPermission('categorys.create')
const canUpdate = authStore.hasPermission('categorys.update')
const canDelete = authStore.hasPermission('categorys.delete')
const canUpload = authStore.hasPermission('media.upload')
const items = ref([])
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const dialog = ref(false)
const editingId = ref(null)
const search = ref('')
const statusFilter = ref(null)
const fileInput = ref(null)
const statusOptions = [
  { label: 'پیش‌نویس', value: 'DRAFT' },
  { label: 'منتشرشده', value: 'PUBLISHED' },
  { label: 'آرشیوشده', value: 'ARCHIVED' },
]
const emptyForm = () => ({ title: '', description: '', imageUrl: '', targetUrl: '', ctaLabel: '', placement: 'HOME_HERO', sortOrder: 0, status: 'DRAFT', isActive: true, startsAt: '', endsAt: '' })
const form = ref(emptyForm())
const statusLabel = (status) => statusOptions.find((item) => item.value === status)?.label || status
const statusTone = (status) => status === 'PUBLISHED' ? 'success' : status === 'ARCHIVED' ? 'secondary' : 'warn'
const dateLabel = (value) => value ? new Date(value).toLocaleString('fa-IR') : 'بدون محدودیت'

function toLocalDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
function normalizeDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
async function load() {
  loading.value = true
  try {
    const response = await categorysApi.list({ page: 1, limit: 100, search: search.value, status: statusFilter.value || undefined })
    const body = response?.data
    items.value = body?.data?.data || body?.data || []
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error?.message || 'دریافت بنرها ناموفق بود.', life: 3500 })
  } finally { loading.value = false }
}
function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  dialog.value = true
}
function edit(item) {
  editingId.value = item.id
  form.value = { ...emptyForm(), ...item, startsAt: toLocalDateTime(item.startsAt), endsAt: toLocalDateTime(item.endsAt) }
  dialog.value = true
}
async function uploadImage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const response = await categorysApi.uploadImage(file)
    form.value.imageUrl = response?.data?.data?.url || response?.data?.url
    toast.add({ severity: 'success', summary: 'تصویر بارگذاری شد', detail: 'تصویر بنر آماده استفاده است.', life: 2500 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا در بارگذاری', detail: error?.message || 'بارگذاری تصویر انجام نشد.', life: 3500 })
  } finally { uploading.value = false; event.target.value = '' }
}
async function save() {
  if (!form.value.title.trim() || !form.value.imageUrl) {
    toast.add({ severity: 'warn', summary: 'اطلاعات ناقص', detail: 'عنوان و تصویر بنر الزامی هستند.', life: 3000 })
    return
  }
  saving.value = true
  const payload = { ...form.value, startsAt: normalizeDate(form.value.startsAt), endsAt: normalizeDate(form.value.endsAt) }
  try {
    if (editingId.value) await categorysApi.update(editingId.value, payload)
    else await categorysApi.create(payload)
    dialog.value = false
    toast.add({ severity: 'success', summary: 'ذخیره شد', detail: 'اطلاعات بنر ذخیره شد.', life: 2500 })
    await load()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error?.message || 'ذخیره بنر ناموفق بود.', life: 3500 })
  } finally { saving.value = false }
}
async function archive(item) {
  if (!window.confirm(`بنر «${item.title}» به آرشیو منتقل شود؟`)) return
  try {
    await categorysApi.archive(item.id)
    toast.add({ severity: 'success', summary: 'آرشیو شد', detail: 'بنر از نمایش عمومی خارج شد.', life: 2500 })
    await load()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error?.message || 'آرشیو بنر انجام نشد.', life: 3500 })
  }
}
onMounted(load)
</script>

<style scoped>
.category-management { gap: 1.1rem; color: var(--ds-color-text); }
.category-intro { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:1.25rem 1.4rem; border:1px solid var(--ds-color-border); border-radius:var(--ds-card-radius); background:linear-gradient(115deg,color-mix(in srgb,var(--ds-color-primary) 8%,var(--ds-color-surface)),var(--ds-color-surface) 72%); }
.category-intro__eyebrow { color:var(--ds-color-primary); font-size:.75rem; font-weight:800; }
.category-intro h2 { margin:.3rem 0; font-size:1.15rem; }
.category-intro p { margin:0; color:var(--ds-color-text-muted); font-size:.85rem; line-height:1.8; }
.category-toolbar { display:flex; flex-wrap:wrap; gap:.65rem; }
.category-toolbar > :first-child { min-width:min(320px,100%); }
.category-table-wrap { overflow:hidden; border:1px solid var(--ds-color-border); border-radius:var(--ds-card-radius); background:var(--ds-color-surface); }
.category-thumb { width:88px; height:54px; object-fit:cover; border-radius:8px; }
.category-empty { padding:2rem; text-align:center; color:var(--ds-color-text-muted); }
.category-form { display:grid; gap:1rem; }
.category-form__field { display:grid; gap:.45rem; min-width:0; }
.category-form__field label { font-size:.83rem; font-weight:700; }
.category-form__grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
.category-upload { display:flex; align-items:center; flex-wrap:wrap; gap:.75rem; }
.category-upload input { position:absolute; width:1px; height:1px; opacity:0; pointer-events:none; }
.category-upload span { color:var(--ds-color-text-muted); font-size:.75rem; }
.category-preview { display:block; width:100%; max-height:230px; object-fit:contain; border:1px solid var(--ds-color-border); border-radius:10px; background:var(--ds-color-surface-alt); }
.category-form__switch { display:flex; align-items:center; gap:.6rem; }
@media(max-width:640px) { .category-intro { align-items:flex-start; flex-direction:column; } .category-form__grid { grid-template-columns:1fr; } .category-toolbar > * { width:100%; } }
</style>
