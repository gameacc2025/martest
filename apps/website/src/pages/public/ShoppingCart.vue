<template>
  <main class="cart-page ds-page" dir="rtl">
    <div class="ds-container cart-shell">
      <WorkspacePageHeading
        title="سبد خرید"
        description="محصولات انتخاب‌شده را مرور و تعداد موردنیاز را اصلاح کنید."
        heading-id="shopping-cart-title"
      >
        <template #actions>
          <Breadcrumb :home="home" :model="breadcrumbs" />
        </template>
      </WorkspacePageHeading>

      <section v-if="cartItems.length === 0" class="cart-empty" aria-labelledby="cart-empty-title">
        <span class="cart-empty-mark" aria-hidden="true"><i class="pi pi-shopping-cart"></i></span>
        <h2 id="cart-empty-title">سبد خرید خالی است</h2>
        <p>هنوز محصولی به سبد خرید اضافه نشده است.</p>
        <Button label="مشاهده محصولات" icon="pi pi-arrow-left" @click="goToProducts" />
      </section>

      <div v-else class="cart-layout">
        <section class="cart-items-panel" aria-labelledby="cart-items-title">
          <header class="cart-panel-heading">
            <div>
              <h2 id="cart-items-title">اقلام انتخاب‌شده</h2>
              <p>{{ itemCount.toLocaleString('fa-IR') }} عدد محصول</p>
            </div>
            <Button label="خالی‌کردن سبد" icon="pi pi-trash" severity="secondary" text size="small" @click="clearCart" />
          </header>

          <article v-for="item in cartItems" :key="item.id" class="cart-item">
            <div class="cart-item-image">
              <img v-if="item.image" :src="item.image" :alt="item.name" width="104" height="104" loading="lazy" />
              <i v-else class="pi pi-image" aria-hidden="true"></i>
            </div>

            <div class="cart-item-main">
              <h3>{{ item.name }}</h3>
              <p class="cart-item-unit">{{ formatPrice(item.price, item.currency) }} <span>برای هر واحد</span></p>
              <div class="cart-item-controls">
                <div class="quantity-control" :aria-label="'تعداد ' + item.name">
                  <button type="button" :aria-label="'افزایش تعداد ' + item.name" @click="changeQuantity(item, 1)">
                    <i class="pi pi-plus" aria-hidden="true"></i>
                  </button>
                  <output :aria-label="'تعداد فعلی ' + item.name">{{ item.quantity.toLocaleString('fa-IR') }}</output>
                  <button type="button" :aria-label="'کاهش تعداد ' + item.name" :disabled="item.quantity <= 1" @click="changeQuantity(item, -1)">
                    <i class="pi pi-minus" aria-hidden="true"></i>
                  </button>
                </div>
                <button type="button" class="remove-item" :aria-label="'حذف ' + item.name + ' از سبد'" @click="removeItem(item.id)">
                  <i class="pi pi-trash" aria-hidden="true"></i>
                  <span>حذف</span>
                </button>
              </div>
            </div>

            <div class="cart-item-total">
              <span>جمع این ردیف</span>
              <strong>{{ formatPrice(Number(item.price) * item.quantity, item.currency) }}</strong>
            </div>
          </article>

          <div class="cart-continue">
            <Button label="ادامه خرید" icon="pi pi-arrow-left" severity="secondary" text @click="goToProducts" />
          </div>
        </section>

        <aside class="cart-summary" aria-labelledby="cart-summary-title">
          <h2 id="cart-summary-title">خلاصه سبد</h2>
          <div class="summary-row">
            <span>تعداد اقلام</span>
            <strong>{{ itemCount.toLocaleString('fa-IR') }}</strong>
          </div>
          <div class="summary-row summary-total">
            <span>جمع قیمت‌های ذخیره‌شده</span>
            <strong>{{ formatPrice(subtotal) }}</strong>
          </div>
          <p class="summary-disclaimer">
            قیمت‌های سبد فقط نسخه ذخیره‌شده در مرورگر هستند و هنوز از سمت سرور برای موجودی، قیمت نهایی و هزینه ارسال تأیید نشده‌اند.
          </p>
          <Button label="ادامه به اطلاعات ارسال" icon="pi pi-arrow-left" class="checkout-button" @click="goToCheckout" />
          <div class="checkout-unavailable">
            <i class="pi pi-info-circle" aria-hidden="true"></i>
            <span>ثبت سفارش و پرداخت آنلاین تا اتصال سرویس سفارش و درگاه بانکی فعال نیست.</span>
          </div>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { useCartStore } from '../../stores/cart'

const router = useRouter()
const cartStore = useCartStore()
const cartItems = computed(() => cartStore.items)
const itemCount = computed(() => cartStore.itemCount)
const subtotal = computed(() => cartStore.subtotal)

const home = { icon: 'pi pi-home', to: '/' }
const breadcrumbs = [{ label: 'سبد خرید', to: '/cart' }]

function formatPrice(value, currency = 'IRR') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  try {
    return new Intl.NumberFormat('fa-IR', { style: 'currency', currency }).format(amount)
  } catch {
    return new Intl.NumberFormat('fa-IR').format(amount)
  }
}

function changeQuantity(item, delta) {
  cartStore.updateQuantity(item.id, item.quantity + delta)
}

function removeItem(productId) {
  cartStore.removeItem(productId)
}

function clearCart() {
  cartStore.clearCart()
}

