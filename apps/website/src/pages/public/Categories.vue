<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import AppBreadcrumb from '../../components/AppBreadcrumb.vue'

const router = useRouter()
const productsStore = useProductsStore()
const categories = ref([])
const categoryProductCounts = ref({})
const loading = ref(false)
const error = ref('')
function title(category) { return category?.nameFa || category?.name || category?.nameEn || category?.slug || 'دسته‌بندی' }
function count(category) {
  const value = Number(categoryProductCounts.value[String(category?.id)] ?? category?.productCount ?? category?.productsCount ?? category?._count?.products)
  return Number.isFinite(value) && value >= 0 ? value.toLocaleString('fa-IR') : '—'
}
async function loadCategoryProductCounts(list) {
  const entries = await Promise.all(list.map(async category => {
    try {
      const result = await productsStore.getProducts({
        page: 1, limit: 1, status: 'PUBLISHED', categoryId: Number(category.id),
      })
      const total = Number(result?.meta?.total ?? result?.meta?.totalItems ?? result?.total)
      return [String(category.id), Number.isFinite(total) && total >= 0 ? total : null]
    } catch {
      return [String(category.id), null]
    }
  }))
  categoryProductCounts.value = Object.fromEntries(entries)
}
function icon(category) {
  const value = title(category).toLowerCase()
  if (value.includes('فیبر') || value.includes('fiber')) return '◎'
  if (value.includes('شبکه') || value.includes('data')) return '▤'
  if (value.includes('موبایل') || value.includes('mobile')) return '▯'
  if (value.includes('انتقال')) return '⇄'
  if (value.includes('ماهواره')) return '◉'
  if (value.includes('رادیو') || value.includes('آنتن')) return '⌁'
  if (value.includes('برق') || value.includes('باتری')) return '⚡'
  if (value.includes('رک')) return '▦'
  return '⌘'
}
function subcategories(category) {
  const nested = category?.children || category?.subcategories || category?.subCategories
  if (Array.isArray(nested) && nested.length) return nested
  const id = String(category?.id ?? '')
  const fromFlatList = categories.value.filter(item => String(item?.parentId ?? item?.parent?.id ?? '') === id)
  if (fromFlatList.length) return fromFlatList
  return category?.description ? [{ id: 'description-' + id, nameFa: category.description }] : []
}
function openCategory(category) {
  router.push({ name: 'products', query: { category: category.id } })
}
async function loadCategories() {
  loading.value = true
  error.value = ''
  try {
    const result = await productsStore.getCategories()
    categories.value = Array.isArray(result) ? result : []
    await loadCategoryProductCounts(categories.value)
  } catch {
    error.value = 'دریافت دسته‌بندی‌ها ناموفق بود.'
    categories.value = []
  } finally { loading.value = false }
}
onMounted(loadCategories)
</script>

<template>
<main class="reference-categories" dir="rtl">
  <div class="w">
    <AppBreadcrumb :items="[{ label: 'همه دسته‌بندی‌ها' }]" />
    <div class="ph"><h1>همه دسته‌بندی‌ها</h1><p>تجهیزات را بر اساس حوزه کاربرد مرور کنید</p></div>
    <div v-if="loading" class="category-state" role="status">در حال دریافت دسته‌بندی‌ها…</div>
    <div v-else-if="error" class="category-state" role="alert"><span>{{ error }}</span><button type="button" @click="loadCategories">تلاش دوباره</button></div>
    <div v-else-if="!categories.length" class="category-state" role="status">دسته‌بندی فعالی برای نمایش وجود ندارد.</div>
    <div v-else class="g3">
      <article v-for="category in categories" :key="category.id" class="cb">
        <div class="cb-header-img"><span class="dev-icon">{{ icon(category) }}</span></div>
        <div class="cb-top"><div class="cb-top-info"><h3>{{ title(category) }}</h3><small>{{ count(category) }} محصول</small></div><span class="cb-icon-box">{{ icon(category) }}</span></div>
        <ul class="cb-sublist"><li v-for="child in subcategories(category).slice(0, 4)" :key="child.id">{{ child.nameFa || child.name || child.nameEn || child.slug }}</li><li v-if="!subcategories(category).length">زیر‌دسته‌ای برای نمایش ثبت نشده است</li></ul>
        <div class="cb-footer"><button class="mo" type="button" @click="openCategory(category)">مشاهده محصولات ←</button></div>
      </article>
    </div>
  </div>
