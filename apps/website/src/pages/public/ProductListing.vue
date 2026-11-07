<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import { productSalesMode, productPriceLabel } from './homePresentation.js'

const route = useRoute()
const productsStore = useProductsStore()
const products = ref([])
const categories = ref([])
const loading = ref(false)
const error = ref('')
const page = ref(1)
const pageSize = ref(24)
const totalPages = ref(1)
const totalItems = ref(0)
const purchaseMode = ref('')
const selectedBrands = ref([])
const selectedCategories = ref([])
const sortMode = ref('newest')
const minPrice = ref('')
const maxPrice = ref('')
const brandOptions = computed(() => [...new Set(products.value.map(item => item.brand || item.company?.name).filter(Boolean))].sort((a,b) => a.localeCompare(b)))
const categoryOptions = computed(() => categories.value.map(item => ({ id: item.id, name: item.nameFa || item.name || item.nameEn || item.slug, count: Number(item.productCount ?? item.productsCount ?? item._count?.products) || null })))
const visibleProducts = computed(() => {
  const list = products.value.filter(product => {
    const brand = product.brand || product.company?.name || ''
    const categoryId = product.categoryId ?? product.category?.id
    const isRetail = productSalesMode(product)?.kind === 'fixed'
    if (purchaseMode.value === 'retail' && !isRetail) return false
    if (purchaseMode.value === 'inquiry' && isRetail) return false
    if (selectedBrands.value.length && !selectedBrands.value.includes(brand)) return false
    if (selectedCategories.value.length && !selectedCategories.value.some(id => String(id) === String(categoryId))) return false
    return true
  })
  if (sortMode.value === 'price') return list.slice().sort((a, b) => Number(a?.finalPrice ?? a?.price ?? a?.prices?.[0]?.price ?? a?.priceTiers?.[0]?.unitPrice ?? Infinity) - Number(b?.finalPrice ?? b?.price ?? b?.prices?.[0]?.price ?? b?.priceTiers?.[0]?.unitPrice ?? Infinity))
  if (sortMode.value === 'featured') return list.slice().sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
  return list
})
function title(product) { return product?.title || product?.name || 'محصول بدون عنوان' }
function brand(product) { return product?.brand || product?.company?.name || '—' }
function sku(product) { return product?.sku || product?.SKU || product?.catalogCode || '—' }
function category(product) { return product?.category?.nameFa || product?.category?.name || product?.category?.nameEn || '—' }
function image(product) { return product?.images?.find(x => x?.isPrimary && x?.url)?.url || product?.images?.find(x => x?.url)?.url || '' }
function price(product) { const label = productPriceLabel(product); return !label || label === 'استعلامی' ? 'قیمت با استعلام' : label }
function isRetail(product) { return productSalesMode(product)?.kind === 'fixed' }
function routeToProduct(product) { return { name: 'product-details', params: { id: product.id } } }
function fa(value) { return Number(value || 0).toLocaleString('fa-IR') }
function toggle(list, value) {
  const index = list.indexOf(value)
  if (index >= 0) list.splice(index, 1)
  else list.push(value)
}
async function loadCategories() {
  try {
    const result = await productsStore.getCategories()
    categories.value = Array.isArray(result) ? result : []
  } catch { categories.value = [] }
}
async function loadProducts() {
  loading.value = true
  error.value = ''
  try {
    const params = { page: page.value, limit: pageSize.value, status: 'PUBLISHED' , sortBy: 'createdAt', sortOrder: 'desc' }
    if (selectedCategories.value.length === 1) params.categoryId = Number(selectedCategories.value[0])
    if (minPrice.value !== '') params.minPrice = Number(minPrice.value)
    if (maxPrice.value !== '') params.maxPrice = Number(maxPrice.value)
    if (purchaseMode.value === 'retail') params.retailEnabled = true
    const result = await productsStore.getProducts(params) || {}
    const payload = result.data ?? result
    const list = Array.isArray(payload) ? payload : (payload.products ?? payload.items ?? payload.data ?? [])
    products.value = Array.isArray(list) ? list : []
    totalPages.value = Number(result.meta?.totalPages ?? payload.meta?.totalPages ?? result.totalPages ?? 1) || 1
    totalItems.value = Number(result.meta?.total ?? payload.meta?.total ?? result.total ?? products.value.length) || 0
  } catch {
    error.value = 'دریافت محصولات ناموفق بود. لطفاً دوباره تلاش کنید.'
    products.value = []
    totalItems.value = 0
  } finally { loading.value = false }
}
function applyFilters() { page.value = 1; loadProducts() }
function clearFilters() {
  purchaseMode.value = ''
  selectedBrands.value = []
  selectedCategories.value = []
  minPrice.value = ''
  maxPrice.value = ''
  sortMode.value = 'newest'
  page.value = 1
  loadProducts()
}
function changeSort(value) {
  sortMode.value = value
  applyFilters()
}
function changePage(next) { page.value = Math.min(totalPages.value, Math.max(1, next)); loadProducts() }
onMounted(async () => {
  if (route.query.retail === '1' || route.query.retail === 'true') purchaseMode.value = 'retail'
  const initialCategory = Number(route.query.category)
  if (Number.isInteger(initialCategory) && initialCategory > 0) selectedCategories.value = [initialCategory]
  await Promise.all([loadCategories(), loadProducts()])
})
watch(() => route.query.category, value => { const id = Number(value); selectedCategories.value = value && Number.isInteger(id) && id > 0 ? [id] : []; page.value = 1; loadProducts() })
watch(() => route.query.retail, value => { purchaseMode.value = value === '1' || value === 'true' ? 'retail' : ''; page.value = 1; loadProducts() })
</script>

