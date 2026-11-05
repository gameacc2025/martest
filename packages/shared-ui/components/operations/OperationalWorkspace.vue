<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import TemStatCard from '../ui/TemStatCard.vue'
import TemPanel from '../ui/TemPanel.vue'
import TemStatusPill from '../ui/TemStatusPill.vue'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  eyebrow: { type: String, default: 'فضای کاری' },
  stats: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  highlights: { type: Array, default: () => [] },
  demo: { type: Boolean, default: true },
})
const query = ref('')
const route = useRoute()
const selectedStatus = ref(typeof route.query.status === 'string' ? route.query.status : 'همه')
const statuses = computed(() => ['همه', ...new Set(props.rows.map((row) => row.statusLabel).filter(Boolean))])

watch(
  () => route.query.status,
  (status) => {
    const nextStatus = typeof status === 'string' ? status : 'همه'
    selectedStatus.value = statuses.value.includes(nextStatus) ? nextStatus : 'همه'
  },
  { immediate: true },
)
const filteredRows = computed(() => props.rows.filter((row) => {
  const matchesQuery = !query.value || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(query.value.toLowerCase()))
  const matchesStatus = selectedStatus.value === 'همه' || row.statusLabel === selectedStatus.value
  return matchesQuery && matchesStatus
}))
</script>

<template>
  <main class="tm-workspace">
    <div class="tm-workspace__notice" role="note">
      <i class="pi pi-info-circle" aria-hidden="true"></i>
      <span>{{ demo ? 'پیش‌نمایش رابط کاربری — داده‌های این صفحه نمونه هستند و به API متصل نیستند.' : 'اطلاعات این صفحه از سرویس‌های سامانه دریافت می‌شوند.' }}</span>
      <span class="tm-workspace__eyebrow">{{ eyebrow }}</span>
    </div>

    <section v-if="stats.length" class="tm-workspace__stats" aria-label="شاخص‌های کلیدی">
      <TemStatCard v-for="item in stats" :key="item.label" v-bind="item" />
    </section>

    <section v-if="highlights.length" class="tm-workspace__highlights">
      <article v-for="item in highlights" :key="item.title" class="tm-workspace__highlight">
        <span class="tm-workspace__highlight-icon"><i :class="item.icon || 'pi pi-bolt'" aria-hidden="true"></i></span>
        <div><strong>{{ item.title }}</strong><p>{{ item.description }}</p></div>
        <span v-if="item.value" class="tm-workspace__highlight-value">{{ item.value }}</span>
      </article>
    </section>

    <TemPanel :title="title + ' — فهرست'" subtitle="برای بررسی ساختار و گردش‌کار این بخش، از داده‌های نمایشی استفاده شده است." flush>
      <template #actions>
        <span class="tm-workspace__demo-tag">داده نمایشی</span>
      </template>
      <div class="tm-workspace__toolbar">
        <label class="tm-workspace__search">
          <i class="pi pi-search" aria-hidden="true"></i>
          <InputText v-model="query" placeholder="جستجو در اطلاعات..." aria-label="جستجو در اطلاعات" />
        </label>
        <div class="tm-workspace__filters" aria-label="فیلتر وضعیت">
          <button v-for="status in statuses" :key="status" type="button" :class="{ active: selectedStatus === status }" @click="selectedStatus = status">{{ status }}</button>
        </div>
        <Button label="خروجی (فاز API)" icon="pi pi-download" severity="secondary" outlined size="small" disabled />
        <Button label="ایجاد مورد (فاز API)" icon="pi pi-plus" size="small" disabled />
      </div>

      <div class="tm-workspace__table-wrap">
        <table class="tm-workspace__table">
          <thead><tr><th v-for="column in columns" :key="column.key">{{ column.label }}</th></tr></thead>
          <tbody>
            <tr v-for="(row, index) in filteredRows" :key="row.id || index">
              <td v-for="column in columns" :key="column.key">
                <TemStatusPill v-if="column.key === 'statusLabel'" :label="row[column.key]" :tone="row.statusTone || 'neutral'" />
                <strong v-else-if="column.key === 'primary'">{{ row[column.key] }}</strong>
                <span v-else>{{ row[column.key] ?? '—' }}</span>
              </td>
            </tr>
            <tr v-if="!filteredRows.length"><td :colspan="columns.length" class="tm-workspace__empty">موردی با این مشخصات پیدا نشد.</td></tr>
          </tbody>
        </table>
      </div>
      <div class="tm-workspace__table-foot">نمایش {{ filteredRows.length.toLocaleString('fa-IR') }} مورد از {{ rows.length.toLocaleString('fa-IR') }} مورد نمونه</div>
    </TemPanel>
  </main>
