<template>
  <div class="user-list-page">
    <!-- Card with Toolbar -->
    <div class="card">
      <Toolbar>
        <template #start>
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
            @change="applyFilters"
          />
          <Select
            v-model="typeFilter"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="نوع کاربر"
            class="status-filter"
            showClear
            @change="applyFilters"
          />
        </template>

        <template #end>
          <Button v-if="canCreate" label="کاربر جدید" icon="pi pi-plus" @click="openCreateDialog" />
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
        :rowsPerPageOptions="[5, 10, 20, 50]"
        :sortField="sortField"
        :sortOrder="sortOrder"
        @page="onPage"
        @sort="onSort"
        responsiveLayout="scroll"
        dataKey="id"
      >
        <Column header="آواتار" style="width: 4rem">
          <template #body="{ data }">
            <Avatar
              v-if="data.profile?.avatar"
              :image="data.profile.avatar"
              shape="circle"
            />
            <Avatar
              v-else
              :label="avatarLabel(data)"
              shape="circle"
            />
          </template>
        </Column>
        <Column field="email" header="ایمیل" sortable></Column>
        <Column header="نام کامل">
          <template #body="{ data }">
            {{ fullName(data) || '—' }}
          </template>
        </Column>
        <Column header="تلفن">
          <template #body="{ data }">
            {{ data.phone || '—' }}
          </template>
        </Column>
        <Column header="نوع">
          <template #body="{ data }">
            <Tag severity="contrast">{{ typeLabel(data.accessProfile?.type) }}</Tag>
          </template>
        </Column>
        <Column header="شرکت">
          <template #body="{ data }">
            <span v-if="data.accessProfile?.company?.name" class="company-cell">
              <i class="pi pi-building"></i> {{ data.accessProfile.company.name }}
            </span>
            <span v-else class="text-muted">—</span>
          </template>
        </Column>
        <Column header="نقش‌ها">
          <template #body="{ data }">
            <div v-if="data.roles && data.roles.length" class="flex flex-wrap gap-2">
              <Tag v-for="role in data.roles" :key="role.id || role">
                {{ role.label || role.name || role }}
              </Tag>
            </div>
            <Tag v-else severity="warn">بدون نقش</Tag>
          </template>
        </Column>
        <Column field="status" header="وضعیت" sortable>
          <template #body="{ data }">
            <Tag :severity="statusSeverity(data.status)">{{ statusLabel(data.status) }}</Tag>
          </template>
        </Column>
        <Column field="createdAt" header="تاریخ عضویت" sortable>
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>
        <Column header="عملیات" style="width: 9rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-eye" severity="secondary" rounded text @click="openInfo(data)" v-tooltip.top="'مشاهده'" />
              <Button v-if="canUpdate" icon="pi pi-pencil" severity="info" rounded text @click="openEdit(data)" v-tooltip.top="'ویرایش'" />
              <Button v-if="canDelete" icon="pi pi-trash" severity="danger" rounded text @click="confirmDelete(data)" v-tooltip.top="'حذف'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Info Dialog (read-only) -->
    <Dialog
      v-model:visible="showInfoDialog"
      header="اطلاعات کاربر"
      :modal="true"
      class="info-dialog"
      :style="{ width: '36rem' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <div v-if="infoLoading" class="text-center py-6">
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>
      <div v-else-if="infoUser" class="info-content">
        <!-- Profile summary header -->
        <div class="profile-summary">
          <Avatar
            v-if="infoUser.profile?.avatar"
            :image="infoUser.profile.avatar"
            size="xlarge"
            shape="circle"
          />
          <Avatar
            v-else
            :label="avatarLabel(infoUser)"
            size="xlarge"
            shape="circle"
          />
          <div class="profile-meta">
            <h3>{{ fullName(infoUser) || infoUser.email }}</h3>
            <p>{{ infoUser.email }}</p>
            <div class="profile-tags">
              <Tag :severity="statusSeverity(infoUser.status)">{{ statusLabel(infoUser.status) }}</Tag>
              <Tag severity="contrast">{{ typeLabel(infoUser.accessProfile?.type) }}</Tag>
              <Tag v-if="infoUser.accessProfile?.company?.name" severity="contrast" icon="pi pi-building">
                {{ infoUser.accessProfile.company.name }}
              </Tag>
            </div>
          </div>
        </div>

        <section class="info-section">
          <h4>اطلاعات شخصی</h4>
          <div class="info-row"><span>نام</span><b>{{ infoUser.profile?.firstName || '—' }}</b></div>
          <div class="info-row"><span>نام خانوادگی</span><b>{{ infoUser.profile?.lastName || '—' }}</b></div>
          <div class="info-row"><span>ایمیل</span><b>{{ infoUser.email || '—' }}</b></div>
          <div class="info-row"><span>تلفن</span><b>{{ infoUser.phone || '—' }}</b></div>
        </section>

        <section class="info-section">
          <h4>دسترسی و سازمان</h4>
          <div class="info-row"><span>نوع کاربر</span><b>{{ typeLabel(infoUser.accessProfile?.type) }}</b></div>
          <div class="info-row"><span>شرکت</span><b>{{ infoUser.accessProfile?.company?.name || '—' }}</b></div>
          <div class="info-row">
            <span>دسترسی پنل</span>
            <b>
              <Tag :severity="infoUser.accessProfile?.isActive ? 'success' : 'danger'">
                {{ infoUser.accessProfile?.isActive ? 'فعال' : 'غیرفعال' }}
              </Tag>
            </b>
          </div>
          <div class="info-row info-row-block">
            <span>نقش‌ها</span>
            <div class="chip-group">
              <template v-if="infoUser.roles && infoUser.roles.length">
                <Tag v-for="r in infoUser.roles" :key="r.id || r.name || r">
                  {{ r.label || r.name || r }}
                </Tag>
              </template>
              <span v-else class="text-muted">—</span>
            </div>
          </div>
          <div class="info-row info-row-block">
            <span>مجوزهای مؤثر</span>
            <div class="chip-group">
              <template v-if="infoUser.permissions && infoUser.permissions.length">
                <Tag
                  v-for="p in infoUser.permissions.slice(0, 12)"
                  :key="p.id || p.name || p"
                  severity="secondary"
                >
                  {{ p.label || p.name || p }}
                </Tag>
                <span v-if="infoUser.permissions.length > 12" class="text-muted">
                  +{{ infoUser.permissions.length - 12 }}
                </span>
              </template>
              <span v-else class="text-muted">—</span>
            </div>
          </div>
        </section>

        <section class="info-section">
          <h4>سیستم</h4>
          <div class="info-row"><span>شناسه</span><b>{{ infoUser.id }}</b></div>
          <div class="info-row"><span>وضعیت</span><b><Tag :severity="statusSeverity(infoUser.status)">{{ statusLabel(infoUser.status) }}</Tag></b></div>
          <div class="info-row"><span>تاریخ عضویت</span><b>{{ formatDate(infoUser.createdAt) }}</b></div>
          <div class="info-row"><span>آخرین بروزرسانی</span><b>{{ formatDate(infoUser.updatedAt) }}</b></div>
        </section>
      </div>
      <template #footer>
        <Button v-if="infoUser && canUpdate" label="ویرایش" icon="pi pi-pencil" text @click="editFromInfo" />
        <Button label="بستن" icon="pi pi-times" severity="secondary" text @click="showInfoDialog = false" />
      </template>
    </Dialog>

    <!-- Create/Edit User Dialog -->
    <Dialog
      v-model:visible="showDialog"
      :header="dialogHeader"
      :modal="true"
      class="p-fluid"
      :style="{ width: '40rem' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <div v-if="editLoading" class="text-center py-6">
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>
      <template v-else>
        <!-- ── Identity ─────────────────────────────────────── -->
        <h4 class="form-section-title">اطلاعات هویتی</h4>
        <div class="form-grid">
          <div class="field">
            <label for="phone">شماره تلفن <span class="req">*</span></label>
            <InputText id="phone" v-model="currentUser.phone" />
          </div>
          <div class="field">
            <label for="email">ایمیل <span class="opt">(اختیاری)</span></label>
            <InputText id="email" v-model="currentUser.email" type="email" />
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="firstName">نام <span class="req">*</span></label>
            <InputText id="firstName" v-model="currentUser.firstName" />
          </div>
          <div class="field">
            <label for="lastName">نام خانوادگی <span class="req">*</span></label>
            <InputText id="lastName" v-model="currentUser.lastName" />
          </div>
        </div>

        <!-- Password: create only. autocomplete=new-password prevents the
             browser from autofilling and silently changing existing users. -->
        <div class="field" v-if="!isEditMode">
          <label for="password">رمز عبور <span class="req">*</span></label>
          <Password
            id="password"
            v-model="currentUser.password"
            :feedback="false"
            toggleMask
            inputClass="w-full"
            :inputProps="{ autocomplete: 'new-password' }"
          />
          <small class="field-hint">حداقل ۶ کاراکتر.</small>
        </div>

        <!-- Avatar URL -->
        <div class="field">
          <label for="avatar">آدرس آواتار</label>
          <InputText id="avatar" v-model="currentUser.avatar" placeholder="https://..." />
        </div>


        <!-- ── Access / Organization ────────────────────────── -->
        <h4 class="form-section-title">دسترسی و سازمان</h4>

        <div class="form-grid">
          <div class="field">
            <label for="type">نوع کاربر <span class="req">*</span></label>
            <Select
              id="type"
              v-model="currentUser.type"
              :options="accessTypeOptions"
              optionLabel="label"
              optionValue="value"
              :disabled="isEditMode && !isSuperAdmin"
              class="w-full"
              @change="onTypeChange"
            />
            <small v-if="isEditMode && !isSuperAdmin" class="field-hint">تغییر نوع کاربر تنها توسط مدیر کل ممکن است.</small>
          </div>
          <div class="field">
            <label for="userStatus">وضعیت</label>
            <Select id="userStatus" v-model="currentUser.status" :options="userStatusOptions" optionLabel="label" optionValue="value" class="w-full" />
          </div>
        </div>

        <!-- Company: only for COMPANY members -->
        <div class="field" v-if="currentUser.type === 'COMPANY'">
          <label for="userCompany">شرکت <span class="req">*</span></label>
          <Select
            id="userCompany"
            v-model="currentUser.companyId"
            :options="availableCompanies"
            optionLabel="name"
            optionValue="id"
            placeholder="انتخاب شرکت"
            :disabled="isEditMode && !isSuperAdmin"
            showClear
            filter
            class="w-full"
          />
          <small class="field-hint">کاربر کارمند شرکت باید به یک شرکت متصل باشد. با انتخاب «کارمند سازمان» عضویت شرکت حذف می‌شود.</small>
        </div>

        <!-- Panel access toggle (edit only) -->
        <div class="field-checkbox" v-if="isEditMode && (canActivate || canDeactivate)">
          <Checkbox
            inputId="isAccessActive"
            v-model="currentUser.isAccessActive"
            :binary="true"
            :disabled="currentUser.isAccessActive ? !canDeactivate : !canActivate"
          />
          <label for="isAccessActive">دسترسی به پنل فعال باشد</label>
        </div>

        <!-- ── Role ─────────────────────────────────────────── -->
        <template v-if="canAssignRoles">
          <h4 class="form-section-title">نقش</h4>
          <div class="field">
            <label for="roles">نقش کاربر</label>
            <Select id="roles" v-model="currentUser.roleId" :options="availableRoles" optionLabel="label" optionValue="id" placeholder="انتخاب نقش" showClear class="w-full" />
            <small class="field-hint">نقش، مجوزهای کاربر داخل پنل را تعیین می‌کند.</small>
          </div>
        </template>
      </template>
      <template #footer>
        <Button label="لغو" icon="pi pi-times" severity="secondary" text @click="closeDialog" />
        <Button label="ذخیره" icon="pi pi-check" :loading="saving" @click="saveUser" />
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="showDeleteDialog" header="تایید حذف" :modal="true">
      <p>آیا از حذف کاربر "{{ userToDelete ? (fullName(userToDelete) || userToDelete.email) : '' }}" مطمئن هستید؟</p>
      <template #footer>
        <Button label="خیر" icon="pi pi-times" severity="secondary" text @click="showDeleteDialog = false" />
        <Button label="بله" icon="pi pi-check" severity="danger" @click="deleteUser" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useUserStore } from "@/stores/admin/users";
