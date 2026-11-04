<template>
  <div class="user-list-page ds-stack">
    <WorkspacePageHeading sr-only title="مدیریت کاربران" heading-id="user-management-title" />
    <KpiStatsRow :items="kpiItems" :loading="loading" />
    <div class="card ds-panel identity-management-surface">
      <Toolbar class="ds-toolbar identity-management-toolbar">
        <template #start>
          <span class="p-input-icon-right search-wrap">
            <i class="pi pi-search" aria-hidden="true" />
            <InputText v-model="searchQuery" name="userSearch" autocomplete="off" placeholder="جستجو…" aria-label="جستجو در کاربران" @input="debounceSearch" />
          </span>
          <Select
            v-model="statusFilter"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="وضعیت"
            aria-label="فیلتر وضعیت کاربر"
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
            aria-label="فیلتر نوع کاربر"
            class="status-filter"
            showClear
            @change="applyFilters"
          />
        </template>

        <template #end>
          <Button v-if="canCreate" label="کاربر جدید" icon="pi pi-plus" @click="openCreateDialog" />
        </template>
      </Toolbar>

      <SharedDataTable
        ref="tableRef"
        class="identity-management-table"
        title="فهرست کاربران"
        :columns="tableColumns"
        :rows="users"
        :loading="loading"
        :lazy="true"
        :total-records="pagination.total"
        :rows-per-page="pagination.limit"
        :rows-per-page-options="[5, 10, 20, 50]"
        :searchable="false"
        :column-toggle="false"
        :initial-sort-field="sortField"
        :initial-sort-order="sortOrder"
        @request="onTableRequest"
      >
        <template #avatar="{ row }">
          <Avatar v-if="row.profile?.avatar" :image="row.profile.avatar" shape="circle" />
          <Avatar v-else :label="avatarLabel(row)" shape="circle" />
        </template>
        <template #fullName="{ row }">
          <strong class="user-table-name">{{ fullName(row) || '—' }}</strong>
        </template>
        <template #accessType="{ row }">
          <Tag severity="contrast">{{ typeLabel(row.accessProfile?.type) }}</Tag>
        </template>
        <template #company="{ row }">
          <span v-if="row.accessProfile?.company?.name" class="company-cell">
            <i class="pi pi-building" aria-hidden="true"></i> {{ row.accessProfile.company.name }}
          </span>
          <span v-else class="text-muted">—</span>
        </template>
        <template #roles="{ row }">
          <div v-if="row.roles && row.roles.length" class="user-table-roles">
            <Tag v-for="role in row.roles" :key="role.id || role">
              {{ role.label || role.name || role }}
            </Tag>
          </div>
          <Tag v-else severity="warn">بدون نقش</Tag>
        </template>
        <template #status="{ row }">
          <Tag :severity="statusSeverity(row.status)">{{ statusLabel(row.status) }}</Tag>
        </template>
        <template #createdDate="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
        <template #actions="{ row }">
          <Button icon="pi pi-eye" severity="secondary" rounded text aria-label="مشاهده کاربر" v-tooltip.top="'مشاهده'" @click="openInfo(row)" />
          <Button v-if="canUpdate" icon="pi pi-pencil" severity="info" rounded text aria-label="ویرایش کاربر" v-tooltip.top="'ویرایش'" @click="openEdit(row)" />
          <Button v-if="canDelete" icon="pi pi-trash" severity="danger" rounded text aria-label="حذف کاربر" v-tooltip.top="'حذف'" @click="confirmDelete(row)" />
        </template>
      </SharedDataTable>
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
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import KpiStatsRow from '@telecom/shared-ui/components/common/KpiStatsRow.vue'
import SharedDataTable from '@telecom/shared-ui/components/common/DataTable.vue'
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
const tableRef = ref(null);
const loading = ref(false);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });

const kpiItems = computed(() => [
  { label: 'کل کاربران', value: pagination.value.total, icon: 'pi pi-users', tone: 'primary' },
])

const searchQuery = ref("");
const statusFilter = ref(null);
const typeFilter = ref(null);
const sortField = ref("id");
const sortOrder = ref(-1); // -1 desc, 1 asc
const tableColumns = [
  { field: 'id', header: 'شناسه', sortable: true, style: 'width: 5rem' },
  { field: 'profile.avatar', header: 'آواتار', slot: 'avatar' },
  { field: 'email', header: 'ایمیل', sortable: true },
  { field: 'profile.firstName', header: 'نام کامل', slot: 'fullName' },
  { field: 'phone', header: 'تلفن' },
  { field: 'accessProfile.type', header: 'نوع', slot: 'accessType' },
  { field: 'accessProfile.company.name', header: 'شرکت', slot: 'company' },
  { field: 'roles', header: 'نقش‌ها', slot: 'roles' },
  { field: 'status', header: 'وضعیت', sortable: true, slot: 'status' },
  { field: 'createdAt', header: 'تاریخ عضویت', sortable: true, slot: 'createdDate' },
];

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
  tableRef.value?.resetPage();
  loadUsers(1);
}

