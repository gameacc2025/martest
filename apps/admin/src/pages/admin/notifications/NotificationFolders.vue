<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { onMounted, ref } from 'vue'
import { apiGet, apiPost, apiPatch } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'

const folders = ref([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const form = ref({ name: '', scope: 'ALL', sortOrder: 10 })
const scopes = [
  { value: 'ALL', label: 'همه پنل‌ها' },
  { value: 'WEBSITE', label: 'وب‌سایت کاربران' },
  { value: 'COMPANY', label: 'پنل شرکت‌ها' },
  { value: 'ADMIN', label: 'پنل مدیریت' },
]

onMounted(loadFolders)

async function loadFolders() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await apiGet(endpoints.admin.notifications.folders)
    folders.value = Array.isArray(result?.data) ? result.data : Array.isArray(result?.data?.data) ? result.data.data : []
  } catch {
    errorMessage.value = 'دریافت پوشه‌ها انجام نشد. مجوز مدیریت تنظیمات را بررسی کنید.'
  } finally {
    loading.value = false
  }
}

async function createFolder() {
  errorMessage.value = ''
  successMessage.value = ''
  if (form.value.name.trim().length < 2) {
    errorMessage.value = 'نام پوشه باید حداقل دو نویسه باشد.'
    return
  }
  saving.value = true
  try {
    await apiPost(endpoints.admin.notifications.folders, {
      name: form.value.name.trim(),
      scope: form.value.scope,
      sortOrder: Number(form.value.sortOrder) || 0,
    })
    form.value.name = ''
    successMessage.value = 'پوشه با موفقیت ایجاد شد.'
    await loadFolders()
  } catch {
    errorMessage.value = 'ایجاد پوشه انجام نشد.'
  } finally {
    saving.value = false
  }
}

async function updateFolder(folder, changes) {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await apiPatch(endpoints.admin.notifications.folder(folder.id), changes)
    successMessage.value = 'تنظیمات پوشه ذخیره شد.'
    await loadFolders()
  } catch {
    errorMessage.value = 'ذخیره تنظیمات پوشه انجام نشد.'
  }
}
</script>

<template>
  <section class="folder-page" dir="rtl">
    <WorkspacePageHeading
      eyebrow="ساختار صندوق پیام‌ها"
      title="مدیریت پوشه‌های اعلان"
      description="پوشه‌های قابل استفاده در هر پنل را مدیریت کنید. کاربران امکان ساخت پوشه ندارند."
      icon="pi pi-folder-open"
      heading-id="notification-folders-title"
    >
      <template #actions>
        <button class="secondary refresh-action" :disabled="loading" @click="loadFolders"><i class="pi pi-refresh"></i> به‌روزرسانی</button>
      </template>
    </WorkspacePageHeading>

    <form class="panel create-form" @submit.prevent="createFolder">
      <h2>ایجاد پوشه</h2>
      <label>عنوان پوشه<input v-model="form.name" maxlength="60" minlength="2" required placeholder="مثلاً اطلاعیه‌های مهم"></label>
      <label>دامنه نمایش<select v-model="form.scope"><option v-for="item in scopes" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
      <label>ترتیب نمایش<input v-model.number="form.sortOrder" type="number" min="0" max="10000"></label>
      <button class="primary" type="submit" :disabled="saving">{{ saving ? 'در حال ذخیره…' : 'ایجاد پوشه' }}</button>
    </form>

    <p v-if="errorMessage" class="message error" role="alert">{{ errorMessage }}</p>
    <p v-if="successMessage" class="message success" role="status">{{ successMessage }}</p>

    <section class="panel">
      <h2>پوشه‌های موجود</h2>
      <p v-if="loading">در حال بارگذاری…</p>
      <p v-else-if="!folders.length">پوشه‌ای برای نمایش وجود ندارد.</p>
      <div v-else class="folder-list">
        <article v-for="folder in folders" :key="folder.id" class="folder-row">
          <div class="folder-icon"><i :class="folder.key === 'SAVED' ? 'pi pi-bookmark' : folder.key === 'INBOX' ? 'pi pi-inbox' : 'pi pi-folder'"></i></div>
          <div class="folder-info">
            <strong>{{ folder.name }}</strong>
            <small>{{ folder.isSystem ? 'پوشه سیستمی و غیرقابل تغییر' : 'پوشه مدیریتی' }} · {{ scopes.find(s => s.value === folder.scope)?.label || folder.scope }}</small>
          </div>
          <template v-if="!folder.isSystem">
            <label class="inline-field">عنوان<input :value="folder.name" maxlength="60" @change="updateFolder(folder, { name: $event.target.value })"></label>
            <label class="inline-field">نمایش در<select :value="folder.scope" @change="updateFolder(folder, { scope: $event.target.value })"><option v-for="item in scopes" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
            <label class="toggle"><input type="checkbox" :checked="folder.isActive" @change="updateFolder(folder, { isActive: $event.target.checked })"> فعال</label>
            <label class="inline-field order">ترتیب<input type="number" min="0" max="10000" :value="folder.sortOrder" @change="updateFolder(folder, { sortOrder: Number($event.target.value) })"></label>
          </template>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped>