import { useRoleStore } from "@/stores/admin/roles";
import { useToast } from "primevue/usetoast";
import { usePermissions } from "@/composables/usePermissions";
// Note: Password & Checkbox are registered globally in main.js

const toast = useToast();
const userStore = useUserStore();
const roleStore = useRoleStore();
const { can, isSuperAdmin, P } = usePermissions();

// ── Permission gates ─────────────────────────────────────────
const canCreate = computed(() => can(P.USERS.CREATE));
const canUpdate = computed(() => can(P.USERS.UPDATE));
const canDelete = computed(() => can(P.USERS.DELETE));
const canAssignRoles = computed(() => can(P.USERS.ASSIGN_ROLES));
const canResetPassword = computed(() => can(P.USERS.RESET_PASSWORD));
const canActivate = computed(() => can(P.USERS.ACTIVATE));
const canDeactivate = computed(() => can(P.USERS.DEACTIVATE));

const users = ref([]);
const loading = ref(false);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });

const searchQuery = ref("");
const statusFilter = ref(null);
const typeFilter = ref(null);
const sortField = ref("id");
const sortOrder = ref(-1); // -1 desc, 1 asc

const statusOptions = ref([
  { label: "فعال", value: "ACTIVE" },
  { label: "در انتظار", value: "PENDING" },
  { label: "رد شده", value: "REJECTED" },
]);
const userStatusOptions = statusOptions.value;
const typeOptions = ref([
  { label: "کارمند سازمان", value: "STAFF" },
  { label: "کارمند شرکت", value: "COMPANY" },
  { label: "مشتری", value: "CUSTOMER" },
]);
const accessTypeOptions = typeOptions.value;

