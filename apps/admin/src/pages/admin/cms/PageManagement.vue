<template>
  <div class="page-management ds-stack" dir="rtl">
    <WorkspacePageHeading title="مدیریت صفحات استاتیک" heading-id="page-management-title" />
    <div class="page-intro">
      <div><span class="page-intro__eyebrow">صفحات</span><h2>فهرست صفحات</h2><p>صفحات استاتیک سایت را مدیریت کنید.</p></div>
      <Button v-if="canCreate" label="صفحه جدید" icon="pi pi-plus" @click="openCreate" />
    </div>
    <div class="page-toolbar">
      <InputText v-model="search" placeholder="جستجو در عنوان صفحه…" @keyup.enter="load" />
      <Select v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value" placeholder="همه وضعیت‌ها" show-clear @change="load" />
      <Button label="جستجو" icon="pi pi-search" severity="secondary" outlined @click="load" />
    </div>
    <div class="page-table-wrap">
      <DataTable :value="items" :loading="loading" data-key="id" responsive-layout="scroll" striped-rows :paginator="true" :rows="10" :totalRecords="totalRecords" @page="onPage">
        <Column field="title" header="عنوان" style="min-width: 250px" />
        <Column field="slug" header="اسلاگ" style="width: 180px" />
        <Column field="sortOrder" header="ترتیب" style="width: 100px" />
        <Column header="وضعیت" style="width: 130px">
          <template #body="{ data }"><Tag :value="statusLabel(data.isActive)" :severity="statusTone(data.isActive)" /></template>
        </Column>
        <Column header="عملیات" style="width: 130px">
          <template #body="{ data }">
            <Button v-if="canUpdate" icon="pi pi-pencil" text rounded aria-label="ویرایش صفحه" @click="edit(data)" />
            <Button v-if="canDelete" icon="pi pi-trash" text rounded severity="danger" aria-label="حذف صفحه" @click="deletePage(data)" />
          </template>
        </Column>
        <template #empty><div class="page-empty">هنوز صفحه‌ای ثبت نشده است.</div></template>
      </DataTable>
      <div class="page-pagination" v-if="totalRecords > 10">
        <Paginator :first="first" :rows="rows" :totalRecords="totalRecords" @page="onPage" :pageLinkSize="5" />
      </div>
    </div>

    <Dialog v-model:visible="dialog" :header="editingId ? 'ویرایش صفحه' : 'ایجاد صفحه جدید'" modal :style="{ width: 'min(800px, 94vw)' }" :closable="!saving">
      <div class="page-form">
        <div class="page-form__field"><label for="page-title">عنوان *</label><InputText id="page-title" v-model="form.title" maxlength="200" /></div>
        <div class="page-form__field"><label for="page-slug">اسلاگ *</label><InputText id="page-slug" v-model="form.slug" maxlength="200" placeholder="به‌صورت خودکار از عنوان تولید می‌شود" /></div>
        <div class="page-form__field"><label for="page-content">محتوا *</label><Editor v-model="form.content" :editorStyle="{ height: '400px' }" :plugins="editorPlugins" toolbar="bold italic underline strikethrough | heading | alignleft aligncenter alignright | bullist numlist | outdent indent | link image table | code blockquote | undo redo" /></div>
        <div class="page-form__grid">
          <div class="page-form__field"><label for="page-sort">ترتیب نمایش</label><InputNumber id="page-sort" v-model="form.sortOrder" :min="0" /></div>
          <div class="page-form__field"><label for="page-status">وضعیت</label><Select id="page-status" v-model="form.isActive" :options="statusOptions" option-label="label" option-value="value" placeholder="وضعیت را انتخاب کنید" /></div>
        </div>

        <div class="page-form__actions">
          <Button label="انصراف" icon="pi pi-times" text @click="closeDialog" :disabled="saving" />
          <Button label="ذخیره" icon="pi pi-check" @click="save" :loading="saving" />
        </div>
      </div>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { cmsPagesApi } from '@telecom/api-client'
import { usePermissions } from '@/composables/usePermissions'
import Editor from 'primevue/editor'

const toast = useToast()
const confirm = useConfirm()
const { can: canCreate } = usePermissions()
const { can: canUpdate } = usePermissions()
const { can: canDelete } = usePermissions()

const items = ref([])
const loading = ref(false)
const totalRecords = ref(0)
const first = ref(0)
const rows = ref(10)

const search = ref('')
const statusFilter = ref('')
const currentPage = ref(1)

const dialog = ref(false)
const editingId = ref(null)
const saving = ref(false)