</main>
</template>
<style scoped>
.reference-categories {
  background: var(--ds-page-bg);
  color: var(--ds-text-primary);
  font-family: var(--ds-font-family);
  min-height: 60vh;
}
.reference-categories .cb button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ds-primary-button);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.reference-categories .category-state {
  display: flex;
  min-height: 250px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
  padding: 30px;
  border: 1px dashed var(--ds-border);
  border-radius: 14px;
  background: var(--ds-card-bg);
  color: var(--ds-text-secondary);
  text-align: center;
  font-size: 13px;
}
.reference-categories .category-state button {
  border: 0;
  background: transparent;
  color: var(--ds-primary-button);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.reference-categories {
  font-family: var(--ds-font-family);
  background: var(--ds-page-bg);
  color: var(--ds-text-primary);
}
.reference-categories .top,
.reference-categories footer {
  background: var(--ds-color-brand-deep);
  color: var(--ds-color-on-brand-muted);
}
.reference-categories .hero,
.reference-categories .feat .img,
.reference-categories .bf .im2 {
  background: var(--ds-color-brand-dark);
  color: var(--ds-color-on-brand);
}
.reference-categories .b1,
.reference-categories .fab {
  background: var(--ds-primary-button);
  color: var(--ds-primary-button-text);
}
.reference-categories .b1:hover,
.reference-categories .fab:hover {
  background: var(--ds-primary-button-hover);
}
.reference-categories .search {
  background: var(--ds-card-bg);
}
.reference-categories .search input {
  color: var(--ds-text-primary);
}
.reference-categories .tabs button.on {
  background: var(--ds-card-bg);
  color: var(--ds-text-primary);
}
.reference-categories .ofr {
  background: var(--ds-brand-secondary);
  color: #FFFFFF;
}
.reference-categories .ofr .btn {
  background: var(--ds-card-bg);
  color: var(--ds-brand-secondary);
}
.reference-categories .rfq,
.reference-categories .p .im {
  background: var(--ds-surface-secondary);
}
.reference-categories .bt.n {
  background: var(--ds-status-danger-bg);
  color: var(--ds-status-danger-fg);
}
.reference-categories .bt.t {
  background: var(--ds-status-success-bg);
  color: var(--ds-status-success-fg);
}
.reference-categories footer a,
.reference-categories footer .nl input {
  color: var(--ds-color-on-brand-muted);
}
.reference-categories .sh h2:after {
  background: var(--ds-brand-primary);
}

/* NewTemp.html — exact public page geometry and visual rules. */
.reference-home,
.reference-products,
.reference-categories {
  --pri: var(--ds-brand-primary);
  --prh: var(--ds-brand-primary-hover);
  --pra: var(--ds-brand-primary-active);
  --sub: var(--ds-brand-primary-subtle);
  --sec: var(--ds-brand-secondary);
  --acc: var(--ds-brand-accent);
  --glow: var(--ds-brand-primary);
  --navy: var(--ds-color-brand-deep);
  --pet: var(--ds-color-brand-dark);
  --bg: var(--ds-page-bg);
  --hdr: var(--ds-header-bg);
  --card: var(--ds-card-bg);
  --hv: var(--ds-card-hover);
  --s2: var(--ds-surface-secondary);
  --ln: var(--ds-border);
  --tx: var(--ds-text-primary);
  --mu: var(--ds-text-secondary);
  --mt: var(--ds-text-muted);
  --btn: var(--ds-primary-button);
  --btnh: var(--ds-primary-button-hover);
  --onb: var(--ds-primary-button-text);
  --out: var(--ds-outline-text);
  --lk: var(--ds-color-link);
  --am: var(--ds-color-primary-soft);
  --amt: var(--ds-color-primary-text);
  --ch: var(--ds-color-primary-soft);
  --ok: var(--ds-status-success-fg);
  --okb: var(--ds-status-success-bg);
  --okt: var(--ds-status-success-fg);
  --wn: var(--ds-status-warning-fg);
  --wnb: var(--ds-status-warning-bg);
  --er: var(--ds-status-danger-fg);
  --erb: var(--ds-status-danger-bg);
  --in: var(--ds-status-info-fg);
  --inb: var(--ds-status-info-bg);
  --sh: var(--ds-shadow-xs);
}
:global(:root.app-dark) .reference-home,
:global(:root.app-dark) .reference-products,
:global(:root.app-dark) .reference-categories {
  --bg: var(--ds-page-bg);
  --hdr: var(--ds-header-bg);
  --card: var(--ds-card-bg);
  --hv: var(--ds-card-hover);
  --s2: var(--ds-surface-secondary);
  --ln: var(--ds-border);
  --tx: var(--ds-text-primary);
  --mu: var(--ds-text-secondary);
  --mt: var(--ds-text-muted);
  --btn: var(--ds-primary-button);
  --btnh: var(--ds-primary-button-hover);
  --onb: var(--ds-primary-button-text);
  --out: var(--ds-outline-text);
  --lk: var(--ds-color-link);
  --am: var(--ds-color-primary-soft);
  --amt: var(--ds-color-primary-text);
  --ch: var(--ds-color-primary-soft);
  --ok: var(--ds-status-success-fg);
  --okb: var(--ds-status-success-bg);
  --okt: var(--ds-status-success-fg);
  --wn: var(--ds-status-warning-fg);
  --wnb: var(--ds-status-warning-bg);
  --er: var(--ds-status-danger-fg);
  --erb: var(--ds-status-danger-bg);
  --in: var(--ds-status-info-fg);
  --inb: var(--ds-status-info-bg);
  --sh: var(--ds-shadow-xs);
}

html { scroll-padding-top: 60px; }
* { box-sizing: border-box; margin: 0; }
body {
  font-family: Vazirmatn, Inter, Tahoma, sans-serif;
  background: var(--ds-page-bg);
  color: var(--ds-text-primary);
  line-height: 1.7;
  font-size: 14px;
}
input::placeholder,
textarea::placeholder { color: var(--ds-text-muted); }
a { color: var(--ds-color-link); text-decoration: none; }
.w { max-width: 1200px; margin: auto; padding: 0 24px; }
.ic { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.top { background: var(--ds-color-brand-deep); color: #b9d6e2; font-size: 12px; padding: 4px 0; }
.top .w,
.nav .w { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.top .ic { width: 15px; height: 15px; vertical-align: -3px; }
.nav { background: var(--ds-header-bg); border-bottom: 1px solid var(--ds-border); position: sticky; top: 0; z-index: 20; padding: 0; }
.logo { display: flex; gap: 8px; align-items: center; font-weight: 800; font-size: 17px; color: var(--ds-text-primary); cursor: pointer; }
.logo svg { width: 30px; height: 30px; }
.nav ul { display: flex; gap: 4px; list-style: none; padding: 0; align-items: center; }
.nav li a {
  color: var(--ds-text-secondary);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 6px;
  display: block;
  transition: .2s;
  cursor: pointer;
}
.nav li a:hover { background: var(--ds-card-hover); color: var(--ds-color-link); }
.nav li a.a { background: var(--ds-color-primary-soft); color: var(--ds-color-primary-text); }
.tl { display: flex; gap: 8px; align-items: center; }
.ib {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--ds-border);
  background: transparent;
  color: var(--ds-text-primary);
  display: grid;
  place-items: center;
  cursor: pointer;
  position: relative;
}
.ib b {
  position: absolute;
  top: -6px;
  left: -6px;
  background: var(--ds-primary-button);
  color: var(--ds-primary-button-text);
  border-radius: 9px;
  font-size: 12px;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
}
.nav .w { min-height: 56px; }
.btn {
  border: 0;
  height: 36px;
  border-radius: 8px;
  padding: 0 16px;
  font: inherit;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  transition: transform .2s, filter .2s;
}
.btn:hover { transform: translateY(-1px); }
.b1 {
  background: var(--ds-primary-button);
  color: var(--ds-primary-button-text);
  position: relative;
  overflow: hidden;
}
.b1:hover {
  background: var(--ds-primary-button-hover);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--ds-brand-primary) 40%, transparent);
}
.hero .b1,
.band .b1 {
  background: var(--ds-brand-primary);
  color: #083344;
}
.hero .b1:hover,
.band .b1:hover {
  background: var(--ds-brand-primary-hover);
}
.b1:after {
  content: "";
  position: absolute;
  top: 0;
  left: -70%;
  width: 40%;
  height: 100%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, .4), transparent);
  transform: skewX(-20deg);
  transition: left .7s;
}
.b1:hover:after { left: 140%; }
.btn:active { transform: scale(.97); }
.b2 {
  background: transparent;
  color: var(--ds-outline-text);
  border: 1px solid var(--ds-outline-text);
}
.b2:hover { background: var(--ds-card-hover); }
.b3 {
  background: var(--ds-brand-secondary);
  color: #fff;
}
.b3:hover { filter: brightness(1.1); }
.cta .btn { height: 48px; border-radius: 10px; padding: 0 24px; font-size: 15px; }
.sr .btn { height: 44px; border-radius: 8px; }
.bw {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, .4);
}

