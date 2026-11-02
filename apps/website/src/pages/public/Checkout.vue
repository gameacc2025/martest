<template>
  <div class="checkout-page">
    <div class="ds-container ds-page">
      <WorkspacePageHeading
        eyebrow="تکمیل سفارش"
        title="تسویه حساب"
        description="اطلاعات سفارش و روش پرداخت را در مراحل بعدی بررسی کنید."
        icon="pi pi-wallet"
        heading-id="checkout-title"
      >
        <template #actions><Breadcrumb :home="home" :model="items" /></template>
      </WorkspacePageHeading>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Checkout Steps -->
        <div class="lg:col-span-2">
          <Card>
            <template #title>فرآیند تسویه حساب</template>
            <template #content>
              <Steps :model="steps" :readonly="false" class="mb-8" />

              <div v-if="currentStep === 0">
                <!-- Step 1: Shipping Information -->
                <h2 class="text-lg font-semibold mb-4">اطلاعات ارسال</h2>
                <form @submit.prevent="nextStep" class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-2">نام و نام خانوادگی</label>
                      <InputText
                        v-model="shippingInfo.fullName"
                        placeholder="نام و نام خانوادگی خود را وارد کنید"
                        class="w-full"
                        :class="{ 'p-invalid': errors.fullName }"
                      />
                      <small v-if="errors.fullName" class="p-error block">{{ errors.fullName }}</small>
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2">شماره تلفن</label>
                      <InputText
                        v-model="shippingInfo.phone"
                        placeholder="شماره تلفن خود را وارد کنید"
                        class="w-full"
                        :class="{ 'p-invalid': errors.phone }"
                      />
                      <small v-if="errors.phone" class="p-error block">{{ errors.phone }}</small>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-2">استان</label>
                      <Select
                        v-model="shippingInfo.province"
                        :options="provinces"
                        optionLabel="name"
                        placeholder="استان را انتخاب کنید"
                        class="w-full"
                        :class="{ 'p-invalid': errors.province }"
                      />
                      <small v-if="errors.province" class="p-error block">{{ errors.province }}</small>
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2">شهر</label>
                      <Select
                        v-model="shippingInfo.city"
                        :options="cities"
                        optionLabel="name"
                        placeholder="شهر را انتخاب کنید"
                        class="w-full"
                        :class="{ 'p-invalid': errors.city }"
                      />
                      <small v-if="errors.city" class="p-error block">{{ errors.city }}</small>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-2">آدرس کامل</label>
                    <Textarea
                      v-model="shippingInfo.address"
                      placeholder="آدرس کامل پستی خود را وارد کنید"
                      rows="3"
                      class="w-full"
                      :class="{ 'p-invalid': errors.address }"
                    />
                    <small v-if="errors.address" class="p-error block">{{ errors.address }}</small>
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-2">کد پستی</label>
                    <InputText
                      v-model="shippingInfo.postalCode"
                      placeholder="کد پستی خود را وارد کنید"
                      class="w-full"
                      :class="{ 'p-invalid': errors.postalCode }"
                    />
                    <small v-if="errors.postalCode" class="p-error block">{{ errors.postalCode }}</small>
                  </div>

                  <div class="flex gap-2">
                    <Button
                      type="submit"
                      label="ادامه"
                      icon="pi pi-arrow-left"
                      class="p-button-primary"
                    />
                    <Button
                      label="بازگشت به سبد خرید"
                      icon="pi pi-shopping-cart"
                      class="p-button-outlined"
                      @click="goToCart"
                    />
                  </div>
                </form>
              </div>

              <div v-if="currentStep === 1">
                <!-- Step 2: Payment Method -->
                <h2 class="text-lg font-semibold mb-4">روش پرداخت</h2>
                <form @submit.prevent="nextStep" class="space-y-4">
                  <div class="space-y-4">
                    <div
                      v-for="method in paymentMethods"
                      :key="method.value"
                      class="payment-method p-4 border rounded-lg cursor-pointer"
                      :class="{ 'border-primary bg-primary-50': selectedPaymentMethod === method.value }"
                      @click="selectPaymentMethod(method.value)"
                    >
                      <div class="flex items-center gap-3">
                        <i :class="method.icon" class="text-2xl"></i>
                        <div>
                          <h3 class="font-semibold">{{ method.label }}</h3>
                          <p class="text-sm text-gray-500">{{ method.description }}</p>
                        </div>
                        <RadioButton
                          v-model="selectedPaymentMethod"
                          :value="method.value"
                          class="mr-auto"
                        />
                      </div>
                    </div>
                  </div>

                  <div v-if="selectedPaymentMethod === 'online'">
                    <h3 class="font-semibold mb-2">اطلاعات کارت بانکی</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium mb-2">شماره کارت</label>
                        <InputText
                          v-model="paymentInfo.cardNumber"
                          placeholder="شماره کارت 16 رقمی"
                          class="w-full"
                          :class="{ 'p-invalid': errors.cardNumber }"
                        />
                        <small v-if="errors.cardNumber" class="p-error block">{{ errors.cardNumber }}</small>
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-2">نام صاحب کارت</label>
                        <InputText
                          v-model="paymentInfo.cardHolder"
                          placeholder="نام صاحب کارت"
                          class="w-full"
                          :class="{ 'p-invalid': errors.cardHolder }"
                        />
                        <small v-if="errors.cardHolder" class="p-error block">{{ errors.cardHolder }}</small>
                      </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label class="block text-sm font-medium mb-2">تاریخ انقضا</label>
                        <InputText
                          v-model="paymentInfo.expiryDate"
                          placeholder="MM/YY"
                          class="w-full"
                          :class="{ 'p-invalid': errors.expiryDate }"
                        />
                        <small v-if="errors.expiryDate" class="p-error block">{{ errors.expiryDate }}</small>
                      </div>
                      <div>
                        <label class="block text-sm font-medium mb-2">CVV2</label>
                        <InputText
                          v-model="paymentInfo.cvv"
                          placeholder="CVV2"
                          class="w-full"
                          :class="{ 'p-invalid': errors.cvv }"
                        />
                        <small v-if="errors.cvv" class="p-error block">{{ errors.cvv }}</small>
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-2">
                    <Button
                      type="submit"
                      label="ادامه"
                      icon="pi pi-arrow-left"
                      class="p-button-primary"
                    />
                    <Button
                      label="بازگشت"
                      icon="pi pi-arrow-right"
                      class="p-button-outlined"
                      @click="prevStep"
                    />
                  </div>
                </form>
              </div>

              <div v-if="currentStep === 2">
                <!-- Step 3: Order Review -->
                <h2 class="text-lg font-semibold mb-4">بررسی سفارش</h2>
                <div class="space-y-6">
                  <!-- Shipping Info Review -->
                  <Card>
                    <template #title>اطلاعات ارسال</template>
                    <template #content>
                      <div class="space-y-2">
                        <p><strong>نام:</strong> {{ shippingInfo.fullName }}</p>
                        <p><strong>تلفن:</strong> {{ shippingInfo.phone }}</p>
                        <p><strong>آدرس:</strong> {{ shippingInfo.address }}, {{ shippingInfo.city?.name }}, {{ shippingInfo.province?.name }}</p>
                        <p><strong>کد پستی:</strong> {{ shippingInfo.postalCode }}</p>
                      </div>
                    </template>
                  </Card>

                  <!-- Payment Info Review -->
                  <Card>
                    <template #title>روش پرداخت</template>
                    <template #content>
                      <p>
                        <strong>روش:</strong>
                        {{ paymentMethods.find(m => m.value === selectedPaymentMethod)?.label }}
                      </p>
                    </template>
                  </Card>

                  <!-- Order Items Review -->
                  <Card>
                    <template #title>اقلام سفارش ({{ cartItems.length }})</template>
                    <template #content>
                      <div class="space-y-4">
                        <div
                          v-for="item in cartItems"
                          :key="item.id"
                          class="flex justify-between items-center p-2 border-b"
                        >
                          <div class="flex items-center gap-3">
                            <img
                              :src="item.image || '/placeholder-product.jpg'"
                              :alt="item.name"
                              class="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <p class="font-medium">{{ item.name }}</p>
                              <p class="text-sm text-gray-500">تعداد: {{ item.quantity }}</p>
                            </div>
                          </div>
                          <span class="font-semibold">{{ formatPrice(item.price * item.quantity) }}</span>
                        </div>
                      </div>
                    </template>
                  </Card>

                  <!-- Order Summary -->
                  <Card>
                    <template #title>مجموع سفارش</template>
                    <template #content>
                      <div class="space-y-2">
                        <div class="flex justify-between">
                          <span>مجموع محصولات:</span>
                          <span>{{ formatPrice(subtotal) }}</span>
                        </div>
                        <div class="flex justify-between" v-if="discount > 0">
                          <span>تخفیف:</span>
                          <span class="text-green-600">-{{ formatPrice(discount) }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span>هزینه ارسال:</span>
                          <span>{{ shippingCost > 0 ? formatPrice(shippingCost) : 'رایگان' }}</span>
                        </div>
                        <div class="flex justify-between border-t pt-2 font-bold">
                          <span>مبلغ قابل پرداخت:</span>
                          <span class="text-primary">{{ formatPrice(total) }}</span>
                        </div>
                      </div>
                    </template>
                  </Card>

                  <div class="flex gap-2">
                    <Button
                      label="تایید و پرداخت"
                      icon="pi pi-check"
                      class="p-button-success flex-1"
                      @click="confirmOrder"
                    />
                    <Button
                      label="بازگشت"
                      icon="pi pi-arrow-right"
                      class="p-button-outlined"
                      @click="prevStep"
                    />
                  </div>
                </div>
              </div>

              <div v-if="currentStep === 3">
                <!-- Step 4: Order Confirmation -->
                <div class="text-center py-8">
                  <i class="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
                  <h2 class="text-2xl font-bold mb-2">سفارش شما با موفقیت ثبت شد!</h2>
                  <p class="text-gray-500 mb-6">شماره سفارش: {{ orderNumber }}</p>

                  <Card class="mb-6">
                    <template #title>جزئیات سفارش</template>
                    <template #content>
                      <div class="space-y-2">
                        <p><strong>شماره سفارش:</strong> {{ orderNumber }}</p>
                        <p><strong>تاریخ سفارش:</strong> {{ orderDate }}</p>
                        <p><strong>مبلغ کل:</strong> {{ formatPrice(total) }}</p>
                        <p><strong>روش پرداخت:</strong> {{ paymentMethods.find(m => m.value === selectedPaymentMethod)?.label }}</p>
                      </div>
                    </template>
                  </Card>

                  <div class="flex gap-2 justify-center">
                    <Button
                      label="مشاهده سفارش"
                      icon="pi pi-eye"
                      class="p-button-primary"
                      @click="viewOrder"
                    />
                    <Button
                      label="بازگشت به صفحه اصلی"
                      icon="pi pi-home"
                      class="p-button-outlined"
                      @click="goToHome"
                    />
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Order Summary Sidebar -->
        <div class="lg:col-span-1">
          <Card>
            <template #title>مجموع سبد خرید</template>
            <template #content>
              <div class="space-y-4">
                <div class="flex justify-between">
                  <span>مجموع محصولات:</span>
                  <span>{{ formatPrice(subtotal) }}</span>
                </div>
                <div class="flex justify-between" v-if="discount > 0">
                  <span>تخفیف:</span>
                  <span class="text-green-600">-{{ formatPrice(discount) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>هزینه ارسال:</span>
                  <span>{{ shippingCost > 0 ? formatPrice(shippingCost) : 'رایگان' }}</span>
                </div>
                <div class="flex justify-between border-t pt-2 font-bold">
                  <span>مبلغ قابل پرداخت:</span>
                  <span class="text-primary">{{ formatPrice(total) }}</span>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import RadioButton from 'primevue/radiobutton'
import Steps from 'primevue/steps'

const router = useRouter()
const cartStore = useCartStore()

const cartItems = computed(() => cartStore.items)

const currentStep = ref(0)
const orderNumber = ref('')
const orderDate = ref('')

const home = ref({
  icon: 'pi pi-home',
  to: '/'
})

const items = ref([
  { label: 'تسویه حساب', to: '/checkout' }
])

const steps = ref([
  { label: 'اطلاعات ارسال' },
  { label: 'روش پرداخت' },
  { label: 'بررسی سفارش' },
  { label: 'تایید سفارش' }
])

const shippingInfo = ref({
  fullName: '',
  phone: '',
  province: null,
  city: null,
  address: '',
  postalCode: ''
})

const paymentInfo = ref({
  cardNumber: '',
  cardHolder: '',
  expiryDate: '',
  cvv: ''
})

const selectedPaymentMethod = ref('online')
const discountCode = ref('')
const discountApplied = ref(false)
const shippingCost = ref(0)

const errors = ref({})

const provinces = ref([
  { id: 1, name: 'تهران' },
  { id: 2, name: 'اصفهان' },
  { id: 3, name: 'شیراز' },
  { id: 4, name: 'مشهد' },
  { id: 5, name: 'تبریز' }
])

const cities = ref([
  { id: 1, name: 'تهران', provinceId: 1 },
  { id: 2, name: 'کرج', provinceId: 1 },
  { id: 3, name: 'اصفهان', provinceId: 2 },
  { id: 4, name: 'نجف آباد', provinceId: 2 },
  { id: 5, name: 'شیراز', provinceId: 3 }
])

const paymentMethods = ref([
  {
    value: 'online',
    label: 'پرداخت آنلاین',
    description: 'پرداخت از طریق درگاه بانکی',
    icon: 'pi pi-credit-card'
  },
  {
    value: 'cash',
    label: 'پرداخت در محل',
    description: 'پرداخت نقدی هنگام تحویل',
    icon: 'pi pi-money-bill'
  },
  {
    value: 'wallet',
    label: 'کیف پول',
    description: 'پرداخت از طریق کیف پول الکترونیکی',
    icon: 'pi pi-wallet'
  }
])

const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const discount = computed(() => {
  return discountApplied.value ? 50000 : 0
})

const total = computed(() => {
  return subtotal.value - discount.value + shippingCost.value
})

onMounted(() => {
  // Load saved shipping info if available
  const savedShipping = localStorage.getItem('shippingInfo')
  if (savedShipping) {
    shippingInfo.value = JSON.parse(savedShipping)
  }
})

const nextStep = () => {
  if (validateStep()) {
    currentStep.value++
  }
}

const prevStep = () => {
  currentStep.value--
}

const validateStep = () => {
  errors.value = {}

  if (currentStep.value === 0) {
    if (!shippingInfo.value.fullName) errors.value.fullName = 'وارد کردن نام الزامی است'
    if (!shippingInfo.value.phone) errors.value.phone = 'وارد کردن تلفن الزامی است'
    if (!shippingInfo.value.province) errors.value.province = 'انتخاب استان الزامی است'
    if (!shippingInfo.value.city) errors.value.city = 'انتخاب شهر الزامی است'
    if (!shippingInfo.value.address) errors.value.address = 'وارد کردن آدرس الزامی است'
    if (!shippingInfo.value.postalCode) errors.value.postalCode = 'وارد کردن کد پستی الزامی است'

    return Object.keys(errors.value).length === 0
  }

  if (currentStep.value === 1 && selectedPaymentMethod.value === 'online') {
    if (!paymentInfo.value.cardNumber) errors.value.cardNumber = 'وارد کردن شماره کارت الزامی است'
    if (!paymentInfo.value.cardHolder) errors.value.cardHolder = 'وارد کردن نام صاحب کارت الزامی است'
    if (!paymentInfo.value.expiryDate) errors.value.expiryDate = 'وارد کردن تاریخ انقضا الزامی است'
    if (!paymentInfo.value.cvv) errors.value.cvv = 'وارد کردن CVV2 الزامی است'

    return Object.keys(errors.value).length === 0
  }

  return true
}

const selectPaymentMethod = (method) => {
  selectedPaymentMethod.value = method
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR'
  }).format(price)
}

const confirmOrder = async () => {
  try {
    const orderData = {
      items: cartItems.value,
      shippingInfo: shippingInfo.value,
      paymentMethod: selectedPaymentMethod.value,
      paymentInfo: selectedPaymentMethod.value === 'online' ? paymentInfo.value : null,
      subtotal: subtotal.value,
      discount: discount.value,
      shippingCost: shippingCost.value,
      total: total.value
    }

    const result = { orderNumber: 'ORD-' + Date.now() }
    orderNumber.value = result.orderNumber
    orderDate.value = new Date().toLocaleDateString('fa-IR')
    currentStep.value = 3

    // Clear cart
    cartStore.clearCart()

    // Save order info
    localStorage.setItem('shippingInfo', JSON.stringify(shippingInfo.value))
  } catch (error) {
    console.error('Error creating order:', error)
  }
}

const viewOrder = () => {
  router.push({ name: 'orders' })
}

const goToHome = () => {
  router.push('/')
}

const goToCart = () => {
  router.push('/cart')
}
</script>

<style scoped>
.checkout-page {
  direction: rtl;
}

.payment-method {
  transition: all 0.2s ease;
}

.payment-method:hover {
  border-color: var(--ds-color-primary);
  background-color: var(--ds-color-surface-hover);
}

:deep(.p-steps .p-steps-item) {
  direction: rtl;
}

.checkout-page { color: var(--ds-color-text); }
.checkout-page .ds-page-heading {
  align-items: flex-end;
  padding-bottom: var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border);
}
.checkout-page .ds-page-heading__title {
  color: var(--ds-color-text);
  font-size: clamp(1.35rem, 2vw, var(--ds-font-size-2xl));
  font-weight: var(--ds-font-weight-bold);
}
.checkout-page :deep(.p-card) {
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-xs);
}
.checkout-page :deep(.p-card .p-card-title) {
  color: var(--ds-color-text);
  font-weight: var(--ds-font-weight-bold);
}
.checkout-page :deep(.p-button) { border-radius: var(--ds-radius-md); }
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
.checkout-page { color: var(--ds-color-text); }
.checkout-page :deep(.p-card) { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); box-shadow: var(--ds-shadow-xs); }
.checkout-page :deep(.p-card-title) { color: var(--ds-color-text); font-weight: var(--ds-font-weight-bold); }
.checkout-page :deep(.p-button) { border-radius: var(--ds-radius-md); }
.checkout-page .payment-method { border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-lg); background: var(--ds-color-surface); padding: 1rem; }
.checkout-page .payment-method:hover { border-color: var(--ds-color-primary); background: var(--ds-color-surface-hover); }
.checkout-page :deep(.p-steps) { background: var(--ds-color-surface-alt); border-radius: var(--ds-radius-lg); padding: .75rem; }


</style>