const form = ref({
  title: '',
  slug: '',
  content: '',
  sortOrder: 0,
  isActive: true,
})

const statusOptions = [
  { label: 'فعال', value: true },
  { label: 'غیرفعال', value: false },
]

const editorPlugins = [
  'bold', 'italic', 'underline', 'strikethrough',
  'heading', 'alignleft', 'aligncenter', 'alignright',
  'bullist', 'numlist', 'outdent', 'indent',
  'link', 'image', 'table', 'code', 'blockquote',
  'undo', 'redo'
]

const statusLabel = (isActive) => isActive ? 'فعال' : 'غیرفعال'
const statusTone = (isActive) => isActive ? 'success' : 'secondary'

async function load() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: rows.value,
      search: search.value || undefined,
      isActive: statusFilter.value !== '' ? statusFilter.value : undefined,
    }
    const res = await cmsPagesApi.listManage(params)
    const data = res.data?.data || res.data || { items: [], meta: {} }
    items.value = data.items || data.data || []
    totalRecords.value = data.meta?.total || data.total || items.value.length
    first.value = (currentPage.value - 1) * rows.value
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'بارگذاری صفحات با خطا مواجه شد', life: 3500 })
    items.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

function onPage(event) {
  currentPage.value = event.page + 1
  first.value = event.first
  rows.value = event.rows
  load()
}

function openCreate() {
  form.value = { title: '', slug: '', content: '', sortOrder: 0, isActive: true }
  editingId.value = null
  dialog.value = true
}

async function edit(item) {
  try {
    const res = await cmsPagesApi.getManageById(item.id)
    const data = res.data?.data || res.data
    if (!data) throw new Error('صفحه یافت نشد')
    form.value = { title: data.title || '', slug: data.slug || '', content: data.content || '', sortOrder: data.sortOrder || 0, isActive: data.isActive !== false }
    editingId.value = item.id
    dialog.value = true
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'بارگذاری صفحه ناموفق بود', life: 3500 })
  }
}

function closeDialog() {
  dialog.value = false
  editingId.value = null
  form.value = { title: '', slug: '', content: '', sortOrder: 0, isActive: true }
}

async function save() {
  if (!form.value.title.trim()) {
    toast.add({ severity: 'warn', summary: 'اطلاعات ناقص', detail: 'عنوان صفحه الزامی است', life: 3000 })
    return
  }
  if (!form.value.content.trim()) {
    toast.add({ severity: 'warn', summary: 'اطلاعات ناقص', detail: 'محتوا صفحه الزامی است', life: 3000 })
    return
  }
  saving.value = true
  try {
    const payload = {
      title: form.value.title.trim(),
      slug: form.value.slug.trim() || undefined,
      content: form.value.content.trim(),
      sortOrder: form.value.sortOrder || 0,
      isActive: form.value.isActive,
    }
    if (editingId.value) {
      await cmsPagesApi.update(editingId.value, payload)
    } else {
      await cmsPagesApi.create(payload)
    }
    dialog.value = false
    toast.add({ severity: 'success', summary: 'ذخیره شد', detail: 'اطلاعات صفحه ذخیره شد', life: 2500 })
    await load()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error?.message || 'ذخیره صفحه ناموفق بود', life: 3500 })
  } finally {
    saving.value = false
  }
}

async function deletePage(item) {
  const confirmed = await confirm.require({
    message: 'صفحه «' + item.title + '» به‌طور دائمی حذف شود؟ این عملیات غیرقابل بازگشت است.',
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
  })
  if (!confirmed) return
  try {
    await cmsPagesApi.delete(item.id)
    toast.add({ severity: 'success', summary: 'حذف شد', detail: 'صفحه با موفقیت حذف شد', life: 2500 })
    await load()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error?.message || 'حذف صفحه انجام نشد', life: 3500 })
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
.page-empty { padding:2rem; text-align:center; color:var(--ds-color-text-muted); }
.page-pagination { padding: 1rem; }
.page-form { display:grid; gap:1rem; }
.page-form__field { display:grid; gap:.45rem; min-width:0; }
.page-form__field label { font-size:.83rem; font-weight:700; }
.page-form__grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
.page-form__actions { display:flex; justify-content:flex-end; gap:.75rem; margin-top:.5rem; padding-top:.5rem; border-top:1px solid var(--ds-color-border); }
@media(max-width:640px) { .page-intro { align-items:flex-start; flex-direction:column; } .page-form__grid { grid-template-columns:1fr; } .page-toolbar > * { width:100%; } }
</style>
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
