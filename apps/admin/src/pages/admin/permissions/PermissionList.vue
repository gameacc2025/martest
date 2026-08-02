<template>
  <div class="permission-list-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1>لیست مجوزها</h1>
      <div class="page-header-actions">
        <Button label="مجوز جدید" icon="pi pi-plus" @click="openCreateDialog" />
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

      <DataTable :value="permissions" :loading="loading" :paginator="true" :rows="pagination.limit"
        :totalRecords="pagination.total" :rowsPerPageOptions="[5, 10, 20, 50]"
        @page="onPageChange" responsiveLayout="scroll">
        <Column field="id" header="شناسه" sortable></Column>
        <Column field="name" header="نام مجوز" sortable></Column>
        <Column field="label" header="عنوان" sortable></Column>
        <Column field="group" header="گروه"></Column>
        <Column field="description" header="توضیحات"></Column>
        <Column header="عملیات">
          <template #body="slotProps">
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" severity="info" rounded text @click="editPermission(slotProps.data)" />
              <Button icon="pi pi-trash" severity="danger" rounded text @click="confirmDelete(slotProps.data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Permission Dialog -->
    <Dialog v-model:visible="showDialog" :header="dialogHeader" :modal="true" class="p-fluid">
      <div class="field">
        <label for="name">نام مجوز (انگلیسی)</label>
        <InputText id="name" v-model="currentPermission.name" :disabled="isEditMode" placeholder="مثال: users.create" />
      </div>
      <div class="field">
        <label for="label">عنوان نمایشی</label>
        <InputText id="label" v-model="currentPermission.label" placeholder="مثال: ایجاد کاربر" />
      </div>
      <div class="field">
        <label for="group">گروه</label>
        <InputText id="group" v-model="currentPermission.group" placeholder="مثال: users" />
      </div>
      <div class="field">
        <label for="description">توضیحات</label>
        <InputText id="description" v-model="currentPermission.description" />
      </div>
      <template #footer>
        <Button label="لغو" icon="pi pi-times" severity="secondary" text @click="closeDialog" />
        <Button label="ذخیره" icon="pi pi-check" @click="savePermission" />
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="showDeleteDialog" header="تایید حذف" :modal="true">
      <p>آیا از حذف مجوز "{{ permissionToDelete?.label || permissionToDelete?.name }}" مطمئن هستید؟</p>
      <template #footer>
        <Button label="خیر" icon="pi pi-times" severity="secondary" text @click="showDeleteDialog = false" />
        <Button label="بله" icon="pi pi-check" severity="danger" @click="deletePermission" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePermissionStore } from '@/stores/admin/permissions'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const permissionStore = usePermissionStore()

const permissions = ref([])
const loading = ref(false)
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
})

const searchQuery = ref('')
const showDialog = ref(false)
const isEditMode = ref(false)
const currentPermission = ref({})
const showDeleteDialog = ref(false)
const permissionToDelete = ref(null)

const dialogHeader = computed(() => {
  return isEditMode.value ? 'ویرایش مجوز' : 'ایجاد مجوز جدید'
})

onMounted(() => {
  loadPermissions()
})

function debounceSearch() {
  clearTimeout(debounceSearch.timer)
  debounceSearch.timer = setTimeout(() => {
    applyFilters()
  }, 500)
}

function applyFilters() {
  loadPermissions(1)
}

async function loadPermissions(page = 1) {
  try {
    loading.value = true
    const response = await permissionStore.getPermissions({
      page,
      search: searchQuery.value
    })
    permissions.value = response.permissions || []
    pagination.value = {
      page: response.page,
      limit: response.limit,
      total: response.total,
      totalPages: response.totalPages,
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت مجوزها', life: 3000 })
  } finally {
    loading.value = false
  }
}

function onPageChange(event) {
  loadPermissions(event.page + 1)
}

function openCreateDialog() {
  isEditMode.value = false
  currentPermission.value = {
    name: '',
    label: '',
    group: '',
    description: ''
  }
  showDialog.value = true
}

function editPermission(permission) {
  isEditMode.value = true
  currentPermission.value = { ...permission }
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
}

async function savePermission() {
  try {
    if (isEditMode.value) {
      await permissionStore.updatePermission(currentPermission.value.id, {
        label: currentPermission.value.label,
        description: currentPermission.value.description,
        group: currentPermission.value.group,
      })
      toast.add({ severity: 'success', summary: 'موفقیت', detail: 'مجوز با موفقیت بروزرسانی شد', life: 3000 })
    } else {
      await permissionStore.createPermission({
        name: currentPermission.value.name,
        label: currentPermission.value.label,
        description: currentPermission.value.description,
        group: currentPermission.value.group,
      })
      toast.add({ severity: 'success', summary: 'موفقیت', detail: 'مجوز با موفقیت ایجاد شد', life: 3000 })
    }
    closeDialog()
    loadPermissions()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error.message || 'خطا در ذخیره مجوز', life: 3000 })
  }
}

function confirmDelete(permission) {
  permissionToDelete.value = permission
  showDeleteDialog.value = true
}

async function deletePermission() {
  try {
    await permissionStore.deletePermission(permissionToDelete.value.id)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'مجوز با موفقیت حذف شد', life: 3000 })
    showDeleteDialog.value = false
    loadPermissions()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error.message || 'خطا در حذف مجوز', life: 3000 })
  }
}
</script>

<style scoped>
.permission-list-page {
  direction: rtl;
}
</style>