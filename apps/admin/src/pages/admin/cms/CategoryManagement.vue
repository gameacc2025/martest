with open("G:\\Project\\telecom-marketplace\\apps\\admin\\src\\pages\\admin\\cms\\CategoryManagement.vue", "w", encoding="utf-8") as f:
    f.write("""<template>
  <div class="category-management ds-stack" dir="rtl">
    <WorkspacePageHeading title="مدیریت دسته‌بندی‌ها" heading-id="category-management-title" />
    <div class="category-intro">
      <div><span class="category-intro__eyebrow">دسته‌بندی‌ها</span><h2>فهرست دسته‌بندی‌ها</h2><p>دسته‌بندی‌های مقالات را مدیریت کنید.</p></div>
      <Button v-if="canCreate" label="دسته‌بندی جدید" icon="pi pi-plus" @click="openCreate" />
    </div>
    <div class="category-toolbar">
      <InputText v-model="search" placeholder="جستجو در نام دسته‌بندی…" @keyup.enter="load" />
      <Select v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value" placeholder="همه وضعیت‌ها" show-clear @change="load" />
      <Button label="جستجو" icon="pi pi-search" severity="secondary" outlined @click="load" />
    </div>
    <div class="category-table-wrap">
      <DataTable :value="items" :loading="loading" data-key="id" responsive-layout="scroll" striped-rows :paginator="true" :rows="10" :totalRecords="totalRecords" @page="onPage">
        <Column field="name" header="نام" style="min-width: 250px" />
        <Column field="slug" header="اسلاگ" style="width: 180px" />
        <Column field="sortOrder" header="ترتیب" style="width: 100px" />
        <Column header="وضعیت" style="width: 130px">
          <template #body="{ data }"><Tag :value="statusLabel(data.isActive)" :severity="statusTone(data.isActive)" /></template>
        </Column>
        <Column header="تعداد مقالات" style="width: 120px">
          <template #body="{ data }">{{ data._count?.articles || 0 }}</template>
        </Column>
        <Column header="عملیات" style="width: 130px">
          <template #body="{ data }">
            <Button v-if="canUpdate" icon="pi pi-pencil" text rounded aria-label="ویرایش دسته‌بندی" @click="edit(data)" />
            <Button v-if="canDelete" icon="pi pi-trash" text rounded severity="danger" aria-label="حذف دسته‌بندی" @click="deleteCategory(data)" />
          </template>
        </Column>
        <template #empty><div class="category-empty">هنوز دسته‌بندی‌ای ثبت نشده است.</div></template>
      </DataTable>
      <div class="category-pagination" v-if="totalRecords > 10">
        <Paginator :first="first" :rows="rows" :totalRecords="totalRecords" @page="onPage" :pageLinkSize="5" />
      </div>
    </div>

    <Dialog v-model:visible="dialog" :header="editingId ? 'ویرایش دسته‌بندی' : 'ایجاد دسته‌بندی جدید'" modal :style="{ width: 'min(500px, 94vw)' }" :closable="!saving">
      <div class="category-form">
        <div class="category-form__field"><label for="category-name">نام *</label><InputText id="category-name" v-model="form.name" maxlength="100" /></div>
        <div class="category-form__field"><label for="category-slug">اسلاگ *</label><InputText id="category-slug" v-model="form.slug" maxlength="100" placeholder="به‌صورت خودکار از نام تولید می‌شود" /></div>
        <div class="category-form__field"><label for="category-description">توضیحات</label><Textarea id="category-description" v-model="form.description" rows="3" maxlength="500" auto-resize /></div>
        <div class="category-form__grid">
          <div class="category-form__field"><label for="category-sort">ترتیب نمایش</label><InputNumber id="category-sort" v-model="form.sortOrder" :min="0" /></div>
          <div class="category-form__field"><label for="category-status">وضعیت</label><Select id="category-status" v-model="form.isActive" :options="statusOptions" option-label="label" option-value="value" placeholder="وضعیت را انتخاب کنید" /></div>
        </div>

        <div class="category-form__actions">
          <Button label="انصراف" icon="pi pi-times" text @click="closeDialog" :disabled="saving" />
          <Button label="ذخیره" icon="pi pi-check" @click="save" :loading="saving" />
        </div>
      </div>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>
""")