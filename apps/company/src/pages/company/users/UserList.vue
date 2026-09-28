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
import Password from 'primevue/password'
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

// Activate/deactivate — toggles AccessProfile.isActive (panel access),
// NOT User.status. Same dialog handles both directions.
const showToggleActiveDialog = ref(false)
const userToToggle = ref(null)
const togglingActive = ref(false)

const showDeleteDialog = ref(false)
const userToDelete = ref(null)

// Add user
const showCreateDialog = ref(false)
const creating = ref(false)
const assignableRoles = ref([])
const rolesLoading = ref(false)
const createForm = ref(emptyCreateForm())
const createErrors = ref({})

function emptyCreateForm() {
  return { email: '', phone: '', password: '', firstName: '', lastName: '', roleIds: [] }
}

const companyId = computed(() => auth.companyId)

// users.create is granted to COMPANY_MANAGER only — COMPANY_USER has no
// users.* permission at all (see backend/prisma/seed.js ROLE_PERMISSIONS).
// Kept permission-based (not role-hardcoded) so a future custom company
// role can be granted just this one capability independently.
const canCreate = computed(() => auth.hasPermission('users.create'))
const canActivate = computed(() => auth.hasPermission('users.activate'))
const canDeactivate = computed(() => auth.hasPermission('users.deactivate'))
const canDelete = computed(() => auth.hasPermission('users.delete'))
const canAssignRole = computed(() => auth.hasPermission('users.assign_roles'))

function isSelf(row) {
  return row?.id === auth.user?.id
}

function isActive(row) {
  return row?.accessProfile?.isActive !== false
}

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

// ── Change role dialog ───────────────────────────────────────
// Roles are the single source of truth for permissions in this system
// (backend/src/modules/users/user.service.js — direct per-user permission
// overrides were removed from the domain model). So "editing a user's
// access" means changing their ROLE, via the same PATCH /:id/access
// endpoint and the same accessType-scoped role list used by "Add User".
async function openEdit(row) {
  editLoading.value = true
  showEditDialog.value = true
  ensureRolesLoaded()
  try {
    const user = await userStore.getUserById(row.id)
    editUser.value = {
      ...user,
      roleId: user.roles?.[0]?.id ?? user.roles?.[0]?.role?.id ?? null,
    }
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت اطلاعات کاربر', life: 3000 })
    showEditDialog.value = false
  } finally {
    editLoading.value = false
  }
}

async function saveRole() {
  if (!editUser.value) return
  saving.value = true
  try {
    await userStore.setRole(editUser.value.id, editUser.value.roleId)
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'نقش کاربر بروزرسانی شد', life: 3000 })
    showEditDialog.value = false
    loadUsers()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در بروزرسانی نقش', life: 3000 })
  } finally {
    saving.value = false
  }
}

// ── Activate / Deactivate ────────────────────────────────────
function confirmToggleActive(user) {
  userToToggle.value = user
  showToggleActiveDialog.value = true
}