const showDialog = ref(false);
const isEditMode = ref(false);
const currentUser = ref({});
const availableRoles = ref([]);
const availableCompanies = ref([]);
const saving = ref(false);
const editLoading = ref(false);

const showInfoDialog = ref(false);
const infoUser = ref(null);
const infoLoading = ref(false);

const showDeleteDialog = ref(false);
const userToDelete = ref(null);

const dialogHeader = computed(() => (isEditMode.value ? "ویرایش کاربر" : "ایجاد کاربر جدید"));

onMounted(() => {
  loadUsers();
  loadRoles();
  loadCompanies();
});

// ── Display helpers ──────────────────────────────────────────
function fullName(u) {
  const first = u?.profile?.firstName || "";
  const last = u?.profile?.lastName || "";
  return [first, last].filter(Boolean).join(" ").trim();
}
function avatarLabel(u) {
  return (fullName(u) || u?.email || "U").charAt(0);
}
function statusLabel(status) {
  return status === "ACTIVE" ? "فعال" : status === "PENDING" ? "در انتظار" : "رد شده";
}
function statusSeverity(status) {
  return status === "ACTIVE" ? "success" : status === "PENDING" ? "warn" : "danger";
}
function typeLabel(type) {
  const found = typeOptions.value.find((t) => t.value === type);
  return found ? found.label : "—";
}
function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("fa-IR");
  } catch {
    return "—";
  }
}

