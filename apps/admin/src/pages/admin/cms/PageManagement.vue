<template>
  <div class="page-management ds-stack" dir="rtl">
    <WorkspacePageHeading title="مدیریت صفحات استاتیک" heading-id="page-management-title" />
    <div class="page-intro">
      <div><span class="page-intro__eyebrow">صفحات</span><h2>فهرست صفحات</h2><p>صفحات استاتیک سایت را مدیریت کنید.</p></div>
      <Button v-if="canCreate" label="صفحه جدید" icon="pi pi-plus" @click="openCreate" />
    </div>
    <div class="page-toolbar">
      <InputText v-model="search" placeholder="جستجو در عنوان بنر…" @keyup.enter="load" />
      <Select v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value" placeholder="همه وضعیت‌ها" show-clear @change="load" />
      <Button label="جستجو" icon="pi pi-search" severity="secondary" outlined @click="load" />
    </div>
    <div class="page-table-wrap">
      <DataTable :value="items" :loading="loading" data-key="id" responsive-layout="scroll" striped-rows>
        <Column header="تصویر" style="width: 120px">
          <template #body="{ data }"><img v-if="data.imageUrl" :src="data.imageUrl" :alt="data.title" class="page-thumb" /><span v-else>—</span></template>
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
        <template #empty><div class="page-empty">هنوز بنر تبلیغاتی ثبت نشده است.</div></template>
      </DataTable>
    </div>

    <Dialog v-model:visible="dialog" :header="editingId ? 'ویرایش بنر' : 'ایجاد بنر تبلیغاتی'" modal :style="{ width: 'min(760px, 94vw)' }" :closable="!saving">
      <div class="page-form">
        <div class="page-form__field"><label for="page-title">عنوان بنر *</label><InputText id="page-title" v-model="form.title" maxlength="120" /></div>
        <div class="page-form__field"><label for="page-description">متن کوتاه</label><Textarea id="page-description" v-model="form.description" rows="2" maxlength="300" auto-resize /></div>
        <div class="page-form__field"><label>محتوا *</label><div class="page-upload"><input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" @change="uploadImage" /><Button v-if="canUpload" label="انتخاب تصویر" icon="pi pi-upload" severity="secondary" outlined :loading="uploading" @click="fileInput?.click()" /><span>{{ form.imageUrl ? 'تصویر بارگذاری شده است' : 'JPG، PNG یا WebP — حداکثر ۸ مگابایت' }}</span></div><img v-if="form.imageUrl" :src="form.imageUrl" alt="پیش‌نمایش بنر" class="page-preview" /></div>
        <div class="page-form__grid">
          <div class="page-form__field"><label for="page-target">لینک مقصد</label><InputText id="page-target" v-model="form.targetUrl" placeholder="/products یا https://…" /></div>
          <div class="page-form__field"><label for="page-cta">متن دکمه</label><InputText id="page-cta" v-model="form.ctaLabel" maxlength="40" placeholder="مشاهده جشنواره" /></div>
          <div class="page-form__field"><label for="page-order">اولویت نمایش</label><InputNumber id="page-order" v-model="form.sortOrder" :min="0" :max="100000" /></div>
          <div class="page-form__field"><label for="page-status">وضعیت انتشار</label><Select id="page-status" v-model="form.status" :options="statusOptions" option-label="label" option-value="value" /></div>
          <div class="page-form__field"><label for="page-start">شروع نمایش</label><InputText id="page-start" v-model="form.startsAt" type="datetime-local" /></div>
          <div class="page-form__field"><label for="page-end">پایان نمایش</label><InputText id="page-end" v-model="form.endsAt" type="datetime-local" /></div>
        </div>
        <div class="page-form__field page-form__switch"><Checkbox v-model="form.isActive" input-id="page-active" pgary /><label for="page-active">بنر فعال باشد</label></div>
      </div>
      <template #footer><Button label="انصراف" severity="secondary" text @click="dialog = false" /><Button v-if="(editingId && canUpdate) || (!editingId && canCreate)" label="ذخیره بنر" icon="pi pi-check" :loading="saving" @click="save" /></template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { pagesApi } from '@telecom/api-client'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../../../stores/auth'
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'

const toast = useToast()
const authStore = useAuthStore()
const canCreate = authStore.hasPermission('pages.create')
const canUpdate = authStore.hasPermission('pages.update')
const canDelete = authStore.hasPermission('pages.delete')
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
    const response = await pagesApi.list({ page: 1, limit: 100, search: search.value, status: statusFilter.value || undefined })
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
    const response = await pagesApi.uploadImage(file)
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
    if (editingId.value) await pagesApi.update(editingId.value, payload)
    else await pagesApi.create(payload)
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
    await pagesApi.archive(item.id)
    toast.add({ severity: 'success', summary: 'آرشیو شد', detail: 'بنر از نمایش عمومی خارج شد.', life: 2500 })
    await load()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error?.message || 'آرشیو بنر انجام نشد.', life: 3500 })
  }
}
onMounted(load)
</script>

<style scoped>
.page-management { gap: 1.1rem; color: var(--ds-color-text); }
.page-intro { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:1.25rem 1.4rem; border:1px solid var(--ds-color-border); border-radius:var(--ds-card-radius); background:linear-gradient(115deg,color-mix(in srgb,var(--ds-color-primary) 8%,var(--ds-color-surface)),var(--ds-color-surface) 72%); }
.page-intro__eyebrow { color:var(--ds-color-primary); font-size:.75rem; font-weight:800; }
.page-intro h2 { margin:.3rem 0; font-size:1.15rem; }
.page-intro p { margin:0; color:var(--ds-color-text-muted); font-size:.85rem; line-height:1.8; }
.page-toolbar { display:flex; flex-wrap:wrap; gap:.65rem; }
.page-toolbar > :first-child { min-width:min(320px,100%); }
.page-table-wrap { overflow:hidden; border:1px solid var(--ds-color-border); border-radius:var(--ds-card-radius); background:var(--ds-color-surface); }
.page-thumb { width:88px; height:54px; object-fit:cover; border-radius:8px; }
.page-empty { padding:2rem; text-align:center; color:var(--ds-color-text-muted); }
.page-form { display:grid; gap:1rem; }
.page-form__field { display:grid; gap:.45rem; min-width:0; }
.page-form__field label { font-size:.83rem; font-weight:700; }
.page-form__grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
.page-upload { display:flex; align-items:center; flex-wrap:wrap; gap:.75rem; }
.page-upload input { position:absolute; width:1px; height:1px; opacity:0; pointer-events:none; }
.page-upload span { color:var(--ds-color-text-muted); font-size:.75rem; }
.page-preview { display:block; width:100%; max-height:230px; object-fit:contain; border:1px solid var(--ds-color-border); border-radius:10px; background:var(--ds-color-surface-alt); }
.page-form__switch { display:flex; align-items:center; gap:.6rem; }
@media(max-width:640px) { .page-intro { align-items:flex-start; flex-direction:column; } .page-form__grid { grid-template-columns:1fr; } .page-toolbar > * { width:100%; } }
</style>