.folder-page{display:grid;gap:1.25rem;color:var(--text-color,var(--tm-ink))}
.page-heading{display:flex;justify-content:space-between;align-items:center;gap:1rem}
h1{font-size:1.4rem;margin:0 0 .4rem}h2{font-size:1.05rem;margin:0 0 1rem}
p{color:var(--text-color-secondary,var(--tm-muted));margin:.3rem 0 0;line-height:1.8}
.panel{background:var(--ds-color-surface);border:1px solid var(--ds-color-border);border-radius:var(--ds-card-radius);box-shadow:var(--ds-shadow-xs);padding:1.25rem}
.create-form{display:grid;grid-template-columns:2fr 1fr 1fr auto;align-items:end;gap:1rem}
label{display:grid;gap:.4rem;font-size:.9rem}
input,select{min-width:0;width:100%;border:1px solid var(--surface-border,var(--tm-line-strong));border-radius:6px;padding:.65rem;background:var(--ds-color-background);color:inherit}
button{border:0;border-radius:6px;padding:.7rem 1rem;cursor:pointer}
button:disabled{opacity:.55;cursor:wait}.primary{background:var(--tm-cyan);color:var(--tm-cyan-deep)}.secondary{background:var(--surface-hover,var(--tm-surface-alt));color:inherit}
.folder-list{display:grid}.folder-row{display:flex;align-items:center;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--surface-border,var(--tm-line))}.folder-row:last-child{border-bottom:0}
.folder-icon{font-size:1.2rem;width:2rem;text-align:center}.folder-info{flex:1;display:grid;gap:.3rem;min-width:9rem}.folder-info small{color:var(--text-color-secondary,var(--tm-muted))}
.inline-field{min-width:9rem}.inline-field.order{min-width:5rem;max-width:6rem}.toggle{display:flex;align-items:center;gap:.4rem;white-space:nowrap}.toggle input{width:auto}
.message{padding:.7rem 1rem;border-radius:6px}.error{color:var(--tm-red);background:var(--tm-red-soft)}.success{color:var(--tm-green);background:var(--tm-green-soft)}
@media(max-width:900px){.create-form{grid-template-columns:1fr 1fr}.folder-row{flex-wrap:wrap}.folder-info{flex-basis:70%}}
@media(max-width:560px){.create-form{grid-template-columns:1fr}.page-heading{align-items:flex-start;flex-direction:column}}

.folder-page { gap: var(--ds-space-5); }
.folder-page .page-heading {
  padding: var(--ds-space-5) var(--ds-space-6);
  background: var(--ds-color-surface);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-card-radius);
  box-shadow: var(--ds-shadow-xs);
}
.folder-page .panel {
  border-color: var(--ds-color-border);
  border-radius: var(--ds-card-radius);
  box-shadow: var(--ds-shadow-xs);
  background: var(--ds-color-surface);
}
.folder-page input,
.folder-page select {
  border-color: var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
}
.folder-page input:focus,
.folder-page select:focus {
  outline: 0;
  border-color: var(--ds-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ds-color-primary) 14%, transparent);
}
@media (max-width: 640px) {
  .folder-page .page-heading { align-items: stretch; flex-direction: column; padding: var(--ds-space-4); }
}


