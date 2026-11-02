<template>
  <div class="role-list-page ds-stack">
    <!-- Card with Toolbar -->
    <WorkspacePageHeading eyebrow="کنترل دسترسی" title="مدیریت نقش‌ها" description="نقش‌ها و دسترسی‌های مبتنی بر مجوز را مدیریت کنید." icon="pi pi-shield" heading-id="access-management-title" />
    <div class="card ds-panel management-data-surface">
      <Toolbar class="ds-toolbar management-data-toolbar">
        <template #start>
          <span class="p-input-icon-right">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="جستجو..." aria-label="جستجو در نقش‌ها" @input="debounceSearch" />
          </span>
        </template>

        <template #end>
          <Button label="نقش جدید" icon="pi pi-plus" @click="openCreateDialog" />
        </template>
      </Toolbar>

      <DataTable class="management-data-table" :value="roles" :loading="loading" :paginator="true" :rows="pagination.limit"
        :totalRecords="pagination.total" :rowsPerPageOptions="[5, 10, 20, 50]"
        @page="onPageChange" responsiveLayout="scroll">
        <Column field="id" header="شناسه" sortable></Column>
        <Column field="label" header="عنوان" sortable></Column>
        <Column field="name" header="نام نقش" sortable></Column>
        <Column header="دامنه">
          <template #body="slotProps">
            <Tag :value="scopeLabels[slotProps.data.scope] || slotProps.data.scope" :severity="scopeSeverity[slotProps.data.scope]" />
          </template>
        </Column>
        <Column field="description" header="توضیحات"></Column>
        <Column header="مجوزها">
          <template #body="slotProps">
            <div v-if="slotProps.data.permissions && slotProps.data.permissions.length" class="flex flex-wrap gap-2">
              <Tag v-for="perm in slotProps.data.permissions" :key="perm.permission.id">
                {{ perm.permission.label || perm.permission.name }}
              </Tag>
            </div>
            <div v-else>
              <Tag severity="warning">بدون مجوز</Tag>
            </div>
          </template>
        </Column>
        <Column header="تعداد کاربران">
          <template #body="slotProps">
            <Tag>{{ slotProps.data._count?.users || 0 }}</Tag>
          </template>
        </Column>
        <Column header="عملیات">
          <template #body="slotProps">
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" severity="info" rounded text aria-label="ویرایش نقش" @click="editRole(slotProps.data)" v-tooltip.top="slotProps.data.isSystem ? 'ویرایش عنوان، توضیحات و مجوزها؛ دامنه ثابت می‌ماند' : 'ویرایش نقش'" />
              <Button icon="pi pi-trash" severity="danger" rounded text aria-label="حذف نقش" @click="confirmDelete(slotProps.data)" :disabled="slotProps.data.isSystem" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Role Dialog -->
    <Dialog v-model:visible="showDialog" :header="dialogHeader" :modal="true" class="p-fluid" :style="{ width: '700px', maxWidth: '96vw' }" :breakpoints="{ '960px': '92vw', '640px': '96vw' }">
      <div class="field">
        <label for="name">نام نقش (انگلیسی)</label>
        <InputText id="name" v-model="currentRole.name" :disabled="isEditMode" placeholder="مثال: EDITOR" />
      </div>
      <div class="field">
        <label for="label">عنوان نمایشی</label>
        <InputText id="label" v-model="currentRole.label" placeholder="مثال: ویراستار" />
      </div>
      <div class="field">
        <label for="description">توضیحات</label>
        <InputText id="description" v-model="currentRole.description" />
      </div>
      <div class="field">
        <label for="scope">دامنه‌ی نقش <span style="color: var(--p-red-500)">*</span></label>
        <Select
          id="scope"
          v-model="currentRole.scope"
          :options="scopeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="انتخاب دامنه"
          :disabled="isEditMode && currentRole.isSystem"
          class="w-full"
        />
        <small class="field-hint">
          مشخص می‌کند این نقش به کدام پنل تعلق دارد: ادمین سیستم (STAFF)، شرکت (COMPANY)، یا مشتری (CUSTOMER).
          نقشی که به کاربران شرکتی داده می‌شود باید COMPANY باشد تا مدیر شرکت بتواند آن را هنگام افزودن کاربر انتخاب کند.
        </small>
      </div>
      <div class="field">
        <label>مجوزها</label>

        <!-- Permission search -->
        <div class="permission-search-box">
          <span class="p-input-icon-right w-full">
            <i class="pi pi-search" />
            <InputText v-model="permissionSearch" placeholder="جستجوی مجوز..." aria-label="جستجوی مجوزهای نقش" class="w-full" />
          </span>
        </div>

        <!-- Grouped Permission Selector -->
        <div class="permission-group-selector">
          <div v-for="(group, groupName) in filteredPermissionGroups" :key="groupName" class="permission-group">
            <div class="permission-group-header">
              <div class="permission-group-select">
                <Checkbox
                  :inputId="`permission-group-${groupName}`"
                  :modelValue="isGroupAllChecked(group)"
                  :binary="true"
                  @update:modelValue="toggleGroupAll($event, group)"
                />
                <label :for="`permission-group-${groupName}`">{{ groupName }}</label>
              </div>
              <button
                type="button"
                class="permission-group-toggle"
                :aria-expanded="Boolean(expandedGroups[groupName])"
                :aria-controls="`permission-group-items-${groupName}`"
                :aria-label="`باز و بسته کردن گروه ${groupName}`"
                @click="toggleGroup(groupName)"
              >
                <span class="permission-group-count">{{ getSelectedCountInGroup(group) }} / {{ group.length }}</span>
                <i class="pi" :class="expandedGroups[groupName] ? 'pi-chevron-down' : 'pi-chevron-left'" aria-hidden="true"></i>
              </button>
            </div>
            <div v-if="expandedGroups[groupName]" :id="`permission-group-items-${groupName}`" class="permission-group-items">
              <div v-for="perm in group" :key="perm.id" class="permission-item">
                <Checkbox
                  :modelValue="currentRole.permissionIds?.includes(perm.id)"
                  :binary="true"
                  :inputId="`perm-${perm.id}`"
                  @update:modelValue="togglePermission(perm.id, $event)"
                />
                <label :for="`perm-${perm.id}`">
                  {{ perm.label || perm.name }}
                  <span class="text-muted text-sm" style="margin-inline-start: 0.5rem;">{{ perm.name }}</span>
                </label>
              </div>
            </div>
          </div>
          <div v-if="Object.keys(filteredPermissionGroups).length === 0" class="text-center text-muted p-4">
            مجوزی یافت نشد
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="لغو" icon="pi pi-times" severity="secondary" text @click="closeDialog" />
        <Button label="ذخیره" icon="pi pi-check" @click="saveRole" />
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="showDeleteDialog" header="تایید حذف" :modal="true">
      <p>آیا از حذف نقش "{{ roleToDelete?.label || roleToDelete?.name }}" مطمئن هستید؟</p>
      <template #footer>
        <Button label="خیر" icon="pi pi-times" severity="secondary" text @click="showDeleteDialog = false" />
        <Button label="بله" icon="pi pi-check" severity="danger" @click="deleteRole" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoleStore } from '@/stores/admin/roles'
