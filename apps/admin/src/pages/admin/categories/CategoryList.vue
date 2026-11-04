<template>
  <div class="category-list-page ds-stack">
    <!-- Card with Toolbar -->
    <WorkspacePageHeading title="مدیریت دسته‌بندی‌ها" heading-id="category-management-title" />
    <KpiStatsRow :items="kpiItems" :loading="loading" />
    <div class="card ds-panel management-data-surface">
      <Toolbar class="ds-toolbar management-data-toolbar">
        <template #start>
          <span class="p-input-icon-right">
            <i class="pi pi-search" aria-hidden="true" />
            <InputText v-model="searchQuery" name="categorySearch" autocomplete="off" placeholder="جستجو…" aria-label="جستجو در دسته‌بندی‌ها" @input="debounceSearch" />
          </span>
        </template>
        <template #end>
          <Button label="دسته جدید" icon="pi pi-plus" @click="openCreateDialog" />
        </template>
      </Toolbar>

      <SharedDataTable
        ref="tableRef"
        class="management-data-table"
        title="فهرست دسته‌بندی‌ها"
        :columns="tableColumns"
        :rows="categories"
        :loading="loading"
        :lazy="true"
        :total-records="pagination.total"
        :rows-per-page="pagination.limit"
        :rows-per-page-options="[10, 20, 50]"
        :searchable="false"
        :column-toggle="false"
        @request="onTableRequest"
      >
        <template #categoryImage="{ row }">
          <img
            v-if="row.image"
            :src="row.image"
            :alt="row.nameFa || row.nameEn || 'تصویر دسته‌بندی'"
            width="56"
            height="44"
            class="category-table-image"
            loading="lazy"
            decoding="async"
          />
          <span v-else class="category-table-image-placeholder" aria-label="بدون تصویر">
            <i class="pi pi-image" aria-hidden="true"></i>
          </span>
        </template>
        <template #actions="{ row }">
          <Button icon="pi pi-pencil" severity="info" rounded text aria-label="ویرایش دسته‌بندی" v-tooltip.top="'ویرایش'" @click="editCategory(row)" />
          <Button icon="pi pi-trash" severity="danger" rounded text aria-label="حذف دسته‌بندی" v-tooltip.top="'حذف'" @click="confirmDelete(row)" />
        </template>
      </SharedDataTable>
    </div>

    <!-- Create/Edit Category Dialog -->
    <Dialog v-model:visible="showDialog" :header="dialogHeader" :modal="true" class="p-fluid">
      <div class="field">
        <label for="nameFa">نام فارسی</label>
        <InputText id="nameFa" v-model="form.nameFa" required />
      </div>
      <div class="field">
        <label for="nameEn">نام انگلیسی</label>
        <InputText id="nameEn" v-model="form.nameEn" required />
      </div>
      <div class="field">
        <label for="slug">اسلاگ</label>
        <InputText id="slug" v-model="form.slug" required />
      </div>
      <div class="field">
        <label for="image">آدرس تصویر دسته‌بندی</label>
        <InputText id="image" v-model="form.image" placeholder="https://... یا /uploads/..." />
        <small>آدرس عمومی تصویر را وارد کنید؛ تصویر در صفحه دسته‌بندی‌ها و صفحه اصلی نمایش داده می‌شود.</small>
        <img v-if="form.image" :src="form.image" :alt="form.nameFa || 'پیش‌نمایش تصویر دسته‌بندی'" width="640" height="360" loading="lazy" decoding="async" style="display: block; max-width: 100%; max-height: 160px; margin-top: 0.75rem; object-fit: contain;" />
      </div>
      <template #footer>
        <Button label="انصراف" icon="pi pi-times" severity="secondary" text @click="closeDialog" />
        <Button label="ذخیره" icon="pi pi-check" @click="saveCategory" />
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="showDeleteDialog" header="تایید حذف" :modal="true">
      <p>آیا از حذف دسته "{{ categoryToDelete?.name }}" مطمئن هستید؟</p>
      <template #footer>
        <Button label="خیر" icon="pi pi-times" severity="secondary" text @click="showDeleteDialog = false" />
        <Button label="بله" icon="pi pi-check" severity="danger" @click="deleteCategory" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import KpiStatsRow from '@telecom/shared-ui/components/common/KpiStatsRow.vue'
import SharedDataTable from '@telecom/shared-ui/components/common/DataTable.vue'
import { ref, computed, onMounted } from 'vue'
import { categoriesApi } from '@telecom/api-client'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const categories = ref([])
const tableRef = ref(null)
const loading = ref(false)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const editingId = ref(null)
const categoryToDelete = ref(null)
const searchQuery = ref('')

const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
})

const kpiItems = computed(() => [
  { label: 'کل دسته‌بندی‌ها', value: pagination.value.total, icon: 'pi pi-sitemap', tone: 'primary' },
])

const tableColumns = [
  { field: 'id', header: 'شناسه', sortable: true, style: 'width: 6rem' },
  { field: 'nameFa', header: 'نام فارسی', sortable: true },
  { field: 'nameEn', header: 'نام انگلیسی' },
  { field: 'image', header: 'تصویر', slot: 'categoryImage' },
  { field: 'slug', header: 'اسلاگ' },
]

