<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { cmsArticlesApi, cmsCategoriesApi, cmsTagsApi } from '@telecom/api-client'
import { usePermissions } from '@/composables/usePermissions'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const { can } = usePermissions()
const canCreate = computed(() => can('cms.articles.create'))
const canUpdate = computed(() => can('cms.articles.update'))
const canDelete = computed(() => can('cms.articles.delete'))
const canUpload = computed(() => can('media.upload'))

const items = ref([])
const loading = ref(false)
const error = ref('')
const totalRecords = ref(0)
const first = ref(0)
const rows = ref(10)

const search = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const currentPage = ref(1)

const dialog = ref(false)
const editingId = ref(null)
const saving = ref(false)
const uploading = ref(false)

const form = ref({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  contentFormat: 'HTML',
  type: 'ARTICLE',
  status: 'DRAFT',
  coverImageKey: null,
  scheduledAt: null,
  categories: [],
  tags: [],
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  isIndexable: true,
})

const categoryOptions = ref([])
const tagOptions = ref([])
const typeOptions = [
  { label: 'خبر', value: 'NEWS' },
  { label: 'مقاله', value: 'ARTICLE' },
  { label: 'راهنما', value: 'GUIDE' },
]
const statusOptions = [
  { label: 'پیش‌نویس', value: 'DRAFT' },
  { label: 'در بازبینی', value: 'IN_REVIEW' },
  { label: 'زمان‌بندی', value: 'SCHEDULED' },
  { label: 'منتشرشده', value: 'PUBLISHED' },
  { label: 'بایگانی', value: 'ARCHIVED' },
]

const editorPlugins = [
  'Bold', 'Italic', 'Underline', 'Strike', 'Heading', 'Alignment',
  'BulletList', 'NumberedList', 'Indent', 'Outdent', 'Link', 'Image',
  'Table', 'CodeBlock', 'BlockQuote', 'Undo', 'Redo'
]

const statusLabel = (status) => {
  const labels = {
    DRAFT: 'پیش‌نویس',
    IN_REVIEW: 'در بازبینی',
    SCHEDULED: 'زمان‌بندی',
    PUBLISHED: 'منتشرشده',
    ARCHIVED: 'بایگانی',
  }
  return labels[status] || status
}

const statusTone = (status) => {
  const tones = {
    DRAFT: 'secondary',
    IN_REVIEW: 'warn',
    SCHEDULED: 'info',
    PUBLISHED: 'success',
    ARCHIVED: 'danger',
  }
  return tones[status] || 'secondary'
}

const typeLabel = (type) => {
  const labels = { NEWS: 'خبر', ARTICLE: 'مقاله', GUIDE: 'راهنما' }
  return labels[type] || type
}

async function fetchCategories() {
  try {
    const res = await cmsCategoriesApi.list()
    categoryOptions.value = (res.data?.data || res.data || []).map(c => ({ id: c.id, name: c.name }))
  } catch (err) {
    console.error('Failed to fetch categories:', err)
  }
}

async function fetchTags() {
  try {
    const res = await cmsTagsApi.list()
    tagOptions.value = (res.data?.data || res.data || []).map(t => ({ id: t.id, name: t.name }))
  } catch (err) {
    console.error('Failed to fetch tags:', err)
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params = {
      page: currentPage.value,
      limit: rows.value,
      search: search.value || undefined,
      status: statusFilter.value || undefined,
      type: typeFilter.value || undefined,
    }
    const res = await cmsArticlesApi.listManage(params)
    const data = res.data?.data || res.data || { items: [], meta: {} }
    items.value = data.items || data.data || []
    totalRecords.value = data.meta?.total || data.total || items.value.length
    first.value = (currentPage.value - 1) * rows.value
  } catch (err) {
    error.value = err.message || 'بارگذاری مقالات با خطا مواجه شد'
    toast.add({ severity: 'error', summary: 'خطا', detail: error.value, life: 3500 })
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
  form.value = {
    title: '', slug: '', excerpt: '', content: '', contentFormat: 'HTML',
    type: 'ARTICLE', status: 'DRAFT', coverImageKey: null, scheduledAt: null,
    categories: [], tags: [], metaTitle: '', metaDescription: '', canonicalUrl: '', isIndexable: true,
  }
  editingId.value = null
  dialog.value = true
}

async function edit(item) {
  try {
    const res = await cmsArticlesApi.getManageById(item.id)
    const data = res.data?.data || res.data
    if (!data) throw new Error('مقاله یافت نشد')
    form.value = {
      title: data.title || '',
      slug: data.slug || '',
      excerpt: data.excerpt || '',
      content: data.content || '',
      contentFormat: data.contentFormat || 'HTML',
      type: data.type || 'ARTICLE',
      status: data.status || 'DRAFT',
      coverImageKey: data.coverImageKey || null,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString().slice(0, 16) : null,
      categories: (data.categories || []).map(c => c.categoryId || c.category?.id || c.id).filter(Boolean),
      tags: (data.tags || []).map(t => t.tagId || t.tag?.id || t.id).filter(Boolean),
      metaTitle: data.metaTitle || '',
      metaDescription: data.metaDescription || '',
      canonicalUrl: data.canonicalUrl || '',
      isIndexable: data.isIndexable !== false,
    }
    editingId.value = item.id
    dialog.value = true
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'بارگذاری مقاله ناموفق بود', life: 3500 })
  }
}

