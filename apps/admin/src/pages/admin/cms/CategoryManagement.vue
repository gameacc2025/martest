<template>
  <div class="category-management ds-stack" dir="rtl">
    <WorkspacePageHeading title="مدیریت دسته‌بندی‌ها" heading-id="category-management-title" />
    <div class="category-intro">
      <div>
        <span class="category-intro__eyebrow">دسته‌بندی‌ها</span>
        <h2>فهرست دسته‌بندی‌ها</h2>
        <p>دسته‌بندی مقالات را مدیریت کنید.</p>
      </div>
      <Button v-if="canCreate" label="دسته‌بندی جدید" icon="pi pi-plus" @click="openCreate" />
    </div>

    <div class="category-toolbar">
      <InputText v-model="search" placeholder="جستجو در نام دسته‌بندی…" @keyup.enter="load" />
      <Select v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value" placeholder="همه وضعیت‌ها" show-clear @change="onFilterChange" />
      <Button label="جستجو" icon="pi pi-search" severity="secondary" outlined @click="onFilterChange" />
    </div>

    <div class="category-table-wrap">
      <DataTable :value="items" :loading="loading" data-key="id" responsive-layout="scroll" striped-rows>
        <Column field="name" header="نام" style="min-width: 220px" />
        <Column field="slug" header="اسلاگ" style="min-width: 180px" />
        <Column field="sortOrder" header="ترتیب" style="width: 100px" />
        <Column header="تعداد مقالات" style="width: 120px">
          <template #body="{ data }">{{ data._count?.articles || 0 }}</template>
        </Column>
        <Column header="وضعیت" style="width: 120px">
          <template #body="{ data }">
            <Tag :value="data.isActive ? 'فعال' : 'غیرفعال'" :severity="data.isActive ? 'success' : 'secondary'" />
          </template>
        </Column>
        <Column header="عملیات" style="width: 130px">
          <template #body="{ data }">
            <Button v-if="canUpdate" icon="pi pi-pencil" text rounded aria-label="ویرایش دسته‌بندی" @click="edit(data)" />
            <Button v-if="canDelete" icon="pi pi-trash" text rounded severity="danger" aria-label="حذف دسته‌بندی" @click="deleteCategory(data)" />
          </template>
        </Column>
        <template #empty><div class="category-empty">هنوز دسته‌بندی‌ای ثبت نشده است.</div></template>
      </DataTable>
      <div v-if="totalRecords > rows" class="category-pagination">
        <Paginator :first="first" :rows="rows" :totalRecords="totalRecords" :pageLinkSize="5" @page="onPage" />
      </div>
    </div>

    <Dialog v-model:visible="dialog" :header="editingId ? 'ویرایش دسته‌بندی' : 'ایجاد دسته‌بندی جدید'" modal :style="{ width: 'min(500px, 94vw)' }" :closable="!saving">
      <div class="category-form">
        <div class="category-form__field">
          <label for="category-name">نام *</label>
          <InputText id="category-name" v-model="form.name" maxlength="100" autofocus />
        </div>
        <div v-if="editingId" class="category-form__field">
          <label for="category-slug">اسلاگ تولیدشده</label>
          <InputText id="category-slug" :model-value="form.slug" disabled />
          <small>اسلاگ به‌صورت خودکار از نام دسته‌بندی ساخته می‌شود.</small>
        </div>
        <div class="category-form__grid">
          <div class="category-form__field">
            <label for="category-sort">ترتیب نمایش</label>
            <InputNumber id="category-sort" v-model="form.sortOrder" :min="0" :max="100000" />
          </div>
          <div class="category-form__field">
            <label for="category-status">وضعیت</label>
            <Select id="category-status" v-model="form.isActive" :options="statusOptions" option-label="label" option-value="value" />
          </div>
        </div>
        <div class="category-form__actions">
          <Button label="انصراف" icon="pi pi-times" text @click="closeDialog" :disabled="saving" />
          <Button label="ذخیره" icon="pi pi-check" @click="save" :loading="saving" />
        </div>
      </div>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { cmsCategoriesApi } from '@telecom/api-client'
import { usePermissions } from '@/composables/usePermissions'

const toast = useToast()
const confirm = useConfirm()
const { can } = usePermissions()
const canCreate = computed(() => can('cms.categories.create'))
const canUpdate = computed(() => can('cms.categories.update'))
const canDelete = computed(() => can('cms.categories.delete'))