function debounceSearch() {
  clearTimeout(debounceSearch.timer);
  debounceSearch.timer = setTimeout(() => applyFilters(), 500);
}
function applyFilters() {
  loadUsers(1);
}

async function loadUsers(page = pagination.value.page) {
  try {
    loading.value = true;
    const response = await userStore.getUsers({
      page,
      limit: pagination.value.limit,
      search: searchQuery.value,
      status: statusFilter.value,
      type: typeFilter.value,
      sortBy: sortField.value,
      sortOrder: sortOrder.value === 1 ? "asc" : "desc",
    });
    users.value = response.users || [];
    pagination.value = {
      page: response.page,
      limit: response.limit,
      total: response.total,
      totalPages: response.totalPages,
    };
  } catch (error) {
    toast.add({ severity: "error", summary: "خطا", detail: "خطا در دریافت کاربران", life: 3000 });
  } finally {
    loading.value = false;
  }
}

async function loadRoles() {
  try {
    const response = await roleStore.getRoles({ limit: 100 });
    availableRoles.value = response.roles || [];
  } catch (error) {
    toast.add({ severity: "error", summary: "خطا", detail: "خطا در دریافت نقش‌ها", life: 3000 });
  }
}

async function loadCompanies() {
  try {
    const { useCompanyStore } = await import("@/stores/companies");
    const companyStore = useCompanyStore();
    const result = await companyStore.getCompanies({ limit: 100 });
    availableCompanies.value = result.data || [];
  } catch (error) {
    toast.add({ severity: "error", summary: "خطا", detail: "خطا در دریافت شرکت‌ها", life: 3000 });
  }
}