import { usePermissionStore } from '@/stores/admin/permissions'
import { useToast } from 'primevue/usetoast'
import Select from 'primevue/select'

const toast = useToast()
const roleStore = useRoleStore()
const permissionStore = usePermissionStore()

const roles = ref([])
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
const currentRole = ref({})
const availablePermissions = ref([])
const showDeleteDialog = ref(false)
const roleToDelete = ref(null)
const permissionSearch = ref('')
const expandedGroups = reactive({})

const scopeOptions = [
  { label: 'ادمین سیستم (STAFF)', value: 'STAFF' },
  { label: 'شرکت (COMPANY)', value: 'COMPANY' },
  { label: 'مشتری (CUSTOMER)', value: 'CUSTOMER' },
]
const scopeLabels = { STAFF: 'ادمین سیستم', COMPANY: 'شرکت', CUSTOMER: 'مشتری' }
const scopeSeverity = { STAFF: 'danger', COMPANY: 'info', CUSTOMER: 'success' }

const dialogHeader = computed(() => {
  return isEditMode.value ? 'ویرایش نقش' : 'ایجاد نقش جدید'
})

// Group permissions by their `group` field
const permissionGroups = computed(() => {
  const groups = {}
  availablePermissions.value.forEach(perm => {
    const groupName = perm.group || 'سایر'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(perm)
  })
  return groups
})

// Filter permission groups based on search
const filteredPermissionGroups = computed(() => {
  if (!permissionSearch.value) return permissionGroups.value

  const search = permissionSearch.value.toLowerCase()
  const filtered = {}
  Object.keys(permissionGroups.value).forEach(groupName => {
    const matchingPerms = permissionGroups.value[groupName].filter(perm => {
      const label = (perm.label || '').toLowerCase()
      const name = (perm.name || '').toLowerCase()
      return label.includes(search) || name.includes(search)
    })
    if (matchingPerms.length > 0) {
      filtered[groupName] = matchingPerms
    }
  })
  return filtered
})

onMounted(() => {
  loadRoles()
  loadPermissions()
})

function debounceSearch() {
  clearTimeout(debounceSearch.timer)
  debounceSearch.timer = setTimeout(() => {
    applyFilters()
  }, 500)
}

function applyFilters() {
  loadRoles(1)
}