/* Dynamic Fiber Optic Hero Animation */
.hero {
  background: linear-gradient(135deg, var(--ds-color-brand-deep), var(--ds-color-brand-dark));
  color: #fff;
  position: relative;
  overflow: hidden;
  padding: 64px 0 88px;
}
.hero-bg-network {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: .65;
  pointer-events: none;
}
.hero .w { position: relative; z-index: 2; }
.slides { display: grid; }
.sl {
  grid-area: 1/1;
  display: grid;
  grid-template-columns: 1.15fr .85fr;
  gap: 48px;
  align-items: center;
  opacity: 0;
  visibility: hidden;
  transform: translateX(-70px);
  transition: opacity .6s, transform .8s cubic-bezier(.2, .8, .2, 1), visibility 0s .8s;
}
.sl.lv { transform: translateX(70px); }
.sl.on { opacity: 1; visibility: visible; transform: none; transition: opacity .6s, transform .8s cubic-bezier(.2, .8, .2, 1), visibility 0s; }
.sl > div:first-child > * { opacity: 0; transform: translateY(26px); transition: opacity .6s, transform .7s cubic-bezier(.2, .8, .2, 1); }
.sl.on > div:first-child > * { opacity: 1; transform: none; }
.sl.on > div:first-child > :nth-child(2) { transition-delay: .15s; }
.sl.on > div:first-child > :nth-child(3) { transition-delay: .3s; }
.sl.on > div:first-child > :nth-child(4) { transition-delay: .45s; }
.sl .hc { opacity: 0; transform: translateX(-50px) scale(.94); transition: opacity .7s .2s, transform .9s .2s cubic-bezier(.2, .8, .2, 1); }
.sl.on .hc { opacity: 1; transform: none; }
.hc .dv { animation: fy 5s ease-in-out infinite; }
.pg { display: flex; gap: 8px; margin-top: 28px; align-items: center; }
.pg b {
  flex: 0 0 56px;
  height: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, .2);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.pg b:after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--ds-brand-primary);
  transform: scaleX(0);
  transform-origin: right;
}
.pg b.on:after { animation: pgp 6s linear forwards; }
.hero:hover .pg b.on:after { animation-play-state: paused; }
.pg span { color: #9cc4d4; font-size: 12px; margin-inline-start: 8px; font-variant-numeric: tabular-nums; }
.ar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, .3);
  background: rgba(255, 255, 255, .08);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: .2s;
}
.ar:first-of-type { margin-inline-start: auto; }
.ar:hover { background: var(--ds-brand-primary); color: #083344; transform: scale(1.1); }
.tag { color: var(--ds-brand-primary); font-weight: 700; font-size: 13px; display: flex; gap: 8px; align-items: center; }
.tag:before { content: ""; width: 28px; height: 2px; background: var(--ds-brand-primary); }
h1 { font-size: 36px; line-height: 1.5; font-weight: 800; margin: 8px 0 12px; }
.hero p { color: #c3dde8; max-width: 560px; }
.cta { display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
.hc {
  background: rgba(255, 255, 255, .07);
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(6px);
}
.hc .dv { width: 100%; background: rgba(0, 26, 39, .4); border-radius: 12px; }
.hc h3 { font-size: 16px; margin-top: 12px; }
.hc small { color: #9cc4d4; }
.hc .r { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }

/* Stats Section */
.stats { margin-top: -44px; position: relative; z-index: 10; }
.sg {
  background: var(--ds-card-bg);
  border-radius: 12px;
  box-shadow: var(--ds-shadow-xs);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 20px;
  border: 1px solid var(--ds-border);
}
.st { text-align: center; border-inline-start: 1px solid var(--ds-border); }
.st:first-child { border: 0; }
.st b {
  font-size: 28px;
  color: var(--ds-color-link);
  display: block;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
}
.st > span { font-size: 13px; color: var(--ds-text-secondary); }
.brands {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  padding: 32px 0 4px;
}
.brands span {
  padding: 6px 24px;
  color: var(--ds-text-secondary);
  font-weight: 800;
  font-size: 17px;
  letter-spacing: .5px;
  opacity: .65;
  transition: .2s;
}
.brands span:hover { opacity: 1; color: var(--ds-color-link); }
.sec { padding: 40px 0 8px; }
.sh {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 20px;
  gap: 12px;
}
.sh h2 {
  font-size: 24px;
  font-weight: 800;
  color: var(--ds-text-primary);
  position: relative;
  padding-bottom: 12px;
}
.sh h2:after {
  content: "";
  position: absolute;
  right: 0;
  bottom: 0;
  height: 3px;
  width: 44px;
  border-radius: 3px;
  background: var(--ds-brand-primary);
}
.sh p { color: var(--ds-text-secondary); font-size: 13px; }
.sh a { font-size: 13px; font-weight: 700; cursor: pointer; }
.g4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.g3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

/* Advanced Category Cards */
.cb {
  background: var(--ds-card-bg);
  border: 1px solid var(--ds-border);
  border-radius: 14px;
  padding: 0;
  transition: .25s;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--ds-shadow-xs);
}
.cb:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(16, 42, 67, .12);
  border-color: var(--ds-brand-primary);
}
.cb-header-img {
  height: 84px;
  background: linear-gradient(135deg, var(--ds-color-brand-deep), var(--ds-color-brand-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--ds-border);
}
.cb-header-img svg.bg-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: .25;
}
.cb-header-img .dev-icon {
  position: relative;
  z-index: 2;
  width: 120px;
  height: 54px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}
.cb-top { padding: 16px 20px 12px; display: flex; justify-content: space-between; align-items: flex-start; }
.cb-top-info h3 { font-size: 16px; font-weight: 800; color: var(--ds-text-primary); line-height: 1.4; }
.cb-top-info small { color: var(--ds-text-secondary); font-size: 12px; display: block; margin-top: 2px; }
.cb-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-link);
  display: grid;
  place-items: center;
  flex: none;
}
.cb-sublist { list-style: none; padding: 0 20px 16px; margin: 0; flex: 1; }
.cb-sublist li { border-top: 1px solid var(--ds-border); }
.cb-sublist li a {
  display: block;
  padding: 9px 0;
  color: var(--ds-text-secondary);
  font-size: 13px;
  transition: color .2s, padding .2s;
  cursor: pointer;
}
.cb-sublist li a:hover { color: var(--ds-color-link); padding-inline-start: 6px; }
.cb-footer { padding: 12px 20px 18px; margin-top: auto; }
.cb-footer .mo { color: var(--ds-color-link); font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: gap .2s; }
.cb:hover .cb-footer .mo { gap: 8px; }

