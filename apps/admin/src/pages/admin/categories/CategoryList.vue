<template>
  <div class="category-list-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1>مدیریت دسته‌بندی‌ها</h1>
      <div class="page-header-actions">
        <Button label="دسته جدید" icon="pi pi-plus" @click="openCreateDialog" />
      </div>
    </div>

    <!-- Card with Toolbar -->
    <div class="card">
      <Toolbar>
        <template #start>
          <span class="p-input-icon-right">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="جستجو..." @input="debounceSearch" />
          </span>
        </template>
      </Toolbar>

      <DataTable :value="categories" :loading="loading" :paginator="true" :rows="pagination.limit"
        :totalRecords="pagination.total" :rowsPerPageOptions="[5, 10, 20, 50]"
        @page="onPageChange" responsiveLayout="scroll">
        <Column field="id" header="شناسه" sortable></Column>
        <Column field="name" header="نام" sortable></Column>
        <Column field="slug" header="اسلاگ"></Column>
        <Column header="دسته والد">
          <template #body="{ data }">
            {{ data.parent?.name || '-' }}
          </template>
        </Column>
        <Column header="عملیات">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" severity="info" rounded text @click="editCategory(data)" />
              <Button icon="pi pi-trash" severity="danger" rounded text @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Category Dialog -->
    <Dialog v-model:visible="showDialog" :header="dialogHeader" :modal="true" class="p-fluid">
      <div class="field">
        <label for="name">نام</label>
        <InputText id="name" v-model="form.name" />
      </div>
      <div class="field">
        <label for="slug">اسلاگ</label>
        <InputText id="slug" v-model="form.slug" />
      </div>
      <div class="field">
        <label for="parent">دسته والد</label>
        <Dropdown id="parent" v-model="form.parentId" :options="parentCategories" optionLabel="name" optionValue="id" placeholder="بدون والد" showClear />
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
import { ref, computed, onMounted } from 'vue'
import { categoriesApi } from '@telecom/api-client'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const categories = ref([])
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

const form = ref({
  name: '',
  slug: '',
  parentId: null
})

const parentCategories = ref([])

const dialogHeader = computed(() => {
  return editingId.value ? 'ویرایش دسته‌بندی' : 'ایجاد دسته‌بندی جدید'
})

function debounceSearch() {
  clearTimeout(debounceSearch.timer)
  debounceSearch.timer = setTimeout(() => {
    fetchCategories(1)
  }, 500)
}

async function fetchCategories(page = 1) {
  loading.value = true
  try {
    const res = await categoriesApi.list({ page, search: searchQuery.value })
    const body = res.data
    const items = body?.data?.data || body?.data || body?.items || body || []
    categories.value = Array.isArray(items) ? items : []
    parentCategories.value = categories.value
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

function onPageChange(event) {
  fetchCategories(event.page + 1)
}

function openCreateDialog() {
  editingId.value = null
  form.value = { name: '', slug: '', parentId: null }
  showDialog.value = true
}

function editCategory(category) {
  editingId.value = category.id
  form.value = { ...category }
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
    form.value = { name: '', slug: '', parentId: null }
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
</style>