<template>
  <div class="tag-management ds-stack" dir="rtl">
    <WorkspacePageHeading title="مدیریت برچسب‌ها" heading-id="tag-management-title" />
    <div class="tag-intro">
      <div><span class="tag-intro__eyebrow">برچسب‌ها</span><h2>فهرست برچسب‌ها</h2><p>برچسب‌های مقالات را مدیریت کنید.</p></div>
      <Button v-if="canCreate" label="برچسب جدید" icon="pi pi-plus" @click="openCreate" />
    </div>
    <div class="tag-toolbar">
      <InputText v-model="search" placeholder="جستجو در نام برچسب…" @keyup.enter="load" />
      <Select v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value" placeholder="همه وضعیت‌ها" show-clear @change="load" />
      <Button label="جستجو" icon="pi pi-search" severity="secondary" outlined @click="load" />
    </div>
    <div class="tag-table-wrap">
      <DataTable :value="items" :loading="loading" data-key="id" responsive-layout="scroll" striped-rows :paginator="true" :rows="10" :totalRecords="totalRecords" @page="onPage">
        <Column field="name" header="نام" style="min-width: 250px" />
        <Column field="slug" header="اسلاگ" style="width: 180px" />
        <Column field="sortOrder" header="ترتیب" style="width: 100px" />
        <Column header="وضعیت" style="width: 130px">
          <template #body="{ data }"><Tag :value="statusLabel(data.isActive)" :severity="statusTone(data.isActive)" /></template>
        </Column>
        <Column header="تعداد مقالات" style="width: 120px">
          <template #body="{ data }">{{ data._count?.articles || 0 }}</template>
        </Column>
        <Column header="عملیات" style="width: 130px">
          <template #body="{ data }">
            <Button v-if="canUpdate" icon="pi pi-pencil" text rounded aria-label="ویرایش برچسب" @click="edit(data)" />
            <Button v-if="canDelete" icon="pi pi-trash" text rounded severity="danger" aria-label="حذف برچسب" @click="deleteTag(data)" />
          </template>
        </Column>
        <template #empty><div class="tag-empty">هنوز برچسب‌ای ثبت نشده است.</div></template>
      </DataTable>
      <div class="tag-pagination" v-if="totalRecords > 10">
        <Paginator :first="first" :rows="rows" :totalRecords="totalRecords" @page="onPage" :pageLinkSize="5" />
      </div>
    </div>

    <Dialog v-model:visible="dialog" :header="editingId ? 'ویرایش برچسب' : 'ایجاد برچسب جدید'" modal :style="{ width: 'min(500px, 94vw)' }" :closable="!saving">
      <div class="tag-form">
        <div class="tag-form__field"><label for="tag-name">نام *</label><InputText id="tag-name" v-model="form.name" maxlength="100" /></div>
        <div class="tag-form__field"><label for="tag-slug">اسلاگ *</label><InputText id="tag-slug" v-model="form.slug" maxlength="100" placeholder="به‌صورت خودکار از نام تولید می‌شود" /></div>
        <div class="tag-form__field"><label for="tag-description">توضیحات</label><Textarea id="tag-description" v-model="form.description" rows="3" maxlength="500" auto-resize /></div>
        <div class="tag-form__grid">
          <div class="tag-form__field"><label for="tag-sort">ترتیب نمایش</label><InputNumber id="tag-sort" v-model="form.sortOrder" :min="0" /></div>
          <div class="tag-form__field"><label for="tag-status">وضعیت</label><Select id="tag-status" v-model="form.isActive" :options="statusOptions" option-label="label" option-value="value" placeholder="وضعیت را انتخاب کنید" /></div>
        </div>

        <div class="tag-form__actions">
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
import { cmsTagsApi } from '@telecom/api-client'
import { usePermissions } from '@/composables/usePermissions'

const toast = useToast()
const confirm = useConfirm()
const { can } = usePermissions()
const canCreate = computed(() => can('cms.tags.create'))
const canUpdate = computed(() => can('cms.tags.update'))
const canDelete = computed(() => can('cms.tags.delete'))

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
  name: '',
  slug: '',
  description: '',
  sortOrder: 0,
  isActive: true,
})

const statusOptions = [
  { label: 'فعال', value: true },
  { label: 'غیرفعال', value: false },
]

const statusLabel = (isActive) => isActive ? 'فعال' : 'غیرفعال'
const statusTone = (isActive) => isActive ? 'success' : 'secondary'

