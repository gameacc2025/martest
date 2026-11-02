<template>
  <div class="shopping-cart-page">
    <div class="ds-container ds-page">
      <header class="commerce-page-heading">
        <div class="commerce-heading-copy"><span class="ds-eyebrow"><i class="pi pi-shopping-cart"></i> خرید محصولات</span><h1 class="ds-page-heading__title">سبد خرید</h1><p>اقلام انتخاب‌شده و تعداد موردنیاز را پیش از ادامه بررسی کنید.</p></div>
        <Breadcrumb :home="home" :model="items" />
      </header>

      <div v-if="cartItems.length === 0" class="cart-empty-state">
        <i class="pi pi-shopping-cart text-6xl text-gray-300 mb-4"></i>
        <h2 class="text-xl font-semibold mb-2">سبد خرید شما خالی است</h2>
        <p class="text-gray-500 mb-6">هیچ محصولی به سبد خرید خود اضافه نکرده اید</p>
        <Button
          label="بازگشت به صفحه اصلی"
          icon="pi pi-home"
          class="p-button-primary"
          @click="goToHome"
        />
        <Button
          label="مشاهده محصولات"
          icon="pi pi-shopping-bag"
          class="p-button-outlined ml-4"
          @click="goToProducts"
        />
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Cart Items -->
        <div class="lg:col-span-2">
          <Card>
            <template #title>محصولات سبد خرید ({{ cartItems.length }})</template>
            <template #content>
              <div class="space-y-4">
                <div
                  v-for="(item, index) in cartItems"
                  :key="item.id"
                  class="cart-item flex gap-4 p-4 border-b border-gray-100"
                >
                  <div class="flex-shrink-0">
                    <img
                      :src="item.image || '/placeholder-product.jpg'"
                      :alt="item.name"
                      class="w-20 h-20 object-cover rounded"
                    />
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between items-start">
                      <div>
                        <h3 class="font-semibold">{{ item.name }}</h3>
                        <p class="text-sm text-gray-500" v-if="item.variant">
                          {{ item.variant }}
                        </p>
                      </div>
                      <Button
                        icon="pi pi-trash"
                        class="p-button-rounded p-button-text p-button-danger"
                        @click="removeFromCart(index)"
                      />
                    </div>
                    <div class="flex justify-between items-center mt-2">
                      <div class="text-primary font-bold">
                        {{ formatPrice(item.price * item.quantity) }}
                      </div>
                      <div class="flex items-center gap-2">
                        <Button
                          icon="pi pi-minus"
                          class="p-button-rounded p-button-text"
                          @click="decreaseQuantity(index)"
                          :disabled="item.quantity <= 1"
                        />
                        <span class="px-3 py-1 bg-gray-100 rounded">{{ item.quantity }}</span>
                        <Button
                          icon="pi pi-plus"
                          class="p-button-rounded p-button-text"
                          @click="increaseQuantity(index)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <div class="mt-6 text-right">
            <Button
              label="ادامه خرید"
              icon="pi pi-arrow-left"
              class="p-button-outlined"
              @click="continueShopping"
            />
          </div>
        </div>

        <!-- Cart Summary -->
        <div class="lg:col-span-1">
          <Card>
            <template #title>مجموع سبد خرید</template>
            <template #content>
              <div class="space-y-4">
                <div class="flex justify-between">
                  <span>مجموع قیمت محصولات:</span>
                  <span class="font-semibold">{{ formatPrice(subtotal) }}</span>
                </div>

                <div class="flex justify-between" v-if="discount > 0">
                  <span>تخفیف:</span>
                  <span class="font-semibold text-green-600">-{{ formatPrice(discount) }}</span>
                </div>

                <div class="flex justify-between">
                  <span>هزینه ارسال:</span>
                  <span class="font-semibold">{{ shippingCost > 0 ? formatPrice(shippingCost) : 'رایگان' }}</span>
                </div>

                <div class="flex justify-between border-t pt-4">
                  <span class="font-bold">مبلغ قابل پرداخت:</span>
                  <span class="font-bold text-primary">{{ formatPrice(total) }}</span>
                </div>
              </div>
            </template>
            <template #footer>
              <div class="flex flex-col gap-2">
                <Button
                  label="تسویه حساب"
                  icon="pi pi-check"
                  class="p-button-primary w-full"
                  @click="proceedToCheckout"
                  :disabled="cartItems.length === 0"
                />
                <Button
                  label="بررسی سبد خرید"
                  icon="pi pi-shopping-cart"
                  class="p-button-outlined w-full"
                  @click="reviewCart"
                />
              </div>
            </template>
          </Card>

          <!-- Discount Code -->
          <Card class="mt-4">
            <template #title>کد تخفیف</template>
            <template #content>
              <div class="flex gap-2">
                <InputText
                  v-model="discountCode"
                  placeholder="کد تخفیف را وارد کنید"
                  class="flex-1"
                />
                <Button
                  label="اعمال"
                  icon="pi pi-ticket"
                  class="p-button-success"
                  @click="applyDiscountCode"
                  :disabled="!discountCode"
                />
              </div>
              <div v-if="discountApplied" class="mt-2 text-green-600 text-sm">
                کد تخفیف با موفقیت اعمال شد!
              </div>
              <div v-if="discountError" class="mt-2 text-red-500 text-sm">
                {{ discountError }}
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Related Products -->
      <div class="mt-12">
        <h2 class="text-xl font-bold mb-6">محصولات پیشنهادی</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProductCard
            v-for="product in recommendedProducts"
            :key="product.id"
            :product="product"
            @add-to-cart="addToCart"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { useProductsStore } from '../../stores/products'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import ProductCard from '@telecom/shared-ui/components/products/ProductCard.vue'