<template>
<main class="reference-products" dir="rtl">
  <div class="w pg">
    <div class="bc"><router-link :to="{ name: 'home' }">صفحه اصلی</router-link> / همه محصولات</div>
    <div class="ph"><h1>همه محصولات</h1><p>محصولات تخصصی تأمین‌کنندگان؛ خرید فوری یا ثبت استعلام</p></div>
    <div class="lay">
      <aside class="fl">
        <div class="filter-head"><h3>فیلتر محصولات</h3><button type="button" @click="clearFilters">حذف همه</button></div>
        <h4>نوع خرید</h4>
        <select v-model="purchaseMode" class="filter-select" @change="applyFilters"><option value="">همه محصولات</option><option value="retail">خرید فوری (قیمت مشخص)</option><option value="inquiry">فقط استعلامی</option></select>
        <hr><h4>برند</h4>
        <div v-if="brandOptions.length"><label v-for="item in brandOptions" :key="item"><input type="checkbox" :checked="selectedBrands.includes(item)" @change="toggle(selectedBrands, item); applyFilters()"><span>{{ item }}</span></label></div>
        <small v-else class="filter-empty">برندی در این صفحه دریافت نشده است.</small>
        <hr><h4>دسته‌بندی</h4>
        <div><label v-for="item in categoryOptions" :key="item.id"><input type="checkbox" :checked="selectedCategories.includes(item.id)" @change="toggle(selectedCategories, item.id); applyFilters()"><span>{{ item.name }}</span></label></div>
        <hr><h4>محدوده قیمت <small>ریال</small></h4>
        <div class="price-fields"><input v-model="minPrice" type="number" min="0" placeholder="از" aria-label="حداقل قیمت"><span>تا</span><input v-model="maxPrice" type="number" min="0" placeholder="تا" aria-label="حداکثر قیمت"></div>
        <button class="btn b1 apply-filter" type="button" @click="applyFilters">اعمال فیلترها</button>
      </aside>
      <section class="products-area" aria-label="فهرست محصولات" :aria-busy="loading">
        <div class="bar"><span>{{ fa(totalItems) }} محصول</span><label>مرتب‌سازی: <select :value="sortMode" @change="changeSort($event.target.value)"><option value="newest">جدیدترین</option><option value="featured">محصولات منتخب</option><option value="price">ارزان‌ترین</option></select></label></div>
        <div v-if="loading" class="empty-state">در حال دریافت محصولات…</div>
        <div v-else-if="error" class="empty-state"><b>دریافت محصولات ناموفق بود</b><span>{{ error }}</span><button class="btn b2" type="button" @click="loadProducts">تلاش دوباره</button></div>
        <div v-else-if="!visibleProducts.length" class="empty-state"><b>محصولی یافت نشد</b><span>فیلترها را تغییر دهید یا همه محصولات را مشاهده کنید.</span><button class="btn b2" type="button" @click="clearFilters">حذف فیلترها</button></div>
        <div v-else class="prods">
          <article v-for="product in visibleProducts" :key="product.id" class="p">
            <router-link class="im" :to="routeToProduct(product)"><img v-if="image(product)" :src="image(product)" :alt="title(product)"><span v-else>{{ brand(product) }}</span><em>{{ category(product) }}</em></router-link>
            <div class="bd"><div class="br">{{ brand(product) }}<span v-if="product.company?.isVerified">✓ تأییدشده</span></div><h3>{{ title(product) }}</h3><div class="sk">{{ sku(product) }}</div><div class="pr" :class="{ q: !isRetail(product) }">{{ price(product) }}<small>{{ isRetail(product) ? 'خرید خرده‌فروشی' : 'مناسب خرید سازمانی' }}</small></div></div>
            <div class="ac"><router-link class="btn b1" :to="routeToProduct(product)">مشاهده محصول</router-link><router-link class="btn b2" :to="routeToProduct(product)">جزئیات</router-link></div>
          </article>
        </div>
        <div v-if="totalPages > 1" class="pagination"><button type="button" :disabled="page <= 1" @click="changePage(page - 1)">قبلی</button><span>صفحه {{ fa(page) }} از {{ fa(totalPages) }}</span><button type="button" :disabled="page >= totalPages" @click="changePage(page + 1)">بعدی</button></div>
      </section>
    </div>
  </div>