.cat,
.why > div,
.bp {
  background: var(--ds-card-bg);
  border: 1px solid var(--ds-border);
  border-radius: 12px;
  padding: 20px;
  transition: .25s;
  position: relative;
  overflow: hidden;
}
.p {
  background: var(--ds-card-bg);
  border: 1px solid var(--ds-border);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: .25s;
}
.p .im {
  display: block;
  background: var(--ds-surface-secondary);
  padding: 16px;
  position: relative;
  cursor: pointer;
}
.im em {
  position: absolute;
  top: 12px;
  right: 12px;
  font-style: normal;
  font-size: 12px;
  line-height: 24px;
  background: var(--ds-card-bg);
  color: var(--ds-text-secondary);
  padding: 0 8px;
  border-radius: 6px;
}
.im .dv { width: 100%; height: 110px; }
.p .bd { padding: 14px 16px; flex: 1; }
.br {
  font-size: 12px;
  color: var(--ds-color-link);
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.br span {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 6px;
  background: var(--ds-status-success-bg);
  color: var(--ds-status-success-fg);
  font-weight: 600;
}
.p h3,
.cat h3,
.bp h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-primary);
}
.sku { font-size: 12px; color: var(--ds-text-secondary); }
.pr {
  margin-top: 8px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.pr.q { color: var(--ds-color-link); }
.pr small { display: block; font-weight: 400; font-size: 12px; color: var(--ds-text-secondary); }
.ac { display: flex; gap: 8px; padding: 0 16px 16px; }
.ac .btn { flex: 1; padding: 0; font-size: 13px; }
.why { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.why b { display: block; color: var(--ds-text-primary); margin: 4px 0; }
.band {
  margin: 48px 0 16px;
  border-radius: 12px;
  background: linear-gradient(120deg, var(--ds-color-brand-deep), var(--ds-color-brand-dark));
  color: #fff;
  padding: 32px 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  position: relative;
  overflow: hidden.
}
.band h3 { font-size: 22px; }
.band p { color: #b9d6e2; font-size: 14px; }
.bp .t {
  display: inline-flex;
  align-items: center;
  height: 24px;
  font-size: 12px;
  padding: 0 8px;
  border-radius: 6px;
  background: var(--ds-color-primary-soft);
  color: var(--ds-color-link);
  font-weight: 600;
}
.bp h3 { font-size: 16px; margin: 8px 0 4px; color: var(--ds-text-primary); }
.bp p { font-size: 12px; color: var(--ds-text-secondary); }

/* Slide-over Drawers */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 22, 37, .6);
  backdrop-filter: blur(4px);
  z-index: 90;
  opacity: 0;
  visibility: hidden;
  transition: .3s;
}
.drawer-overlay.on { opacity: 1; visibility: visible; }
.drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 380px;
  max-width: 85vw;
  background: var(--ds-card-bg);
  box-shadow: var(--ds-shadow-xs);
  z-index: 100;
  transform: translateX(-100%);
  transition: transform .3s cubic-bezier(.2, .8, .2, 1);
  display: flex;
  flex-direction: column;
}
.drawer.on { transform: translateX(0); }
.dh { padding: 18px 20px; border-bottom: 1px solid var(--ds-border); display: flex; justify-content: space-between; align-items: center; }
.dh h3 { font-size: 16px; font-weight: 700; }
.close-btn { background: transparent; border: 0; color: var(--ds-text-secondary); font-size: 22px; cursor: pointer; }
.db { flex: 1; overflow-y: auto; padding: 20px; }
.df { padding: 20px; border-top: 1px solid var(--ds-border); background: var(--ds-surface-secondary); }
.cart-item { display: flex; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--ds-border); align-items: center; }
.cart-item .ci-placeholder {
  width: 54px;
  height: 54px;
  border-radius: 8px;
  background: var(--ds-color-primary-soft);
  display: grid;
  place-items: center;
  flex: none;
}
.cart-item-info { flex: 1; }
.cart-item-info h4 { font-size: 13px; margin-bottom: 4px; }
.cart-item-info span { font-size: 12px; color: var(--ds-text-secondary); }
.cart-item-ctrl { display: flex; gap: 6px; align-items: center; margin-top: 4px; }
.cart-item-ctrl button {
  width: 22px;
  height: 22px;
  border: 1px solid var(--ds-border);
  background: var(--ds-card-bg);
  border-radius: 4px;
  cursor: pointer;
}

/* Search Modal Overlay */
.search-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 22, 37, .7);
  backdrop-filter: blur(6px);
  z-index: 110;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 100px;
  opacity: 0;
  visibility: hidden;
  transition: .3s;
}
.search-modal-overlay.on { opacity: 1; visibility: visible; }
.search-modal-box {
  background: var(--ds-card-bg);
  border: 1px solid var(--ds-border);
  border-radius: 14px;
  width: 90%;
  max-width: 600px;
  box-shadow: var(--ds-shadow-xs);
  padding: 24px;
  transform: translateY(-20px);
  transition: transform .3s;
}
.search-modal-overlay.on .search-modal-box { transform: translateY(0); }

