<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../../../stores/auth'
import { useCompanyUsersStore } from '../../../stores/users'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import MultiSelect from 'primevue/multiselect'
import Avatar from 'primevue/avatar'
import ProgressSpinner from 'primevue/progressspinner'
import Toolbar from 'primevue/toolbar'

const toast = useToast()
const auth = useAuthStore()
const userStore = useCompanyUsersStore()

const users = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, limit: 10, total: 0 })

const searchQuery = ref('')
const statusFilter = ref(null)

const statusOptions = [
  { label: 'همه', value: null },
  { label: 'فعال', value: 'ACTIVE' },
  { label: 'در انتظار', value: 'PENDING' },
  { label: 'رد شده', value: 'REJECTED' },
]

const statusLabels = { ACTIVE: 'فعال', PENDING: 'در انتظار', REJECTED: 'رد شده' }
const statusSeverity = { ACTIVE: 'success', PENDING: 'warn', REJECTED: 'danger' }

const showInfoDialog = ref(false)
const infoUser = ref(null)
const infoLoading = ref(false)

const showEditDialog = ref(false)
const editUser = ref(null)
const editLoading = ref(false)
const saving = ref(false)
const availablePermissions = ref([])
const permissionsLoading = ref(false)

const showDeactivateDialog = ref(false)
const userToDeactivate = ref(null)
const showDeleteDialog = ref(false)
const userToDelete = ref(null)

const companyId = computed(() => auth.companyId)


function statusLabel(s) { return statusLabels[s] || s || '—' }
function formatDate(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleDateString('fa-IR') } catch { return '—' }
}

onMounted(() => loadUsers())

async function loadUsers(page = pagination.value.page) {
  loading.value = true
  try {
    const result = await userStore.list({
      page,
      limit: pagination.value.limit,
      search: searchQuery.value || undefined,
      status: statusFilter.value || undefined,
      companyId: companyId.value,
    })
    users.value = result.users || []
    pagination.value = {
      page: result.meta?.page || page,
      limit: pagination.value.limit,
      total: result.meta?.total || 0,
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت کاربران', life: 3000 })
  } finally {
    loading.value = false
  }
}

let searchTimer
function debounceSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadUsers(1), 450)
}

function onPage(event) {
  pagination.value.limit = event.rows
  loadUsers(event.page + 1)
}

// ── Info dialog ──────────────────────────────────────────────
async function openInfo(row) {
  showInfoDialog.value = true
  infoLoading.value = true
  infoUser.value = null
  try {
    infoUser.value = await userStore.getUserById(row.id)
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت اطلاعات کاربر', life: 3000 })
    showInfoDialog.value = false
  } finally {
    infoLoading.value = false
  }
}

// ── Edit permissions dialog ──────────────────────────────────
async function openEdit(row) {
  editLoading.value = true
  showEditDialog.value = true
  ensurePermissionsLoaded()
  try {
    const user = await userStore.getUserById(row.id)
    editUser.value = {
      ...user,
      permissionIds: (user.permissions || []).map((p) => (typeof p === 'object' ? p.id : p)).filter(Boolean),
    }
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت اطلاعات کاربر', life: 3000 })
    showEditDialog.value = false
  } finally {
    editLoading.value = false
  }
}

async function ensurePermissionsLoaded() {
  if (availablePermissions.value.length) return
  permissionsLoading.value = true
  try {
    const { apiGet } = await import('@telecom/shared-core/http/apiClient')
    const { endpoints } = await import('@telecom/api-client')
    const result = await apiGet(endpoints.admin.permissions, { params: { limit: 200 } })
    const body = result?.data ?? result
    availablePermissions.value = body?.data?.data || body?.data || body || []
  } catch {
    // Silent — permissions list is optional
  } finally {
    permissionsLoading.value = false
  }
}

async function savePermissions() {
  if (!editUser.value) return
  saving.value = true
  try {
    await userStore.updatePermissions(editUser.value.id, editUser.value.permissionIds)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'مجوزها بروزرسانی شد', life: 3000 })
    showEditDialog.value = false
    loadUsers()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در بروزرسانی مجوزها', life: 3000 })
  } finally {
    saving.value = false
  }
}

// ── Deactivate ───────────────────────────────────────────────
function confirmDeactivate(user) {
  userToDeactivate.value = user
  showDeactivateDialog.value = true
}