async function loadRoles(page = 1) {
  try {
    loading.value = true
    const response = await roleStore.getRoles({
      page,
      search: searchQuery.value
    })
    roles.value = response.roles || []
    pagination.value = {
      page: response.page,
      limit: response.limit,
      total: response.total,
      totalPages: response.totalPages,
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت نقش ها', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function loadPermissions() {
  try {
    const response = await permissionStore.getPermissions({ limit: 100 })
    availablePermissions.value = response.permissions || []
    // Expand all groups by default
    Object.keys(permissionGroups.value).forEach(g => {
      expandedGroups[g] = true
    })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت مجوزها', life: 3000 })
  }
}

function onPageChange(event) {
  loadRoles(event.page + 1)
}

function openCreateDialog() {
  isEditMode.value = false
  currentRole.value = {
    name: '',
    label: '',
    description: '',
    scope: null,
    permissionIds: []
  }
  permissionSearch.value = ''
  // Expand all groups
  Object.keys(permissionGroups.value).forEach(g => {
    expandedGroups[g] = true
  })
  showDialog.value = true
}

function editRole(role) {
  isEditMode.value = true
  currentRole.value = {
    ...role,
    permissionIds: role.permissions ? role.permissions.map(p => p.permission.id) : [],
  }
  permissionSearch.value = ''
  // Expand all groups
  Object.keys(permissionGroups.value).forEach(g => {
    expandedGroups[g] = true
  })
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
}

function toggleGroup(groupName) {
  expandedGroups[groupName] = !expandedGroups[groupName]
}

function togglePermission(permId, checked) {
  if (!currentRole.value.permissionIds) {
    currentRole.value.permissionIds = []
  }
  if (checked) {
    if (!currentRole.value.permissionIds.includes(permId)) {
      currentRole.value.permissionIds.push(permId)
    }
  } else {
    currentRole.value.permissionIds = currentRole.value.permissionIds.filter(id => id !== permId)
  }
}

function isGroupAllChecked(group) {
  if (!currentRole.value.permissionIds || group.length === 0) return false
  return group.every(perm => currentRole.value.permissionIds.includes(perm.id))
}

function toggleGroupAll(checked, group) {
  if (!currentRole.value.permissionIds) {
    currentRole.value.permissionIds = []
  }
  if (checked) {
    group.forEach(perm => {
      if (!currentRole.value.permissionIds.includes(perm.id)) {
        currentRole.value.permissionIds.push(perm.id)
      }
    })
  } else {
    const groupIds = group.map(p => p.id)
    currentRole.value.permissionIds = currentRole.value.permissionIds.filter(id => !groupIds.includes(id))
  }
}

function getSelectedCountInGroup(group) {
  if (!currentRole.value.permissionIds) return 0
  return group.filter(perm => currentRole.value.permissionIds.includes(perm.id)).length
}

async function saveRole() {
  try {
    if (isEditMode.value) {
      await roleStore.updateRole(currentRole.value.id, {
        label: currentRole.value.label,
        description: currentRole.value.description,
        scope: currentRole.value.scope,
        permissionIds: currentRole.value.permissionIds,
      })
      toast.add({ severity: 'success', summary: 'موفقیت', detail: 'نقش با موفقیت بروزرسانی شد', life: 3000 })
    } else {
      await roleStore.createRole({
        name: currentRole.value.name,
        label: currentRole.value.label,
        description: currentRole.value.description,
        scope: currentRole.value.scope,
        permissionIds: currentRole.value.permissionIds,
      })
      toast.add({ severity: 'success', summary: 'موفقیت', detail: 'نقش با موفقیت ایجاد شد', life: 3000 })
    }
    closeDialog()
    loadRoles()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error.message || 'خطا در ذخیره نقش', life: 3000 })
  }
}

function confirmDelete(role) {
  roleToDelete.value = role
  showDeleteDialog.value = true
}

async function deleteRole() {
  try {
    await roleStore.deleteRole(roleToDelete.value.id)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'نقش با موفقیت حذف شد', life: 3000 })
    showDeleteDialog.value = false
    loadRoles()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error.message || 'خطا در حذف نقش', life: 3000 })
  }
}
</script>

<style scoped>
.role-list-page {
  direction: rtl;
}

/* Shared Paces-style list hierarchy; query, pagination and permissions unchanged. */
.role-list-page { gap: var(--ds-space-5); }
.role-list-page .ds-page-heading { margin-bottom: 0; }
.role-list-page .card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}
.role-list-page :deep(.p-toolbar) {
  background: var(--ds-color-surface);
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl) var(--ds-radius-xl) 0 0;
  padding: var(--ds-space-4) var(--ds-space-5);
}
.role-list-page :deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  padding: var(--ds-space-4) var(--ds-space-5);
  white-space: nowrap;
}
.role-list-page :deep(.p-datatable .p-datatable-tbody > tr > td) {
  border-color: var(--ds-color-border);
  padding: var(--ds-space-4) var(--ds-space-5);
}
@media (max-width: 640px) {
  .role-list-page { gap: var(--ds-space-3); }
  .role-list-page :deep(.p-toolbar) { align-items: stretch; }
}

