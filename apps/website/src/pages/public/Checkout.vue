<template>
  <main class="checkout-page ds-page" dir="rtl">
    <div class="ds-container checkout-shell">
      <WorkspacePageHeading
        title="تکمیل اطلاعات سفارش"
        description="اطلاعات تحویل را ثبت و اقلام انتخاب‌شده را بازبینی کنید."
        heading-id="checkout-title"
      >
        <template #actions><Breadcrumb :home="home" :model="breadcrumbs" /></template>
      </WorkspacePageHeading>

      <div class="checkout-notice" role="status">
        <i class="pi pi-info-circle" aria-hidden="true"></i>
        <div>
          <strong>ثبت سفارش و پرداخت هنوز فعال نشده است</strong>
          <p>درگاه پرداخت و API سفارش خرده‌فروشی هنوز به سامانه متصل نیستند. این صفحه اطلاعات کارت بانکی دریافت نمی‌کند و سفارش آزمایشی هم ثبت نمی‌کند.</p>
        </div>
      </div>

      <div v-if="cartItems.length === 0" class="checkout-empty">
        <h2>سبد خرید شما خالی است</h2>
        <p>برای ادامه، ابتدا محصولی به سبد خرید اضافه کنید.</p>
        <Button label="بازگشت به سبد خرید" icon="pi pi-arrow-right" severity="secondary" @click="router.push('/cart')" />
      </div>

      <div v-else class="checkout-layout">
        <section class="checkout-main">
          <ol class="checkout-steps" aria-label="مراحل تکمیل سفارش">
            <li :class="{ 'is-active': currentStep === 0, 'is-complete': currentStep > 0 }">
              <span>۱</span><strong>اطلاعات تحویل</strong>
            </li>
            <li :class="{ 'is-active': currentStep === 1 }">
              <span>۲</span><strong>بازبینی سفارش</strong>
            </li>
          </ol>

          <section v-if="currentStep === 0" class="checkout-section" aria-labelledby="shipping-title">
            <header class="section-heading">
              <div><h2 id="shipping-title">نشانی تحویل</h2><p>اطلاعات گیرنده و نشانی موردنظر را وارد کنید.</p></div>
            </header>

            <form class="shipping-form" @submit.prevent="continueToReview" novalidate>
              <div class="form-grid">
                <label class="form-field">
                  <span>نام و نام خانوادگی گیرنده <b>*</b></span>
                  <InputText v-model="shipping.fullName" autocomplete="name" :invalid="Boolean(errors.fullName)" />
                  <small v-if="errors.fullName" class="field-error">{{ errors.fullName }}</small>
                </label>
                <label class="form-field">
                  <span>شماره تماس گیرنده <b>*</b></span>
                  <InputText v-model="shipping.phone" inputmode="tel" autocomplete="tel" :invalid="Boolean(errors.phone)" />
                  <small v-if="errors.phone" class="field-error">{{ errors.phone }}</small>
                </label>
                <label class="form-field">
                  <span>استان <b>*</b></span>
                  <InputText v-model="shipping.province" autocomplete="address-level1" :invalid="Boolean(errors.province)" />
                  <small v-if="errors.province" class="field-error">{{ errors.province }}</small>
                </label>
                <label class="form-field">
                  <span>شهر <b>*</b></span>
                  <InputText v-model="shipping.city" autocomplete="address-level2" :invalid="Boolean(errors.city)" />
                  <small v-if="errors.city" class="field-error">{{ errors.city }}</small>
                </label>
                <label class="form-field field-span">
                  <span>نشانی کامل <b>*</b></span>
                  <Textarea v-model="shipping.address" rows="3" autoResize autocomplete="street-address" :invalid="Boolean(errors.address)" />
                  <small v-if="errors.address" class="field-error">{{ errors.address }}</small>
                </label>
                <label class="form-field">
                  <span>کد پستی <b>*</b></span>
                  <InputText v-model="shipping.postalCode" inputmode="numeric" autocomplete="postal-code" maxlength="10" :invalid="Boolean(errors.postalCode)" />
                  <small v-if="errors.postalCode" class="field-error">{{ errors.postalCode }}</small>
                </label>
              </div>

              <div class="form-actions">
                <Button type="submit" label="بازبینی سفارش" icon="pi pi-arrow-left" />
                <Button type="button" label="بازگشت به سبد" severity="secondary" text @click="router.push('/cart')" />
              </div>
            </form>
          </section>

          <section v-else class="checkout-section" aria-labelledby="review-title">
            <header class="section-heading">
              <div><h2 id="review-title">بازبینی اطلاعات</h2><p>پیش از فعال‌شدن خرید، اطلاعات ثبت‌شده را بررسی کنید.</p></div>
              <Button label="ویرایش نشانی" icon="pi pi-pencil" severity="secondary" text size="small" @click="currentStep = 0" />
            </header>

            <dl class="shipping-review">
              <div><dt>گیرنده</dt><dd>{{ shipping.fullName }}</dd></div>
              <div><dt>شماره تماس</dt><dd>{{ shipping.phone }}</dd></div>
              <div><dt>استان و شهر</dt><dd>{{ shipping.province }}، {{ shipping.city }}</dd></div>
              <div><dt>نشانی</dt><dd>{{ shipping.address }}</dd></div>
              <div><dt>کد پستی</dt><dd>{{ shipping.postalCode }}</dd></div>
            </dl>

            <div class="review-actions">
              <Button label="بازگشت و ویرایش" icon="pi pi-arrow-right" severity="secondary" outlined @click="currentStep = 0" />
              <Button label="ثبت سفارش غیرفعال است" icon="pi pi-lock" disabled v-tooltip="'پس از راه‌اندازی API سفارش و اتصال درگاه فعال می‌شود.'" />
            </div>
            <p class="disabled-explanation">هیچ سفارش، رزرو موجودی یا تراکنش مالی در این مرحله ایجاد نمی‌شود.</p>
          </section>
        </section>

        <aside class="checkout-summary" aria-labelledby="summary-title">
          <h2 id="summary-title">خلاصه اقلام</h2>
          <div v-for="item in cartItems" :key="item.id" class="summary-item">
            <div class="summary-item-copy">
              <strong>{{ item.name }}</strong>
              <span>{{ item.quantity.toLocaleString('fa-IR') }} عدد</span>
            </div>
            <b>{{ formatPrice(Number(item.price) * item.quantity, item.currency) }}</b>
          </div>
          <div class="summary-total">
            <span>جمع قیمت ذخیره‌شده</span>
            <strong>{{ formatPrice(subtotal) }}</strong>
          </div>
          <p class="summary-disclaimer">این مبلغ صرفاً جمع داده‌های محلی سبد است. قیمت معتبر، موجودی، تخفیف، مالیات و ارسال باید در checkout سمت سرور محاسبه شوند.</p>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { useCartStore } from '../../stores/cart'

