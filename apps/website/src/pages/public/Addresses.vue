<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { endpoints } from '@telecom/api-client'
import { apiGet, apiPost, apiPatch, apiDelete } from '@telecom/shared-core/http/apiClient'

const router = useRouter()
const addresses = ref([])
const loading = ref(true)
const saving = ref(false)
const deletingId = ref(null)
const errorMessage = ref('')
const successMessage = ref('')
const editingId = ref(null)
const formVisible = ref(false)

const emptyForm = () => ({
  label: 'خانه',
  recipientName: '',
  recipientPhone: '',
  province: '',
  city: '',
  addressLine: '',
  postalCode: '',
  isDefault: false,
})
const form = reactive(emptyForm())

onMounted(loadAddresses)

async function loadAddresses() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await apiGet(endpoints.addresses.list)
    addresses.value = Array.isArray(result) ? result : []
  } catch (error) {
    errorMessage.value = error?.serverMessage || error?.message || 'دریافت آدرس‌ها ناموفق بود.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  formVisible.value = true
  errorMessage.value = ''
  successMessage.value = ''
}

function openEdit(address) {
  editingId.value = address.id
  Object.assign(form, {
    label: address.label || 'خانه',
    recipientName: address.recipientName || '',
    recipientPhone: address.recipientPhone || '',
    province: address.province || '',
    city: address.city || '',
    addressLine: address.addressLine || '',
    postalCode: address.postalCode || '',
    isDefault: Boolean(address.isDefault),
  })
  formVisible.value = true
  errorMessage.value = ''
  successMessage.value = ''
}

function cancelEdit() {
  formVisible.value = false
  editingId.value = null
  Object.assign(form, emptyForm())
}

async function saveAddress() {
  errorMessage.value = ''
  successMessage.value = ''
  saving.value = true
  const payload = {
    ...form,
    label: form.label.trim() || 'خانه',
    recipientName: form.recipientName.trim(),
    recipientPhone: form.recipientPhone.trim(),
    province: form.province.trim(),
    city: form.city.trim(),
    addressLine: form.addressLine.trim(),
    postalCode: form.postalCode.trim() || null,
  }
  try {
    if (editingId.value) {
      await apiPatch(endpoints.addresses.update(editingId.value), payload)
      successMessage.value = 'آدرس با موفقیت به‌روزرسانی شد.'
    } else {
      await apiPost(endpoints.addresses.create, payload)
      successMessage.value = 'آدرس جدید ذخیره شد.'
    }
    cancelEdit()
    await loadAddresses()
  } catch (error) {
    errorMessage.value = error?.serverMessage || error?.message || 'ذخیره آدرس انجام نشد. دوباره تلاش کنید.'
  } finally {
    saving.value = false
  }
}

async function setDefault(address) {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await apiPatch(endpoints.addresses.setDefault(address.id), {})
    successMessage.value = 'آدرس پیش‌فرض تغییر کرد.'
    await loadAddresses()
  } catch (error) {
    errorMessage.value = error?.serverMessage || error?.message || 'تغییر آدرس پیش‌فرض ناموفق بود.'
  }
}