function closeDialog() {
  dialog.value = false
  editingId.value = null
  form.value = {
    title: '', slug: '', excerpt: '', content: '', contentFormat: 'HTML',
    type: 'ARTICLE', status: 'DRAFT', coverImageKey: null, scheduledAt: null,
    categories: [], tags: [], metaTitle: '', metaDescription: '', canonicalUrl: '', isIndexable: true,
  }
}

async function save() {
  if (!form.value.title.trim() || !form.value.excerpt.trim() || !form.value.content.trim()) {
    toast.add({ severity: 'warn', summary: 'اطلاعات ناقص', detail: 'عنوان، چکیده و محتوا الزامی هستند', life: 3000 })
    return
  }
  if (!form.value.categories.length) {
    toast.add({ severity: 'warn', summary: 'اطلاعات ناقص', detail: 'حداقل یک دسته‌بندی الزامی است', life: 3000 })
    return
  }
  saving.value = true
  try {
    const payload = {
      title: form.value.title.trim(),
      slug: form.value.slug.trim() || undefined,
      excerpt: form.value.excerpt.trim(),
      content: form.value.content,
      contentFormat: form.value.contentFormat,
      type: form.value.type,
      status: form.value.status,
      coverImageKey: form.value.coverImageKey,
      scheduledAt: form.value.scheduledAt ? new Date(form.value.scheduledAt).toISOString() : null,
      categories: form.value.categories,
      tags: form.value.tags,
      metaTitle: form.value.metaTitle?.trim() || null,
      metaDescription: form.value.metaDescription?.trim() || null,
      canonicalUrl: form.value.canonicalUrl?.trim() || null,
      isIndexable: form.value.isIndexable,
    }
    if (editingId.value) {
      await cmsArticlesApi.update(editingId.value, payload)
    } else {
      await cmsArticlesApi.create(payload)
    }
    dialog.value = false
    toast.add({ severity: 'success', summary: 'ذخیره شد', detail: 'اطلاعات مقاله ذخیره شد', life: 2500 })
    await load()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error?.message || 'ذخیره مقاله ناموفق بود', life: 3500 })
  } finally {
    saving.value = false
  }
}

function deleteArticle(item) {
  confirm.require({
    message: 'مقاله «' + item.title + '» به‌طور دائمی حذف شود؟ این عملیات غیرقابل بازگشت است.',
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    accept: async () => {
      try {
        await cmsArticlesApi.delete(item.id)
        toast.add({ severity: 'success', summary: 'حذف شد', detail: 'مقاله با موفقیت حذف شد', life: 2500 })
        await load()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'خطا', detail: error?.message || 'حذف مقاله انجام نشد', life: 3500 })
      }
    },
  })
}
async function archiveArticle(item) {
  try {
    await cmsArticlesApi.changeStatus(item.id, 'ARCHIVED')
    toast.add({ severity: 'success', summary: 'بایگانی شد', detail: 'مقاله بایگانی و از نمایش عمومی خارج شد', life: 2500 })
    await load()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error?.message || 'بایگانی مقاله انجام نشد', life: 3500 })
  }
}

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchTags()])
  load()
})
</script>

