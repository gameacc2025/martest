<script setup>
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
    <header class="page-heading">
      <div><h1>مدیریت پوشه‌های اعلان</h1><p>پوشه‌های قابل استفاده در هر پنل را مدیریت کنید. کاربران امکان ساخت پوشه ندارند.</p></div>
      <button class="secondary" :disabled="loading" @click="loadFolders">به‌روزرسانی</button>
    </header>

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
.folder-page{display:grid;gap:1.25rem;color:var(--text-color,#1f2937)}
.page-heading{display:flex;justify-content:space-between;align-items:center;gap:1rem}
h1{font-size:1.4rem;margin:0 0 .4rem}h2{font-size:1.05rem;margin:0 0 1rem}
p{color:var(--text-color-secondary,#64748b);margin:.3rem 0 0;line-height:1.8}
.panel{background:var(--surface-card,#fff);border:1px solid var(--surface-border,#e5e7eb);border-radius:8px;padding:1.25rem}
.create-form{display:grid;grid-template-columns:2fr 1fr 1fr auto;align-items:end;gap:1rem}
label{display:grid;gap:.4rem;font-size:.9rem}
input,select{min-width:0;width:100%;border:1px solid var(--surface-border,#d1d5db);border-radius:6px;padding:.65rem;background:var(--surface-ground,#fff);color:inherit}
button{border:0;border-radius:6px;padding:.7rem 1rem;cursor:pointer}
button:disabled{opacity:.55;cursor:wait}.primary{background:#01bec2;color:#062f30}.secondary{background:var(--surface-hover,#eef2f7);color:inherit}
.folder-list{display:grid}.folder-row{display:flex;align-items:center;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--surface-border,#e5e7eb)}.folder-row:last-child{border-bottom:0}
.folder-icon{font-size:1.2rem;width:2rem;text-align:center}.folder-info{flex:1;display:grid;gap:.3rem;min-width:9rem}.folder-info small{color:var(--text-color-secondary,#64748b)}
.inline-field{min-width:9rem}.inline-field.order{min-width:5rem;max-width:6rem}.toggle{display:flex;align-items:center;gap:.4rem;white-space:nowrap}.toggle input{width:auto}
.message{padding:.7rem 1rem;border-radius:6px}.error{color:#b91c1c;background:#fee2e2}.success{color:#166534;background:#dcfce7}
@media(max-width:900px){.create-form{grid-template-columns:1fr 1fr}.folder-row{flex-wrap:wrap}.folder-info{flex-basis:70%}}
@media(max-width:560px){.create-form{grid-template-columns:1fr}.page-heading{align-items:flex-start;flex-direction:column}}
</style>
