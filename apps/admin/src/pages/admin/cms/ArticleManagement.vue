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
