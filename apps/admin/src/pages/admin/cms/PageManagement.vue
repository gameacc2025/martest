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
        <div class="page-form__field"><label for="page-slug">اسلاگ *</label><InputText id="page-slug" v-model="form.slug" maxlength="100" :disabled="Boolean(editingId)" placeholder="about، contact، terms، privacy، faq یا custom-..." /><small>اسلاگ پس از ایجاد قابل تغییر نیست. صفحه سفارشی باید با custom- شروع شود.</small></div>
        <div class="page-form__field"><label for="page-content">محتوا *</label><Editor v-model="form.content" :editorStyle="{ height: '400px' }" :plugins="editorPlugins" toolbar="bold italic underline strikethrough | heading | alignleft aligncenter alignright | bullist numlist | outdent indent | link image table | code blockquote | undo redo" /></div>
        <div class="page-form__field"><label for="page-status">وضعیت</label><Select id="page-status" v-model="form.isActive" :options="statusOptions" option-label="label" option-value="value" placeholder="وضعیت را انتخاب کنید" /></div>

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
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { cmsPagesApi } from '@telecom/api-client'
import { usePermissions } from '@/composables/usePermissions'
import Editor from 'primevue/editor'

const toast = useToast()
const confirm = useConfirm()
const { can } = usePermissions()
const canCreate = computed(() => can('cms.pages.create'))
const canUpdate = computed(() => can('cms.pages.update'))
const canDelete = computed(() => can('cms.pages.delete'))

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
  form.value = { title: '', slug: '', content: '', isActive: true }
  editingId.value = null
  dialog.value = true
}

async function edit(item) {
  try {
    const res = await cmsPagesApi.getManageById(item.id)
    const data = res.data?.data || res.data
    if (!data) throw new Error('صفحه یافت نشد')
    form.value = { title: data.title || '', slug: data.slug || '', content: data.content || '', isActive: data.isActive !== false }
    editingId.value = item.id
    dialog.value = true
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'بارگذاری صفحه ناموفق بود', life: 3500 })
  }
}

function closeDialog() {
  dialog.value = false
  editingId.value = null
  form.value = { title: '', slug: '', content: '', isActive: true }
}

async function save() {
  const title = form.value.title.trim()
  const slug = form.value.slug.trim().toLowerCase()
  const content = form.value.content.trim()
  if (!title) {
    toast.add({ severity: 'warn', summary: 'اطلاعات ناقص', detail: 'عنوان صفحه الزامی است', life: 3000 })
    return
  }
  if (!slug) {
    toast.add({ severity: 'warn', summary: 'اطلاعات ناقص', detail: 'اسلاگ صفحه الزامی است', life: 3000 })
    return
  }
  if (!['about', 'contact', 'terms', 'privacy', 'faq'].includes(slug) && !slug.startsWith('custom-')) {
    toast.add({ severity: 'warn', summary: 'اسلاگ نامعتبر', detail: 'برای صفحه سفارشی، اسلاگ باید با custom- شروع شود', life: 3500 })
    return
  }
  if (!content) {
    toast.add({ severity: 'warn', summary: 'اطلاعات ناقص', detail: 'محتوای صفحه الزامی است', life: 3000 })
    return
  }
  saving.value = true
  try {
    const payload = { title, content, isActive: form.value.isActive }
    if (!editingId.value) payload.slug = slug
    if (editingId.value) await cmsPagesApi.update(editingId.value, payload)
    else await cmsPagesApi.create(payload)
    dialog.value = false
    toast.add({ severity: 'success', summary: 'ذخیره شد', detail: 'اطلاعات صفحه ذخیره شد', life: 2500 })
    await load()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error?.response?.data?.message || error?.message || 'ذخیره صفحه ناموفق بود', life: 3500 })
  } finally {
    saving.value = false
  }
}
function deletePage(item) {
  confirm.require({
    message: 'صفحه «' + item.title + '» به‌طور دائمی حذف شود؟ این عملیات غیرقابل بازگشت است.',
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    accept: async () => {
      try {
        await cmsPagesApi.delete(item.id)
        toast.add({ severity: 'success', summary: 'حذف شد', detail: 'صفحه با موفقیت حذف شد', life: 2500 })
        await load()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'خطا', detail: error?.message || 'حذف صفحه انجام نشد', life: 3500 })
      }
    },
  })
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
