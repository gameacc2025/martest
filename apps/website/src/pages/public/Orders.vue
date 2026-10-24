<template>
  <div class="orders-page">
    <div class="ds-container ds-page">
      <div class="mb-6">
        <h1 class="text-2xl font-bold">سفارشات من</h1>
        <Breadcrumb :home="home" :model="items" class="mt-2" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Sidebar Filters -->
        <div class="lg:col-span-1">
          <Card>
            <template #title>فیلتر سفارشات</template>
            <template #content>
              <div class="space-y-4">
                <!-- Status Filter -->
                <div>
                  <h3 class="font-semibold mb-2">وضعیت سفارش</h3>
                  <SelectButton
                    v-model="statusFilter"
                    :options="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    multiple
                    class="w-full"
                  />
                </div>

                <!-- Date Range Filter -->
                <div>
                  <h3 class="font-semibold mb-2">محدوده تاریخ</h3>
                  <div class="space-y-2">
                    <Calendar
                      v-model="dateRange"
                      selectionMode="range"
                      :manualInput="false"
                      class="w-full"
                      placeholder="انتخاب محدوده تاریخ"
                    />
                  </div>
                </div>

                <!-- Price Range Filter -->
                <div>
                  <h3 class="font-semibold mb-2">محدوده قیمت</h3>
                  <div class="space-y-2">
                    <Slider
                      v-model="priceRange"
                      range
                      :min="0"
                      :max="maxPrice"
                      class="w-full"
                    />
                    <div class="flex justify-between text-sm text-gray-500">
                      <span>{{ formatPrice(priceRange[0]) }}</span>
                      <span>{{ formatPrice(priceRange[1]) }}</span>
                    </div>
                  </div>
                </div>

                <Button
                  label="اعمال فیلترها"
                  icon="pi pi-check"
                  class="w-full p-button-primary"
                  @click="applyFilters"
                />
                <Button
                  label="حذف فیلترها"
                  icon="pi pi-times"
                  class="w-full p-button-outlined p-button-secondary mt-2"
                  @click="clearFilters"
                />
              </div>
            </template>
          </Card>
        </div>

        <!-- Orders List -->
        <div class="lg:col-span-3">
          <div class="flex justify-between items-center mb-4">
            <div class="text-gray-600">
              {{ totalOrders }} سفارش یافت شد
            </div>
            <div class="flex gap-2">
              <Select
                v-model="sortOption"
                :options="sortOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full md:w-14rem"
                @change="onSortChange"
              />
            </div>
          </div>

          <div v-if="loading" class="text-center py-8">
            <ProgressSpinner />
            <p class="mt-4">در حال بارگذاری...</p>
          </div>

          <div v-else-if="orders.length === 0" class="text-center py-8">
            <i class="pi pi-shopping-bag text-4xl text-gray-400 mb-4"></i>
            <h3 class="text-xl font-semibold mb-2">هیچ سفارشی یافت نشد</h3>
            <p class="text-gray-500">شما هنوز هیچ سفارشی نداده اید</p>
            <Button
              label="مشاهده محصولات"
              icon="pi pi-shopping-bag"
              class="p-button-primary mt-4"
              @click="goToProducts"
            />
          </div>

          <div v-else class="space-y-4">
            <Card v-for="order in orders" :key="order.id" class="order-card">
              <template #content>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="md:col-span-2">
                    <div class="flex justify-between items-start">
                      <div>
                        <h3 class="font-semibold">سفارش #{{ order.orderNumber }}</h3>
                        <p class="text-sm text-gray-500 mt-1">
                          تاریخ: {{ formatDate(order.createdAt) }}
                        </p>
                      </div>
                      <span
                        class="px-2 py-1 rounded-full text-xs font-medium"
                        :class="getStatusClass(order.status)"
                      >
                        {{ getStatusText(order.status) }}
                      </span>
                    </div>

                    <div class="mt-4">
                      <div
                        v-for="item in order.items.slice(0, 3)"
                        :key="item.id"
                        class="flex items-center gap-3 p-2 bg-gray-50 rounded mb-2"
                      >
                        <img
                          :src="item.image || '/placeholder-product.jpg'"
                          :alt="item.name"
                          class="w-12 h-12 object-cover rounded"
                        />
                        <div class="flex-1">
                          <p class="font-medium">{{ item.name }}</p>
                          <p class="text-sm text-gray-500">
                            تعداد: {{ item.quantity }} × {{ formatPrice(item.price) }}
                          </p>
                        </div>
                      </div>
                      <p
                        v-if="order.items.length > 3"
                        class="text-sm text-primary cursor-pointer"
                        @click="toggleExpandOrder(order.id)"
                      >
                        +{{ order.items.length - 3 }} محصول دیگر
                      </p>
                    </div>
                  </div>

                  <div class="text-right">
                    <div class="space-y-2">
                      <p class="font-bold text-lg">{{ formatPrice(order.total) }}</p>
                      <p class="text-sm text-gray-500">
                        {{ order.items.length }} محصول
                      </p>
                      <div class="space-y-1 mt-2">
                        <Button
                          label="مشاهده جزئیات"
                          icon="pi pi-eye"
                          class="p-button-text p-button-sm w-full"
                          @click="viewOrder(order.id)"
                        />
                        <Button
                          v-if="order.status === 'pending' && canCancelOrder(order)"
                          label="لغو سفارش"
                          icon="pi pi-times"
                          class="p-button-text p-button-danger p-button-sm w-full"
                          @click="cancelOrder(order.id)"
                        />
                        <Button
                          v-if="order.status === 'delivered'"
                          label="ثبت نظر"
                          icon="pi pi-star"
                          class="p-button-text p-button-sm w-full"
                          @click="addReview(order.id)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>

          <div class="mt-8">
            <Paginator
              :rows="perPage"
              :totalRecords="totalOrders"
              :rowsPerPageOptions="[10, 20, 50, 100]"
              @page="onPageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Calendar from 'primevue/calendar'
