<template>
  <div class="faq-management ds-stack" dir="rtl">
    <WorkspacePageHeading title="مدیریت سوالات متداول" heading-id="faq-management-title" />
    <div class="faq-intro">
      <div><span class="faq-intro__eyebrow">سوالات متداول</span><h2>فهرست سوالات متداول</h2><p>سوالات متداول را مدیریت کنید.</p></div>
      <Button v-if="canCreate" label="سوال جدید" icon="pi pi-plus" @click="openCreate" />
    </div>
    <div class="faq-toolbar">
      <InputText v-model="search" placeholder="جستجو در متن سوال…" @keyup.enter="load" />
      <Select v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value" placeholder="همه وضعیت‌ها" show-clear @change="load" />
      <Button label="جستجو" icon="pi pi-search" severity="secondary" outlined @click="load" />
    </div>
    <div class="faq-table-wrap">
      <DataTable :value="items" :loading="loading" data-key="id" responsive-layout="scroll" striped-rows :paginator="true" :rows="10" :totalRecords="totalRecords" @page="onPage">
        <Column field="question" header="سوال" style="min-width: 300px" />
        <Column field="category" header="دسته‌بندی" style="width: 150px" />
        <Column field="sortOrder" header="ترتیب" style="width: 100px" />
        <Column header="وضعیت" style="width: 130px">
          <template #body="{ data }"><Tag :value="statusLabel(data.isActive)" :severity="statusTone(data.isActive)" /></template>
        </Column>
        <Column header="عملیات" style="width: 130px">
          <template #body="{ data }">
            <Button v-if="canUpdate" icon="pi pi-pencil" text rounded aria-label="ویرایش سوال" @click="edit(data)" />
            <Button v-if="canDelete" icon="pi pi-trash" text rounded severity="danger" aria-label="حذف سوال" @click="deleteFaq(data)" />
          </template>
        </Column>
        <template #empty><div class="faq-empty">هنوز سوالی ثبت نشده است.</div></template>
      </DataTable>
      <div class="faq-pagination" v-if="totalRecords > 10">
        <Paginator :first="first" :rows="rows" :totalRecords="totalRecords" @page="onPage" :pageLinkSize="5" />
      </div>
    </div>

    <Dialog v-model:visible="dialog" :header="editingId ? 'ویرایش سوال' : 'ایجاد سوال جدید'" modal :style="{ width: 'min(600px, 94vw)' }" :closable="!saving">
      <div class="faq-form">
        <div class="faq-form__field"><label for="faq-question">سوال *</label><InputText id="faq-question" v-model="form.question" maxlength="500" /></div>
        <div class="faq-form__field"><label for="faq-answer">پاسخ *</label><Textarea id="faq-answer" v-model="form.answer" rows="4" maxlength="2000" auto-resize /></div>
        <div class="faq-form__field"><label for="faq-category">دسته‌بندی</label><InputText id="faq-category" v-model="form.category" maxlength="100" placeholder="مثال: خرید، پرداخت، حساب کاربری" /></div>
        <div class="faq-form__grid">
          <div class="faq-form__field"><label for="faq-sort">ترتیب نمایش</label><InputNumber id="faq-sort" v-model="form.sortOrder" :min="0" /></div>
          <div class="faq-form__field"><label for="faq-status">وضعیت</label><Select id="faq-status" v-model="form.isActive" :options="statusOptions" option-label="label" option-value="value" placeholder="وضعیت را انتخاب کنید" /></div>
        </div>

        <div class="faq-form__actions">
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
import { cmsFaqsApi } from '@telecom/api-client'
import { usePermissions } from '@/composables/usePermissions'

const toast = useToast()
const confirm = useConfirm()
const { can } = usePermissions()
const canCreate = computed(() => can('cms.faqs.create'))
const canUpdate = computed(() => can('cms.faqs.update'))
const canDelete = computed(() => can('cms.faqs.delete'))

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
  question: '',
  answer: '',
  category: '',
  sortOrder: 0,
  isActive: true,
})

const statusOptions = [
  { label: 'فعال', value: true },
  { label: 'غیرفعال', value: false },
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
    const res = await cmsFaqsApi.listManage(params)
    const data = res.data?.data || res.data || { items: [], meta: {} }
    items.value = data.items || data.data || []
    totalRecords.value = data.meta?.total || data.total || items.value.length
    first.value = (currentPage.value - 1) * rows.value
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'بارگذاری سوالات با خطا مواجه شد', life: 3500 })
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
  form.value = { question: '', answer: '', category: '', sortOrder: 0, isActive: true }
  editingId.value = null
  dialog.value = true
}