const form = ref({
  nameFa: '',
  nameEn: '',
  slug: '',
  image: '',
  status: 'ACTIVE',
  showInMenu: true,
  sortOrder: 0,
})

const dialogHeader = computed(() => {
  return editingId.value ? 'ویرایش دسته‌بندی' : 'ایجاد دسته‌بندی جدید'
})

function resetTablePage() {
  tableRef.value?.resetPage()
}

function debounceSearch() {
  clearTimeout(debounceSearch.timer)
  debounceSearch.timer = setTimeout(() => {
    resetTablePage()
    fetchCategories(1)
  }, 500)
}

async function fetchCategories(page = 1, limit = pagination.value.limit) {
  loading.value = true
  try {
    const res = await categoriesApi.listForManagement({ page, limit, search: searchQuery.value })
    const body = res.data
    const items = body?.data?.data || body?.data || body?.items || body || []
    categories.value = Array.isArray(items) ? items : []
    const meta = body?.data?.meta || body?.meta
    if (meta) {
      pagination.value = {
        page: meta?.page || page,
        limit: meta?.limit || 10,
        total: meta?.total || 0,
        totalPages: meta?.totalPages || 1,
      }
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت دسته‌بندی‌ها', life: 3000 })
  } finally {
    loading.value = false
  }
}

function onTableRequest({ page, rows }) {
  pagination.value.limit = rows
  fetchCategories(page, rows)
}

function openCreateDialog() {
  editingId.value = null
  form.value = { nameFa: '', nameEn: '', slug: '', image: '', status: 'ACTIVE', showInMenu: true, sortOrder: 0 }
  showDialog.value = true
}

function editCategory(category) {
  editingId.value = category.id
  form.value = {
    nameFa: category.nameFa || '',
    nameEn: category.nameEn || '',
    slug: category.slug || '',
    image: category.image || '',
    status: category.status || 'ACTIVE',
    showInMenu: category.showInMenu ?? true,
    sortOrder: category.sortOrder ?? 0,
  }
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
}

async function saveCategory() {
  try {
    if (editingId.value) {
      await categoriesApi.update(editingId.value, form.value)
      toast.add({ severity: 'success', summary: 'موفقیت', detail: 'دسته‌بندی با موفقیت بروزرسانی شد', life: 3000 })
    } else {
      await categoriesApi.create(form.value)
      toast.add({ severity: 'success', summary: 'موفقیت', detail: 'دسته‌بندی با موفقیت ایجاد شد', life: 3000 })
    }
    showDialog.value = false
    editingId.value = null
    form.value = { nameFa: '', nameEn: '', slug: '', image: '', status: 'ACTIVE', showInMenu: true, sortOrder: 0 }
    resetTablePage()
    await fetchCategories()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در ذخیره دسته‌بندی', life: 3000 })
  }
}

function confirmDelete(category) {
  categoryToDelete.value = category
  showDeleteDialog.value = true
}

async function deleteCategory() {
  try {
    await categoriesApi.delete(categoryToDelete.value.id)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'دسته‌بندی با موفقیت حذف شد', life: 3000 })
    showDeleteDialog.value = false
    resetTablePage()
    await fetchCategories()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در حذف دسته‌بندی', life: 3000 })
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.category-list-page {
  direction: rtl;
}

/* Shared Paces-style list hierarchy; query, pagination and permissions unchanged. */
.category-list-page { gap: var(--ds-space-5); }
.category-list-page .ds-page-heading { margin-bottom: 0; }
.category-list-page .card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}
@media (max-width: 640px) {
  .category-list-page { gap: var(--ds-space-3); }
}

.category-list-page { gap: clamp(1rem, 2vw, 1.5rem); }
.management-page-intro {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: linear-gradient(110deg, color-mix(in srgb, var(--ds-color-primary) 8%, var(--ds-color-surface)), var(--ds-color-surface) 72%);
  box-shadow: var(--ds-shadow-xs);
}
.management-page-icon {
  display: grid;
  place-items: center;
  width: 3.2rem;
  height: 3.2rem;
  flex: 0 0 auto;
  border-radius: 1rem;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
  font-size: 1.3rem;
}
.management-page-copy { min-width: 0; }
.management-page-copy > span {
  display: block;
  margin-bottom: .2rem;
  color: var(--ds-color-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
.management-page-copy h1 {
  margin: 0;
  color: var(--ds-color-text);
  font-size: clamp(1.3rem, 2vw, 1.7rem);
  font-weight: 800;
}
.management-page-copy p {
  margin: .35rem 0 0;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  line-height: 1.7;
}
.category-list-page .card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}
@media (max-width: 640px) {
  .management-page-intro { align-items: flex-start; padding: 1rem; }
  .management-page-icon { width: 2.75rem; height: 2.75rem; }
}


/* Access/catalogue administration surfaces. */
.management-data-surface {
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.management-data-toolbar {
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}

.category-table-image,
.category-table-image-placeholder {
  display: grid;
  place-items: center;
  width: 3.5rem;
  height: 2.75rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-primary);
  object-fit: cover;
}
.category-table-image-placeholder i { font-size: 1.1rem; }
</style>