function onPage(event) {
  pagination.value.limit = event.rows;
  loadUsers(event.page + 1);
}
function onSort(event) {
  sortField.value = event.sortField || "id";
  sortOrder.value = event.sortOrder || -1;
  loadUsers(1);
}

// When the type is switched away from COMPANY, drop the company link.
function onTypeChange() {
  if (currentUser.value.type !== "COMPANY") {
    currentUser.value.companyId = null;
  }
}

// ── Info dialog (lazy fetch of full user detail) ─────────────
async function openInfo(row) {
  showInfoDialog.value = true;
  infoLoading.value = true;
  infoUser.value = null;
  try {
    infoUser.value = await userStore.getUserById(row.id);
  } catch {
    toast.add({ severity: "error", summary: "خطا", detail: "خطا در دریافت اطلاعات کاربر", life: 3000 });
    showInfoDialog.value = false;
  } finally {
    infoLoading.value = false;
  }
}

function editFromInfo() {
  const target = infoUser.value;
  showInfoDialog.value = false;
  if (target) openEdit(target);
}

// ── Create / Edit ────────────────────────────────────────────
function openCreateDialog() {
  isEditMode.value = false;
  editLoading.value = false;
  currentUser.value = {
    email: "",
    phone: "",
    password: "",
    firstName: "",
    lastName: "",
    avatar: "",
    type: "STAFF",
    companyId: null,
    status: "ACTIVE",
    roleId: null,
  };
  showDialog.value = true;
}

async function openEdit(row) {
  isEditMode.value = true;
  showDialog.value = true;
  editLoading.value = true;
  try {
    const user = await userStore.getUserById(row.id);
    const firstRole = user.roles && user.roles.length > 0 ? user.roles[0] : null;
    currentUser.value = {
      id: user.id,
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      firstName: user.profile?.firstName || "",
      lastName: user.profile?.lastName || "",
      avatar: user.profile?.avatar || "",
      type: user.accessProfile?.type || "STAFF",
      companyId: user.accessProfile?.companyId || null,
      isAccessActive: user.accessProfile?.isActive ?? true,
      status: user.status || "ACTIVE",
      roleId: firstRole ? firstRole.id : null,
    };
  } catch {
    toast.add({ severity: "error", summary: "خطا", detail: "خطا در دریافت اطلاعات کاربر", life: 3000 });
    showDialog.value = false;
  } finally {
    editLoading.value = false;
  }
}