async function doDeactivate() {
  try {
    await userStore.deactivate(userToDeactivate.value.id)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'کاربر غیرفعال شد', life: 3000 })
    showDeactivateDialog.value = false
    loadUsers()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در غیرفعال‌سازی', life: 3000 })
  }
}

// ── Delete ───────────────────────────────────────────────────
function confirmDelete(user) {
  userToDelete.value = user
  showDeleteDialog.value = true
}

async function doDelete() {
  try {
    await userStore.remove(userToDelete.value.id)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'کاربر حذف شد', life: 3000 })
    showDeleteDialog.value = false
    loadUsers()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در حذف کاربر', life: 3000 })
  }
}
</script>

<template>
  <div class="user-list-page">
    <div class="page-header">
      <h1>کاربران شرکت</h1>
    </div>

    <div class="card">
      <Toolbar>
        <template #start>
          <div class="toolbar-filters">
            <span class="p-input-icon-right search-wrap">
              <i class="pi pi-search" />
              <InputText v-model="searchQuery" placeholder="جستجو..." @input="debounceSearch" />
            </span>
            <Select
              v-model="statusFilter"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="وضعیت"
              class="status-filter"
              showClear
              @change="loadUsers(1)"
            />
          </div>
        </template>
      </Toolbar>

      <DataTable
        :value="users"
        :loading="loading"
        lazy
        paginator
        :rows="pagination.limit"
        :first="(pagination.page - 1) * pagination.limit"
        :totalRecords="pagination.total"
        :rowsPerPageOptions="[5, 10, 20]"
        @page="onPage"
        responsiveLayout="scroll"
        dataKey="id"
      >
        <Column header="آواتار" style="width: 4rem">
          <template #body="{ data }">
            <Avatar
              v-if="data.avatarUrl"
              :image="data.avatarUrl"
              shape="circle"
            />
            <Avatar
              v-else
              :label="(data.displayName || data.fullName || data.username || 'U').charAt(0)"
              shape="circle"
            />
          </template>
        </Column>
        <Column field="fullName" header="نام" sortable>
          <template #body="{ data }">{{ data.fullName || data.displayName || data.username || '—' }}</template>
        </Column>
        <Column field="email" header="ایمیل" sortable></Column>
        <Column header="تلفن">
          <template #body="{ data }">{{ data.phoneNumber || '—' }}</template>
        </Column>
        <Column field="status" header="وضعیت" sortable>
          <template #body="{ data }">
            <Tag :value="statusLabel(data.status)" :severity="statusSeverity[data.status]" />
          </template>
        </Column>
        <Column header="نقش‌ها">
          <template #body="{ data }">
            <div v-if="data.roles?.length" class="flex flex-wrap gap-1">
              <Tag v-for="role in data.roles" :key="role.id || role" size="small">
                {{ role.label || role.name || role }}
              </Tag>
            </div>
            <span v-else class="muted">—</span>
          </template>
        </Column>
        <Column header="آخرین ورود">
          <template #body="{ data }">{{ formatDate(data.lastLoginAt) }}</template>
        </Column>
        <Column header="عملیات" style="width: 9rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-eye" severity="secondary" rounded text v-tooltip.top="'مشاهده'" @click="openInfo(data)" />
              <Button icon="pi pi-key" severity="info" rounded text v-tooltip.top="'مجوزها'" @click="openEdit(data)" />
              <Button icon="pi pi-ban" severity="warn" rounded text v-tooltip.top="'غیرفعال'" @click="confirmDeactivate(data)" />
              <Button icon="pi pi-trash" severity="danger" rounded text v-tooltip.top="'حذف'" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="state-block">
            <i class="pi pi-users state-icon"></i>
            <h3>کاربری یافت نشد</h3>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Info Dialog -->
    <Dialog v-model:visible="showInfoDialog" header="اطلاعات کاربر" :modal="true" :style="{ width: '36rem' }" :breakpoints="{ '640px': '95vw' }">
      <div v-if="infoLoading" class="text-center py-6">
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>
      <div v-else-if="infoUser" class="info-content">
        <div class="profile-summary">
          <Avatar v-if="infoUser.avatarUrl" :image="infoUser.avatarUrl" size="xlarge" shape="circle" />
          <Avatar v-else :label="(infoUser.displayName || infoUser.fullName || infoUser.username || 'U').charAt(0)" size="xlarge" shape="circle" />
          <div class="profile-meta">
            <h3>{{ infoUser.fullName || infoUser.displayName || infoUser.username }}</h3>
            <p>{{ infoUser.email }}</p>
            <Tag :severity="statusSeverity[infoUser.status]">{{ statusLabel(infoUser.status) }}</Tag>
          </div>
        </div>
        <section class="info-section">
          <h4>اطلاعات شخصی</h4>
          <div class="info-row"><span>نام کاربری</span><b>{{ infoUser.username || '—' }}</b></div>
          <div class="info-row"><span>ایمیل</span><b>{{ infoUser.email || '—' }}</b></div>
          <div class="info-row"><span>تلفن</span><b>{{ infoUser.phoneNumber || '—' }}</b></div>
        </section>
        <section class="info-section">
          <h4>مجوزها</h4>
          <div class="chip-group">
            <template v-if="infoUser.permissions?.length">
              <Tag v-for="p in infoUser.permissions" :key="p.id || p.name || p" severity="secondary">
                {{ p.label || p.name || p }}
              </Tag>
            </template>
            <span v-else class="muted">بدون مجوز مستقیم</span>
          </div>
        </section>
      </div>
      <template #footer>
        <Button label="ویرایش مجوزها" icon="pi pi-key" text @click="showInfoDialog = false; openEdit(infoUser)" />
        <Button label="بستن" icon="pi pi-times" severity="secondary" text @click="showInfoDialog = false" />
      </template>
    </Dialog>

    <!-- Edit Permissions Dialog -->
    <Dialog v-model:visible="showEditDialog" header="ویرایش مجوزها" :modal="true" :style="{ width: '40rem' }" :breakpoints="{ '640px': '95vw' }">
      <div v-if="editLoading" class="text-center py-6">
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>
      <template v-else-if="editUser">
        <div class="field">
          <label>کاربر</label>
          <InputText :modelValue="editUser.fullName || editUser.username" disabled />
        </div>
        <div class="field">
          <label>مجوزهای مستقیم</label>
          <MultiSelect
            v-model="editUser.permissionIds"
            :options="availablePermissions"
            optionLabel="label"
            optionValue="id"
            :loading="permissionsLoading"
            placeholder="انتخاب مجوزها"
            display="chip"
            filter
            class="w-full"
          />
          <small class="field-hint">مجوزهای مستقیم علاوه بر مجوزهای نقش اعمال می‌شوند.</small>
        </div>
      </template>
      <template #footer>
        <Button label="لغو" icon="pi pi-times" severity="secondary" text @click="showEditDialog = false" />
        <Button label="ذخیره" icon="pi pi-check" :loading="saving" @click="savePermissions" />
      </template>
    </Dialog>

    <!-- Deactivate Dialog -->
    <Dialog v-model:visible="showDeactivateDialog" header="غیرفعال‌سازی کاربر" :modal="true">
      <p>آیا از غیرفعال کردن کاربر "{{ userToDeactivate?.fullName || userToDeactivate?.username }}" مطمئن هستید؟</p>
      <template #footer>
        <Button label="خیر" icon="pi pi-times" severity="secondary" text @click="showDeactivateDialog = false" />
        <Button label="بله، غیرفعال شود" icon="pi pi-ban" severity="warn" @click="doDeactivate" />
      </template>
    </Dialog>

    <!-- Delete Dialog -->
    <Dialog v-model:visible="showDeleteDialog" header="حذف کاربر" :modal="true">
      <p>آیا از حذف کاربر "{{ userToDelete?.fullName || userToDelete?.username }}" مطمئن هستید؟ این عمل قابل بازگشت نیست.</p>
      <template #footer>
        <Button label="خیر" icon="pi pi-times" severity="secondary" text @click="showDeleteDialog = false" />
        <Button label="بله، حذف شود" icon="pi pi-trash" severity="danger" @click="doDelete" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.user-list-page {
  direction: rtl;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.page-header h1 {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
}

.toolbar-filters {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.status-filter {
  width: 150px;
}

.muted {
  color: var(--text-color-secondary);
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  text-align: center;
}

.state-icon {
  font-size: 2.5rem;
  color: var(--text-color-secondary);
}

.state-block h3 {
  margin: 0;
  font-size: 1.05rem;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.profile-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--content-border-radius);
  background: var(--surface-ground);
}

.profile-meta h3 {
  margin: 0;
  font-size: 1.1rem;
}

.profile-meta p {
  margin: 0.15rem 0 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.info-section h4 {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: var(--primary-color);
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 0.35rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.info-row span {
  color: var(--text-color-secondary);
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.field-hint {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}
</style>