.role-list-page { gap: clamp(1rem, 2vw, 1.5rem); }
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
.role-list-page .card { border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); box-shadow: var(--ds-shadow-xs); }
.role-list-page :deep(.p-toolbar) { flex-wrap: wrap; gap: .75rem; }
.role-list-page :deep(.p-toolbar-start), .role-list-page :deep(.p-toolbar-end) { display: flex; align-items: center; flex-wrap: wrap; gap: .65rem; }
.role-list-page :deep(.p-toolbar .p-inputtext) { min-height: 2.65rem; border-radius: var(--ds-radius-md); }
.role-list-page :deep(.p-datatable-table-container) { overflow-x: auto; }
.role-list-page :deep(.p-datatable-thead > tr > th) { white-space: nowrap; }
@media (max-width: 640px) {
  .access-management-intro { align-items: flex-start; padding: 1rem; }
  .access-management-icon { width: 2.75rem; height: 2.75rem; }
  .role-list-page :deep(.p-toolbar-start), .role-list-page :deep(.p-toolbar-end) { width: 100%; }
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
.management-data-toolbar :deep(.p-toolbar-start),
.management-data-toolbar :deep(.p-toolbar-end) {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .65rem;
}
.management-data-toolbar :deep(.p-inputtext),
.management-data-toolbar :deep(.p-select) {
  min-height: 2.65rem;
  border-radius: var(--ds-radius-md);
}
.management-data-table :deep(.p-datatable-table-container) { overflow-x: auto; scrollbar-width: thin; }
.management-data-table :deep(.p-datatable-thead > tr > th) {
  padding: .9rem 1rem;
  border-color: var(--ds-color-border);
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  white-space: nowrap;
}
.management-data-table :deep(.p-datatable-tbody > tr > td) {
  padding: .85rem 1rem;
  border-color: var(--ds-color-border);
  color: var(--ds-color-text);
  vertical-align: middle;
}
.management-data-table :deep(.p-datatable-tbody > tr:hover) { background: var(--ds-color-surface-hover); }
.management-data-table :deep(.p-paginator) {
  justify-content: flex-start;
  padding: .8rem 1rem;
  border-top: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.management-data-table :deep(.p-paginator-page),
.management-data-table :deep(.p-paginator-next),
.management-data-table :deep(.p-paginator-prev) {
  min-width: 2.75rem;
  min-height: 2.75rem;
  border-radius: var(--ds-radius-md);
}
.management-data-table :deep(.p-button.p-button-text) {
  width: 2.75rem;
  min-width: 2.75rem;
  height: 2.75rem;
  min-height: 2.75rem;
}
@media (max-width: 700px) {
  .management-data-toolbar :deep(.p-toolbar) { align-items: stretch; flex-direction: column; }
  .management-data-toolbar :deep(.p-toolbar-start),
  .management-data-toolbar :deep(.p-toolbar-end) { width: 100%; }
  .management-data-toolbar :deep(.p-toolbar-start) { display: grid; grid-template-columns: minmax(0, 1fr); }
  .management-data-toolbar :deep(.p-inputtext),
  .management-data-toolbar :deep(.p-select) { width: 100%; }
  .management-data-toolbar :deep(.p-toolbar-end .p-button) { width: 100%; }
}

.permission-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  min-height: 3.25rem;
  padding: .35rem .65rem;
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface-alt);
}
.permission-group-select {
  display: inline-flex;
  align-items: center;
  gap: .65rem;
  min-width: 0;
  min-height: 2.75rem;
}
.permission-group-select label {
  color: var(--ds-color-text);
  font-weight: var(--ds-font-weight-semibold);
  cursor: pointer;
}
.permission-group-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .65rem;
  min-width: 2.75rem;
  min-height: 2.75rem;
  padding: .4rem .65rem;
  border: 0;
  border-radius: var(--ds-radius-md);
  background: transparent;
  color: var(--ds-color-text-muted);
  cursor: pointer;
}
.permission-group-toggle:hover { background: var(--ds-color-surface-hover); color: var(--ds-color-primary); }
.permission-group-toggle:focus-visible {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 2px;
}
.permission-group-items { padding: .5rem .75rem; }
.permission-item {
  display: flex;
  align-items: center;
  gap: .65rem;
  min-height: 2.75rem;
  padding: .3rem .25rem;
  border-bottom: 1px solid var(--ds-color-border);
}
.permission-item:last-child { border-bottom: 0; }
.permission-item label { cursor: pointer; line-height: 1.7; }
.role-list-page .management-data-toolbar :deep(.p-inputtext) { min-height: 2.75rem; }

</style>