async function edit(item) {
  try {
    const res = await cmsFaqsApi.getById(item.id)
    const data = res.data?.data || res.data
    if (!data) throw new Error('سوال یافت نشد')
    form.value = { question: data.question || '', answer: data.answer || '', category: data.category || '', sortOrder: data.sortOrder || 0, isActive: data.isActive !== false }
    editingId.value = item.id
    dialog.value = true
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'بارگذاری سوال ناموفق بود', life: 3500 })
  }
}

function closeDialog() {
  dialog.value = false
  editingId.value = null
  form.value = { question: '', answer: '', category: '', sortOrder: 0, isActive: true }
}

async function save() {
  if (!form.value.question.trim()) {
    toast.add({ severity: 'warn', summary: 'اطلاعات ناقص', detail: 'متن سوال الزامی است', life: 3000 })
    return
  }
  if (!form.value.answer.trim()) {
    toast.add({ severity: 'warn', summary: 'اطلاعات ناقص', detail: 'پاسخ سوال الزامی است', life: 3000 })
    return
  }
  saving.value = true
  try {
    const payload = {
      question: form.value.question.trim(),
      answer: form.value.answer.trim(),
      category: form.value.category?.trim() || '',
      sortOrder: form.value.sortOrder || 0,
      isActive: form.value.isActive,
    }
    if (editingId.value) {
      await cmsFaqsApi.update(editingId.value, payload)
    } else {
      await cmsFaqsApi.create(payload)
    }
    dialog.value = false
    toast.add({ severity: 'success', summary: 'ذخیره شد', detail: 'اطلاعات سوال متداول ذخیره شد', life: 2500 })
    await load()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error?.message || 'ذخیره سوال متداول ناموفق بود', life: 3500 })
  } finally {
    saving.value = false
  }
}

function deleteFaq(item) {
  confirm.require({
    message: 'سوال «' + (item.question?.substring(0, 50) || 'بدون عنوان') + '...' + '» به‌طور دائمی حذف شود؟ این عملیات غیرقابل بازگشت است.',
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    accept: async () => {
      try {
        await cmsFaqsApi.delete(item.id)
        toast.add({ severity: 'success', summary: 'حذف شد', detail: 'سوال متداول با موفقیت حذف شد', life: 2500 })
        await load()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'خطا', detail: error?.message || 'حذف سوال متداول انجام نشد', life: 3500 })
      }
    },
  })
}
onMounted(load)
</script>
<style scoped>
.faq-management { gap: 1.1rem; color: var(--ds-color-text); }
.faq-intro { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:1.25rem 1.4rem; border:1px solid var(--ds-color-border); border-radius:var(--ds-card-radius); background:linear-gradient(115deg,color-mix(in srgb,var(--ds-color-primary) 8%,var(--ds-color-surface)),var(--ds-color-surface) 72%); }
.faq-intro__eyebrow { color:var(--ds-color-primary); font-size:.75rem; font-weight:800; }
.faq-intro h2 { margin:.3rem 0; font-size:1.15rem; }
.faq-intro p { margin:0; color:var(--ds-color-text-muted); font-size:.85rem; line-height:1.8; }
.faq-toolbar { display:flex; flex-wrap:wrap; gap:.65rem; }
.faq-toolbar > :first-child { min-width:min(320px,100%); }
.faq-table-wrap { overflow:hidden; border:1px solid var(--ds-color-border); border-radius:var(--ds-card-radius); background:var(--ds-color-surface); }
.faq-empty { padding:2rem; text-align:center; color:var(--ds-color-text-muted); }
.faq-pagination { padding: 1rem; }
.faq-form { display:grid; gap:1rem; }
.faq-form__field { display:grid; gap:.45rem; min-width:0; }
.faq-form__field label { font-size:.83rem; font-weight:700; }
.faq-form__grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
.faq-form__actions { display:flex; justify-content:flex-end; gap:.75rem; margin-top:.5rem; padding-top:.5rem; border-top:1px solid var(--ds-color-border); }
@media(max-width:640px) { .faq-intro { align-items:flex-start; flex-direction:column; } .faq-form__grid { grid-template-columns:1fr; } .faq-toolbar > * { width:100%; } }
</style>