/* Loader */
#ld {
  position: fixed;
  inset: 0;
  background: #060D17;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 999;
  transition: opacity .4s;
}
#ld.x { opacity: 0; pointer-events: none; visibility: hidden; }
.fiber-loader-svg { width: min(440px, 90vw); height: auto; }
.wait-text { margin-top: 20px; font-size: 16px; font-weight: 600; color: #67E8F9; animation: pText 1.5s ease-in-out infinite alternate; }

#pb { position: fixed; top: 0; right: 0; height: 3px; width: 0; background: var(--ds-brand-primary); box-shadow: 0 0 10px var(--ds-brand-primary); z-index: 60; }

.lay { display: grid; grid-template-columns: 250px 1fr; gap: 20px; margin: 16px 0 40px; }
.fl {
  background: var(--ds-card-bg);
  border: 1px solid var(--ds-border);
  border-radius: 12px;
  padding: 18px;
  align-self: start;
  font-size: 13px;
}
.fl h4 { font-size: 14px; margin: 0 0 6px; }
.fl label { display: block; color: var(--ds-text-secondary); cursor: pointer; padding: 2px 0; }
.fl hr { border: 0; border-top: 1px solid var(--ds-border); margin: 14px 0; }
.bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; color: var(--ds-text-secondary); font-size: 13px; }
.fm textarea { height: auto !important; padding: 10px 12px !important; }
select,
.fm input,
.fm textarea,
.fm select {
  font: inherit;
  font-size: 14px;
  height: 44px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--ds-border);
  background: var(--ds-card-bg);
  color: var(--ds-text-primary);
  width: 100%;
}
.box { background: var(--ds-card-bg); border: 1px solid var(--ds-border); border-radius: 12px; padding: 24px; }
.fm { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.fm .x { grid-column: 1/-1; }
.fm label { font-size: 13px; color: var(--ds-text-secondary); display: block; }

footer {
  background: var(--ds-color-brand-deep);
  color: #9cc4d4;
  font-size: 13px;
  padding: 44px 0 20px;
  margin-top: 48px;
}
footer .fg { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1.2fr; gap: 28px; }
footer h5 { color: #fff; font-size: 14px; margin: 0 0 10px; }
footer a { display: block; color: #9cc4d4; padding: 3px 0; cursor: pointer; }
footer a:hover { color: var(--ds-brand-primary); }
footer .cp { border-top: 1px solid #24394D; margin-top: 28px; padding-top: 14px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 12px; }
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translate(-50%, 20px);
  background: var(--ds-color-brand-deep);
  color: #fff;
  border-radius: 99px;
  padding: 10px 22px;
  font-size: 13px;
  opacity: 0;
  transition: .3s;
  z-index: 50;
  pointer-events: none;
}
.toast.s { opacity: 1; transform: translate(-50%, 0); }
@media (max-width: 1000px) {
  .reference-home .hero .w { grid-template-columns: 1fr; gap: 26px; }
  .reference-home .feat { max-width: 560px; }
  .reference-home .g4, .reference-home .g3, .reference-home .prods, .reference-home .why, .reference-categories .g3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .reference-products .lay { grid-template-columns: 1fr; }
  .reference-products .fl { position: static; }
  .reference-products .prods { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .reference-home .w, .reference-products .w, .reference-categories .w { padding-inline: 16px; }
  .reference-home .hero { padding: 38px 0 60px; }
  .reference-home h1 { font-size: 27px; }
  .reference-home .stats .g { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .reference-home .st { border: 0; }
  .reference-home .g4, .reference-home .g3, .reference-home .prods, .reference-home .why, .reference-products .prods, .reference-categories .g3 { grid-template-columns: 1fr; }
  .reference-products .lay { gap: 14px; }
  .reference-products .fl { padding: 14px; }
  .reference-products .bar { align-items: flex-start; flex-direction: column; gap: 8px; }
  .reference-products .ph h1, .reference-categories .ph h1 { font-size: 23px; }
  .reference-home .band { padding: 22px 18px; }
  .reference-home .fm { grid-template-columns: 1fr; }
  .reference-home .fm .x { grid-column: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .reference-home *, .reference-products *, .reference-categories * { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
@keyframes fy { 50% { transform: translateY(-8px); } }
@keyframes pgp { to { transform: scaleX(1); } }
@keyframes pText { from { opacity: .4; } to { opacity: 1; } }

.reference-categories{font-family:var(--ds-font-family);background:var(--ds-page-bg);color:var(--ds-text-primary)}
.reference-categories .top,.reference-categories footer{background:var(--ds-color-brand-deep);color:var(--ds-color-on-brand-muted)}
.reference-categories .hero,.reference-categories .feat .img,.reference-categories .bf .im2{background:var(--ds-color-brand-dark);color:var(--ds-color-on-brand)}
.reference-categories .b1,.reference-categories .fab{background:var(--ds-primary-button);color:var(--ds-primary-button-text)}
.reference-categories .b1:hover,.reference-categories .fab:hover{background:var(--ds-primary-button-hover)}
.reference-categories .search{background:var(--ds-card-bg)}
.reference-categories .search input{color:var(--ds-text-primary)}
.reference-categories .tabs button.on{background:var(--ds-card-bg);color:var(--ds-text-primary)}
.reference-categories .ofr{background:var(--ds-brand-secondary);color:#FFFFFF}
.reference-categories .ofr .btn{background:var(--ds-card-bg);color:var(--ds-brand-secondary)}
.reference-categories .rfq,.reference-categories .p .im{background:var(--ds-surface-secondary)}
.reference-categories .bt.n{background:var(--ds-status-danger-bg);color:var(--ds-status-danger-fg)}
.reference-categories .bt.t{background:var(--ds-status-success-bg);color:var(--ds-status-success-fg)}
.reference-categories footer a,.reference-categories footer .nl input{color:var(--ds-color-on-brand-muted)}
.reference-categories .sh h2:after{background:var(--ds-brand-primary)}


/* NewTemp.html — exact public page geometry and visual rules. */
.reference-home,.reference-products,.reference-categories{--pri:var(--ds-brand-primary);--prh:var(--ds-brand-primary-hover);--pra:var(--ds-brand-primary-active);--sub:var(--ds-brand-primary-subtle);--sec:var(--ds-brand-secondary);--acc:var(--ds-brand-accent);--glow:var(--ds-brand-primary);--navy:var(--ds-navy);--pet:var(--ds-color-brand-dark);--bg:var(--ds-page-bg);--hdr:var(--ds-header-bg);--card:var(--ds-card-bg);--hv:var(--ds-card-hover);--s2:var(--ds-surface-secondary);--ln:var(--ds-border);--tx:var(--ds-text-primary);--mu:var(--ds-text-secondary);--mt:var(--ds-text-muted);--btn:var(--ds-primary-button);--btnh:var(--ds-primary-button-hover);--onb:var(--ds-primary-button-text);--out:var(--ds-outline-text);--lk:var(--ds-color-link);--am:var(--ds-color-primary-soft);--amt:var(--ds-color-primary-text);--ch:var(--ds-color-primary-soft);--ok:var(--ds-status-success-fg);--okb:var(--ds-status-success-bg);--okt:var(--ds-status-success-fg);--wn:var(--ds-status-warning-fg);--wnb:var(--ds-status-warning-bg);--er:var(--ds-status-danger-fg);--erb:var(--ds-status-danger-bg);--in:var(--ds-status-info-fg);--inb:var(--ds-status-info-bg);--sh:var(--ds-shadow-xs);}
:global(:root.app-dark) .reference-home,:global(:root.app-dark) .reference-products,:global(:root.app-dark) .reference-categories{--bg:var(--ds-page-bg);--hdr:var(--ds-header-bg);--card:var(--ds-card-bg);--hv:var(--ds-card-hover);--s2:var(--ds-surface-secondary);--ln:var(--ds-border);--tx:var(--ds-text-primary);--mu:var(--ds-text-secondary);--mt:var(--ds-text-muted);--btn:var(--ds-primary-button);--btnh:var(--ds-primary-button-hover);--onb:var(--ds-primary-button-text);--out:var(--ds-outline-text);--lk:var(--ds-color-link);--am:var(--ds-color-primary-soft);--amt:var(--ds-color-primary-text);--ch:var(--ds-color-primary-soft);--ok:var(--ds-status-success-fg);--okb:var(--ds-status-success-bg);--okt:var(--ds-status-success-fg);--wn:var(--ds-status-warning-fg);--wnb:var(--ds-status-warning-bg);--er:var(--ds-status-danger-fg);--erb:var(--ds-status-danger-bg);--in:var(--ds-status-info-fg);--inb:var(--ds-status-info-bg);--sh:var(--ds-shadow-xs);}

html{scroll-padding-top:60px}
*{box-sizing:border-box;margin:0}
body{font-family:Vazirmatn,Inter,Tahoma,sans-serif;background:var(--bg);color:var(--tx);line-height:1.7;font-size:14px}input::placeholder,textarea::placeholder{color:var(--mt)}
a{color:var(--lk);text-decoration:none}
.w{max-width:1200px;margin:auto;padding:0 24px}
.ic{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex:none}
.top{background:var(--navy);color:#b9d6e2;font-size:12px;padding:4px 0}
.top .w,.nav .w{display:flex;justify-content:space-between;align-items:center;gap:16px}
.top .ic{width:15px;height:15px;vertical-align:-3px}
.nav{background:var(--hdr);border-bottom:1px solid var(--ln);position:sticky;top:0;z-index:20;padding:0}
.logo{display:flex;gap:8px;align-items:center;font-weight:800;font-size:17px;color:var(--tx);cursor:pointer}
.logo svg{width:30px;height:30px}
.nav ul{display:flex;gap:4px;list-style:none;padding:0;align-items:center}
.nav li a{color:var(--mu);font-size:13px;font-weight:500;padding:6px 10px;border-radius:6px;display:block;transition:.2s;cursor:pointer}
.nav li a:hover{background:var(--hv);color:var(--lk)}.nav li a.a{background:var(--am);color:var(--amt)}
.tl{display:flex;gap:8px;align-items:center}
.ib{width:36px;height:36px;border-radius:8px;border:1px solid var(--ln);background:transparent;color:var(--tx);display:grid;place-items:center;cursor:pointer;position:relative}
.ib b{position:absolute;top:-6px;left:-6px;background:var(--btn);color:var(--onb);border-radius:9px;font-size:12px;min-width:18px;height:18px;line-height:18px;text-align:center}
.nav .w{min-height:56px}
.btn{border:0;height:36px;border-radius:8px;padding:0 16px;font:inherit;font-weight:600;font-size:13px;cursor:pointer;display:inline-flex;gap:8px;align-items:center;justify-content:center;transition:transform .2s,filter .2s}
.btn:hover{transform:translateY(-1px)}
.b1{background:var(--btn);color:var(--onb);position:relative;overflow:hidden}.b1:hover{background:var(--btnh);box-shadow:0 6px 18px color-mix(in srgb,var(--pri) 40%,transparent)}.hero .b1,.band .b1{background:var(--glow);color:#083344}.hero .b1:hover,.band .b1:hover{background:#67E8F9}.b1:after{content:"";position:absolute;top:0;left:-70%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.4),transparent);transform:skewX(-20deg);transition:left .7s}.b1:hover:after{left:140%}.btn:active{transform:scale(.97)}
.b2{background:transparent;color:var(--out);border:1px solid var(--out)}.b2:hover{background:var(--hv)}.b3{background:var(--sec);color:#fff}.b3:hover{filter:brightness(1.1)}.cta .btn{height:48px;border-radius:10px;padding:0 24px;font-size:15px}.sr .btn{height:44px;border-radius:8px}
.bw{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.4)}

/* Dynamic Fiber Optic Hero Animation */
.hero{background:linear-gradient(135deg,var(--navy),var(--pet));color:#fff;position:relative;overflow:hidden;padding:64px 0 88px}
.hero-bg-network{position:absolute;inset:0;width:100%;height:100%;opacity:.65;pointer-events:none}
.hero .w{position:relative;z-index:2}
.slides{display:grid}
.sl{grid-area:1/1;display:grid;grid-template-columns:1.15fr .85fr;gap:48px;align-items:center;opacity:0;visibility:hidden;transform:translateX(-70px);transition:opacity .6s,transform .8s cubic-bezier(.2,.8,.2,1),visibility 0s .8s}
.sl.lv{transform:translateX(70px)}.sl.on{opacity:1;visibility:visible;transform:none;transition:opacity .6s,transform .8s cubic-bezier(.2,.8,.2,1),visibility 0s}
.sl>div:first-child>*{opacity:0;transform:translateY(26px);transition:opacity .6s,transform .7s cubic-bezier(.2,.8,.2,1)}
.sl.on>div:first-child>*{opacity:1;transform:none}.sl.on>div:first-child>:nth-child(2){transition-delay:.15s}.sl.on>div:first-child>:nth-child(3){transition-delay:.3s}.sl.on>div:first-child>:nth-child(4){transition-delay:.45s}
.sl .hc{opacity:0;transform:translateX(-50px) scale(.94);transition:opacity .7s .2s,transform .9s .2s cubic-bezier(.2,.8,.2,1)}.sl.on .hc{opacity:1;transform:none}
.hc .dv{animation:fy 5s ease-in-out infinite}
.pg{display:flex;gap:8px;margin-top:28px;align-items:center}.pg b{flex:0 0 56px;height:4px;border-radius:4px;background:rgba(255,255,255,.2);cursor:pointer;position:relative;overflow:hidden}.pg b:after{content:"";position:absolute;inset:0;background:var(--glow);transform:scaleX(0);transform-origin:right}.pg b.on:after{animation:pgp 6s linear forwards}.hero:hover .pg b.on:after{animation-play-state:paused}.pg span{color:#9cc4d4;font-size:12px;margin-inline-start:8px;font-variant-numeric:tabular-nums}
.ar{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:#fff;cursor:pointer;display:grid;place-items:center;transition:.2s}.ar:first-of-type{margin-inline-start:auto}.ar:hover{background:var(--glow);color:#083344;transform:scale(1.1)}
.tag{color:var(--glow);font-weight:700;font-size:13px;display:flex;gap:8px;align-items:center}.tag:before{content:"";width:28px;height:2px;background:var(--glow)}
h1{font-size:36px;line-height:1.5;font-weight:800;margin:8px 0 12px}
.hero p{color:#c3dde8;max-width:560px}
.cta{display:flex;gap:12px;margin-top:24px;flex-wrap:wrap}
.hc{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:20px;backdrop-filter:blur(6px)}
.hc .dv{width:100%;background:rgba(0,26,39,.4);border-radius:12px}
.hc h3{font-size:16px;margin-top:12px}.hc small{color:#9cc4d4}
.hc .r{display:flex;justify-content:space-between;align-items:center;margin-top:8px}

/* Stats Section */
.stats{margin-top:-44px;position:relative;z-index:10}
.sg{background:var(--card);border-radius:12px;box-shadow:var(--sh);display:grid;grid-template-columns:repeat(4,1fr);padding:20px;border:1px solid var(--ln)}
.st{text-align:center;border-inline-start:1px solid var(--ln)}.st:first-child{border:0}
.st b{font-size:28px;color:var(--lk);display:block;font-variant-numeric:tabular-nums;line-height:1.4}.st>span{font-size:13px;color:var(--mu)}
.brands{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;padding:32px 0 4px}
.brands span{padding:6px 24px;color:var(--mu);font-weight:800;font-size:17px;letter-spacing:.5px;opacity:.65;transition:.2s}.brands span:hover{opacity:1;color:var(--lk)}
.sec{padding:40px 0 8px}
.sh{display:flex;justify-content:space-between;align-items:end;margin-bottom:20px;gap:12px}
.sh h2{font-size:24px;font-weight:800;color:var(--tx);position:relative;padding-bottom:12px}.sh h2:after{content:"";position:absolute;right:0;bottom:0;height:3px;width:44px;border-radius:3px;background:var(--pri)}
.sh p{color:var(--mu);font-size:13px}.sh a{font-size:13px;font-weight:700;cursor:pointer}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}

/* Advanced Category Cards */
.cb{background:var(--card);border:1px solid var(--ln);border-radius:14px;padding:0;transition:.25s;position:relative;overflow:hidden;display:flex;flex-direction:column;box-shadow:var(--sh)}
.cb:hover{transform:translateY(-4px);box-shadow:0 12px 28px rgba(16,42,67,.12);border-color:var(--pri)}
.cb-header-img{height:84px;background:linear-gradient(135deg,var(--navy),var(--pet));display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;border-bottom:1px solid var(--ln)}
.cb-header-img svg.bg-art{position:absolute;inset:0;width:100%;height:100%;opacity:.25}
.cb-header-img .dev-icon{position:relative;z-index:2;width:120px;height:54px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3))}
.cb-top{padding:16px 20px 12px;display:flex;justify-content:space-between;align-items:flex-start}
.cb-top-info h3{font-size:16px;font-weight:800;color:var(--tx);line-height:1.4}
.cb-top-info small{color:var(--mu);font-size:12px;display:block;margin-top:2px}
.cb-icon-box{width:40px;height:40px;border-radius:50%;background:var(--ch);color:var(--lk);display:grid;place-items:center;flex:none}
.cb-sublist{list-style:none;padding:0 20px 16px;margin:0;flex:1}
.cb-sublist li{border-top:1px solid var(--ln)}
.cb-sublist li a{display:block;padding:9px 0;color:var(--mu);font-size:13px;transition:color .2s,padding .2s;cursor:pointer}
.cb-sublist li a:hover{color:var(--lk);padding-inline-start:6px}
.cb-footer{padding:12px 20px 18px;margin-top:auto}
.cb-footer .mo{color:var(--lk);font-weight:700;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:gap .2s}
.cb:hover .cb-footer .mo{gap:8px}

.cat,.why>div,.bp{background:var(--card);border:1px solid var(--ln);border-radius:12px;padding:20px;transition:.25s;position:relative;overflow:hidden}
.p{background:var(--card);border:1px solid var(--ln);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;transition:.25s}
.p .im{display:block;background:var(--s2);padding:16px;position:relative;cursor:pointer}
.im em{position:absolute;top:12px;right:12px;font-style:normal;font-size:12px;line-height:24px;background:var(--card);color:var(--mu);padding:0 8px;border-radius:6px}
.im .dv{width:100%;height:110px}
.p .bd{padding:14px 16px;flex:1}
.br{font-size:12px;color:var(--lk);font-weight:600;display:flex;justify-content:space-between;align-items:center}.br span{display:inline-flex;align-items:center;height:24px;padding:0 8px;border-radius:6px;background:var(--okb);color:var(--okt);font-weight:600}
.p h3,.cat h3,.bp h3{font-size:14px;font-weight:600;color:var(--tx)}.sku{font-size:12px;color:var(--mu)}
.pr{margin-top:8px;font-weight:800;font-variant-numeric:tabular-nums}.pr.q{color:var(--lk)}.pr small{display:block;font-weight:400;font-size:12px;color:var(--mu)}
.ac{display:flex;gap:8px;padding:0 16px 16px}.ac .btn{flex:1;padding:0;font-size:13px}
.why{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.why b{display:block;color:var(--tx);margin:4px 0}
.band{margin:48px 0 16px;border-radius:12px;background:linear-gradient(120deg,var(--navy),var(--pet));color:#fff;padding:32px 36px;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;position:relative;overflow:hidden}
.band h3{font-size:22px}.band p{color:#b9d6e2;font-size:14px}
.bp .t{display:inline-flex;align-items:center;height:24px;font-size:12px;padding:0 8px;border-radius:6px;background:var(--ch);color:var(--lk);font-weight:600}
.bp h3{font-size:16px;margin:8px 0 4px;color:var(--tx)}.bp p{font-size:12px;color:var(--mu)}

/* Slide-over Drawers */
.drawer-overlay{position:fixed;inset:0;background:rgba(10,22,37,.6);backdrop-filter:blur(4px);z-index:90;opacity:0;visibility:hidden;transition:.3s}
.drawer-overlay.on{opacity:1;visibility:visible}
.drawer{position:fixed;top:0;left:0;bottom:0;width:380px;max-width:85vw;background:var(--card);box-shadow:var(--sh);z-index:100;transform:translateX(-100%);transition:transform .3s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column}
.drawer.on{transform:translateX(0)}
.dh{padding:18px 20px;border-bottom:1px solid var(--ln);display:flex;justify-content:space-between;align-items:center}
.dh h3{font-size:16px;font-weight:700}
.close-btn{background:transparent;border:0;color:var(--mu);font-size:22px;cursor:pointer}
.db{flex:1;overflow-y:auto;padding:20px}
.df{padding:20px;border-top:1px solid var(--ln);background:var(--s2)}
.cart-item{display:flex;gap:12px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--ln);align-items:center}
.cart-item .ci-placeholder{width:54px;height:54px;border-radius:8px;background:var(--ch);display:grid;place-items:center;flex:none}
.cart-item-info{flex:1}
.cart-item-info h4{font-size:13px;margin-bottom:4px}
.cart-item-info span{font-size:12px;color:var(--mu)}
.cart-item-ctrl{display:flex;gap:6px;align-items:center;margin-top:4px}
.cart-item-ctrl button{width:22px;height:22px;border:1px solid var(--ln);background:var(--card);border-radius:4px;cursor:pointer}

/* Search Modal Overlay */
.search-modal-overlay{position:fixed;inset:0;background:rgba(10,22,37,.7);backdrop-filter:blur(6px);z-index:110;display:flex;align-items:flex-start;justify-content:center;padding-top:100px;opacity:0;visibility:hidden;transition:.3s}
.search-modal-overlay.on{opacity:1;visibility:visible}
.search-modal-box{background:var(--card);border:1px solid var(--ln);border-radius:14px;width:90%;max-width:600px;box-shadow:var(--sh);padding:24px;transform:translateY(-20px);transition:transform .3s}
.search-modal-overlay.on .search-modal-box{transform:translateY(0)}

/* Loader */
#ld{position:fixed;inset:0;background:#060D17;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999;transition:opacity .4s}
#ld.x{opacity:0;pointer-events:none;visibility:hidden}
.fiber-loader-svg{width:min(440px,90vw);height:auto}
.wait-text{margin-top:20px;font-size:16px;font-weight:600;color:#67E8F9;animation:pText 1.5s ease-in-out infinite alternate}

#pb{position:fixed;top:0;right:0;height:3px;width:0;background:var(--pri);box-shadow:0 0 10px var(--pri);z-index:60}

.lay{display:grid;grid-template-columns:250px 1fr;gap:20px;margin:16px 0 40px}
.fl{background:var(--card);border:1px solid var(--ln);border-radius:12px;padding:18px;align-self:start;font-size:13px}
.fl h4{font-size:14px;margin:0 0 6px}.fl label{display:block;color:var(--mu);cursor:pointer;padding:2px 0}.fl hr{border:0;border-top:1px solid var(--ln);margin:14px 0}
.bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;color:var(--mu);font-size:13px}
.fm textarea{height:auto!important;padding:10px 12px!important}select,.fm input,.fm textarea,.fm select{font:inherit;font-size:14px;height:44px;padding:0 12px;border-radius:8px;border:1px solid var(--ln);background:var(--card);color:var(--tx);width:100%}
.box{background:var(--card);border:1px solid var(--ln);border-radius:12px;padding:24px}
.fm{display:grid;grid-template-columns:1fr 1fr;gap:14px}.fm .x{grid-column:1/-1}.fm label{font-size:13px;color:var(--mu);display:block}

footer{background:var(--navy);color:#9cc4d4;font-size:13px;padding:44px 0 20px;margin-top:48px}
footer .fg{display:grid;grid-template-columns:1.6fr 1fr 1fr 1.2fr;gap:28px}
footer h5{color:#fff;font-size:14px;margin:0 0 10px}footer a{display:block;color:#9cc4d4;padding:3px 0;cursor:pointer}footer a:hover{color:var(--glow)}
footer .cp{border-top:1px solid #24394D;margin-top:28px;padding-top:14px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:12px}
.toast{position:fixed;bottom:20px;left:50%;transform:translate(-50%,20px);background:var(--navy);color:#fff;border-radius:99px;padding:10px 22px;font-size:13px;opacity:0;transition:.3s;z-index:50;pointer-events:none}
.toast.s{opacity:1;transform:translate(-50%,0)}
@media(max-width:1000px){.reference-home .hero .w{grid-template-columns:1fr;gap:26px}.reference-home .feat{max-width:560px}.reference-home .g4,.reference-home .g3,.reference-home .prods,.reference-home .why,.reference-categories .g3{grid-template-columns:repeat(2,minmax(0,1fr))}.reference-products .lay{grid-template-columns:1fr}.reference-products .fl{position:static}.reference-products .prods{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.reference-home .w,.reference-products .w,.reference-categories .w{padding-inline:16px}.reference-home .hero{padding:38px 0 60px}.reference-home h1{font-size:27px}.reference-home .stats .g{grid-template-columns:repeat(2,1fr);gap:12px}.reference-home .st{border:0}.reference-home .g4,.reference-home .g3,.reference-home .prods,.reference-home .why,.reference-products .prods,.reference-categories .g3{grid-template-columns:1fr}.reference-products .lay{gap:14px}.reference-products .fl{padding:14px}.reference-products .bar{align-items:flex-start;flex-direction:column;gap:8px}.reference-products .ph h1,.reference-categories .ph h1{font-size:23px}.reference-home .band{padding:22px 18px}.reference-home .fm{grid-template-columns:1fr}.reference-home .fm .x{grid-column:auto}}@media(prefers-reduced-motion:reduce){.reference-home *, .reference-products *, .reference-categories *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
@keyframes fy{50%{transform:translateY(-8px)}}
@keyframes pgp{to{transform:scaleX(1)}}
@keyframes pText{from{opacity:.4}to{opacity:1}}

</style>