</main>
</template>
<style scoped>
.reference-products{--bg:#f4f5fa;--card:#fff;--text:#12182b;--muted:#6b7390;--line:#e4e7f2;--pri:#6c5ce7;--pri2:#2aa7e8;--ok:#0f9d73;--chip:#eceaff;--hero1:#0a2540;--hero2:#126b8a;min-height:60vh;background:var(--bg);color:var(--text);font-family:Vazirmatn,Tahoma,sans-serif}
.reference-products .filter-head{display:flex;align-items:center;justify-content:space-between;margin:-2px 0 14px;padding-bottom:12px;border-bottom:1px solid var(--line)}
.reference-products .filter-head h3{font-size:15px;margin:0}
.reference-products .filter-head button{border:0;background:transparent;color:var(--pri);font:inherit;font-size:11px;cursor:pointer}
.reference-products .filter-select{width:100%;margin:0 0 4px}
.reference-products .fl label{display:flex;align-items:center;gap:7px}
.reference-products .fl label input{accent-color:var(--pri)}
.reference-products .filter-empty{color:var(--muted);font-size:11px}
.reference-products .price-fields{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:6px;align-items:center}
.reference-products .price-fields input{width:100%;min-width:0;height:36px;padding:6px 8px;border:1px solid var(--line);border-radius:9px;background:var(--card);color:var(--text);font:inherit;font-size:11px}
.reference-products .price-fields span{font-size:10px;color:var(--muted)}
.reference-products .apply-filter{width:100%;margin-top:10px}
.reference-products .products-area{min-width:0}
.reference-products .products-area .prods{grid-template-columns:repeat(3,minmax(0,1fr))}
.reference-products .products-area .im{display:grid;text-decoration:none}
.reference-products .products-area .im img{width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;padding:12px}
.reference-products .products-area .im span{align-self:center}
.reference-products .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:260px;padding:30px;border:1px dashed var(--line);border-radius:14px;background:var(--card);color:var(--muted);text-align:center;font-size:13px}
.reference-products .empty-state b{color:var(--text)}
.reference-products .pagination{display:flex;justify-content:center;align-items:center;gap:18px;margin-top:18px;padding:14px;background:var(--card);border:1px solid var(--line);border-radius:12px;font-size:12px}
.reference-products .pagination button{border:1px solid var(--line);border-radius:8px;padding:7px 12px;background:var(--card);color:var(--pri);font:inherit;cursor:pointer}
.reference-products .pagination button:disabled{opacity:.4;cursor:not-allowed}