const router = useRouter()
const cartStore = useCartStore()
const productsStore = useProductsStore()

const cartItems = computed(() => cartStore.items)
const recommendedProducts = ref([])
const discountCode = ref('')
const discountApplied = ref(false)
const discountError = ref('')
const shippingCost = ref(0)

const home = ref({
  icon: 'pi pi-home',
  to: '/'
})

const items = ref([
  { label: 'سبد خرید', to: '/cart' }
])

onMounted(async () => {
  await loadRecommendedProducts()
  await calculateShippingCost()
})

const loadRecommendedProducts = async () => {
  try {
    const data = await productsStore.getRecommendedProducts()
    recommendedProducts.value = data.slice(0, 4)
  } catch (error) {
    console.error('Error loading recommended products:', error)
  }
}

const calculateShippingCost = async () => {
  try {
    const cost = await productsStore.calculateShippingCost(cartItems.value)
    shippingCost.value = cost
  } catch (error) {
    console.error('Error calculating shipping cost:', error)
    shippingCost.value = 0
  }
}

const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const discount = computed(() => {
  return discountApplied.value ? 50000 : 0
})

const total = computed(() => {
  return subtotal.value - discount.value + shippingCost.value
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR'
  }).format(price)
}

const removeFromCart = (index) => {
  cartStore.removeFromCart(index)
}

const increaseQuantity = (index) => {
  cartStore.increaseQuantity(index)
}

const decreaseQuantity = (index) => {
  cartStore.decreaseQuantity(index)
}

const addToCart = (product) => {
  cartStore.addToCart({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    quantity: 1
  })
}

const continueShopping = () => {
  router.push('/products')
}

const proceedToCheckout = () => {
  router.push('/checkout')
}

const reviewCart = () => {
  // Scroll to top of cart
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToHome = () => {
  router.push('/')
}

const goToProducts = () => {
  router.push('/products')
}

const applyDiscountCode = async () => {
  try {
    discountError.value = ''
    // Simulate API call to validate discount code
    await new Promise(resolve => setTimeout(resolve, 500))
    discountApplied.value = true
    discountError.value = ''
  } catch (error) {
    discountError.value = 'کد تخفیف معتبر نیست'
    discountApplied.value = false
  }
}
</script>

<style scoped>
.shopping-cart-page {
  direction: rtl;
}

.cart-item {
  transition: all 0.2s ease;
}

.cart-item:hover {
  background-color: var(--ds-color-surface-hover);
}

.shopping-cart-page { color: var(--ds-color-text); }
.shopping-cart-page .ds-page-heading {
  align-items: flex-end;
  padding-bottom: var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border);
}
.shopping-cart-page .ds-page-heading__title {
  color: var(--ds-color-text);
  font-size: clamp(1.35rem, 2vw, var(--ds-font-size-2xl));
  font-weight: var(--ds-font-weight-bold);
}
.shopping-cart-page :deep(.p-card) {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.shopping-cart-page :deep(.p-card .p-card-title) {
  color: var(--ds-color-text);
  font-weight: var(--ds-font-weight-bold);
}
.shopping-cart-page :deep(.p-button) { border-radius: var(--ds-radius-md); }
.commerce-page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: var(--ds-space-6);
  padding: clamp(1rem, 2vw, 1.5rem);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  background: linear-gradient(110deg, color-mix(in srgb, var(--ds-color-primary) 7%, var(--ds-color-surface)), var(--ds-color-surface) 72%);
  box-shadow: var(--ds-shadow-xs);
}
.commerce-heading-copy { min-width: 0; }
.commerce-heading-copy .ds-eyebrow { display: inline-flex; align-items: center; gap: .45rem; margin-bottom: .25rem; font-weight: var(--ds-font-weight-bold); }
.commerce-heading-copy h1 { margin: 0; color: var(--ds-color-text); font-size: clamp(1.35rem, 2vw, var(--ds-font-size-2xl)); font-weight: var(--ds-font-weight-bold); }
.commerce-heading-copy p { margin: .35rem 0 0; color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); line-height: 1.7; }
.commerce-page-heading :deep(.p-breadcrumb) { padding: 0; background: transparent; border: 0; }
.shopping-cart-page { color: var(--ds-color-text); }
.shopping-cart-page :deep(.p-card) { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); box-shadow: var(--ds-shadow-xs); }
.shopping-cart-page :deep(.p-card-title) { color: var(--ds-color-text); font-weight: var(--ds-font-weight-bold); }
.shopping-cart-page :deep(.p-button) { border-radius: var(--ds-radius-md); }
.cart-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 22rem; gap: .8rem; padding: 2rem; border: 1px dashed var(--ds-color-border); border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); text-align: center; }
.cart-empty-state > i { display: grid; place-items: center; width: 4.5rem; height: 4.5rem; border-radius: 1.25rem; background: var(--ds-color-primary-soft); color: var(--ds-color-primary); font-size: 1.8rem; }
.cart-empty-state h2 { margin: 0; color: var(--ds-color-text); }
.cart-empty-state p { color: var(--ds-color-text-muted); }
.cart-item { border-bottom: 1px solid var(--ds-color-border); }

</style>