function unpackCmsListResponse(response) {
  const body = response?.data ?? response
  const nested = body?.data
  const rows = Array.isArray(nested)
    ? nested
    : Array.isArray(nested?.data)
      ? nested.data
      : Array.isArray(body?.items)
        ? body.items
        : Array.isArray(nested?.items)
          ? nested.items
          : []
  const meta = body?.meta ?? nested?.meta ?? {}
  return { rows, total: Number(meta.total ?? body?.total ?? rows.length) }
}

async function load() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: rows.value,
      search: search.value || undefined,
      isActive: statusFilter.value !== '' ? statusFilter.value : undefined,
    }
    const res = await cmsTagsApi.listManage(params)
    const page = unpackCmsListResponse(res)
    items.value = page.rows
    totalRecords.value = page.total
    first.value = (currentPage.value - 1) * rows.value
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'بارگذاری برچسب‌ها با خطا مواجه شد', life: 3500 })
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
  form.value = { name: '', slug: '', description: '', sortOrder: 0, isActive: true }
  editingId.value = null
  dialog.value = true
}

async function edit(item) {
  try {
    const res = await cmsTagsApi.getById(item.id)
    const data = res.data?.data || res.data
    if (!data) throw new Error('برچسب یافت نشد')
    form.value = { name: data.name || '', slug: data.slug || '', description: data.description || '', sortOrder: data.sortOrder || 0, isActive: data.isActive !== false }
    editingId.value = item.id
    dialog.value = true
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'بارگذاری برچسب ناموفق بود', life: 3500 })
  }
}

function closeDialog() {
  dialog.value = false
  editingId.value = null
  form.value = { name: '', slug: '', description: '', sortOrder: 0, isActive: true }
}

async function save() {
  if (!form.value.name.trim()) {
    toast.add({ severity: 'warn', summary: 'اطلاعات ناقص', detail: 'نام برچسب الزامی است', life: 3000 })
    return
  }
  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      slug: form.value.slug.trim() || undefined,
      description: form.value.description?.trim() || '',
      sortOrder: form.value.sortOrder || 0,
      isActive: form.value.isActive,
    }
    if (editingId.value) {
      await cmsTagsApi.update(editingId.value, payload)
    } else {
      await cmsTagsApi.create(payload)
    }
    dialog.value = false
    toast.add({ severity: 'success', summary: 'ذخیره شد', detail: 'اطلاعات برچسب ذخیره شد', life: 2500 })
    await load()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error?.message || 'ذخیره برچسب ناموفق بود', life: 3500 })
  } finally {
    saving.value = false
  }
}

function deleteTag(item) {
  confirm.require({
    message: 'برچسب «' + item.name + '» به‌طور دائمی حذف شود؟ این عملیات غیرقابل بازگشت است.',
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    accept: async () => {
      try {
        await cmsTagsApi.delete(item.id)
        toast.add({ severity: 'success', summary: 'حذف شد', detail: 'برچسب با موفقیت حذف شد', life: 2500 })
        await load()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'خطا', detail: error?.message || 'حذف برچسب انجام نشد', life: 3500 })
      }
    },
  })
}
onMounted(load)
</script>

<style scoped>
.tag-management { gap: 1.1rem; color: var(--ds-color-text); }
.tag-intro { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:1.25rem 1.4rem; border:1px solid var(--ds-color-border); border-radius:var(--ds-card-radius); background:linear-gradient(115deg,color-mix(in srgb,var(--ds-color-primary) 8%,var(--ds-color-surface)),var(--ds-color-surface) 72%); }
.tag-intro__eyebrow { color:var(--ds-color-primary); font-size:.75rem; font-weight:800; }
.tag-intro h2 { margin:.3rem 0; font-size:1.15rem; }
.tag-intro p { margin:0; color:var(--ds-color-text-muted); font-size:.85rem; line-height:1.8; }
.tag-toolbar { display:flex; flex-wrap:wrap; gap:.65rem; }
.tag-toolbar > :first-child { min-width:min(320px,100%); }
.tag-table-wrap { overflow:hidden; border:1px solid var(--ds-color-border); border-radius:var(--ds-card-radius); background:var(--ds-color-surface); }
.tag-empty { padding:2rem; text-align:center; color:var(--ds-color-text-muted); }
.tag-pagination { padding: 1rem; }
.tag-form { display:grid; gap:1rem; }
.tag-form__field { display:grid; gap:.45rem; min-width:0; }
.tag-form__field label { font-size:.83rem; font-weight:700; }
.tag-form__grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
.tag-form__actions { display:flex; justify-content:flex-end; gap:.75rem; margin-top:.5rem; padding-top:.5rem; border-top:1px solid var(--ds-color-border); }
@media(max-width:640px) { .tag-intro { align-items:flex-start; flex-direction:column; } .tag-form__grid { grid-template-columns:1fr; } .tag-toolbar > * { width:100%; } }
</style>