:root{--bg:#f4f5fa;--card:#fff;--text:#12182b;--muted:#6b7390;--line:#e4e7f2;--pri:#6c5ce7;--pri2:#2aa7e8;--ok:#0f9d73;--hero1:#0a2540;--hero2:#126b8a;--chip:#eceaff;
box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0e1220;--card:#171c30;--text:#eef0f8;--muted:#9aa3c2;--line:#262d49;--chip:#262a4d;--hero1:#06182c;--hero2:#0c4a63}}
*{box-sizing:border-box;margin:0}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
body{font-family:Vazirmatn,Tahoma,sans-serif;background:var(--bg);color:var(--text);line-height:1.7}
.w{max-width:1240px;margin:auto;padding:0 20px}
.top{background:#0b1020;color:#c9d1ee;font-size:12px;padding:6px 0}
.top .w,.nav .w{display:flex;justify-content:space-between;align-items:center;gap:16px}
.nav{background:var(--card);border-bottom:1px solid var(--line);padding:12px 0}
.logo{font-weight:800;font-size:18px;display:flex;gap:10px;align-items:center}
.logo i{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--pri2),var(--pri));display:block}
.nav ul{display:flex;gap:22px;list-style:none;padding:0;font-size:14px;color:var(--muted)}
.nav li a{color:inherit;text-decoration:none}.nav li.a,.nav li.a a{color:var(--pri);font-weight:700}
.tools{display:flex;gap:10px;align-items:center;font-size:13px}
.btn{border:0;border-radius:10px;padding:10px 18px;font:inherit;font-weight:700;font-size:14px;cursor:pointer}
.b1{background:linear-gradient(90deg,var(--pri),var(--pri2));color:#fff}
.b2{background:transparent;color:var(--pri);border:1px solid var(--pri)}
.hero{background:linear-gradient(135deg,var(--hero1),var(--hero2));color:#fff;padding:44px 0 56px}
.hero .w{display:grid;grid-template-columns:1.2fr 1fr;gap:36px;align-items:center}
.tag{color:#7fe3ff;font-size:13px;font-weight:500}
h1{font-size:38px;line-height:1.5;font-weight:800;margin:6px 0 10px}
.hero p{color:#cfe6f2;font-size:14px;max-width:560px}
.tabs{display:inline-flex;background:rgba(255,255,255,.12);border-radius:12px;padding:4px;margin:20px 0 12px}
.tabs button{border:0;background:transparent;color:#d9ecf6;font:inherit;font-size:13px;font-weight:700;padding:8px 18px;border-radius:9px;cursor:pointer}
.tabs button.on{background:#fff;color:#12182b}
.search{display:flex;background:#fff;border-radius:12px;padding:6px;max-width:600px}
.search input{flex:1;border:0;outline:0;font:inherit;font-size:14px;padding:0 12px;color:#12182b;background:transparent;min-width:0}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;font-size:12px;color:#bcd9e8;align-items:center}
.chips span.c{background:rgba(255,255,255,.14);padding:2px 12px;border-radius:99px}
.cta2{display:flex;gap:12px;margin-top:20px;flex-wrap:wrap}
.cta2 .btn.b2{color:#fff;border-color:rgba(255,255,255,.5)}
.feat{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:18px;padding:18px;backdrop-filter:blur(6px)}
.feat .img{height:190px;border-radius:12px;background:linear-gradient(135deg,#1c5d7d,#2d8aa8);display:grid;place-items:center;font-size:44px;font-weight:800;opacity:.9;letter-spacing:2px}
.feat h3{margin-top:12px;font-size:16px}.feat small{color:#bcd9e8}
.feat .row{display:flex;justify-content:space-between;align-items:center;margin-top:10px}
.stats{margin-top:-30px;position:relative}
.stats .g{background:var(--card);border-radius:16px;box-shadow:0 8px 30px rgba(20,30,70,.12);display:grid;grid-template-columns:repeat(4,1fr);padding:18px}
.st{text-align:center;border-inline-start:1px solid var(--line)}.st:first-child{border:0}
.st b{font-size:24px;color:var(--pri);display:block}.st span{font-size:12px;color:var(--muted)}
.brands{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;padding:26px 0 6px;color:var(--muted);font-weight:800;font-size:17px}
.brands span{padding:6px 22px;border:1px dashed var(--line);border-radius:10px;letter-spacing:.5px}
.sec{padding:30px 0 4px}
.sh{display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid var(--line);margin-bottom:18px;padding-bottom:8px}
.sh h2{font-size:22px;position:relative;font-weight:800}
.sh h2:after{content:"";position:absolute;right:0;bottom:-10px;width:44px;height:3px;border-radius:3px;background:linear-gradient(90deg,var(--pri2),var(--pri))}
.sh a{font-size:13px;color:var(--pri);text-decoration:none;font-weight:700}
.cats{display:grid;grid-template-columns:repeat(6,1fr);gap:14px}
.cat{background:var(--card);border-radius:14px;padding:16px 12px;text-align:center;box-shadow:0 2px 10px rgba(20,30,70,.06);font-size:13px;font-weight:700}
.cat i{display:grid;place-items:center;width:46px;height:46px;margin:0 auto 8px;border-radius:12px;background:var(--chip);color:var(--pri);font-style:normal;font-size:20px}
.cat small{display:block;color:var(--muted);font-weight:400;font-size:11px}
.prods{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.p{background:var(--card);border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(20,30,70,.06);display:flex;flex-direction:column}
.p .im{height:130px;background:linear-gradient(135deg,var(--chip),var(--bg));display:grid;place-items:center;position:relative;font-weight:800;color:var(--pri);font-size:22px}
.p .im em{position:absolute;top:10px;right:10px;font-style:normal;font-size:11px;background:var(--card);color:var(--muted);padding:1px 10px;border-radius:6px;font-weight:500}
.p .bd{padding:14px;flex:1}
.br{font-size:12px;color:var(--pri);font-weight:700;display:flex;justify-content:space-between}
.br span{color:var(--ok);font-weight:500}
.p h3{font-size:15px;margin:2px 0}
.p .sk{font-size:11px;color:var(--muted)}
.pr{margin-top:10px;font-weight:800}.pr small{font-weight:400;color:var(--muted);font-size:11px;display:block}
.pr.q{color:var(--pri)}
.ac{display:flex;gap:8px;padding:0 14px 14px}
.ac .btn{padding:8px 0;flex:1;font-size:13px}
.why{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.why div{background:var(--card);border-radius:14px;padding:18px;box-shadow:0 2px 10px rgba(20,30,70,.06);font-size:13px;color:var(--muted)}
.why b{display:block;color:var(--text);font-size:15px;margin-bottom:4px}
.rfq{margin:34px 0;border-radius:18px;background:linear-gradient(90deg,var(--chip),var(--card));padding:26px 30px;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;border:1px solid var(--line)}
.rfq h3{font-size:20px}.rfq p{font-size:13px;color:var(--muted)}
footer{background:#0b1020;color:#9aa3c2;font-size:13px;padding:28px 0;margin-top:20px}
footer .w{display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px}
.rk{position:absolute;top:10px;left:10px;background:var(--pri);color:#fff;border-radius:8px;font-size:12px;padding:0 9px;font-style:normal}.pr small.sold{color:var(--ok)}
.bc{font-size:13px;color:var(--muted);padding:18px 0 4px}.bc a{color:var(--pri);text-decoration:none}
.ph{padding:6px 0 4px}.ph h1{font-size:28px;color:var(--text);margin:0}.ph p{color:var(--muted);font-size:14px}
.lay{display:grid;grid-template-columns:250px 1fr;gap:20px;margin:18px 0}
.fl{background:var(--card);border-radius:14px;padding:18px;box-shadow:0 2px 10px rgba(20,30,70,.06);align-self:start;font-size:13px}
.fl h4{font-size:14px;margin:0 0 8px}.fl label{display:block;padding:3px 0;color:var(--muted);cursor:pointer}.fl hr{border:0;border-top:1px solid var(--line);margin:14px 0}
.bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:13px;color:var(--muted)}
select{font:inherit;font-size:13px;padding:7px 10px;border-radius:9px;border:1px solid var(--line);background:var(--card);color:var(--text)}
.pg .prods{grid-template-columns:repeat(3,1fr)}
.cbig{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:18px 0}
.cb{background:var(--card);border-radius:16px;padding:22px;box-shadow:0 2px 10px rgba(20,30,70,.06)}
.cb .t{display:flex;gap:12px;align-items:center;margin-bottom:12px}.cb .t i{width:50px;height:50px;border-radius:13px;background:var(--chip);color:var(--pri);display:grid;place-items:center;font-style:normal;font-size:22px}
.cb h3{font-size:16px}.cb .t small{color:var(--muted);font-size:12px;display:block}
.cb ul{list-style:none;padding:0;font-size:13px;color:var(--muted)}.cb li{padding:5px 0;border-top:1px solid var(--line)}.cb a{color:var(--pri);font-size:13px;font-weight:700;text-decoration:none;display:inline-block;margin-top:8px}
footer{padding:40px 0 18px}footer .fg{display:grid;grid-template-columns:1.5fr 1fr 1fr 1.2fr 1.4fr;gap:28px}footer h5{color:#fff;font-size:14px;margin:0 0 10px}footer a{display:block;color:#9aa3c2;text-decoration:none;padding:3px 0}footer .nl{display:flex;gap:6px;margin-top:8px}footer .nl input{flex:1;min-width:0;border-radius:9px;border:0;padding:8px 10px;font:inherit;font-size:12px}footer .cp{border-top:1px solid #1d2440;margin-top:26px;padding-top:14px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:12px}
@media(max-width:900px){.lay{grid-template-columns:1fr}.pg .prods,.cbig{grid-template-columns:repeat(2,1fr)}footer .fg{grid-template-columns:1fr 1fr}}
.hero{position:relative}.hero .w{transition:opacity .25s}.hero .w.fo{opacity:0}
.ha{position:absolute;top:50%;width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font-size:18px;cursor:pointer;transform:translateY(-50%)}.ha:hover{background:rgba(255,255,255,.32)}.ha.pv{right:10px}.ha.nx{left:10px}
.dots{position:absolute;bottom:42px;left:50%;transform:translateX(-50%);display:flex;gap:8px}.dots b{width:9px;height:9px;border-radius:9px;background:rgba(255,255,255,.4);cursor:pointer;transition:.25s}.dots b.on{width:26px;background:#fff}
.cats{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:14px;scrollbar-width:none;padding:4px 2px 10px}.cats::-webkit-scrollbar{display:none}.cats .cat{flex:0 0 172px;scroll-snap-align:start}
.sn{display:flex;gap:8px}.sn button{width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:var(--card);color:var(--pri);cursor:pointer;font-size:16px}
.bl{display:grid;grid-template-columns:1.2fr 1fr;gap:16px}.bf{background:var(--card);border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(20,30,70,.06)}.bf .im2{height:210px;background:linear-gradient(135deg,var(--hero1),var(--hero2));display:grid;place-items:center;color:#fff;font-size:40px;font-weight:800;opacity:.95}.bf .tx{padding:18px}
.bt{display:inline-block;font-size:11px;padding:1px 10px;border-radius:99px;background:var(--chip);color:var(--pri);font-weight:700}.bt.n{background:#ffe9ea;color:#c0364b}.bt.t{background:#e0f6ee;color:var(--ok)}
.bf h3{font-size:18px;margin:8px 0 4px}.bf p,.bi p{font-size:13px;color:var(--muted)}.bd2{font-size:11px;color:var(--muted)}
.bs{display:flex;flex-direction:column;gap:12px}.bi{background:var(--card);border-radius:14px;padding:14px 16px;box-shadow:0 2px 10px rgba(20,30,70,.06);display:flex;gap:12px;align-items:center;flex:1}.bi i{flex:0 0 64px;height:64px;border-radius:12px;background:var(--chip);color:var(--pri);display:grid;place-items:center;font-style:normal;font-size:24px}.bi h4{font-size:14px;margin:2px 0}
.fab{position:fixed;left:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:20;background:linear-gradient(90deg,var(--pri),var(--pri2));color:#fff;border:0;border-radius:99px;padding:12px 20px;font:inherit;font-weight:700;font-size:13px;box-shadow:0 8px 24px rgba(40,60,140,.35);cursor:pointer}
.ofr{margin-top:34px;border-radius:18px;background:linear-gradient(100deg,#7b2ff7,#2aa7e8);color:#fff;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap}.ofr h3{font-size:20px}.ofr p{font-size:13px;opacity:.9}
.tm{display:flex;gap:8px;direction:ltr}.tm div{background:rgba(255,255,255,.18);border-radius:10px;padding:6px 12px;text-align:center;min-width:58px}.tm b{display:block;font-size:20px}.tm span{font-size:10px}
.ofr .btn{background:#fff;color:#4b3bd6}
.tms{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.tc{background:var(--card);border-radius:14px;padding:18px;box-shadow:0 2px 10px rgba(20,30,70,.06);font-size:13px;color:var(--muted)}.tc q{display:block;color:var(--text);font-size:14px;margin-bottom:12px;quotes:none}.tc b{color:var(--text);display:block}.tc .av{width:38px;height:38px;border-radius:50%;background:var(--chip);color:var(--pri);display:grid;place-items:center;font-weight:800;float:right;margin-left:10px}
.cg{margin-top:34px;border-radius:18px;background:var(--card);border:1px solid var(--line);padding:24px 28px;display:grid;grid-template-columns:1fr 1.2fr;gap:24px;align-items:center}.cg h3{font-size:20px}.cg p{font-size:13px;color:var(--muted)}
.cg .fm{display:flex;gap:8px;flex-wrap:wrap}.cg input{flex:1;min-width:150px;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font:inherit;font-size:13px;background:var(--bg);color:var(--text)}.cg .ok{color:var(--ok);font-size:13px;margin-top:8px;width:100%}
.faq details{background:var(--card);border-radius:12px;padding:14px 18px;margin-bottom:10px;box-shadow:0 2px 10px rgba(20,30,70,.05);font-size:14px}.faq summary{cursor:pointer;font-weight:700}.faq details p{color:var(--muted);font-size:13px;margin-top:8px}
.cmp{display:block;padding:0 14px 8px;font-size:12px;color:var(--muted);cursor:pointer}
.cbar{position:fixed;bottom:calc(18px + env(safe-area-inset-bottom,0px));right:50%;transform:translateX(50%);z-index:20;background:var(--text);color:var(--bg);border-radius:99px;padding:10px 22px;font-size:13px;font-weight:700;display:none}
@media(max-width:900px){.tms,.cg{grid-template-columns:1fr}}
@media(max-width:900px){.bl{grid-template-columns:1fr}.ha{display:none}}
@media(max-width:900px){.hero .w{grid-template-columns:1fr}.cats{grid-template-columns:repeat(3,1fr)}.prods,.why{grid-template-columns:repeat(2,1fr)}.stats .g{grid-template-columns:repeat(2,1fr);gap:12px}.nav ul{display:none}h1{font-size:28px}}

@media(prefers-color-scheme:dark){.reference-products:not([data-theme="light"]){--bg:#0e1220;--card:#171c30;--text:#eef0f8;--muted:#9aa3c2;--line:#262d49;--chip:#262a4d;--hero1:#06182c;--hero2:#0c4a63}}
</style>