<template>
  <main class="retail-inventory-page ds-page" dir="rtl" aria-labelledby="retail-inventory-title" :aria-busy="loading">
    <header class="page-heading">
      <div><span class="eyebrow">COMPANY · INVENTORY VISIBILITY</span><h1 id="retail-inventory-title">موجودی خرده‌فروشی شرکت</h1>
        <p>موجودی و رزروهای محصولات متعلق به شرکت شما؛ این صفحه فعلاً فقط خواندنی است.</p></div>
      <Button label="به‌روزرسانی" icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="loadInventory" />
    </header>

    <div v-if="error" class="error-state" role="alert"><strong>دریافت موجودی ناموفق بود</strong><p>{{ error }}</p><Button label="تلاش دوباره" severity="secondary" outlined @click="loadInventory" /></div>
    <div v-else-if="loading && !products.length" class="state" role="status"><ProgressSpinner style="width:2rem;height:2rem" />در حال دریافت موجودی...</div>
    <div v-else-if="!products.length" class="state"><i class="pi pi-box" aria-hidden="true"></i><strong>محصولی برای نمایش وجود ندارد</strong></div>
    <section v-else class="inventory-table-wrap" aria-label="موجودی محصولات شرکت">
      <table class="inventory-table">
        <thead><tr><th>محصول</th><th>موجودی کل</th><th>رزروشده</th><th>قابل فروش</th><th>گردش</th></tr></thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td><div class="product-cell"><strong>{{ product.title }}</strong><small>{{ product.sku || 'بدون کد کالا' }}</small></div></td>
            <td>{{ number(balanceById[product.id]?.onHand) }}</td>
            <td>{{ number(balanceById[product.id]?.reserved) }}</td>
            <td><strong>{{ number(balanceById[product.id]?.available) }}</strong></td>
            <td><Button label="مشاهده گردش" severity="secondary" text size="small" @click="openMovements(product)" /></td>
          </tr>
        </tbody>
      </table>
      <nav v-if="meta.totalPages > 1" class="pagination" aria-label="صفحه‌بندی محصولات">
        <Button label="قبلی" severity="secondary" text :disabled="page <= 1" @click="changePage(page - 1)" />
        <span>صفحه {{ page.toLocaleString('fa-IR') }} از {{ meta.totalPages.toLocaleString('fa-IR') }}</span>
        <Button label="بعدی" severity="secondary" text :disabled="page >= meta.totalPages" @click="changePage(page + 1)" />
      </nav>
    </section>

    <Dialog v-model:visible="movementsOpen" modal :header="'گردش موجودی — ' + selectedProduct?.title" :style="{ width: 'min(94vw, 48rem)' }">
      <div v-if="movementsLoading" class="state" role="status"><ProgressSpinner style="width:1.5rem;height:1.5rem" />در حال دریافت گردش...</div>
      <div v-else-if="movementError" class="error-state" role="alert">{{ movementError }}</div>
      <div v-else-if="!movements.length" class="state">گردشی برای این محصول ثبت نشده است.</div>
      <div v-else class="movement-list">
        <div v-for="movement in movements" :key="movement.id" class="movement-row">
          <div><strong>{{ movementTypeLabel(movement.movementType) }}</strong><small>{{ movement.reason || movement.referenceType || '—' }}</small></div>
          <strong :class="Number(movement.quantityDelta) < 0 ? 'negative' : 'positive'">{{ Number(movement.quantityDelta) > 0 ? '+' : '' }}{{ number(movement.quantityDelta) }}</strong>
          <time>{{ formatDate(movement.createdAt) }}</time>
        </div>
      </div>
    </Dialog>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import { apiGet, apiGetPaginated } from '@telecom/shared-core/http/apiClient'
import { endpoints } from '@telecom/api-client'
import { useProductsStore } from '../../../stores/products'

const productStore = useProductsStore()
const products = ref([])
const balanceById = ref({})
const loading = ref(false)
const error = ref('')
const page = ref(1)
const meta = ref({ totalPages: 1, total: 0 })
const movementsOpen = ref(false)
const movementsLoading = ref(false)
const movementError = ref('')
const movements = ref([])
const selectedProduct = ref(null)