const items = ref([])
const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const editingId = ref(null)
const search = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const rows = ref(10)
const first = ref(0)
const totalRecords = ref(0)
const form = ref({ name: '', slug: '', sortOrder: 0, isActive: true })

const statusOptions = [
  { label: 'فعال', value: true },
  { label: 'غیرفعال', value: false },
]

async function load() {
  loading.value = true
  try {
    const response = await cmsCategoriesApi.listManage({
      page: currentPage.value,
      limit: rows.value,
      search: search.value.trim() || undefined,
      isActive: statusFilter.value !== '' ? statusFilter.value : undefined,
    })
    const payload = response?.data?.data ?? response?.data ?? response
    items.value = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.items) ? payload.items : []
    totalRecords.value = Number(payload?.meta?.total ?? payload?.total ?? items.value.length)
    first.value = (currentPage.value - 1) * rows.value
  } catch (error) {
    items.value = []
    totalRecords.value = 0
    toast.add({ severity: 'error', summary: 'خطا', detail: error?.response?.data?.message || error?.message || 'بارگذاری دسته‌بندی‌ها ناموفق بود', life: 3500 })
  } finally {
    loading.value = false
  }
}

function onFilterChange() {
  currentPage.value = 1
  first.value = 0
  load()
}

function onPage(event) {
  currentPage.value = event.page + 1
  first.value = event.first
  rows.value = event.rows
  load()
}

function openCreate() {
  form.value = { name: '', slug: '', sortOrder: 0, isActive: true }
  editingId.value = null
  dialog.value = true
}

async function edit(item) {
  try {
    const response = await cmsCategoriesApi.getById(item.id)
    const data = response?.data?.data ?? response?.data ?? response
    if (!data?.id) throw new Error('دسته‌بندی یافت نشد')
    form.value = {
      name: data.name || '',
      slug: data.slug || '',
      sortOrder: Number(data.sortOrder) || 0,
      isActive: data.isActive !== false,
    }
    editingId.value = item.id
    dialog.value = true
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error?.response?.data?.message || error?.message || 'بارگذاری دسته‌بندی ناموفق بود', life: 3500 })
  }
}

function closeDialog() {
  dialog.value = false
  editingId.value = null
  form.value = { name: '', slug: '', sortOrder: 0, isActive: true }
}

async function save() {
  const name = form.value.name.trim()
  if (!name) {
    toast.add({ severity: 'warn', summary: 'اطلاعات ناقص', detail: 'نام دسته‌بندی الزامی است', life: 3000 })
    return
  }
  saving.value = true
  try {
    const payload = { name, sortOrder: Number(form.value.sortOrder) || 0, isActive: Boolean(form.value.isActive) }
    if (editingId.value) await cmsCategoriesApi.update(editingId.value, payload)
    else await cmsCategoriesApi.create(payload)
    closeDialog()
    toast.add({ severity: 'success', summary: 'ذخیره شد', detail: 'دسته‌بندی با موفقیت ذخیره شد', life: 2500 })
    await load()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error?.response?.data?.message || error?.message || 'ذخیره دسته‌بندی ناموفق بود', life: 3500 })
  } finally {
    saving.value = false
  }
}

function deleteCategory(item) {
  confirm.require({
    message: 'دسته‌بندی «' + item.name + '» حذف شود؟ اگر مقاله‌ای به آن متصل باشد، حذف انجام نمی‌شود.',
    header: 'تأیید حذف دسته‌بندی',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    accept: async () => {
      try {
        await cmsCategoriesApi.delete(item.id)
        toast.add({ severity: 'success', summary: 'حذف شد', detail: 'دسته‌بندی حذف شد', life: 2500 })
        await load()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'خطا', detail: error?.response?.data?.message || error?.message || 'حذف دسته‌بندی ناموفق بود', life: 3500 })
      }
    },
  })
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
.category-empty { padding:2rem; text-align:center; color:var(--ds-color-text-muted); }
.category-pagination { padding:1rem; }
.category-form { display:grid; gap:1rem; }
.category-form__field { display:grid; gap:.45rem; min-width:0; }
.category-form__field label { font-size:.83rem; font-weight:700; }
.category-form__field small { color:var(--ds-color-text-muted); font-size:.75rem; }
.category-form__grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
.category-form__actions { display:flex; justify-content:flex-end; gap:.75rem; margin-top:.5rem; padding-top:.5rem; border-top:1px solid var(--ds-color-border); }
@media(max-width:640px) { .category-intro { align-items:flex-start; flex-direction:column; } .category-form__grid { grid-template-columns:1fr; } .category-toolbar > * { width:100%; } }
</style>