async function doToggleActive() {
  const target = userToToggle.value
  if (!target) return
  togglingActive.value = true
  try {
    const nextActive = !isActive(target)
    await userStore.setAccessActive(target.id, nextActive)
    toast.add({
      severity: 'success',
      summary: 'موفقیت',
      detail: nextActive ? 'دسترسی کاربر فعال شد' : 'دسترسی کاربر غیرفعال شد',
      life: 3000,
    })
    showToggleActiveDialog.value = false
    loadUsers()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در تغییر وضعیت دسترسی', life: 3000 })
  } finally {
    togglingActive.value = false
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

// ── Add user ─────────────────────────────────────────────────
async function ensureRolesLoaded() {
  if (assignableRoles.value.length) return
  rolesLoading.value = true
  try {
    const { apiGet } = await import('@telecom/shared-core/http/apiClient')
    const { endpoints } = await import('@telecom/api-client')
    // GET /roles/assignable — scoped to the caller's own accessType on the
    // backend (COMPANY_MANAGER only ever gets COMPANY_MANAGER/COMPANY_USER
    // back), so there is no need to filter again here.
    const result = await apiGet(endpoints.admin.assignableRoles)
    const body = result?.data ?? result
    assignableRoles.value = body?.data || body || []
  } catch {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت لیست نقش‌ها', life: 3000 })
  } finally {
    rolesLoading.value = false
  }
}

function openCreate() {
  createForm.value = emptyCreateForm()
  createErrors.value = {}
  showCreateDialog.value = true
  ensureRolesLoaded()
}

function validateCreateForm() {
  const errs = {}
  if (!createForm.value.phone) errs.phone = 'شماره تلفن الزامی است'
  if (!createForm.value.firstName) errs.firstName = 'نام الزامی است'
  if (!createForm.value.lastName) errs.lastName = 'نام خانوادگی الزامی است'
  if (!createForm.value.password || createForm.value.password.length < 6) errs.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد'
  createErrors.value = errs
  return Object.keys(errs).length === 0
}

async function saveCreate() {
  if (!validateCreateForm()) return
  creating.value = true
  try {
    // No `type`/`companyId` sent: the backend forces both to the caller's
    // own company for a COMPANY-scoped caller regardless of what's sent
    // (see backend/src/modules/users/user.service.js createUser).
    await userStore.create({
      email: createForm.value.email || undefined,
      phone: createForm.value.phone,
      password: createForm.value.password,
      firstName: createForm.value.firstName,
      lastName: createForm.value.lastName,
      roleIds: createForm.value.roleIds,
    })
    toast.add({ severity: 'success', summary: 'موفقیت', detail: 'کاربر جدید ایجاد شد', life: 3000 })
    showCreateDialog.value = false
    loadUsers(1)
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: err.message || 'خطا در ایجاد کاربر', life: 4000 })
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="user-list-page">
    <div class="page-header">
      <h1>کاربران شرکت</h1>
      <Button v-if="canCreate" label="افزودن کاربر" icon="pi pi-plus" @click="openCreate" />
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
          <template #body="{ data }">
            {{ data.fullName || data.displayName || data.username || '—' }}
            <Tag v-if="isSelf(data)" value="شما" severity="info" style="margin-inline-start: 0.35rem" />
          </template>
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
        <Column header="دسترسی به پنل">
          <template #body="{ data }">
            <Tag :value="isActive(data) ? 'فعال' : 'غیرفعال'" :severity="isActive(data) ? 'success' : 'danger'" />
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
        <Column header="عملیات" style="width: 10rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-eye" severity="secondary" rounded text v-tooltip.top="'مشاهده'" @click="openInfo(data)" />
              <Button v-if="canAssignRole && !isSelf(data)" icon="pi pi-key" severity="info" rounded text v-tooltip.top="'تغییر نقش'" @click="openEdit(data)" />
              <!-- A user can never activate/deactivate their own access —
                   hidden entirely for the row matching the logged-in user,
                   not just disabled (see backend setAccessActive guard too). -->
              <template v-if="!isSelf(data)">
                <Button
                  v-if="isActive(data) && canDeactivate"
                  icon="pi pi-ban"
                  severity="warn"
                  rounded
                  text
                  v-tooltip.top="'غیرفعال کردن دسترسی'"
                  @click="confirmToggleActive(data)"
                />
                <Button
                  v-else-if="!isActive(data) && canActivate"
                  icon="pi pi-check"
                  severity="success"
                  rounded
                  text
                  v-tooltip.top="'فعال کردن دسترسی'"
                  @click="confirmToggleActive(data)"
                />
              </template>
              <Button v-if="canDelete && !isSelf(data)" icon="pi pi-trash" severity="danger" rounded text v-tooltip.top="'حذف'" @click="confirmDelete(data)" />
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
            <Tag :severity="isActive(infoUser) ? 'success' : 'danger'">{{ isActive(infoUser) ? 'دسترسی فعال' : 'دسترسی غیرفعال' }}</Tag>
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
        <Button v-if="canAssignRole && !isSelf(infoUser)" label="تغییر نقش" icon="pi pi-key" text @click="showInfoDialog = false; openEdit(infoUser)" />
        <Button label="بستن" icon="pi pi-times" severity="secondary" text @click="showInfoDialog = false" />
      </template>
    </Dialog>

    <!-- Edit Permissions Dialog -->
    <Dialog v-model:visible="showEditDialog" header="تغییر نقش کاربر" :modal="true" :style="{ width: '32rem' }" :breakpoints="{ '640px': '95vw' }">
      <div v-if="editLoading" class="text-center py-6">
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>
      <template v-else-if="editUser">
        <div class="field">
          <label>کاربر</label>
          <InputText :modelValue="editUser.fullName || editUser.username" disabled />
        </div>
        <div class="field">
          <label>نقش</label>
          <Select
            v-model="editUser.roleId"
            :options="assignableRoles"
            optionLabel="label"
            optionValue="id"
            :loading="rolesLoading"
            placeholder="انتخاب نقش"
            class="w-full"
          />
          <small class="field-hint">نقش، مجموعه‌ی دسترسی‌های این کاربر در پنل شرکت را تعیین می‌کند.</small>
        </div>
      </template>
      <template #footer>
        <Button label="لغو" icon="pi pi-times" severity="secondary" text @click="showEditDialog = false" />
        <Button label="ذخیره" icon="pi pi-check" :loading="saving" @click="saveRole" />
      </template>
    </Dialog>

    <!-- Activate/Deactivate Dialog -->
    <Dialog v-model:visible="showToggleActiveDialog" :header="isActive(userToToggle) ? 'غیرفعال‌سازی دسترسی' : 'فعال‌سازی دسترسی'" :modal="true">
      <p v-if="isActive(userToToggle)">
        آیا از غیرفعال کردن دسترسی "{{ userToToggle?.fullName || userToToggle?.username }}" به پنل شرکت مطمئن هستید؟
      </p>
      <p v-else>
        آیا از فعال کردن دسترسی "{{ userToToggle?.fullName || userToToggle?.username }}" به پنل شرکت مطمئن هستید؟
      </p>
      <template #footer>
        <Button label="خیر" icon="pi pi-times" severity="secondary" text @click="showToggleActiveDialog = false" />
        <Button
          :label="isActive(userToToggle) ? 'بله، غیرفعال شود' : 'بله، فعال شود'"
          :icon="isActive(userToToggle) ? 'pi pi-ban' : 'pi pi-check'"
          :severity="isActive(userToToggle) ? 'warn' : 'success'"
          :loading="togglingActive"
          @click="doToggleActive"
        />
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

    <!-- Add User Dialog -->
    <Dialog v-model:visible="showCreateDialog" header="افزودن کاربر شرکت" :modal="true" :style="{ width: '32rem' }" :breakpoints="{ '640px': '95vw' }">
      <div class="field">
        <label>شماره تلفن <span class="req">*</span></label>
        <InputText v-model="createForm.phone" class="w-full" :class="{ 'p-invalid': createErrors.phone }" />
        <small v-if="createErrors.phone" class="field-error">{{ createErrors.phone }}</small>
      </div>
      <div class="field">
        <label>ایمیل <span class="opt">(اختیاری)</span></label>
        <InputText v-model="createForm.email" class="w-full" :class="{ 'p-invalid': createErrors.email }" />
        <small v-if="createErrors.email" class="field-error">{{ createErrors.email }}</small>
      </div>
      <div class="field-row">
        <div class="field">
          <label>نام <span class="req">*</span></label>
          <InputText v-model="createForm.firstName" class="w-full" :class="{ 'p-invalid': createErrors.firstName }" />
          <small v-if="createErrors.firstName" class="field-error">{{ createErrors.firstName }}</small>
        </div>
        <div class="field">
          <label>نام خانوادگی <span class="req">*</span></label>
          <InputText v-model="createForm.lastName" class="w-full" :class="{ 'p-invalid': createErrors.lastName }" />
          <small v-if="createErrors.lastName" class="field-error">{{ createErrors.lastName }}</small>
        </div>
      </div>
      <div class="field">
        <label>رمز عبور <span class="req">*</span></label>
        <Password v-model="createForm.password" class="w-full" inputClass="w-full" toggleMask :feedback="false" :class="{ 'p-invalid': createErrors.password }" />
        <small v-if="createErrors.password" class="field-error">{{ createErrors.password }}</small>
      </div>
      <div class="field">
        <label>نقش</label>
        <MultiSelect
          v-model="createForm.roleIds"
          :options="assignableRoles"
          optionLabel="label"
          optionValue="id"
          :loading="rolesLoading"
          placeholder="انتخاب نقش"
          display="chip"
          class="w-full"
        />
        <small class="field-hint">نقش تعیین می‌کند این کاربر در پنل شرکت چه کاری مجاز به انجام آن است.</small>
      </div>
      <template #footer>
        <Button label="لغو" icon="pi pi-times" severity="secondary" text @click="showCreateDialog = false" />
        <Button label="ایجاد کاربر" icon="pi pi-check" :loading="creating" @click="saveCreate" />
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

.profile-meta .p-tag {
  margin-inline-end: 0.35rem;
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

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.field-row {
  display: flex;
  gap: 1rem;
}

.field-row .field {
  flex: 1;
}

.req {
  color: var(--p-red-500);
}

.opt {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  font-weight: 400;
}

.field-error {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--p-red-500);
}

.field-hint {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}
</style>