</template>

<style scoped>
.tm-workspace { display:flex; flex-direction:column; gap:18px; min-width:0; }
.tm-workspace__notice { display:flex; align-items:center; gap:9px; padding:10px 13px; border:1px solid #d8e8f1; border-radius:10px; background:#f2f8fc; color:#34556b; font-size:12px; }
.tm-workspace__eyebrow { margin-inline-start:auto; color:#627d90; font-size:11px; white-space:nowrap; }
.tm-workspace__stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
.tm-workspace__highlights { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
.tm-workspace__highlight { display:flex; align-items:center; gap:12px; padding:15px; border:1px solid var(--tm-line); border-radius:12px; background:var(--tm-surface); min-width:0; }
.tm-workspace__highlight-icon { display:grid; place-items:center; width:38px; height:38px; flex:none; border-radius:10px; background:var(--tm-surface-sunk); color:var(--tm-blue); }
.tm-workspace__highlight strong { font-size:13px; }.tm-workspace__highlight p { margin:4px 0 0; color:var(--tm-muted); font-size:11px; line-height:1.7; }
.tm-workspace__highlight-value { margin-inline-start:auto; color:var(--tm-ink); font-weight:700; white-space:nowrap; font-size:13px; }
.tm-workspace__demo-tag { color:#9a6815; background:#fff5dc; border-radius:20px; padding:4px 9px; font-size:10px; }
.tm-workspace__toolbar { display:flex; align-items:center; flex-wrap:wrap; gap:9px; padding:14px; border-bottom:1px solid var(--tm-line); }
.tm-workspace__search { display:flex; align-items:center; gap:8px; min-width:220px; flex:1; color:var(--tm-muted); }
.tm-workspace__search :deep(input) { width:100%; font-size:12px; }
.tm-workspace__filters { display:flex; flex-wrap:wrap; gap:4px; padding:3px; border-radius:8px; background:var(--tm-surface-sunk); }
.tm-workspace__filters button { border:0; border-radius:6px; padding:6px 10px; background:transparent; color:var(--tm-muted); font:inherit; font-size:11px; cursor:pointer; }
.tm-workspace__filters button.active { background:var(--tm-surface); color:var(--tm-ink); box-shadow:0 1px 3px #14233a14; }
.tm-workspace__table-wrap { overflow-x:auto; }
.tm-workspace__table { width:100%; border-collapse:collapse; text-align:start; white-space:nowrap; }
.tm-workspace__table th { padding:12px 15px; color:var(--tm-muted); background:var(--tm-surface-sunk); font-size:11px; font-weight:600; }
.tm-workspace__table td { padding:13px 15px; border-bottom:1px solid var(--tm-line); color:var(--tm-ink-soft); font-size:12px; }
.tm-workspace__table td strong { color:var(--tm-ink); font-weight:600; }
.tm-workspace__empty { text-align:center; padding:32px !important; color:var(--tm-muted) !important; }
.tm-workspace__table-foot { padding:12px 15px; color:var(--tm-muted); font-size:11px; }
@media(max-width:1100px){.tm-workspace__stats{grid-template-columns:repeat(2,minmax(0,1fr))}.tm-workspace__highlights{grid-template-columns:1fr 1fr}}
@media(max-width:700px){.tm-workspace__stats,.tm-workspace__highlights{grid-template-columns:1fr}.tm-workspace__notice{align-items:flex-start;flex-wrap:wrap}.tm-workspace__eyebrow{margin-inline-start:0}}
</style>