const router = useRouter()
const cartStore = useCartStore()
const cartItems = computed(() => cartStore.items)
const subtotal = computed(() => cartStore.subtotal)
const currentStep = ref(0)
const errors = ref({})
const shipping = reactive({
  fullName: '',
  phone: '',
  province: '',
  city: '',
  address: '',
  postalCode: '',
})

const home = { icon: 'pi pi-home', to: '/' }
const breadcrumbs = [{ label: 'سبد خرید', to: '/cart' }, { label: 'تکمیل اطلاعات', to: '/checkout' }]

watch(cartItems, (items) => {
  if (!items.length) router.replace('/cart')
}, { immediate: true })

function formatPrice(value, currency = 'IRR') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  try {
    return new Intl.NumberFormat('fa-IR', { style: 'currency', currency }).format(amount)
  } catch {
    return new Intl.NumberFormat('fa-IR').format(amount)
  }
}

function normalizeDigits(value) {
  return String(value)
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
}

function continueToReview() {
  const nextErrors = {}
  const phone = normalizeDigits(shipping.phone).replace(/[\\s-]/g, '')
  const postalCode = normalizeDigits(shipping.postalCode).trim()
  if (!shipping.fullName.trim()) nextErrors.fullName = 'نام گیرنده را وارد کنید.'
  if (!/^0?\d{10}$/.test(phone)) nextErrors.phone = 'شماره تماس معتبر وارد کنید.'
  if (!shipping.province.trim()) nextErrors.province = 'استان را وارد کنید.'
  if (!shipping.city.trim()) nextErrors.city = 'شهر را وارد کنید.'
  if (!shipping.address.trim()) nextErrors.address = 'نشانی کامل را وارد کنید.'
  if (!/^\d{10}$/.test(postalCode)) nextErrors.postalCode = 'کد پستی باید ۱۰ رقم باشد.'
  errors.value = nextErrors
  if (!Object.keys(nextErrors).length) currentStep.value = 1
}
</script>