function closeDialog() {
  showDialog.value = false;
}

function validateForm() {
  const u = currentUser.value;
  if (!u.phone) return "شماره تلفن الزامی است.";
  if (!u.firstName) return "نام الزامی است.";
  if (!u.lastName) return "نام خانوادگی الزامی است.";
  if (!isEditMode.value && !u.password) return "رمز عبور الزامی است.";
  if (u.type === "COMPANY" && !u.companyId) return "برای کارمند شرکت، انتخاب شرکت الزامی است.";
  return null;
}

async function saveUser() {
  const validationError = validateForm();
  if (validationError) {
    toast.add({ severity: "warn", summary: "اطلاعات ناقص", detail: validationError, life: 3000 });
    return;
  }
  try {
    saving.value = true;
    const u = currentUser.value;
    if (isEditMode.value) {
      const payload = {
        email: u.email || null,
        phone: u.phone,
        firstName: u.firstName ?? null,
        lastName: u.lastName ?? null,
        avatar: u.avatar || null,
        status: u.status,
        isAccessActive: u.isAccessActive,
      };
      // type/company only changeable by SUPER_ADMIN (backend enforces too)
      if (isSuperAdmin.value) {
        payload.type = u.type;
        payload.companyId = u.type === "COMPANY" ? u.companyId : null;
      }
      if (canAssignRoles.value) payload.roleId = u.roleId ?? null;
      // Password is intentionally NOT editable here — the edit form has no
      // password field, so a user's password can never be changed by accident.


      await userStore.updateUser(u.id, payload);
      toast.add({ severity: "success", summary: "موفقیت", detail: "کاربر بروزرسانی شد", life: 3000 });
    } else {
      await userStore.createUser({
        email: u.email || undefined,
        phone: u.phone,
        password: u.password,
        firstName: u.firstName,
        lastName: u.lastName,
        type: u.type,
        companyId: u.type === "COMPANY" ? u.companyId : undefined,
        status: u.status,
        roleId: canAssignRoles.value ? u.roleId : undefined,
      });
      toast.add({ severity: "success", summary: "موفقیت", detail: "کاربر ایجاد شد", life: 3000 });
    }
    closeDialog();
    loadUsers();
  } catch (error) {
    toast.add({ severity: "error", summary: "خطا", detail: error.message || "خطا در ذخیره کاربر", life: 3000 });
  } finally {
    saving.value = false;
  }
}

function confirmDelete(user) {
  userToDelete.value = user;
  showDeleteDialog.value = true;
}

async function deleteUser() {
  try {
    await userStore.deleteUser(userToDelete.value.id);
    toast.add({ severity: "success", summary: "موفقیت", detail: "کاربر حذف شد", life: 3000 });
    showDeleteDialog.value = false;
    loadUsers();
  } catch (error) {
    toast.add({ severity: "error", summary: "خطا", detail: error.message || "خطا در حذف کاربر", life: 3000 });
  }
}
</script>

<style scoped>
.user-list-page {
  direction: rtl;
}

.search-wrap {
  margin-inline-end: 0.5rem;
}

.status-filter {
  width: 150px;
  margin-inline-end: 0.5rem;
}

.company-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.company-cell i {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.text-muted {
  color: var(--text-color-secondary);
}

/* ── Form layout ─────────────────────────────────────────── */
.form-section-title {
  margin: 1rem 0 0.75rem;
  font-size: 0.9rem;
  color: var(--primary-color);
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 0.35rem;
}
.form-section-title:first-child {
  margin-top: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.req {
  color: var(--red-500, #ef4444);
}

.opt {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  font-weight: 400;
}

.field-hint {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.field-hint-inline {
  font-size: 0.72rem;
  color: var(--text-color-secondary);
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0 1rem;
}

/* ── Info dialog ─────────────────────────────────────────── */
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
  border-radius: var(--content-border-radius, 8px);
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

.profile-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
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

.info-row-block {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}
</style>
