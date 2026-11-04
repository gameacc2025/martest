<script setup>
/** Data-first metric link for operational dashboards; no data fetching or invented comparisons. */
defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: null },
  icon: { type: String, default: 'pi pi-chart-bar' },
  tone: { type: String, default: 'primary', validator: (v) => ['primary', 'success', 'warning', 'danger', 'info'].includes(v) },
  loading: { type: Boolean, default: false },
  to: { type: [String, Object], default: null },
})
function faNumber(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(number) ? String(value) : number.toLocaleString('fa-IR')
}
</script>

<template>
  <component :is="to ? 'router-link' : 'div'" :to="to || undefined" class="kpi-card"
    :class="['kpi-card--' + tone, { 'kpi-card--link': to }]">
    <span class="kpi-card-label"><i :class="icon" aria-hidden="true"></i>{{ label }}</span>
    <span v-if="loading" class="kpi-card-value kpi-card-value--skeleton" aria-label="در حال بارگذاری"></span>
    <strong v-else class="kpi-card-value">{{ faNumber(value) }}</strong>
    <span v-if="to" class="kpi-card-destination">مشاهده جزئیات <i class="pi pi-arrow-left" aria-hidden="true"></i></span>
  </component>
</template>

<style scoped>
.kpi-card{position:relative;display:flex;min-width:0;min-height:6.25rem;flex-direction:column;align-items:flex-start;justify-content:center;gap:.28rem;padding:.9rem 4.1rem .9rem 1rem;overflow:hidden;border:1px solid #dce8f4;border-radius:15px;background:linear-gradient(145deg,#fff 0%,#f8fbff 100%);color:#18385e;text-decoration:none;box-shadow:0 3px 12px rgba(32,79,130,.045);transition:transform .18s,border-color .18s,box-shadow .18s}
.kpi-card::before{position:absolute;inset-inline-start:1rem;bottom:-1.3rem;width:6rem;height:2.5rem;border-top:2px solid var(--kpi-accent,#20b8d4);border-radius:50%;content:"";opacity:.7;transform:rotate(-9deg)}
.kpi-card::after{position:absolute;inset-inline-end:.9rem;top:50%;display:grid;width:2.8rem;height:2.8rem;place-items:center;border-radius:12px;background:var(--kpi-icon-bg,#e6f8fc);color:var(--kpi-accent,#12b8d0);font-family:primeicons;font-size:1.25rem;content:var(--kpi-icon,"")}
.kpi-card-label{display:flex;align-items:center;gap:.35rem;color:#6e839c;font-size:.72rem;font-weight:600;line-height:1.5}.kpi-card-label i{display:none}
.kpi-card-value{color:#18385e;font-size:1.42rem;font-weight:800;line-height:1.25;font-variant-numeric:tabular-nums}
.kpi-card-destination{display:inline-flex;align-items:center;gap:.3rem;min-height:1.15rem;color:#7c91a8;font-size:.65rem;opacity:.85}
.kpi-card--link{cursor:pointer}.kpi-card--link:hover{transform:translateY(-2px);border-color:#9edce9;box-shadow:0 8px 20px rgba(21,139,177,.11)}.kpi-card--link:hover .kpi-card-destination{color:#078eae}
.kpi-card--primary{--kpi-accent:#12b8d0;--kpi-icon-bg:#e4f8fc;--kpi-icon:"\\e90f"}.kpi-card--success{--kpi-accent:#12bfa7;--kpi-icon-bg:#e3faf4;--kpi-icon:"\\e909"}.kpi-card--warning{--kpi-accent:#efa94d;--kpi-icon-bg:#fff4e3;--kpi-icon:"\\e925"}.kpi-card--danger{--kpi-accent:#ef739d;--kpi-icon-bg:#fff0f5;--kpi-icon:"\\e91b"}.kpi-card--info{--kpi-accent:#388fe8;--kpi-icon-bg:#eaf3ff;--kpi-icon:"\\e90b"}
.kpi-card-value--skeleton{display:block;width:3.5rem;height:1.5rem;border-radius:5px;background:#eaf0f7;animation:kpi-pulse 1.2s ease-in-out infinite}
@keyframes kpi-pulse{0%,100%{opacity:1}50%{opacity:.45}}
@media(max-width:640px){.kpi-card{min-height:5.5rem;padding:.75rem 3.7rem .75rem .8rem}.kpi-card-value{font-size:1.25rem}}
@media(prefers-reduced-motion:reduce){.kpi-card,.kpi-card-value--skeleton{transition:none;animation:none}}
</style>
