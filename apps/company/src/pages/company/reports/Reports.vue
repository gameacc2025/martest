<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { inquiriesApi, productsApi } from '@telecom/api-client'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

import KpiCard from '@telecom/shared-ui/components/admin/dashboard/KpiCard.vue'
import DashboardPanel from '@telecom/shared-ui/components/admin/dashboard/DashboardPanel.vue'
import AnalyticsChart from '@telecom/shared-ui/components/admin/dashboard/AnalyticsChart.vue'

const toast = useToast()

const activeTab = ref('products')

// ── Products data ────────────────────────────────────────────
const products = ref([])
const productsLoading = ref(true)

const productKpis = computed(() => {
  const all = products.value
  return {
    total: all.length,
    draft: all.filter((p) => p.status === 'DRAFT').length,
    pending: all.filter((p) => p.status === 'PENDING_REVIEW').length,
    approved: all.filter((p) => p.status === 'APPROVED').length,
    published: all.filter((p) => p.status === 'PUBLISHED').length,
    rejected: all.filter((p) => p.status === 'REJECTED').length,
  }
})

const productStatusChart = computed(() => [
  { label: 'پیش‌نویس', value: productKpis.value.draft },
  { label: 'در انتظار بررسی', value: productKpis.value.pending },
  { label: 'تأیید شده', value: productKpis.value.approved },
  { label: 'منتشر شده', value: productKpis.value.published },
  { label: 'رد شده', value: productKpis.value.rejected },
])

// ── Inquiries data ───────────────────────────────────────────
const inquiryStats = ref(null)
const inquiriesLoading = ref(true)

const inquiryKpis = computed(() => {
  const s = inquiryStats.value
  if (!s) return { total: 0, open: 0, closed: 0, expired: 0 }
  const received = s.received || {}
  const sent = s.sent || {}
  return {
    total: (received.total || 0) + (sent.total || 0),
    open: (received.byStatus?.OPEN || 0) + (sent.byStatus?.OPEN || 0),
    closed: (received.byStatus?.CLOSED || 0) + (sent.byStatus?.CLOSED || 0),
    expired: (received.byStatus?.EXPIRED || 0) + (sent.byStatus?.EXPIRED || 0),
  }
})

const inquiryStatusChart = computed(() => [
  { label: 'باز', value: inquiryKpis.value.open },
  { label: 'بسته شده', value: inquiryKpis.value.closed },
  { label: 'منقضی شده', value: inquiryKpis.value.expired },
])

onMounted(() => {
  fetchProducts()
  fetchInquiryStats()
})

async function fetchProducts() {
  productsLoading.value = true
  try {
    const res = await productsApi.myProducts({ limit: 500 })
    const body = res?.data ?? res
    products.value = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت محصولات', life: 3000 })
  } finally {
    productsLoading.value = false
  }
}

async function fetchInquiryStats() {
  inquiriesLoading.value = true
  try {
    const res = await inquiriesApi.getStats()
    const body = res?.data ?? res
    inquiryStats.value = body?.data ?? body
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت آمار استعلام‌ها', life: 3000 })
  } finally {
    inquiriesLoading.value = false
  }
}

// ── Export helpers ────────────────────────────────────────────
function exportCSV(data, filename) {
  if (!data.length) {
    toast.add({ severity: 'warn', summary: 'توجه', detail: 'داده‌ای برای خروجی وجود ندارد', life: 3000 })
    return
  }
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]
  for (const row of data) {
    csvRows.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
  }
  const blob = new Blob(['\u200B' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}

function exportProductsCSV() {
  const data = products.value.map((p) => ({
    عنوان: p.title,
    برند: p.brand || '',
    مدل: p.model || '',
    وضعیت: p.status,
    دسته: p.category?.nameFa || '',
    تاریخ: p.createdAt,
  }))
  exportCSV(data, 'products-report.csv')
}

function exportInquiriesCSV() {
  const s = inquiryStats.value
  if (!s) return
  const data = [
    { عنوان: 'کل استعلام‌ها', مقدار: inquiryKpis.value.total },
    { عنوان: 'باز', مقدار: inquiryKpis.value.open },
    { عنوان: 'بسته شده', مقدار: inquiryKpis.value.closed },
    { عنوان: 'منقضی شده', مقدار: inquiryKpis.value.expired },
  ]
  exportCSV(data, 'inquiries-report.csv')
}
</script>

<template>
  <div class="reports-page">
    <div class="page-header">
      <h1>گزارش‌ها</h1>
      <div class="page-header-actions">
        <Button v-if="activeTab === 'products'" label="خروجی CSV" icon="pi pi-download" severity="secondary" outlined @click="exportProductsCSV" />
        <Button v-if="activeTab === 'inquiries'" label="خروجی CSV" icon="pi pi-download" severity="secondary" outlined @click="exportInquiriesCSV" />
      </div>
    </div>

    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="products">گزارش محصولات</Tab>
        <Tab value="inquiries">گزارش استعلام‌ها</Tab>
      </TabList>
      <TabPanels>
        <!-- Products Tab -->
        <TabPanel value="products">
          <div v-if="productsLoading" class="text-center py-8">
            <ProgressSpinner />
          </div>
          <template v-else>
            <div class="kpi-grid">
              <KpiCard label="کل محصولات" :value="productKpis.total" icon="pi pi-box" tone="info" />
              <KpiCard label="پیش‌نویس" :value="productKpis.draft" icon="pi pi-file-edit" tone="secondary" />
              <KpiCard label="در انتظار بررسی" :value="productKpis.pending" icon="pi pi-clock" tone="warning" />
              <KpiCard label="منتشر شده" :value="productKpis.published" icon="pi pi-check-circle" tone="success" />
            </div>
            <div class="chart-grid">
              <DashboardPanel title="وضعیت محصولات" icon="pi pi-chart-bar">
                <AnalyticsChart :series="productStatusChart" tone="primary" :loading="productsLoading" />
              </DashboardPanel>
            </div>
          </template>
        </TabPanel>

        <!-- Inquiries Tab -->
        <TabPanel value="inquiries">
          <div v-if="inquiriesLoading" class="text-center py-8">
            <ProgressSpinner />
          </div>
          <template v-else>
            <div class="kpi-grid">
              <KpiCard label="کل استعلام‌ها" :value="inquiryKpis.total" icon="pi pi-inbox" tone="info" />
              <KpiCard label="باز" :value="inquiryKpis.open" icon="pi pi-envelope-open" tone="primary" />
              <KpiCard label="بسته شده" :value="inquiryKpis.closed" icon="pi pi-check" tone="success" />
              <KpiCard label="منقضی شده" :value="inquiryKpis.expired" icon="pi pi-times-circle" tone="danger" />
            </div>
            <div class="chart-grid">
              <DashboardPanel title="وضعیت استعلام‌ها" icon="pi pi-chart-bar">
                <AnalyticsChart :series="inquiryStatusChart" tone="primary" :loading="inquiriesLoading" />
              </DashboardPanel>
            </div>
          </template>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
.reports-page {
  direction: rtl;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header h1 {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
}

.page-header-actions {
  display: flex;
  gap: 0.5rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--ds-space-4);
  margin-bottom: var(--ds-space-6);
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--ds-space-6);
}

@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 575px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
