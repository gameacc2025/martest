<template>
  <div class="role-list-page">
    <!-- Card with Toolbar -->
    <div class="card">
      <Toolbar>
        <template #start>
          <span class="p-input-icon-right">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="جستجو..." @input="debounceSearch" />
          </span>
        </template>

        <template #end>
          <Button label="نقش جدید" icon="pi pi-plus" @click="openCreateDialog" />
        </template>
      </Toolbar>

      <DataTable :value="roles" :loading="loading" :paginator="true" :rows="pagination.limit"
        :totalRecords="pagination.total" :rowsPerPageOptions="[5, 10, 20, 50]"
        @page="onPageChange" responsiveLayout="scroll">
        <Column field="id" header="شناسه" sortable></Column>
        <Column field="label" header="عنوان" sortable></Column>
        <Column field="name" header="نام نقش" sortable></Column>
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
              <Button icon="pi pi-pencil" severity="info" rounded text @click="editRole(slotProps.data)" :disabled="slotProps.data.isSystem" />
              <Button icon="pi pi-trash" severity="danger" rounded text @click="confirmDelete(slotProps.data)" :disabled="slotProps.data.isSystem" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Role Dialog -->
    <Dialog v-model:visible="showDialog" :header="dialogHeader" :modal="true" class="p-fluid" :style="{ width: '700px' }">
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
        <label>مجوزها</label>

        <!-- Permission search -->
        <div class="permission-search-box">
          <span class="p-input-icon-right w-full">
            <i class="pi pi-search" />
            <InputText v-model="permissionSearch" placeholder="جستجوی مجوز..." class="w-full" />
          </span>
        </div>

        <!-- Grouped Permission Selector -->
        <div class="permission-group-selector">
          <div v-for="(group, groupName) in filteredPermissionGroups" :key="groupName" class="permission-group">
            <div class="permission-group-header" @click="toggleGroup(groupName)">
              <div class="flex items-center gap-2">
                <Checkbox
                  :modelValue="isGroupAllChecked(group)"
                  :binary="true"
                  @update:modelValue="toggleGroupAll($event, group)"
                />
                <span>{{ groupName }}</span>
              </div>
              <span class="permission-group-count">
                {{ getSelectedCountInGroup(group) }} / {{ group.length }}
                <i class="pi" :class="expandedGroups[groupName] ? 'pi-chevron-down' : 'pi-chevron-left'" style="margin-inline-start: 0.5rem; font-size: 0.75rem;"></i>
              </span>
            </div>
            <div v-if="expandedGroups[groupName]" class="permission-group-items">
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
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoleStore } from '@/stores/admin/roles'
import { usePermissionStore } from '@/stores/admin/permissions'
import { useToast } from 'primevue/usetoast'

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
        permissionIds: currentRole.value.permissionIds,
      })
      toast.add({ severity: 'success', summary: 'موفقیت', detail: 'نقش با موفقیت بروزرسانی شد', life: 3000 })
    } else {
      await roleStore.createRole({
        name: currentRole.value.name,
        label: currentRole.value.label,
        description: currentRole.value.description,
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
</style>