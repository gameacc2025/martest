<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const activeCategory = ref('همه مطالب')
const searchQuery = ref('')

const articles = [
  { slug: 'fiber-optic-cable-guide', title: 'راهنمای انتخاب کابل فیبر نوری؛ از ساختار تا کاربرد', excerpt: 'برای انتخاب کابل مناسب پروژه، باید نوع فیبر، تعداد کور، ساختار حفاظتی و شرایط نصب را کنار هم بررسی کنید.', category: 'فیبر نوری', kind: 'راهنمای خرید', readTime: '۷ دقیقه', dateLabel: 'راهنمای تخصصی', icon: 'pi pi-share-alt', tone: 'cyan', featured: true, body: ['انتخاب کابل فیبر نوری فقط به تعداد کور محدود نمی‌شود. مسیر نصب، محیط بهره‌برداری، میزان رطوبت، فشار مکانیکی و شعاع خمش، همگی در انتخاب نهایی نقش دارند.', 'برای مسیرهای بیرونی، کابل باید متناسب با شرایط محیطی و روش نصب انتخاب شود. در مسیرهای داخلی، ابعاد، انعطاف‌پذیری و استانداردهای ایمنی ساختمان اهمیت بیشتری پیدا می‌کنند.', 'پیش از خرید، تعداد کور موردنیاز فعلی و ظرفیت توسعه آینده را مشخص کنید؛ سپس نوع فیبر، ساختار کابل و تجهیزات جانبی سازگار را با مشخصات فنی پروژه تطبیق دهید.'], related: ['otdr-buying-guide', 'fiber-accessories-checklist'] },
  { slug: 'otdr-buying-guide', title: 'هنگام خرید OTDR به چه مشخصاتی توجه کنیم؟', excerpt: 'برد دینامیکی، ناحیه مرده، طول موج و دقت اندازه‌گیری را متناسب با شبکه خود مقایسه کنید.', category: 'تجهیزات تست', kind: 'راهنمای خرید', readTime: '۶ دقیقه', dateLabel: 'راهنمای تخصصی', icon: 'pi pi-chart-line', tone: 'blue', featured: true, body: ['OTDR یکی از ابزارهای اصلی عیب‌یابی لینک‌های فیبر نوری است؛ اما انتخاب مدل مناسب باید بر اساس نوع شبکه و سناریوی اندازه‌گیری انجام شود.', 'برد دینامیکی، ناحیه مرده رویداد و تضعیف، طول موج‌های پشتیبانی‌شده و امکان ذخیره و تحلیل گزارش از مشخصات مهم دستگاه هستند.', 'پیش از نهایی‌کردن خرید، سازگاری کانکتورها، اقلام همراه، خدمات کالیبراسیون و آموزش کاربری را نیز بررسی کنید.'], related: ['fiber-optic-cable-guide', 'fiber-accessories-checklist'] },
  { slug: 'network-switch-selection', title: 'چطور سوئیچ شبکه مناسب پروژه سازمانی را انتخاب کنیم؟', excerpt: 'تعداد پورت، سرعت uplink، قابلیت مدیریتی و توان PoE را با نیاز واقعی شبکه تطبیق دهید.', category: 'تجهیزات شبکه', kind: 'آموزش فنی', readTime: '۸ دقیقه', dateLabel: 'آموزش فنی', icon: 'pi pi-sitemap', tone: 'navy', featured: true, body: ['در انتخاب سوئیچ سازمانی، ابتدا تعداد کاربران و تجهیزات متصل را به همراه رشد احتمالی شبکه برآورد کنید.', 'سرعت پورت‌ها، ظرفیت uplink، قابلیت‌های لایه ۲ و ۳، VLAN، افزونگی و توان PoE باید با طراحی شبکه هماهنگ باشند.', 'برای مقایسه پیشنهادها، مدل دقیق، نسخه نرم‌افزار، لایسنس‌ها، گارانتی و اقلام همراه را در یک جدول یکسان ثبت کنید.'], related: ['poe-switch-planning', 'network-rack-checklist'] },
  { slug: 'poe-switch-planning', title: 'محاسبه توان PoE پیش از خرید سوئیچ', excerpt: 'بودجه توان کل، کلاس مصرف‌کننده‌ها و ظرفیت توسعه را قبل از انتخاب مدل محاسبه کنید.', category: 'تجهیزات شبکه', kind: 'آموزش فنی', readTime: '۵ دقیقه', dateLabel: 'آموزش فنی', icon: 'pi pi-bolt', tone: 'amber', featured: false, body: ['برای طراحی درست PoE، تنها جمع‌زدن تعداد پورت‌ها کافی نیست. توان موردنیاز هر مصرف‌کننده و بودجه توان کل دستگاه را بررسی کنید.', 'دوربین‌ها، تلفن‌های IP و اکسس‌پوینت‌ها ممکن است در شرایط کاری مختلف مصرف متفاوتی داشته باشند.', 'همیشه مقداری ظرفیت برای توسعه آینده در نظر بگیرید و محدودیت توان منبع تغذیه و دمای محیط را هم بسنجید.'], related: ['network-switch-selection', 'network-rack-checklist'] },
  { slug: 'fiber-accessories-checklist', title: 'چک‌لیست تجهیزات جانبی اجرای پروژه فیبر نوری', excerpt: 'از پیگتیل و آداپتور تا پچ‌کورد، کاست و متعلقات مدیریت کابل؛ اقلام ضروری را فراموش نکنید.', category: 'فیبر نوری', kind: 'چک‌لیست پروژه', readTime: '۴ دقیقه', dateLabel: 'چک‌لیست پروژه', icon: 'pi pi-list-check', tone: 'cyan', featured: false, body: ['در برآورد پروژه فیبر نوری، اقلام جانبی باید از ابتدا در کنار کابل و تجهیزات فعال دیده شوند.', 'نوع کانکتور، پولیش، تعداد اتصال‌ها و سازگاری اجزا با تجهیزات انتهایی را بررسی کنید.', 'برای جلوگیری از دوباره‌کاری، فهرست اقلام را بر اساس نقشه مسیر، تعداد نقاط اتصال و ظرفیت توسعه تهیه کنید.'], related: ['fiber-optic-cable-guide', 'otdr-buying-guide'] },
  { slug: 'network-rack-checklist', title: 'پیش از تجهیز رک شبکه چه مواردی را بررسی کنیم؟', excerpt: 'ابعاد رک، تهویه، توزیع برق، مدیریت کابل و ظرفیت توسعه را در یک برنامه مشخص قرار دهید.', category: 'زیرساخت', kind: 'چک‌لیست پروژه', readTime: '۵ دقیقه', dateLabel: 'چک‌لیست پروژه', icon: 'pi pi-server', tone: 'blue', featured: false, body: ['انتخاب رک باید با ابعاد تجهیزات، عمق موردنیاز، وزن قابل تحمل و محل نصب هماهنگ باشد.', 'تهویه، مسیر ورود کابل، ارت، PDU و دسترسی برای نگهداری را از ابتدا طراحی کنید.', 'فضای خالی برای توسعه آینده و مستندسازی محل نصب تجهیزات، هزینه نگهداری را کاهش می‌دهد.'], related: ['network-switch-selection', 'poe-switch-planning'] },
  { slug: 'telecom-procurement-checklist', title: 'چک‌لیست استعلام خرید تجهیزات مخابراتی', excerpt: 'چطور درخواست استعلام دقیق بنویسیم تا پیشنهادهای تأمین‌کنندگان قابل مقایسه باشند؟', category: 'خرید سازمانی', kind: 'راهنمای خرید', readTime: '۶ دقیقه', dateLabel: 'راهنمای خرید', icon: 'pi pi-file-edit', tone: 'navy', featured: false, body: ['درخواست استعلام دقیق با شرح نیاز روشن شروع می‌شود. مدل، تعداد، مشخصات فنی، محل تحویل و زمان‌بندی را تا حد امکان مشخص کنید.', 'اگر معادل فنی قابل قبول است، معیارهای پذیرش را شفاف بنویسید تا پیشنهادهای جایگزین نیز قابل ارزیابی باشند.', 'شرایط گارانتی، اصالت کالا، اعتبار پیشنهاد و اقلام همراه را در پاسخ‌ها مقایسه کنید.'], related: ['network-switch-selection', 'fiber-optic-cable-guide'] },
  { slug: 'telecom-equipment-authenticity', title: 'اصالت تجهیزات شبکه را پیش از تحویل چطور بررسی کنیم؟', excerpt: 'شماره سریال، مستندات، وضعیت ظاهری و تطابق مشخصات کالا با پیشنهاد را کنترل کنید.', category: 'خرید سازمانی', kind: 'کنترل کیفیت', readTime: '۵ دقیقه', dateLabel: 'کنترل کیفیت', icon: 'pi pi-shield-check', tone: 'amber', featured: false, body: ['کنترل اصالت باید از مرحله بررسی پیشنهاد آغاز شود. مدل و پارت‌نامبر را با مستندات سازنده تطبیق دهید.', 'هنگام تحویل، شماره سریال، پلمب، متعلقات، وضعیت ظاهری و مدارک گارانتی را ثبت کنید.', 'در خریدهای سازمانی، صورت‌جلسه تحویل و معیارهای پذیرش فنی از بروز اختلاف جلوگیری می‌کند.'], related: ['telecom-procurement-checklist', 'network-rack-checklist'] },
]