function goToProducts() {
  router.push({ name: 'products' })
}

function goToCheckout() {
  router.push({ name: 'customer-checkout' })
}
</script>

<style scoped>
.cart-page { color: var(--ds-color-text); }
.cart-shell { padding-block: var(--ds-space-6) var(--ds-space-12); }
.cart-layout { display: grid; grid-template-columns: minmax(0, 1fr) 21rem; gap: 1.25rem; align-items: start; }
.cart-items-panel, .cart-summary { min-width: 0; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); }
.cart-items-panel { padding: clamp(1rem, 2vw, 1.5rem); }
.cart-panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--ds-color-border); }
.cart-panel-heading h2, .cart-summary h2 { margin: 0; font-size: 1rem; font-weight: 700; }
.cart-panel-heading p { margin: .25rem 0 0; color: var(--ds-color-text-muted); font-size: .8rem; }
.cart-item { display: grid; grid-template-columns: 5.5rem minmax(0, 1fr) auto; gap: 1rem; align-items: center; padding: 1.15rem 0; border-bottom: 1px solid var(--ds-color-border); }
.cart-item-image { display: grid; place-items: center; width: 5.5rem; aspect-ratio: 1; overflow: hidden; border-radius: var(--ds-radius-lg); background: var(--ds-color-surface-muted, var(--ds-color-surface-hover)); color: var(--ds-color-text-muted); }
.cart-item-image img { width: 100%; height: 100%; object-fit: contain; }
.cart-item-image i { font-size: 1.4rem; }
.cart-item-main { min-width: 0; }
.cart-item-main h3 { margin: 0; font-size: .95rem; font-weight: 650; }
.cart-item-unit { margin: .35rem 0 .75rem; color: var(--ds-color-text); font-size: .85rem; font-weight: 600; }
.cart-item-unit span { margin-inline-start: .25rem; color: var(--ds-color-text-muted); font-size: .75rem; font-weight: 400; }
.cart-item-controls { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.quantity-control { display: inline-flex; align-items: center; gap: .25rem; padding: .2rem; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-md); }
.quantity-control button { display: grid; place-items: center; width: 1.9rem; height: 1.9rem; border: 0; border-radius: var(--ds-radius-sm); background: transparent; color: var(--ds-color-text); cursor: pointer; }
.quantity-control button:hover:not(:disabled) { background: var(--ds-color-primary-soft); color: var(--ds-color-primary); }
.quantity-control button:disabled { opacity: .35; cursor: not-allowed; }
.quantity-control output { min-width: 1.8rem; text-align: center; font-size: .85rem; font-variant-numeric: tabular-nums; }
.remove-item { display: inline-flex; align-items: center; gap: .35rem; border: 0; background: transparent; color: var(--ds-color-text-muted); font: inherit; font-size: .78rem; cursor: pointer; }
.remove-item:hover { color: var(--ds-color-danger, #b42318); }
.cart-item-total { display: flex; flex-direction: column; align-items: flex-end; gap: .3rem; white-space: nowrap; }
.cart-item-total span { color: var(--ds-color-text-muted); font-size: .72rem; }
.cart-item-total strong { font-size: .9rem; }
.cart-continue { padding-top: 1rem; }
.cart-summary { position: sticky; top: 1rem; padding: 1.25rem; }
.cart-summary h2 { padding-bottom: 1rem; border-bottom: 1px solid var(--ds-color-border); }
.summary-row { display: flex; justify-content: space-between; gap: .75rem; padding: .85rem 0; color: var(--ds-color-text-muted); font-size: .85rem; }
.summary-row strong { color: var(--ds-color-text); }
.summary-total { align-items: flex-start; border-top: 1px solid var(--ds-color-border); color: var(--ds-color-text); }
.summary-total strong { max-width: 60%; color: var(--ds-color-primary); font-size: 1.05rem; text-align: left; }
.summary-disclaimer { margin: .25rem 0 1rem; color: var(--ds-color-text-muted); font-size: .76rem; line-height: 1.8; }
.checkout-button { width: 100%; justify-content: center; }
.checkout-unavailable { display: flex; align-items: flex-start; gap: .5rem; margin-top: .9rem; padding-top: .85rem; border-top: 1px solid var(--ds-color-border); color: var(--ds-color-text-muted); font-size: .75rem; line-height: 1.75; }
.checkout-unavailable i { margin-top: .2rem; color: var(--ds-color-primary); }
.cart-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 22rem; padding: 2rem; border: 1px dashed var(--ds-color-border); border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); text-align: center; }
.cart-empty-mark { display: grid; place-items: center; width: 4rem; height: 4rem; margin-bottom: 1rem; border-radius: 1rem; background: var(--ds-color-primary-soft); color: var(--ds-color-primary); font-size: 1.6rem; }
.cart-empty h2 { margin: 0; font-size: 1.15rem; }
.cart-empty p { margin: .5rem 0 1.25rem; color: var(--ds-color-text-muted); font-size: .9rem; }
@media (max-width: 900px) { .cart-layout { grid-template-columns: minmax(0, 1fr); } .cart-summary { position: static; } }
@media (max-width: 560px) { .cart-item { grid-template-columns: 4rem minmax(0, 1fr); gap: .75rem; } .cart-item-image { width: 4rem; } .cart-item-total { grid-column: 2; align-items: flex-start; } .cart-panel-heading { align-items: flex-start; } }
</style>