async function loadUsers(page = pagination.value.page, limit = pagination.value.limit) {
  try {
    loading.value = true;
    const response = await userStore.getUsers({
      page,
      limit,
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

function onTableRequest({ page, rows, sortField: requestedSortField, sortOrder: requestedSortOrder }) {
  pagination.value.limit = rows;
  if (requestedSortField) sortField.value = requestedSortField;
  if (requestedSortOrder) sortOrder.value = requestedSortOrder === "asc" ? 1 : -1;
  loadUsers(page, rows);
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
  color: var(--red-500, var(--tm-red));
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

/* Shared Paces-style list hierarchy; query, pagination and permissions unchanged. */
.user-list-page { gap: var(--ds-space-5); }
.user-list-page .ds-page-heading { margin-bottom: 0; }
.user-list-page .card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}
.user-list-page :deep(.p-toolbar) {
  background: var(--ds-color-surface);
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl) var(--ds-radius-xl) 0 0;
  padding: var(--ds-space-4) var(--ds-space-5);
}
.user-list-page :deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  padding: var(--ds-space-4) var(--ds-space-5);
  white-space: nowrap;
}
.user-list-page :deep(.p-datatable .p-datatable-tbody > tr > td) {
  border-color: var(--ds-color-border);
  padding: var(--ds-space-4) var(--ds-space-5);
}
@media (max-width: 640px) {
  .user-list-page { gap: var(--ds-space-3); }
  .user-list-page :deep(.p-toolbar) { align-items: stretch; }
}

.user-list-page { gap: clamp(1rem, 2vw, 1.5rem); }
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
.user-list-page .card {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
  overflow: hidden;
}
.user-list-page :deep(.p-toolbar) { flex-wrap: wrap; gap: .75rem; }
.user-list-page :deep(.p-toolbar-start),
.user-list-page :deep(.p-toolbar-end) { display: flex; align-items: center; flex-wrap: wrap; gap: .65rem; }
.user-list-page :deep(.p-toolbar .p-inputtext),
.user-list-page :deep(.p-toolbar .p-select) { min-height: 2.65rem; border-radius: var(--ds-radius-md); }
.user-list-page :deep(.p-toolbar .p-button) { min-height: 2.65rem; border-radius: var(--ds-radius-md); }
.user-list-page :deep(.p-datatable-table-container) { overflow-x: auto; }
.user-list-page :deep(.p-datatable-tbody > tr) { transition: background var(--ds-transition-fast); }
.user-list-page :deep(.p-datatable-tbody > tr > td) { vertical-align: middle; }
@media (max-width: 640px) {
  .management-page-intro { align-items: flex-start; padding: 1rem; }
  .management-page-icon { width: 2.75rem; height: 2.75rem; }
  .user-list-page :deep(.p-toolbar-start),
  .user-list-page :deep(.p-toolbar-end) { width: 100%; }
}


/* Identity and access directory — unified data density and mobile filter behavior. */
.identity-management-surface {
  overflow: hidden;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.identity-management-toolbar {
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.identity-management-toolbar :deep(.p-toolbar-start),
.identity-management-toolbar :deep(.p-toolbar-end) {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .65rem;
}
.identity-management-toolbar :deep(.p-inputtext),
.identity-management-toolbar :deep(.p-select) {
  min-height: 2.65rem;
  border-radius: var(--ds-radius-md);
}
.identity-management-table :deep(.p-datatable-table-container) { overflow-x: auto; scrollbar-width: thin; }
.identity-management-table :deep(.p-datatable-thead > tr > th) {
  padding: .9rem 1rem;
  border-color: var(--ds-color-border);
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  white-space: nowrap;
}
.identity-management-table :deep(.p-datatable-tbody > tr > td) {
  padding: .85rem 1rem;
  border-color: var(--ds-color-border);
  color: var(--ds-color-text);
  vertical-align: middle;
}
.identity-management-table :deep(.p-datatable-tbody > tr) { transition: background-color var(--ds-transition-fast); }
.identity-management-table :deep(.p-datatable-tbody > tr:hover) { background: var(--ds-color-surface-hover); }
.identity-management-table :deep(.p-paginator) {
  justify-content: flex-start;
  padding: .8rem 1rem;
  border-top: 1px solid var(--ds-color-border);
  background: var(--ds-color-surface);
}
.identity-management-table :deep(.p-paginator-page),
.identity-management-table :deep(.p-paginator-next),
.identity-management-table :deep(.p-paginator-prev) {
  min-width: 2.75rem;
  min-height: 2.75rem;
  border-radius: var(--ds-radius-md);
}
.identity-management-table :deep(.p-button.p-button-text) { width: 2.75rem; min-width: 2.75rem; height: 2.75rem; min-height: 2.75rem; }
@media (max-width: 700px) {
  .identity-management-toolbar :deep(.p-toolbar) { align-items: stretch; flex-direction: column; }
  .identity-management-toolbar :deep(.p-toolbar-start),
  .identity-management-toolbar :deep(.p-toolbar-end),
  .identity-management-toolbar .toolbar-filters { width: 100%; }
  .identity-management-toolbar :deep(.p-toolbar-start) { display: grid; grid-template-columns: minmax(0, 1fr); }
  .identity-management-toolbar :deep(.p-inputtext),
  .identity-management-toolbar :deep(.p-select) { width: 100%; margin: 0; }
  .identity-management-toolbar :deep(.p-toolbar-end .p-button) { width: 100%; }
}
.user-table-name { color: var(--ds-color-text); font-weight: var(--ds-font-weight-semibold); }
.user-table-roles { display: flex; flex-wrap: wrap; gap: .35rem; }
</style>

/* Reference-led identity workspace: compact, branded and data-first. */
.user-list-page { gap: 1.1rem; }
.user-list-page :deep(.workspace-page-heading) {
  margin: 0;
  padding: 1rem 1.2rem;
  border-color: var(--tm-line);
  border-radius: 15px;
  background: linear-gradient(108deg, var(--tm-surface-alt) 0%, #fff 58%, var(--tm-surface-alt) 100%);
  box-shadow: 0 4px 14px rgba(30, 77, 128, .055);
}
.user-list-page :deep(.workspace-page-heading h1) {
  font-size: 1.22rem;
  font-weight: 800;
  letter-spacing: -.015em;
}
.user-list-page :deep(.workspace-page-heading-icon) { color: var(--tm-cyan-deep); font-size: 1.15rem; }
.user-list-page :deep(.workspace-page-heading p) { margin-top: .22rem; color: var(--tm-muted); font-size: .77rem; }
.identity-management-surface {
  border-color: var(--tm-line);
  border-radius: 15px;
  box-shadow: 0 5px 18px rgba(28, 73, 119, .055);
}
.identity-management-toolbar {
  padding: .85rem 1rem;
  background: linear-gradient(100deg, var(--tm-surface-alt) 0%, #fff 62%, var(--tm-surface-alt) 100%);
}
.identity-management-toolbar :deep(.p-toolbar-start) { flex: 1 1 30rem; min-width: 0; }
.identity-management-toolbar :deep(.p-toolbar-end) { flex: 0 0 auto; }
.identity-management-toolbar :deep(.p-inputtext), .identity-management-toolbar :deep(.p-select) {
  min-height: 2.65rem;
  border-radius: 9px;
  background: #fff;
}
.identity-management-toolbar :deep(.p-button:not(.p-button-text):not(.p-button-outlined)) {
  min-height: 2.7rem;
  border-color: var(--tm-cyan);
  background: linear-gradient(105deg, var(--tm-cyan-strong), var(--tm-cyan));
  color: var(--tm-surface);
  box-shadow: 0 3px 9px rgba(38, 160, 197, .16);
}
.identity-management-table :deep(.ent-table-toolbar) {
  padding: .8rem 1rem;
  border-bottom: 1px solid var(--tm-line);
  background: #fff;
}
.identity-management-table :deep(.ent-table-title) { color: var(--tm-ink); font-size: .88rem; font-weight: 800; }
.identity-management-table :deep(.ent-table-record-count) { color: var(--tm-muted); font-size: .72rem; font-variant-numeric: tabular-nums; }
.identity-management-table :deep(.p-datatable-thead > tr > th) {
  padding: .78rem .9rem;
  background: var(--tm-surface-alt);
  color: var(--tm-muted);
  font-size: .7rem;
  font-weight: 800;
}
.identity-management-table :deep(.p-datatable-tbody > tr > td) { padding: .72rem .9rem; color: var(--tm-ink-soft); font-size: .76rem; }
.identity-management-table :deep(.p-datatable-tbody > tr:hover) { background: var(--tm-surface-alt); }
.identity-management-table :deep(.p-button.p-button-text) { min-width: 2.75rem; min-height: 2.75rem; border-radius: 9px; }
.user-list-page :deep(.p-button:focus-visible), .user-list-page :deep(.p-inputtext:focus-visible), .user-list-page :deep(.p-select:focus-visible) {
  outline: 2px solid var(--tm-cyan);
  outline-offset: 2px;
}
@media (max-width: 760px) {
  .user-list-page :deep(.workspace-page-heading) { padding: .85rem .9rem; }
  .identity-management-toolbar { padding: .75rem; }
  .identity-management-toolbar :deep(.p-toolbar-start) { display: grid; grid-template-columns: minmax(0, 1fr); }
  .identity-management-toolbar :deep(.p-inputtext), .identity-management-toolbar :deep(.p-select) { min-width: 0; width: 100%; }
  .identity-management-toolbar :deep(.p-toolbar-end .p-button) { width: 100%; }
  .identity-management-table :deep(.ent-table-toolbar) { align-items: flex-start; flex-direction: column; gap: .5rem; }
}
@media (prefers-reduced-motion: reduce) {
  .identity-management-table :deep(.p-datatable-tbody > tr), .identity-management-table :deep(.p-button) { transition: none; }
}

