<template>
  <div class="order-details-page">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold">جزئیات سفارش</h1>
        <Breadcrumb :home="home" :model="items" class="mt-2" />
      </div>

      <div v-if="loading" class="text-center py-8">
        <ProgressSpinner />
        <p class="mt-4">در حال بارگذاری...</p>
      </div>

      <div v-else-if="error" class="text-center py-8">
        <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-4"></i>
        <h3 class="text-xl font-semibold mb-2">خطا در دریافت سفارش</h3>
        <p class="text-gray-500 mb-4">{{ error }}</p>
        <Button label="بازگشت به سفارشات" icon="pi pi-arrow-right" class="p-button-primary" @click="goToOrders" />
      </div>

      <div v-else-if="!order" class="text-center py-8">
        <i class="pi pi-shopping-bag text-4xl text-gray-400 mb-4"></i>
        <h3 class="text-xl font-semibold mb-2">سفارش یافت نشد</h3>
        <Button label="بازگشت به سفارشات" icon="pi pi-arrow-right" class="p-button-primary mt-4" @click="goToOrders" />
      </div>

      <template v-else>
        <!-- Order Header -->
        <Card class="mb-6">
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="md:col-span-2">
                <h2 class="text-xl font-bold mb-2">سفارش #{{ order.orderNumber }}</h2>
                <div class="flex flex-wrap gap-4 text-gray-600">
                  <span><strong>تاریخ:</strong> {{ formatDate(order.createdAt) }}</span>
                  <span><strong>وضعیت:</strong>
                    <span :class="getStatusClass(order.status)" class="px-2 py-1 rounded-full text-xs font-medium ml-1">
                      {{ getStatusText(order.status) }}
                    </span>
                  </span>
                </div>
              </div>
              <div class="text-right md:text-left">
                <p class="text-2xl font-bold text-primary">{{ formatPrice(order.total) }}</p>
              </div>
            </div>
          </template>
        </Card>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Order Items -->
          <div class="lg:col-span-2">
            <Card>
              <template #title>اقلام سفارش ({{ order.items?.length || 0 }})</template>
              <template #content>
                <div v-if="order.items && order.items.length > 0" class="space-y-4">
                  <div
                    v-for="item in order.items"
                    :key="item.id"
                    class="flex gap-4 p-4 border-b border-gray-100 last:border-0"
                  >
                    <div class="flex-shrink-0">
                      <img
                        :src="item.image || '/placeholder-product.jpg'"
                        :alt="item.name"
                        class="w-20 h-20 object-cover rounded"
                      />
                    </div>
                    <div class="flex-1">
                      <h3 class="font-semibold">{{ item.name }}</h3>
                      <p class="text-sm text-gray-500" v-if="item.variant">{{ item.variant }}</p>
                      <div class="flex justify-between items-center mt-2">
                        <div class="text-primary font-bold">
                          {{ formatPrice(item.price * item.quantity) }}
                        </div>
                        <div class="flex items-center gap-2 text-gray-500">
                          <span>تعداد: {{ item.quantity }}</span>
                          <span>× {{ formatPrice(item.price) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-4 text-gray-500">
                  آیتمی یافت نشد
                </div>
              </template>
            </Card>

            <!-- Shipping Info -->
            <Card class="mt-6">
              <template #title>اطلاعات ارسال</template>
              <template #content>
                <div v-if="order.shippingInfo" class="space-y-2">
                  <p><strong>نام گیرنده:</strong> {{ order.shippingInfo.fullName }}</p>
                  <p><strong>تلفن:</strong> {{ order.shippingInfo.phone }}</p>
                  <p><strong>آدرس:</strong> {{ order.shippingInfo.address }}, {{ order.shippingInfo.city }}, {{ order.shippingInfo.province }}</p>
                  <p><strong>کد پستی:</strong> {{ order.shippingInfo.postalCode }}</p>
                </div>
                <p v-else class="text-gray-500">اطلاعات ارسال موجود نیست</p>
              </template>
            </Card>

            <!-- Payment Info -->
            <Card class="mt-6">
              <template #title>اطلاعات پرداخت</template>
              <template #content>
                <div v-if="order.paymentInfo" class="space-y-2">
                  <p><strong>روش پرداخت:</strong> {{ getPaymentMethodText(order.paymentMethod) }}</p>
                  <p v-if="order.paymentInfo.cardNumber"><strong>شماره کارت:</strong> {{ maskCardNumber(order.paymentInfo.cardNumber) }}</p>
                </div>
                <p v-else class="text-gray-500">اطلاعات پرداخت موجود نیست</p>
              </template>
            </Card>
          </div>

          <!-- Order Summary -->
          <div class="lg:col-span-1">
            <Card>
              <template #title>مجموع سفارش</template>
              <template #content>
                <div class="space-y-4">
                  <div class="flex justify-between">
                    <span>مجموع محصولات:</span>
                    <span>{{ formatPrice(order.subtotal || 0) }}</span>
                  </div>
                  <div v-if="order.discount > 0" class="flex justify-between">
                    <span>تخفیف:</span>
                    <span class="text-green-600">-{{ formatPrice(order.discount) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>هزینه ارسال:</span>
                    <span>{{ order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'رایگان' }}</span>
                  </div>
                  <div class="flex justify-between border-t pt-4 font-bold text-lg">
                    <span>مبلغ قابل پرداخت:</span>
                    <span class="text-primary">{{ formatPrice(order.total) }}</span>
                  </div>
                </div>
              </template>
            </Card>

            <Card class="mt-4">
              <template #title>عملیات</template>
              <template #content>
                <div class="space-y-2">
                  <Button
                    v-if="order.status === 'pending' || order.status === 'processing'"
                    label="لغو سفارش"
                    icon="pi pi-times"
                    class="w-full p-button-danger"
                    @click="cancelOrder"
                  />
                  <Button
                    v-if="order.status === 'delivered'"
                    label="ثبت نظر"
                    icon="pi pi-star"
                    class="w-full p-button-outlined"
                    @click="addReview"
                  />
                  <Button
                    label="دانلود فاکتور"
                    icon="pi pi-file"
                    class="w-full p-button-outlined"
                    @click="downloadInvoice"
                  />
                </div>
              </template>
            </Card>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '../../stores/orders'
import { formatPrice, formatDate, getStatusText, getStatusClass } from '../../utils/helpers'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

const order = ref(null)
const loading = ref(false)
const error = ref('')

const home = ref({
  icon: 'pi pi-home',
  to: '/'
})

const items = computed(() => [
  { label: 'سفارشات من', to: '/orders' },
  { label: `سفارش #${route.params.id}` }
])

onMounted(async () => {
  await loadOrder()
})

const loadOrder = async () => {
  const orderId = route.params.id
  if (!orderId) {
    error.value = 'شناسه سفارش نامعتبر است'
    return
  }

  loading.value = true
  error.value = ''
  try {
    order.value = await orderStore.getOrderById(orderId)
  } catch (err) {
    error.value = err.message || 'خطا در دریافت سفارش'
  } finally {
    loading.value = false
  }
}

const getPaymentMethodText = (method) => {
  const methods = {
    online: 'پرداخت آنلاین',
    cash: 'پرداخت در محل',
    wallet: 'کیف پول'
  }
  return methods[method] || method
}

const maskCardNumber = (cardNumber) => {
  if (!cardNumber) return ''
  return cardNumber.replace(/\d(?=\d{4})/g, '*')
}

const cancelOrder = async () => {
  if (!confirm('آیا از لغو این سفارش مطمئن هستید؟')) return

  try {
    await orderStore.cancelOrder(order.value.id)
    order.value = await orderStore.getOrderById(order.value.id)
  } catch (err) {
    console.error('Error cancelling order:', err)
  }
}

const addReview = () => {
  router.push({ name: 'add-review', query: { orderId: order.value.id } })
}

const downloadInvoice = () => {
  // TODO: Implement invoice download
  alert('دانلود فاکتور به زودی اضافه خواهد شد')
}

const goToOrders = () => {
  router.push({ name: 'orders' })
}
</script>

<style scoped>
.order-details-page {
  direction: rtl;
}
</style>