async function deleteAddress(address) {
  if (!window.confirm(`آدرس «${address.label || address.city}» حذف شود؟`)) return
  deletingId.value = address.id
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await apiDelete(endpoints.addresses.delete(address.id))
    successMessage.value = 'آدرس حذف شد.'
    if (editingId.value === address.id) cancelEdit()
    await loadAddresses()
  } catch (error) {
    errorMessage.value = error?.serverMessage || error?.message || 'حذف آدرس ناموفق بود.'
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <main class="ds-container ds-page addresses-page" dir="rtl">
    <header class="page-heading">
      <div>
        <p class="eyebrow">حساب کاربری</p>
        <h1>آدرس‌های من</h1>
        <p class="muted">نشانی‌های خود را ذخیره و آدرس پیش‌فرض را برای استفاده‌های بعدی مشخص کنید.</p>
      </div>
      <div class="heading-actions">
        <button class="button button-secondary" type="button" @click="router.push('/profile')">بازگشت به پروفایل</button>
        <button class="button button-primary" type="button" @click="openCreate">افزودن آدرس جدید</button>
      </div>
    </header>

    <p v-if="errorMessage" class="notice error" role="alert">{{ errorMessage }}</p>
    <p v-if="successMessage" class="notice success" role="status">{{ successMessage }}</p>

    <section v-if="formVisible" class="address-card form-card">
      <h2>{{ editingId ? 'ویرایش آدرس' : 'ثبت آدرس جدید' }}</h2>
      <form class="address-form" @submit.prevent="saveAddress">
        <label>عنوان آدرس
          <input v-model="form.label" maxlength="50" placeholder="مثلاً خانه یا محل کار">
        </label>
        <label>نام تحویل‌گیرنده *
          <input v-model="form.recipientName" required maxlength="120" autocomplete="name">
        </label>
        <label>شماره تماس تحویل‌گیرنده *
          <input v-model="form.recipientPhone" required maxlength="30" autocomplete="tel" inputmode="tel">
        </label>
        <label>استان *
          <input v-model="form.province" required maxlength="100" autocomplete="address-level1">
        </label>
        <label>شهر *
          <input v-model="form.city" required maxlength="100" autocomplete="address-level2">
        </label>
        <label>کد پستی
          <input v-model="form.postalCode" maxlength="30" autocomplete="postal-code" inputmode="numeric">
        </label>
        <label class="full-width">نشانی کامل *
          <textarea v-model="form.addressLine" required minlength="5" maxlength="1000" rows="3" autocomplete="street-address" placeholder="خیابان، کوچه، پلاک، واحد و جزئیات لازم"></textarea>
        </label>
        <label class="default-choice full-width">
          <input v-model="form.isDefault" type="checkbox">
          این آدرس، آدرس پیش‌فرض من باشد
        </label>
        <div class="form-actions full-width">
          <button class="button button-secondary" type="button" :disabled="saving" @click="cancelEdit">انصراف</button>
          <button class="button button-primary" type="submit" :disabled="saving">{{ saving ? 'در حال ذخیره…' : 'ذخیره آدرس' }}</button>
        </div>
      </form>
    </section>

    <div v-if="loading" class="state" role="status">در حال دریافت آدرس‌ها…</div>
    <section v-else-if="addresses.length" class="address-list" aria-label="فهرست آدرس‌ها">
      <article v-for="address in addresses" :key="address.id" class="address-card">
        <div class="address-top">
          <div class="address-title">
            <span class="address-pin" aria-hidden="true">⌖</span>
            <h2>{{ address.label || 'آدرس من' }}</h2>
            <span v-if="address.isDefault" class="default-badge">آدرس پیش‌فرض</span>
          </div>
          <div class="address-actions">
            <button class="text-button" type="button" @click="openEdit(address)">ویرایش</button>
            <button class="text-button danger-text" type="button" :disabled="deletingId === address.id" @click="deleteAddress(address)">{{ deletingId === address.id ? 'در حال حذف…' : 'حذف' }}</button>
          </div>
        </div>
        <p class="recipient">{{ address.recipientName }} <span>·</span> {{ address.recipientPhone }}</p>
        <p class="address-line">{{ address.province }}، {{ address.city }}، {{ address.addressLine }}</p>
        <p v-if="address.postalCode" class="postal">کد پستی: {{ address.postalCode }}</p>
        <button v-if="!address.isDefault" class="button button-secondary make-default" type="button" @click="setDefault(address)">انتخاب به‌عنوان آدرس پیش‌فرض</button>
      </article>
    </section>
    <section v-else class="empty-state">
      <div class="empty-icon" aria-hidden="true">⌖</div>
      <h2>هنوز آدرسی ثبت نکرده‌اید</h2>
      <p>برای دسترسی سریع‌تر، آدرس خانه یا محل کارتان را اضافه کنید.</p>
      <button class="button button-primary" type="button" @click="openCreate">ثبت اولین آدرس</button>
    </section>
  </main>
</template>

<style scoped>
.addresses-page{direction:rtl;max-width:1100px}.page-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem}.page-heading h1{margin:.2rem 0;font-size:1.7rem;font-weight:800;color:var(--text-color)}.eyebrow{margin:0;color:var(--primary-color);font-size:.85rem}.muted{margin:.5rem 0 0;color:var(--text-color-secondary);font-size:.92rem;line-height:1.8}.heading-actions,.address-actions,.form-actions{display:flex;align-items:center;gap:.65rem;flex-wrap:wrap}.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:9px;padding:.7rem 1rem;font:inherit;font-size:.9rem;text-decoration:none;cursor:pointer;transition:opacity .15s,background .15s}.button:disabled{opacity:.55;cursor:not-allowed}.button-primary{background:var(--primary-color);color:#fff}.button-secondary{background:var(--surface-card);border-color:var(--surface-border);color:var(--text-color)}.notice{padding:.8rem 1rem;border-radius:9px;margin-bottom:1rem;line-height:1.7}.error{background:var(--red-50);color:var(--red-700)}.success{background:var(--green-50);color:var(--green-700)}.address-list{display:grid;gap:1rem}.address-card{padding:1.2rem;border:1px solid var(--surface-border);border-radius:14px;background:var(--surface-card);box-shadow:0 2px 10px #00000005}.address-top{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap}.address-title{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap}.address-title h2,.form-card h2,.empty-state h2{margin:0;font-size:1.1rem;font-weight:750;color:var(--text-color)}.address-pin{font-size:1.4rem;color:var(--primary-color)}.default-badge{font-size:.75rem;font-weight:700;color:var(--primary-color);background:var(--primary-50);padding:.3rem .55rem;border-radius:999px}.text-button{border:0;background:transparent;color:var(--primary-color);font:inherit;font-size:.86rem;cursor:pointer;padding:.3rem}.text-button:disabled{opacity:.5}.danger-text{color:var(--red-600)}.recipient{font-weight:650;margin:.9rem 0 .35rem;color:var(--text-color)}.recipient span{color:var(--text-color-secondary);padding:0 .25rem}.address-line{line-height:1.9;margin:.3rem 0;color:var(--text-color)}.postal{font-size:.85rem;color:var(--text-color-secondary);margin:.5rem 0}.make-default{margin-top:.6rem;font-size:.82rem;padding:.5rem .7rem}.form-card{margin-bottom:1.2rem}.form-card h2{margin-bottom:1rem}.address-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.address-form label{display:flex;flex-direction:column;gap:.45rem;font-size:.88rem;font-weight:600;color:var(--text-color)}.address-form input:not([type=checkbox]),.address-form textarea{width:100%;box-sizing:border-box;border:1px solid var(--surface-border);border-radius:8px;background:var(--surface-ground);color:var(--text-color);padding:.75rem;font:inherit;font-weight:400;min-width:0}.address-form input:focus,.address-form textarea:focus{outline:2px solid var(--primary-color);outline-offset:1px}.full-width{grid-column:1/-1}.default-choice{flex-direction:row!important;align-items:center;gap:.6rem!important}.default-choice input{width:1rem;height:1rem;accent-color:var(--primary-color)}.form-actions{justify-content:flex-start}.state,.empty-state{padding:3rem 1rem;text-align:center;color:var(--text-color-secondary)}.empty-state{border:1px dashed var(--surface-border);border-radius:14px;background:var(--surface-card)}.empty-state h2{margin:.8rem 0}.empty-state p{line-height:1.8}.empty-icon{font-size:2.4rem;color:var(--primary-color)}@media(max-width:640px){.address-form{grid-template-columns:1fr}.full-width{grid-column:auto}.heading-actions{width:100%}.heading-actions .button{flex:1}.address-card{padding:1rem}.address-actions{width:100%;justify-content:flex-start}}
</style>