.folder-page { gap: var(--ds-space-5); }
.folder-page .page-heading {
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-card-radius);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.folder-heading-identity { display: flex; align-items: center; gap: 1rem; min-width: 0; }
.folder-heading-icon {
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
.folder-heading-identity > div { min-width: 0; }
.folder-heading-eyebrow { display: block; color: var(--ds-color-primary); font-size: var(--ds-font-size-xs); font-weight: var(--ds-font-weight-bold); }
.folder-page .page-heading h1 { margin: .2rem 0; color: var(--ds-color-text); font-size: var(--ds-font-size-2xl); font-weight: 800; }
.folder-page .page-heading p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
.folder-page .panel { padding: clamp(1rem, 2vw, 1.5rem); }
.folder-page .create-form { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, .8fr) auto; }
.folder-page .panel h2 { color: var(--ds-color-text); font-weight: var(--ds-font-weight-bold); }
.folder-page .folder-row { border-color: var(--ds-color-border); }
.folder-page .folder-icon { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: var(--ds-radius-md); background: var(--ds-color-primary-soft); color: var(--ds-color-primary); }
.folder-page .folder-info strong { color: var(--ds-color-text); }
.folder-page .folder-info small { color: var(--ds-color-text-muted); }
.folder-page .primary { background: var(--ds-color-primary); color: var(--ds-color-primary-contrast); }
.folder-page .secondary { border: 1px solid var(--ds-color-border); background: var(--ds-color-surface-alt); color: var(--ds-color-text); }
.folder-page .error { background: var(--ds-color-danger-soft); color: var(--ds-color-danger); }
.folder-page .success { background: var(--ds-color-success-soft); color: var(--ds-color-success); }
.folder-page .refresh-action { display: inline-flex; align-items: center; gap: .45rem; }
@media (max-width: 900px) { .folder-page .create-form { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) {
  .folder-page .page-heading { align-items: stretch; flex-direction: column; padding: 1rem; }
  .folder-heading-identity { align-items: flex-start; }
  .folder-page .create-form { grid-template-columns: 1fr; }
  .folder-page .folder-row { align-items: stretch; }
}


/* Notification folder registry — readable configuration cards and responsive rows. */
.folder-page { gap: var(--ds-space-5); color: var(--ds-color-text); }
.folder-page .folder-heading {
  align-items: center;
  gap: 1rem;
  padding: var(--ds-space-5) var(--ds-space-6);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-card-radius);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.folder-page .folder-heading-identity { display: flex; align-items: center; gap: 1rem; min-width: 0; }
.folder-page .folder-heading-icon {
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
.folder-page .folder-heading-eyebrow { color: var(--ds-color-primary); font-size: var(--ds-font-size-xs); font-weight: var(--ds-font-weight-bold); }
.folder-page h1 { margin: .2rem 0; color: var(--ds-color-text); font-size: clamp(1.25rem, 2vw, var(--ds-font-size-2xl)); font-weight: 800; }
.folder-page h2 { margin: 0 0 1rem; color: var(--ds-color-text); font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); }
.folder-page p { color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.8; }
.folder-page .panel {
  padding: clamp(1rem, 2vw, 1.5rem);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-card-radius);
  background: var(--ds-color-surface);
  box-shadow: var(--ds-shadow-xs);
}
.folder-page .create-form {
  grid-template-columns: minmax(220px, 1.5fr) minmax(180px, 1fr) minmax(130px, .7fr) auto;
  align-items: end;
  gap: 1rem;
}
.folder-page label { color: var(--ds-color-text); font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-semibold); }
.folder-page input,
.folder-page select {
  min-height: 2.65rem;
  padding: .65rem .8rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-surface-alt);
  color: var(--ds-color-text);
  font: inherit;
}
.folder-page input:focus,
.folder-page select:focus {
  border-color: var(--ds-color-primary);
  outline: 0;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ds-color-primary) 14%, transparent);
}
.folder-page button {
  min-height: 2.65rem;
  border-radius: var(--ds-radius-md);
  font: inherit;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-bold);
}
.folder-page button.primary { background: var(--ds-color-primary); color: var(--ds-color-primary-contrast); }
.folder-page button.secondary { border: 1px solid var(--ds-color-border); background: var(--ds-color-surface-alt); color: var(--ds-color-text); }
.folder-page .folder-list { gap: .65rem; }
.folder-page .folder-row {
  display: grid;
  grid-template-columns: 2.5rem minmax(150px, 1fr) minmax(140px, .9fr) minmax(140px, .9fr) auto minmax(80px, .35fr);
  align-items: center;
  gap: .75rem;
  padding: 1rem;
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-surface);
}
.folder-page .folder-row:last-child { border-bottom: 1px solid var(--ds-color-border); }
.folder-page .folder-icon {
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: .8rem;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-primary);
}
.folder-page .folder-info { min-width: 0; display: grid; gap: .25rem; }
.folder-page .folder-info strong { color: var(--ds-color-text); }
.folder-page .folder-info small { color: var(--ds-color-text-muted); line-height: 1.6; }
.folder-page .inline-field { min-width: 0; }
.folder-page .inline-field.order { max-width: none; }
.folder-page .toggle { display: flex; align-items: center; gap: .4rem; white-space: nowrap; }
.folder-page .toggle input { width: 1rem; min-height: 1rem; accent-color: var(--ds-color-primary); }
.folder-page .message { padding: .8rem 1rem; border: 1px solid; border-radius: var(--ds-radius-md); }
.folder-page .message.error { border-color: color-mix(in srgb, var(--ds-color-danger) 30%, transparent); background: var(--ds-color-danger-soft); color: var(--ds-color-danger); }
.folder-page .message.success { border-color: color-mix(in srgb, var(--ds-color-success) 30%, transparent); background: var(--ds-color-success-soft); color: var(--ds-color-success); }
@media (max-width: 1100px) {
  .folder-page .folder-row { grid-template-columns: 2.5rem minmax(160px, 1fr) minmax(140px, 1fr) minmax(140px, 1fr); }
  .folder-page .folder-row .toggle,
  .folder-page .folder-row .order { grid-column: auto; }
  .folder-page .create-form { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 700px) {
  .folder-page .folder-heading { align-items: flex-start; flex-direction: column; padding: var(--ds-space-4); }
  .folder-page .create-form { grid-template-columns: minmax(0, 1fr); }
  .folder-page .folder-row { grid-template-columns: 2.5rem minmax(0, 1fr); }
  .folder-page .folder-row > .inline-field,
  .folder-page .folder-row > .toggle { grid-column: 1 / -1; }
}
</style>