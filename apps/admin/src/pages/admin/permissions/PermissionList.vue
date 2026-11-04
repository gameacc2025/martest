<template>
  <div class="permission-list-page ds-stack">
    <!-- Card with Toolbar -->
    <WorkspacePageHeading title="مدیریت مجوزها" heading-id="permission-management-title" />
    <KpiStatsRow :items="kpiItems" :loading="loading" />
    <div class="card ds-panel management-data-surface">
      <Toolbar class="ds-toolbar management-data-toolbar">
        <template #start>
          <span class="p-input-icon-right">
            <i class="pi pi-search" aria-hidden="true" />
            <InputText v-model="searchQuery" name="permissionSearch" autocomplete="off" placeholder="جستجو…" aria-label="جستجو در مجوزها" @input="debounceSearch" />
          </span>
        </template>
        <template #end>
          <Button label="مجوز جدید" icon="pi pi-plus" @click="openCreateDialog" />
        </template>
      </Toolbar>

      <SharedDataTable
        ref="tableRef"
        class="management-data-table"
        title="فهرست مجوزها"
        :columns="tableColumns"
        :rows="permissions"
        :loading="loading"
        :lazy="true"
        :total-records="pagination.total"
        :rows-per-page="pagination.limit"
        :rows-per-page-options="[5, 10, 20, 50]"
        :searchable="false"
        :column-toggle="false"
        @request="onTableRequest"
      >
        <template #actions="{ row }">
          <Button icon="pi pi-pencil" severity="info" rounded text aria-label="ویرایش مجوز" @click="editPermission(row)" />
          <Button icon="pi pi-trash" severity="danger" rounded text aria-label="حذف مجوز" @click="confirmDelete(row)" />
        </template>
      </SharedDataTable>
    </div>

    <!-- Create/Edit Permission Dialog -->
    <Dialog v-model:visible="showDialog" :header="dialogHeader" :modal="true" class="p-fluid" :style="{ width: '600px', maxWidth: '96vw' }" :breakpoints="{ '960px': '92vw', '640px': '96vw' }">
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
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import KpiStatsRow from '@telecom/shared-ui/components/common/KpiStatsRow.vue'
import SharedDataTable from '@telecom/shared-ui/components/common/DataTable.vue'
import { ref, computed, onMounted } from 'vue'
import { usePermissionStore } from '@/stores/admin/permissions'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const permissionStore = usePermissionStore()

const permissions = ref([])
const tableRef = ref(null)
const loading = ref(false)
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
})

const kpiItems = computed(() => [
  { label: 'کل مجوزها', value: pagination.value.total, icon: 'pi pi-lock', tone: 'primary' },
  { label: 'گروه‌های مجوز (صفحه جاری)', value: new Set(permissions.value.map((item) => item.group).filter(Boolean)).size, icon: 'pi pi-folder', tone: 'info' },
  { label: 'دارای توضیح (صفحه جاری)', value: permissions.value.filter((item) => Boolean(item.description)).length, icon: 'pi pi-align-right', tone: 'success' },
  { label: 'نمایش داده‌شده', value: permissions.value.length, icon: 'pi pi-list', tone: 'warning' },
])

const searchQuery = ref('')
const tableColumns = [
  { field: 'id', header: 'شناسه', sortable: true, style: 'width: 5rem' },
  { field: 'name', header: 'نام مجوز', sortable: true },
  { field: 'label', header: 'عنوان', sortable: true },
  { field: 'group', header: 'گروه' },
  { field: 'description', header: 'توضیحات' },
]
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
  tableRef.value?.resetPage()
  loadPermissions(1)
}

async function loadPermissions(page = 1, limit = pagination.value.limit) {
  try {
    loading.value = true
    const response = await permissionStore.getPermissions({
      page,
      limit,
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

function onTableRequest({ page, rows }) {
  pagination.value.limit = rows
  loadPermissions(page, rows)
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
    tableRef.value?.resetPage()
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
    tableRef.value?.resetPage()
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

/* Shared Paces-style list hierarchy; query, pagination and permissions unchanged. */
.permission-list-page { gap: var(--ds-space-5); }
.permission-list-page .ds-page-heading { margin-bottom: 0; }
.permission-list-page .card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}
@media (max-width: 640px) {
  .permission-list-page { gap: var(--ds-space-3); }
}

.permission-list-page { gap: clamp(1rem, 2vw, 1.5rem); }
.access-management-intro {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: linear-gradient(110deg, color-mix(in srgb, var(--ds-color-primary) 8%, var(--ds-color-surface)), var(--ds-color-surface) 72%);
  box-shadow: var(--ds-shadow-xs);
}
.access-management-icon {
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
.access-management-intro > div { min-width: 0; }
.access-management-intro > div > span {
  display: block;
  margin-bottom: .2rem;
  color: var(--ds-color-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
}
.access-management-intro h1 {
  margin: 0;
  color: var(--ds-color-text);
  font-size: clamp(1.3rem, 2vw, 1.7rem);
  font-weight: 800;
}
.access-management-intro p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
.permission-list-page .card { border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); box-shadow: var(--ds-shadow-xs); }
@media (max-width: 640px) {
  .access-management-intro { align-items: flex-start; padding: 1rem; }
  .access-management-icon { width: 2.75rem; height: 2.75rem; }
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
</style>