<style scoped>
.checkout-page { color: var(--ds-color-text); }
.checkout-shell { padding-block: var(--ds-space-6) var(--ds-space-12); }
.checkout-notice { display: flex; gap: .85rem; margin-bottom: 1.25rem; padding: 1rem 1.1rem; border: 1px solid color-mix(in srgb, var(--ds-color-primary) 30%, var(--ds-color-border)); border-radius: var(--ds-radius-lg); background: var(--ds-color-primary-soft); }
.checkout-notice > i { margin-top: .15rem; color: var(--ds-color-primary); font-size: 1.15rem; }
.checkout-notice strong { font-size: .9rem; }
.checkout-notice p { margin: .3rem 0 0; color: var(--ds-color-text-muted); font-size: .8rem; line-height: 1.8; }
.checkout-layout { display: grid; grid-template-columns: minmax(0, 1fr) 20rem; gap: 1.25rem; align-items: start; }
.checkout-main, .checkout-summary { min-width: 0; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); }
.checkout-main { padding: clamp(1rem, 2vw, 1.5rem); }
.checkout-summary { position: sticky; top: 1rem; padding: 1.25rem; }
.checkout-summary h2 { margin: 0 0 1rem; padding-bottom: .9rem; border-bottom: 1px solid var(--ds-color-border); font-size: 1rem; }
.checkout-steps { display: flex; gap: 1.5rem; margin: 0 0 1.5rem; padding: 0 0 1rem; border-bottom: 1px solid var(--ds-color-border); list-style: none; }
.checkout-steps li { display: inline-flex; align-items: center; gap: .55rem; color: var(--ds-color-text-muted); font-size: .82rem; }
.checkout-steps li > span { display: grid; place-items: center; width: 1.8rem; height: 1.8rem; border: 1px solid var(--ds-color-border); border-radius: 50%; font-size: .78rem; }
.checkout-steps li.is-active { color: var(--ds-color-primary); font-weight: 700; }
.checkout-steps li.is-active > span, .checkout-steps li.is-complete > span { border-color: var(--ds-color-primary); background: var(--ds-color-primary-soft); color: var(--ds-color-primary); }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
.section-heading h2 { margin: 0; font-size: 1rem; font-weight: 700; }
.section-heading p { margin: .3rem 0 0; color: var(--ds-color-text-muted); font-size: .8rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.form-field { display: flex; flex-direction: column; gap: .4rem; min-width: 0; color: var(--ds-color-text); font-size: .82rem; }
.form-field > span b { color: var(--ds-color-danger, #EF4444); }
.form-field :deep(.p-inputtext), .form-field :deep(.p-textarea) { width: 100%; }
.field-span { grid-column: 1 / -1; }
.field-error { color: var(--ds-color-danger, #EF4444); font-size: .74rem; }
.form-actions, .review-actions { display: flex; align-items: center; gap: .65rem; flex-wrap: wrap; margin-top: 1.35rem; }
.shipping-review { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .9rem 1.25rem; margin: 0; }
.shipping-review div { min-width: 0; }
.shipping-review dt { margin-bottom: .25rem; color: var(--ds-color-text-muted); font-size: .75rem; }
.shipping-review dd { margin: 0; overflow-wrap: anywhere; font-size: .86rem; font-weight: 600; line-height: 1.7; }
.shipping-review div:nth-child(4) { grid-column: 1 / -1; }
.disabled-explanation { margin: .8rem 0 0; color: var(--ds-color-text-muted); font-size: .76rem; }
.summary-item { display: flex; align-items: flex-start; justify-content: space-between; gap: .8rem; padding: .85rem 0; border-bottom: 1px solid var(--ds-color-border); }
.summary-item-copy { display: flex; flex-direction: column; gap: .25rem; min-width: 0; }
.summary-item-copy strong { font-size: .82rem; line-height: 1.6; }
.summary-item-copy span { color: var(--ds-color-text-muted); font-size: .74rem; }
.summary-item > b { flex-shrink: 0; font-size: .8rem; }
.summary-total { display: flex; flex-direction: column; gap: .4rem; padding-top: 1rem; }
.summary-total span { color: var(--ds-color-text-muted); font-size: .78rem; }
.summary-total strong { color: var(--ds-color-primary); font-size: 1.05rem; }
.summary-disclaimer { margin: .8rem 0 0; color: var(--ds-color-text-muted); font-size: .74rem; line-height: 1.8; }
.checkout-empty { padding: 2.5rem 1rem; border: 1px dashed var(--ds-color-border); border-radius: var(--ds-radius-xl); text-align: center; }
.checkout-empty h2 { margin: 0; font-size: 1.1rem; }
.checkout-empty p { color: var(--ds-color-text-muted); }
@media (max-width: 900px) { .checkout-layout { grid-template-columns: minmax(0, 1fr); } .checkout-summary { position: static; } }
@media (max-width: 560px) { .form-grid, .shipping-review { grid-template-columns: minmax(0, 1fr); } .field-span, .shipping-review div:nth-child(4) { grid-column: auto; } .checkout-steps { gap: .8rem; } }
</style>