function number(value) {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount.toLocaleString('fa-IR') : '—'
}
function formatDate(value) {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(date) : '—'
}
function movementTypeLabel(value) {
  return ({ RECEIPT: 'رسید', ADJUSTMENT_IN: 'افزایش موجودی', ADJUSTMENT_OUT: 'کاهش موجودی', RESERVATION: 'رزرو', RELEASE: 'آزادسازی رزرو', SALE: 'فروش', RETURN: 'مرجوعی', DAMAGE: 'ضایعات' })[value] || value
}
async function loadInventory() {
  loading.value = true
  error.value = ''
  try {
    const result = await productStore.getProducts({ page: page.value, limit: 20 })
    products.value = Array.isArray(result?.data) ? result.data : []
    meta.value = result?.meta || { totalPages: 1, total: products.value.length }
    const balances = await Promise.all(products.value.map(async product => {
      try {
        const balance = await apiGet(endpoints.inventory.balance(product.id))
        return [product.id, balance]
      } catch (err) {
        if (err?.status === 404 || err?.response?.status === 404) return [product.id, { onHand: 0, reserved: 0, available: 0 }]
        throw err
      }
    }))
    balanceById.value = Object.fromEntries(balances)
  } catch (err) {
    error.value = err?.serverMessage || err?.message || 'ارتباط با سرور برقرار نشد.'
  } finally { loading.value = false }
}
async function changePage(next) { page.value = next; await loadInventory() }
async function openMovements(product) {
  selectedProduct.value = product
  movementsOpen.value = true
  movementsLoading.value = true
  movementError.value = ''
  movements.value = []
  try {
    const result = await apiGetPaginated(endpoints.inventory.movements(product.id), { params: { page: 1, limit: 30 } })
    movements.value = Array.isArray(result?.data) ? result.data : []
  } catch (err) {
    movementError.value = err?.serverMessage || err?.message || 'دریافت گردش موجودی ناموفق بود.'
  } finally { movementsLoading.value = false }
}
onMounted(loadInventory)
</script>

<style scoped>
.retail-inventory-page { padding: 1.5rem; color: var(--ds-color-text); }
.page-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem; }
.page-heading h1 { margin: .3rem 0; font-size: 1.25rem; font-weight: 800; }
.page-heading p { margin: 0; color: var(--ds-color-text-muted); font-size: .82rem; line-height: 1.8; }
.eyebrow { color: var(--ds-color-primary); font-size: .68rem; font-weight: 700; letter-spacing: .08em; }
.inventory-table-wrap { overflow-x: auto; border: 1px solid var(--ds-color-border); border-radius: var(--ds-radius-xl); background: var(--ds-color-surface); }
.inventory-table { width: 100%; border-collapse: collapse; min-width: 42rem; }
.inventory-table th, .inventory-table td { padding: .85rem 1rem; border-bottom: 1px solid var(--ds-color-border); text-align: right; font-size: .8rem; }
.inventory-table th { color: var(--ds-color-text-muted); background: var(--ds-color-surface-hover); font-weight: 700; }
.inventory-table tbody tr:last-child td { border-bottom: 0; }
.product-cell { display: grid; gap: .2rem; }
.product-cell small { color: var(--ds-color-text-muted); font-size: .72rem; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: .8rem; font-size: .8rem; }
.state, .error-state { display: flex; min-height: 12rem; flex-direction: column; align-items: center; justify-content: center; gap: .7rem; text-align: center; color: var(--ds-color-text-muted); }
.error-state { color: var(--ds-color-danger, var(--ds-status-danger-fg)); }
.state > i { font-size: 1.8rem; }
.movement-list { display: grid; }
.movement-row { display: grid; grid-template-columns: minmax(0,1fr) 5rem 8rem; align-items: center; gap: .75rem; padding: .75rem 0; border-bottom: 1px solid var(--ds-color-border); font-size: .78rem; }
.movement-row > div { display: grid; gap: .2rem; }
.movement-row small, .movement-row time { color: var(--ds-color-text-muted); font-size: .7rem; }
.positive { color: var(--ds-status-success-fg); }
.negative { color: var(--ds-status-danger-fg); }
@media (max-width: 640px) { .retail-inventory-page { padding: 1rem; } .page-heading { flex-direction: column; } .movement-row { grid-template-columns: minmax(0,1fr) auto; } .movement-row time { grid-column: 1 / -1; } }
</style>