<style scoped>
.article-management { gap: 1.1rem; color: var(--ds-color-text); }
.article-intro { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:1.25rem 1.4rem; border:1px solid var(--ds-color-border); border-radius:var(--ds-card-radius); background:linear-gradient(115deg,color-mix(in srgb,var(--ds-color-primary) 8%,var(--ds-color-surface)),var(--ds-color-surface) 72%); }
.article-intro__eyebrow { color:var(--ds-color-primary); font-size:.75rem; font-weight:800; }
.article-intro h2 { margin:.3rem 0; font-size:1.15rem; }
.article-intro p { margin:0; color:var(--ds-color-text-muted); font-size:.85rem; line-height:1.8; }
.article-toolbar { display:flex; flex-wrap:wrap; gap:.65rem; }
.article-toolbar > :first-child { min-width:min(320px,100%); }
.article-table-wrap { overflow:hidden; border:1px solid var(--ds-color-border); border-radius:var(--ds-card-radius); background:var(--ds-color-surface); }
.article-thumb { width:80px; height:50px; object-fit:cover; border-radius:8px; }
.article-empty { padding:2rem; text-align:center; color:var(--ds-color-text-muted); }
.article-pagination { padding: 1rem; }
.article-form { display:grid; gap:1rem; }
.article-form__field { display:grid; gap:.45rem; min-width:0; }
.article-form__field label { font-size:.83rem; font-weight:700; }
.article-form__grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
.article-form__fieldset { border:1px solid var(--ds-color-border); border-radius:var(--ds-card-radius); padding:1rem; margin:.5rem 0; }
.article-form__fieldset legend { font-weight:700; color:var(--ds-color-primary); padding:0 .5rem; }
.article-upload { display:flex; align-items:center; flex-wrap:wrap; gap:.75rem; }
.article-upload input { position:absolute; width:1px; height:1px; opacity:0; pointer-events:none; }
.article-upload span { color:var(--ds-color-text-muted); font-size:.75rem; }
.article-preview { display:block; width:100%; max-height:200px; object-fit:contain; border:1px solid var(--ds-color-border); border-radius:10px; background:var(--ds-color-surface-alt); }
.article-form__actions { display:flex; justify-content:flex-end; gap:.75rem; margin-top:.5rem; padding-top:.5rem; border-top:1px solid var(--ds-color-border); }
@media(max-width:640px) { .article-intro { align-items:flex-start; flex-direction:column; } .article-form__grid { grid-template-columns:1fr; } .article-toolbar > * { width:100%; } }
</style>
<template>
  <div class="article-management ds-stack" dir="rtl">
    <WorkspacePageHeading title="مدیریت مقالات مجله" heading-id="article-management-title" />
    <div class="article-intro">
      <div><span class="article-intro__eyebrow">مقالات مجله</span><h2>فهرست مقالات</h2><p>مقالات منتشرشده، پیش‌نویس‌ها، در بازبینی و زمان‌بندی‌شده را مدیریت کنید.</p></div>
      <Button v-if="canCreate" label="مقاله جدید" icon="pi pi-plus" @click="openCreate" />
    </div>
    <div class="article-toolbar">
      <InputText v-model="search" placeholder="جستجو در عنوان، چکیده یا محتوا…" @keyup.enter="load" />
      <Select v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value" placeholder="همه وضعیت‌ها" show-clear @change="load" />
      <Select v-model="typeFilter" :options="typeOptions" option-label="label" option-value="value" placeholder="همه انواع" show-clear @change="load" />
      <Button label="جستجو" icon="pi pi-search" severity="secondary" outlined @click="load" />
    </div>
    <div class="article-table-wrap">
      <DataTable :value="items" :loading="loading" data-key="id" responsive-layout="scroll" striped-rows :paginator="true" :rows="10" :totalRecords="totalRecords" @page="onPage">
        <Column header="تصویر" style="width: 100px">
          <template #body="{ data }"><img v-if="data.coverImageKey" :src="`/api/v1/uploads/${data.coverImageKey}`" :alt="data.title" class="article-thumb" /><span v-else>—</span></template>
        </Column>
        <Column field="title" header="عنوان" style="min-width: 250px" />
        <Column field="type" header="نوع" style="width: 100px" />
        <Column header="دسته‌بندی‌ها" style="width: 180px">
          <template #body="{ data }"><span v-if="data.categories?.length">{{ data.categories.map(c => c.category?.name).filter(Boolean).join('، ') }}</span><span v-else>—</span></template>
        </Column>
        <Column header="برچسب‌ها" style="width: 150px">
          <template #body="{ data }"><span v-if="data.tags?.length">{{ data.tags.map(t => t.tag?.name).filter(Boolean).join('، ') }}</span><span v-else>—</span></template>
        </Column>
        <Column header="وضعیت" style="width: 130px">
          <template #body="{ data }"><Tag :value="statusLabel(data.status)" :severity="statusTone(data.status)" /></template>
        </Column>
        <Column header="انتشار" style="width: 160px">
          <template #body="{ data }"><small v-if="data.publishedAt">{{ formatDate(data.publishedAt) }}</small><span v-else-if="data.scheduledAt">{{ formatDate(data.scheduledAt) }} (زمان‌بندی)</span><span v-else>—</span></template>
        </Column>
        <Column header="عملیات" style="width: 150px">
          <template #body="{ data }">
            <Button v-if="canUpdate" icon="pi pi-pencil" text rounded aria-label="ویرایش مقاله" @click="edit(data)" />
            <Button v-if="canDelete && data.status !== 'PUBLISHED'" icon="pi pi-trash" text rounded severity="danger" aria-label="حذف مقاله" @click="deleteArticle(data)" />
            <Button v-if="canUpdate && data.status === 'PUBLISHED'" icon="pi pi-archive" text rounded severity="warn" aria-label="بایگانی مقاله" @click="archiveArticle(data)" />
          </template>
        </Column>
        <template #empty><div class="article-empty">هنوز مقاله‌ای ثبت نشده است.</div></template>
      </DataTable>
      <div class="article-pagination" v-if="totalRecords > 10">
        <Paginator :first="first" :rows="rows" :totalRecords="totalRecords" @page="onPage" :pageLinkSize="5" />
      </div>
    </div>

    <Dialog v-model:visible="dialog" :header="editingId ? 'ویرایش مقاله' : 'ایجاد مقاله جدید'" modal :style="{ width: 'min(900px, 96vw)' }" :closable="!saving">
      <div class="article-form">
        <div class="article-form__field"><label for="article-title">عنوان *</label><InputText id="article-title" v-model="form.title" maxlength="220" /></div>
        <div class="article-form__field"><label for="article-slug">اسلاگ (شناسه URL) *</label><InputText id="article-slug" v-model="form.slug" maxlength="220" placeholder="به‌صورت خودکار از عنوان تولید می‌شود" /></div>
        <div class="article-form__field"><label for="article-excerpt">چکیده *</label><Textarea id="article-excerpt" v-model="form.excerpt" rows="3" maxlength="500" auto-resize placeholder="خلاصه کوتاه برای نمایش در لیست و SEO" /></div>
        <div class="article-form__field"><label for="article-content">محتوا *</label><Editor v-model="form.content" :editorStyle="{ height: '400px' }" :plugins="editorPlugins" toolbar="bold italic underline strikethrough | heading | alignleft aligncenter alignright | bullist numlist | outdent indent | link image table | code blockquote | undo redo" /></div>
        <div class="article-form__grid">
          <div class="article-form__field"><label for="article-type">نوع مقاله *</label><Select id="article-type" v-model="form.type" :options="typeOptions" option-label="label" option-value="value" placeholder="نوع را انتخاب کنید" /></div>
          <div class="article-form__field"><label for="article-status">وضعیت *</label><Select id="article-status" v-model="form.status" :options="statusOptions" option-label="label" option-value="value" placeholder="وضعیت را انتخاب کنید" /></div>
        </div>
        <div class="article-form__grid">
          <div class="article-form__field"><label for="article-cover">تصویر جلد</label><div class="article-upload"><input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" @change="uploadImage" /><Button v-if="canUpload" label="انتخاب تصویر" icon="pi pi-upload" severity="secondary" outlined :loading="uploading" @click="fileInput?.click()" /><span>{{ form.coverImageKey ? 'تصویر بارگذاری شده است' : 'JPG، PNG یا WebP — حداکثر ۸ مگابایت' }}</span></div><img v-if="form.coverImageKey" :src="`/api/v1/uploads/${form.coverImageKey}`" alt="پیش‌نمایش تصویر جلد" class="article-preview" /></div>
          <div class="article-form__field"><label for="article-scheduled">زمان‌بندی انتشار</label><InputText id="article-scheduled" v-model="form.scheduledAt" placeholder="تاریخ و ساعت انتشار (اختیاری)" type="datetime-local" /></div>
        </div>
        <div class="article-form__field"><label>دسته‌بندی‌ها *</label><MultiSelect v-model="form.categories" :options="categoryOptions" option-label="name" option-value="id" placeholder="دسته‌بندی‌ها را انتخاب کنید" display="chip" maxSelectedLabels="3" /></div>
        <div class="article-form__field"><label>برچسب‌ها</label><MultiSelect v-model="form.tags" :options="tagOptions" option-label="name" option-value="id" placeholder="برچسب‌ها را انتخاب کنید" display="chip" /></div>

        <fieldset class="article-form__fieldset">
          <legend>تنظیمات SEO</legend>
          <div class="article-form__grid">
            <div class="article-form__field"><label for="article-meta-title">عنوان SEO (Meta Title)</label><InputText id="article-meta-title" v-model="form.metaTitle" maxlength="70" placeholder="حداکثر ۷۰ کاراکتر" /></div>
            <div class="article-form__field"><label for="article-meta-desc">توضیحات SEO (Meta Description)</label><InputText id="article-meta-desc" v-model="form.metaDescription" maxlength="160" placeholder="حداکثر ۱۶۰ کاراکتر" /></div>
          </div>
          <div class="article-form__field"><label for="article-canonical">Canonical URL</label><InputText id="article-canonical" v-model="form.canonicalUrl" placeholder="https://example.com/articles/slug" /></div>
          <div class="article-form__field"><label for="article-indexable">قابل ایندکس‌سازی</label><InputSwitch id="article-indexable" v-model="form.isIndexable" /></div>
        </fieldset>

        <div class="article-form__actions">
          <Button label="انصراف" icon="pi pi-times" text @click="closeDialog" :disabled="saving" />
          <Button label="ذخیره" icon="pi pi-check" @click="save" :loading="saving" />
        </div>
      </div>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>