const categories = ['همه مطالب', ...new Set(articles.map(item => item.category))]
const currentArticle = computed(() => articles.find(item => item.slug === route.params.slug) || null)
const filteredArticles = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('fa')
  return articles.filter(item => {
    const categoryMatch = activeCategory.value === 'همه مطالب' || item.category === activeCategory.value
    const text = `${item.title} ${item.excerpt} ${item.category}`.toLocaleLowerCase('fa')
    return categoryMatch && (!query || text.includes(query))
  })
})
const featuredArticles = computed(() => articles.filter(item => item.featured))
const latestArticles = computed(() => articles.filter(item => item.slug !== currentArticle.value?.slug).slice(0, 5))
const relatedArticles = computed(() => (currentArticle.value?.related || []).map(slug => articles.find(item => item.slug === slug)).filter(Boolean))
const recommendations = computed(() => relatedArticles.value.length ? relatedArticles.value : latestArticles.value.slice(0, 3))
const isArticle = computed(() => Boolean(route.params.slug))

function openArticle(article) {
  router.push({ name: 'mag-article', params: { slug: article.slug } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function openMagazine() {
  activeCategory.value = 'همه مطالب'
  searchQuery.value = ''
  router.push({ name: 'magazine' })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function formatCategory(category) { return category || 'مقاله تخصصی' }

watch(() => route.params.slug, () => {
  if (currentArticle.value) document.title = `${currentArticle.value.title} | مجله Telecom Market`
  else document.title = 'مجله و مقالات تخصصی | Telecom Market'
}, { immediate: true })
</script>

<template>
  <main class="magazine-page" dir="rtl">
    <div class="mag-container">
      <header class="mag-masthead">
        <div class="mag-masthead-copy">
          <span class="mag-eyebrow"><i class="pi pi-book-open"></i> دانش‌نامه بازارگاه</span>
          <h1>{{ isArticle && currentArticle ? currentArticle.title : 'مجله تخصصی تجهیزات شبکه و مخابرات' }}</h1>
          <p v-if="!isArticle">راهنمای خرید، آموزش فنی و نکته‌های کاربردی برای انتخاب و تأمین هوشمندانه تجهیزات.</p>
          <p v-else-if="currentArticle">{{ currentArticle.excerpt }}</p>
          <p v-else>این مطلب پیدا نشد؛ از مقاله‌های پیشنهادی پایین صفحه دیدن کنید.</p>
        </div>
        <div class="mag-masthead-mark" aria-hidden="true"><i class="pi pi-sitemap"></i><span>TELECOM<br>INSIGHTS</span></div>
      </header>

      <div class="mag-layout">
        <section class="mag-main-column">
          <template v-if="!isArticle">
            <section v-if="featuredArticles.length" class="mag-featured" aria-label="مطالب منتخب">
              <button class="mag-featured-card" type="button" @click="openArticle(featuredArticles[0])">
                <span class="mag-featured-visual" :class="`tone-${featuredArticles[0].tone}`"><i :class="featuredArticles[0].icon"></i><span>راهنمای تخصصی</span></span>
                <span class="mag-featured-content"><span class="mag-category">{{ featuredArticles[0].category }}</span><strong>{{ featuredArticles[0].title }}</strong><span>{{ featuredArticles[0].excerpt }}</span><span class="mag-read-link">مطالعه مقاله <i class="pi pi-arrow-left"></i></span></span>
              </button>
              <div class="mag-featured-stack">
                <button v-for="item in featuredArticles.slice(1)" :key="item.slug" class="mag-featured-mini" type="button" @click="openArticle(item)">
                  <span class="mag-mini-icon" :class="`tone-${item.tone}`"><i :class="item.icon"></i></span>
                  <span><small>{{ item.category }}</small><strong>{{ item.title }}</strong><em>{{ item.readTime }} مطالعه</em></span>
                  <i class="pi pi-angle-left"></i>
                </button>
              </div>
            </section>

            <div class="mag-list-heading"><div><span class="mag-eyebrow">کتابخانه محتوا</span><h2>مطالب و آموزش‌ها</h2></div><span>{{ filteredArticles.length.toLocaleString('fa-IR') }} مطلب</span></div>
            <div class="mag-toolbar">
              <div class="mag-categories" aria-label="دسته‌بندی مطالب">
                <button v-for="category in categories" :key="category" type="button" :class="{ active: activeCategory === category }" @click="activeCategory = category">{{ category }}</button>
              </div>
              <label class="mag-search"><i class="pi pi-search"></i><input v-model="searchQuery" type="search" placeholder="جستجو در مقالات..." aria-label="جستجو در مقالات"></label>
            </div>
            <div v-if="filteredArticles.length" class="mag-article-grid">
              <article v-for="item in filteredArticles" :key="item.slug" class="mag-card">
                <button class="mag-card-visual" :class="`tone-${item.tone}`" type="button" :aria-label="`مطالعه ${item.title}`" @click="openArticle(item)"><i :class="item.icon"></i><span>{{ item.kind }}</span></button>
                <div class="mag-card-body"><span class="mag-category">{{ item.category }}</span><h3><button type="button" @click="openArticle(item)">{{ item.title }}</button></h3><p>{{ item.excerpt }}</p><div class="mag-card-meta"><span><i class="pi pi-clock"></i>{{ item.readTime }}</span><button type="button" @click="openArticle(item)">ادامه مطلب <i class="pi pi-arrow-left"></i></button></div></div>
              </article>
            </div>
            <div v-else class="mag-empty"><i class="pi pi-search"></i><strong>مطلبی با این جستجو پیدا نشد</strong><button type="button" @click="activeCategory = 'همه مطالب'; searchQuery = ''">پاک کردن فیلترها</button></div>
          </template>

          <template v-else-if="currentArticle">
            <nav class="mag-breadcrumb" aria-label="مسیر صفحه"><button type="button" @click="openMagazine">مجله</button><i class="pi pi-angle-left"></i><span>{{ currentArticle.category }}</span></nav>
            <article class="mag-article-detail">
              <div class="mag-detail-cover" :class="`tone-${currentArticle.tone}`"><i :class="currentArticle.icon"></i><span>{{ currentArticle.kind }}</span></div>
              <div class="mag-detail-content">
                <div class="mag-detail-meta"><span class="mag-category">{{ currentArticle.category }}</span><span><i class="pi pi-clock"></i>{{ currentArticle.readTime }} مطالعه</span></div>
                <h2>{{ currentArticle.title }}</h2><p class="mag-detail-lead">{{ currentArticle.excerpt }}</p>
                <div class="mag-article-prose"><p v-for="(paragraph, index) in currentArticle.body" :key="index">{{ paragraph }}</p></div>
                <div class="mag-detail-cta"><div><strong>برای تأمین تجهیزات پروژه آماده‌اید؟</strong><span>محصولات و تأمین‌کنندگان را در بازارگاه بررسی کنید.</span></div><router-link :to="{ name: 'products' }">مشاهده محصولات <i class="pi pi-arrow-left"></i></router-link></div>
              </div>
            </article>
            <section class="mag-related-inline"><div class="mag-list-heading"><div><span class="mag-eyebrow">ادامه مسیر مطالعه</span><h2>مطالب مرتبط</h2></div></div><div class="mag-related-grid"><button v-for="item in relatedArticles" :key="item.slug" type="button" @click="openArticle(item)"><span class="mag-mini-icon" :class="`tone-${item.tone}`"><i :class="item.icon"></i></span><span><small>{{ item.category }}</small><strong>{{ item.title }}</strong><em>{{ item.readTime }} مطالعه</em></span><i class="pi pi-arrow-up-left"></i></button></div></section>
          </template>
          <section v-else class="mag-empty"><i class="pi pi-file-excel"></i><strong>این مطلب در دسترس نیست</strong><button type="button" @click="openMagazine">بازگشت به مجله</button></section>
        </section>

        <aside class="mag-sidebar" aria-label="مطالب پیشنهادی مجله">
          <section class="mag-side-panel">
            <div class="mag-side-heading"><span>پیشنهاد سردبیر</span><i class="pi pi-sparkles"></i></div>
            <button v-for="item in recommendations" :key="item.slug" type="button" class="mag-side-article" @click="openArticle(item)">
              <span class="mag-side-icon" :class="`tone-${item.tone}`"><i :class="item.icon"></i></span><span><small>{{ item.category }}</small><strong>{{ item.title }}</strong><em>{{ item.readTime }} مطالعه</em></span>
            </button>
          </section>
          <section class="mag-side-panel mag-latest-panel">
            <div class="mag-side-heading"><span>آخرین مطالب</span><i class="pi pi-history"></i></div>
            <button v-for="(item, index) in latestArticles" :key="item.slug" type="button" class="mag-latest-item" @click="openArticle(item)"><b>{{ String(index + 1).padStart(2, '0') }}</b><span><strong>{{ item.title }}</strong><small>{{ item.category }} · {{ item.readTime }}</small></span></button>
            <button type="button" class="mag-all-link" @click="openMagazine">مشاهده همه مطالب <i class="pi pi-arrow-left"></i></button>
          </section>
          <section class="mag-side-cta"><i class="pi pi-box"></i><strong>دنبال محصول مشخصی هستید؟</strong><p>در کاتالوگ بازارگاه، تجهیزات و تأمین‌کنندگان را جستجو کنید.</p><router-link :to="{ name: 'products' }">رفتن به فروشگاه <i class="pi pi-arrow-left"></i></router-link></section>
        </aside>
      </div>
    </div>
  </main>
</template>

<style scoped>
.magazine-page{--mag-ink:var(--ds-color-text);--mag-muted:var(--ds-color-text-muted);--mag-line:var(--ds-color-border);--mag-surface:var(--ds-color-surface);--mag-soft:var(--ds-color-surface-alt);min-height:65vh;padding:30px 0 54px;background:var(--ds-page-bg);color:var(--mag-ink)}
.mag-container{width:min(1240px,calc(100% - 40px));margin:auto}
.mag-masthead{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:26px;padding:27px 30px;border:1px solid var(--mag-line);border-radius:var(--ds-card-radius);background:linear-gradient(115deg,var(--ds-color-surface),var(--ds-color-primary-soft));overflow:hidden}
.mag-masthead-copy{max-width:760px}.mag-eyebrow{display:inline-flex;align-items:center;gap:7px;color:var(--ds-color-primary-text);font-size:11px;font-weight:800}.mag-masthead h1{margin:10px 0 7px;font-size:clamp(21px,2.5vw,30px);line-height:1.65;font-weight:850}.mag-masthead p{margin:0;color:var(--mag-muted);font-size:13px;line-height:2}
.mag-masthead-mark{display:grid;place-items:center;gap:8px;flex:none;width:120px;height:120px;border:1px solid color-mix(in srgb,var(--ds-brand-primary) 35%,transparent);border-radius:50%;color:var(--ds-color-primary-text);background:color-mix(in srgb,var(--ds-brand-primary) 8%,transparent)}.mag-masthead-mark i{font-size:34px}.mag-masthead-mark span{font-size:9px;letter-spacing:2px;text-align:center;font-weight:800}
.mag-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;align-items:start}.mag-main-column{min-width:0}.mag-featured{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(260px,.85fr);gap:14px;margin-bottom:30px}
.mag-featured-card,.mag-featured-mini,.mag-card-visual,.mag-card h3 button,.mag-related-grid button,.mag-side-article,.mag-latest-item{font:inherit;text-align:start;cursor:pointer}
.mag-featured-card{display:grid;grid-template-columns:42% 1fr;min-height:260px;overflow:hidden;padding:0;border:1px solid var(--mag-line);border-radius:var(--ds-card-radius);background:var(--mag-surface);color:var(--mag-ink);transition:transform .25s,border-color .25s,box-shadow .25s}.mag-featured-card:hover,.mag-card:hover{transform:translateY(-3px);border-color:var(--ds-color-primary);box-shadow:var(--ds-shadow-sm)}
.mag-featured-visual,.mag-detail-cover,.mag-card-visual{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;min-height:190px;color:var(--ds-color-primary-text)}.mag-featured-visual i,.mag-detail-cover i,.mag-card-visual i{font-size:54px}.mag-featured-visual span,.mag-detail-cover span,.mag-card-visual span{font-size:11px;font-weight:800}
.tone-cyan{background:linear-gradient(145deg,color-mix(in srgb,var(--ds-brand-primary) 18%,var(--mag-surface)),color-mix(in srgb,var(--ds-brand-primary) 5%,var(--mag-soft)))}.tone-blue{background:linear-gradient(145deg,color-mix(in srgb,#3B82F6 17%,var(--mag-surface)),color-mix(in srgb,#3B82F6 5%,var(--mag-soft)))}.tone-navy{background:linear-gradient(145deg,color-mix(in srgb,#1E3A5F 18%,var(--mag-surface)),color-mix(in srgb,#1E3A5F 5%,var(--mag-soft)))}.tone-amber{background:linear-gradient(145deg,color-mix(in srgb,#D97706 17%,var(--mag-surface)),color-mix(in srgb,#D97706 5%,var(--mag-soft)))}
.mag-featured-content{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:10px;padding:20px}.mag-category{display:inline-flex;width:max-content;padding:4px 9px;border-radius:5px;background:var(--ds-color-primary-soft);color:var(--ds-color-primary-text);font-size:10px;font-weight:800}.mag-featured-content>strong{font-size:17px;line-height:1.9}.mag-featured-content>span:not(.mag-category){color:var(--mag-muted);font-size:12px;line-height:1.9}.mag-read-link{margin-top:4px;color:var(--ds-color-link);font-size:12px;font-weight:800}.mag-read-link i{margin-inline-start:5px}
.mag-featured-stack{display:grid;gap:10px}.mag-featured-mini{display:flex;align-items:center;gap:12px;min-width:0;padding:13px;border:1px solid var(--mag-line);border-radius:var(--ds-card-radius);background:var(--mag-surface);color:var(--mag-ink);transition:border-color .2s,transform .2s}.mag-featured-mini:hover{transform:translateX(-3px);border-color:var(--ds-color-primary)}.mag-featured-mini>span:nth-child(2){display:grid;min-width:0;gap:4px}.mag-featured-mini small,.mag-side-article small,.mag-related-grid small{color:var(--ds-color-primary-text);font-size:10px}.mag-featured-mini strong,.mag-side-article strong,.mag-related-grid strong{display:-webkit-box;overflow:hidden;font-size:12px;line-height:1.8;-webkit-line-clamp:2;-webkit-box-orient:vertical}.mag-featured-mini em,.mag-side-article em,.mag-related-grid em{color:var(--mag-muted);font-size:10px;font-style:normal}.mag-featured-mini>.pi{margin-inline-start:auto;color:var(--mag-muted)}
.mag-mini-icon,.mag-side-icon{display:grid;place-items:center;flex:none;width:44px;height:44px;border-radius:9px;color:var(--ds-color-primary-text)}.mag-mini-icon i,.mag-side-icon i{font-size:18px}
.mag-list-heading{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:24px 0 14px}.mag-list-heading h2{margin:3px 0 0;font-size:19px;font-weight:850}.mag-list-heading>span{color:var(--mag-muted);font-size:11px}
.mag-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}.mag-categories{display:flex;gap:6px;flex-wrap:wrap}.mag-categories button{min-height:32px;padding:0 11px;border:1px solid var(--mag-line);border-radius:6px;background:var(--mag-surface);color:var(--mag-muted);font:inherit;font-size:11px;cursor:pointer;transition:all .2s}.mag-categories button.active,.mag-categories button:hover{border-color:var(--ds-color-primary);background:var(--ds-color-primary-soft);color:var(--ds-color-primary-text)}
.mag-search{display:flex;align-items:center;gap:8px;min-width:200px;min-height:36px;padding:0 10px;border:1px solid var(--mag-line);border-radius:7px;background:var(--mag-surface);color:var(--mag-muted)}.mag-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--mag-ink);font:inherit;font-size:11px}
.mag-article-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.mag-card{overflow:hidden;border:1px solid var(--mag-line);border-radius:var(--ds-card-radius);background:var(--mag-surface);transition:transform .25s,border-color .25s,box-shadow .25s}.mag-card-visual{display:flex;flex-direction:row;justify-content:space-between;min-height:112px;width:100%;padding:20px 24px;border:0}.mag-card-visual i{font-size:34px}.mag-card-body{padding:15px}.mag-card h3{margin:9px 0 6px;font-size:14px;line-height:1.8}.mag-card h3 button{padding:0;border:0;background:transparent;color:var(--mag-ink);font-weight:800}.mag-card h3 button:hover{color:var(--ds-color-link)}.mag-card-body>p{min-height:48px;margin:0;color:var(--mag-muted);font-size:11px;line-height:1.9}.mag-card-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px;padding-top:11px;border-top:1px solid var(--mag-line);font-size:10px}.mag-card-meta span{color:var(--mag-muted)}.mag-card-meta span i{margin-inline-end:5px}.mag-card-meta button{padding:0;border:0;background:transparent;color:var(--ds-color-link);font:inherit;font-weight:800;cursor:pointer}
.mag-sidebar{position:sticky;top:76px;display:grid;gap:14px}.mag-side-panel{padding:16px;border:1px solid var(--mag-line);border-radius:var(--ds-card-radius);background:var(--mag-surface)}.mag-side-heading{display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid var(--mag-line);font-size:13px;font-weight:850}.mag-side-heading i{color:var(--ds-color-primary-text)}.mag-side-article{display:flex;align-items:center;gap:10px;width:100%;padding:13px 0;border:0;border-bottom:1px solid var(--mag-line);background:transparent;color:var(--mag-ink)}.mag-side-article:last-child{border-bottom:0;padding-bottom:0}.mag-side-article>span:last-child{display:grid;min-width:0;gap:3px}.mag-side-icon{width:38px;height:38px}.mag-side-icon i{font-size:16px}
.mag-latest-item{display:flex;align-items:center;gap:12px;width:100%;padding:12px 0;border:0;border-bottom:1px solid var(--mag-line);background:transparent;color:var(--mag-ink)}.mag-latest-item>b{color:var(--ds-color-primary-text);font-size:19px;font-weight:850}.mag-latest-item>span{display:grid;gap:4px}.mag-latest-item strong{font-size:11px;line-height:1.8}.mag-latest-item small{color:var(--mag-muted);font-size:10px}.mag-all-link{display:flex;align-items:center;justify-content:space-between;width:100%;padding:13px 0 0;border:0;background:transparent;color:var(--ds-color-link);font:inherit;font-size:11px;font-weight:800;cursor:pointer}
.mag-side-cta{display:grid;gap:9px;padding:18px;border:1px solid color-mix(in srgb,var(--ds-brand-primary) 35%,var(--mag-line));border-radius:var(--ds-card-radius);background:var(--ds-color-primary-soft)}.mag-side-cta>i{font-size:23px;color:var(--ds-color-primary-text)}.mag-side-cta strong{font-size:13px}.mag-side-cta p{margin:0;color:var(--mag-muted);font-size:11px;line-height:1.9}.mag-side-cta a,.mag-detail-cta a{display:flex;align-items:center;justify-content:center;gap:8px;min-height:36px;padding:0 12px;border-radius:7px;background:var(--ds-primary-button);color:var(--ds-primary-button-text);font-size:11px;font-weight:800;text-decoration:none}
.mag-breadcrumb{display:flex;align-items:center;gap:9px;margin-bottom:13px;color:var(--mag-muted);font-size:11px}.mag-breadcrumb button{padding:0;border:0;background:transparent;color:var(--ds-color-link);font:inherit;cursor:pointer}
.mag-article-detail{overflow:hidden;border:1px solid var(--mag-line);border-radius:var(--ds-card-radius);background:var(--mag-surface)}.mag-detail-cover{min-height:190px;flex-direction:row;gap:22px}.mag-detail-cover i{font-size:58px}.mag-detail-content{padding:clamp(18px,3vw,34px)}.mag-detail-meta{display:flex;align-items:center;gap:14px;color:var(--mag-muted);font-size:11px}.mag-detail-content h2{margin:14px 0 8px;font-size:clamp(20px,2.3vw,27px);line-height:1.8}.mag-detail-lead{margin:0;padding-bottom:20px;border-bottom:1px solid var(--mag-line);color:var(--mag-muted);font-size:14px;line-height:2}.mag-article-prose{max-width:780px;padding:10px 0;color:var(--mag-ink);font-size:14px;line-height:2.3}.mag-article-prose p{margin:14px 0}.mag-detail-cta{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:18px;padding:16px;border-radius:9px;background:var(--mag-soft)}.mag-detail-cta>div{display:grid;gap:5px}.mag-detail-cta strong{font-size:12px}.mag-detail-cta span{color:var(--mag-muted);font-size:11px}.mag-detail-cta a{flex:none}
.mag-related-inline{margin-top:28px}.mag-related-grid{display:grid;gap:8px}.mag-related-grid button{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--mag-line);border-radius:8px;background:var(--mag-surface);color:var(--mag-ink)}.mag-related-grid button>span:nth-child(2){display:grid;flex:1;gap:3px}.mag-related-grid button>.pi{color:var(--mag-muted)}
.mag-empty{display:grid;justify-items:center;gap:12px;padding:48px 20px;border:1px dashed var(--mag-line);border-radius:var(--ds-card-radius);color:var(--mag-muted)}.mag-empty>i{font-size:30px}.mag-empty strong{color:var(--mag-ink);font-size:13px}.mag-empty button{border:0;background:transparent;color:var(--ds-color-link);font:inherit;font-size:12px;font-weight:800;cursor:pointer}
@media(max-width:1000px){.mag-layout{grid-template-columns:minmax(0,1fr) 260px;gap:16px}.mag-featured{grid-template-columns:1fr}.mag-featured-stack{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){.mag-layout{grid-template-columns:1fr}.mag-sidebar{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}.mag-side-cta{grid-column:1/-1}.mag-masthead-mark{width:90px;height:90px}.mag-article-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.magazine-page{padding-top:18px}.mag-container{width:min(100% - 28px,1240px)}.mag-masthead{padding:18px}.mag-masthead-mark{display:none}.mag-featured-card{grid-template-columns:1fr}.mag-featured-visual{min-height:130px}.mag-featured-stack{grid-template-columns:1fr}.mag-article-grid{grid-template-columns:1fr}.mag-toolbar{align-items:stretch}.mag-search{width:100%}.mag-sidebar{grid-template-columns:1fr}.mag-detail-cta{align-items:stretch;flex-direction:column}.mag-detail-cta a{width:100%}}
@media(prefers-reduced-motion:reduce){.mag-featured-card,.mag-featured-mini,.mag-card,.mag-categories button{transition:none!important}.mag-featured-card:hover,.mag-card:hover{transform:none}}
</style>