import Slider from 'primevue/slider'
import SelectButton from 'primevue/selectbutton'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import Paginator from 'primevue/paginator'

const router = useRouter()

const orders = ref([])
const loading = ref(false)
const totalOrders = ref(0)
const perPage = ref(10)
const currentPage = ref(1)
const maxPrice = ref(10000000)

const statusFilter = ref([])
const dateRange = ref(null)
const priceRange = ref([0, 10000000])
const sortOption = ref('date_desc')

const home = ref({
  icon: 'pi pi-home',
  to: '/'
})

const items = ref([
  { label: 'سفارشات من', to: '/orders' }
])

const statusOptions = ref([
  { label: 'همه', value: '' },
  { label: 'در انتظار پردازش', value: 'pending' },
  { label: 'در حال پردازش', value: 'processing' },
  { label: 'ارسال شده', value: 'shipped' },
  { label: 'تحویل داده شده', value: 'delivered' },
  { label: 'لغو شده', value: 'cancelled' },
  { label: 'مرجوع شده', value: 'refunded' }
])

const sortOptions = ref([
  { label: 'تاریخ: جدیدترین', value: 'date_desc' },
  { label: 'تاریخ: قدیمی ترین', value: 'date_asc' },
  { label: 'مبلغ: زیاد به کم', value: 'total_desc' },
  { label: 'مبلغ: کم به زیاد', value: 'total_asc' },
  { label: 'تعداد آیتم: زیاد به کم', value: 'items_desc' },
  { label: 'تعداد آیتم: کم به زیاد', value: 'items_asc' }
])

onMounted(async () => {
  await loadOrders()
})

const loadOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: perPage.value,
      status: statusFilter.value.length > 0 ? statusFilter.value.join(',') : undefined,
      startDate: dateRange.value?.[0] ? new Date(dateRange.value[0]).toISOString() : undefined,
      endDate: dateRange.value?.[1] ? new Date(dateRange.value[1]).toISOString() : undefined,
      minTotal: priceRange.value[0],
      maxTotal: priceRange.value[1],
      sortBy: getSortField(),
      sortOrder: getSortOrder()
    }

    const data = { orders: [], total: 0, maxTotal: 10000000 }
    orders.value = data.orders
    totalOrders.value = data.total
    maxPrice.value = data.maxTotal || 10000000
    priceRange.value = [0, maxPrice.value]
  } catch (error) {
    console.error('Error loading orders:', error)
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  currentPage.value = 1
  loadOrders()
}

const clearFilters = () => {
  statusFilter.value = []
  dateRange.value = null
  priceRange.value = [0, maxPrice.value]
  sortOption.value = 'date_desc'
  currentPage.value = 1
  loadOrders()
}

const onSortChange = () => {
  loadOrders()
}

const onPageChange = (event) => {
  currentPage.value = event.page + 1
  perPage.value = event.rows
  loadOrders()
}

const getSortField = () => {
  const [field] = sortOption.value.split('_')
  return field === 'date' ? 'createdAt' : field
}

const getSortOrder = () => {
  const [, order] = sortOption.value.split('_')
  return order
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR'
  }).format(price)
}

const formatDate = (date) => {
  if (!date) return 'نامشخص'
  return new Date(date).toLocaleDateString('fa-IR')
}

const getStatusText = (status) => {
  const statusMap = {
    pending: 'در انتظار پردازش',
    processing: 'در حال پردازش',
    shipped: 'ارسال شده',
    delivered: 'تحویل داده شده',
    cancelled: 'لغو شده',
    refunded: 'مرجوع شده'
  }
  return statusMap[status] || status
}

const getStatusClass = (status) => {
  const statusClass = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-orange-100 text-orange-800'
  }
  return statusClass[status] || 'bg-gray-100 text-gray-800'
}

const canCancelOrder = (order) => {
  // Orders can be cancelled if they are pending or processing
  return ['pending', 'processing'].includes(order.status)
}

const toggleExpandOrder = (orderId) => {
  // Toggle expanded state for order
  const order = orders.value.find(o => o.id === orderId)
  if (order) {
    order.expanded = !order.expanded
  }
}

const viewOrder = (orderId) => {
  router.push({ name: 'order-details', params: { id: orderId } })
}

const cancelOrder = async (orderId) => {
  try {
    // cancelOrder logic will be implemented later
    await loadOrders()
  } catch (error) {
    console.error('Error cancelling order:', error)
  }
}

const addReview = (orderId) => {
  router.push({ name: 'add-review', query: { orderId } })
}

const goToProducts = () => {
  router.push('/products')
}
</script>

<style scoped>
.orders-page {
  direction: rtl;
}

.order-card {
  transition: all 0.2s ease;
}

.order-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>