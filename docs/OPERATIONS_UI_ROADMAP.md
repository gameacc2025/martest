# برنامه اجرایی UI عملیات، CRM و مالی

**شناسه:** UI-OPERATIONS-FOUNDATION-01  
**وضعیت:** UI FOUNDATION IMPLEMENTED — API / DOMAIN WORK PENDING  
**آخرین به‌روزرسانی:** 2026-11-04

## تصمیم معماری

HTMLهای **tem/** مرجع بصری و رفتاری هستند، نه کد قابل انتقال مستقیم. ویجت‌های تکرارشونده باید در **packages/shared-ui** به کامپوننت‌های Vue 3 مستقل از داده تبدیل شوند. صفحه‌ها فقط مسئول واکشی داده، کنترل مجوزها و ترکیب ویجت‌ها هستند.

- Design tokens و الگوهای عمومی در **packages/shared-ui/assets/design-system/** و **components/ui/** نگهداری می‌شوند.
- ویجت‌های عمومی از API مستقل‌اند و از props / slots استفاده می‌کنند.
- منطق دامنه و واکشی API در صفحه یا composable / store متعلق به همان اپ باقی می‌ماند.
- داده نمایشی فقط برای prototype مجاز است؛ باید در UI به‌وضوح برچسب «داده نمونه / پیش‌نمایش» داشته باشد و هرگز با داده واقعی ترکیب یا به‌عنوان شاخص زنده معرفی نشود.
- نمایش منو با RBAC و route registration محدود می‌شود. این کنترل جایگزین مجوز سمت سرور برای APIهای آینده نیست.
- هیچ endpoint یا permission خیالی به‌عنوان قابلیت عملیاتی ساخته نمی‌شود.

## کتابخانه ویجت‌های استخراج‌شده از TEM

مسیر: **packages/shared-ui/components/ui/**

| کامپوننت | کاربرد |
|---|---|
| TemPageHeader | عنوان، توضیح و breadcrumb صفحه |
| TemMailLayout | چیدمان سه‌ستونه صندوق پیام، فهرست و خوانشگر |
| TemMailRow | ردیف پیام با وضعیت خوانده‌شدن و ستاره |
| TemMailReader | پنل خواندن پیام با فرستنده، پیوست و عملیات |
| TemActivityTimeline | خط زمانی فعالیت‌ها با وضعیت بارگذاری و خالی |
| TemStatCard | کارت شاخص آماری |
| TemPanel | سطح محتوای عنوان‌دار |
| TemToolbar | نوار جستجو، فیلتر و عملیات |
| TemStatusPill | نمایش وضعیت استاندارد |
| TemSegmented | انتخاب بین نماها / فیلترهای محدود |
| TemEmptyState | وضعیت خالی |
| TemAvatar | آواتار |
| TemUserCell | سلول هویت کاربر |
| TemBarChart | نمودار میله‌ای CSS بدون وابستگی نموداری |
| TemLineChart | نمودار روند SVG چندسری با داده ورودی صفحه |
| TemDonutChart | نمودار حلقه‌ای SVG |
| TemLegend | راهنمای نمودار |
| TemMeter | شاخص پیشرفت |

پوسته عملیاتی قابل استفاده مجدد:
- **components/operations/OperationalWorkspace.vue** — ترکیب صفحه، KPI، highlights، فیلتر وضعیت، جستجو و جدول برای prototypeهای دامنه‌ای.
- **components/operations/TicketDeskWorkspace.vue** — صندوق تیکت، فیلتر و جستجو، انتخاب تیکت، مکالمه و نمایش کنترل‌شده یادداشت داخلی در پنل STAFF.
- **KpiStatsRow** و **KpiCard** — خلاصه وضعیت بالای صفحات فهرستی.

## نگاشت فایل‌های HTML مرجع TEM به ویجت‌های Vue

| فایل مرجع | الگوهای استخراج‌شده / معادل مشترک |
|---|---|
| analytics.html | TemStatCard، TemLineChart، TemBarChart، TemDonutChart، TemLegend، TemMeter، DashboardPanel |
| sales.html | TemStatCard، TemLineChart، TemPanel، EntityList، TemStatusPill |
| ecommerce.html | TemStatCard، TemLineChart، TemDonutChart، TemLegend، ProductCard، EntityList |
| transactions.html | TemStatCard، KpiStatsRow، DataTable، TemToolbar، TemStatusPill، TemUserCell |
| orders.html | TemStatCard، KpiStatsRow، DataTable، TemToolbar، TemStatusPill، TemAvatar |
| customers.html | KpiStatsRow، DataTable، TemToolbar، TemUserCell، TemAvatar، TemStatusPill |
| mail.html / mail-detail.html | TemMailLayout، TemMailRow، TemMailReader |
| products.html / shop.html / product-details.html | ProductCard، TemAvatar، TemUserCell، TemStatusPill، TemPanel |
| cart.html / checkout.html / order-details.html | TemPanel، shared form fields/actions، TemStatusPill |
| plans.html / subscriptions.html | TemPanel، TemStatCard، TemStatusPill، shared comparison/table primitives |
| roles.html / users.html / security.html | DataTable، KpiStatsRow، TemToolbar، TemUserCell، TemAvatar، TemStatusPill |
| telecom.html | TemPanel، TemStatCard، TemLineChart، TemBarChart، TemDonutChart |
| index.html | shared dashboard shell، TemPageHeader، TemPanel، dashboard navigation primitives |

این نگاشت عمداً رفتار/ساختار را به ویجت‌های مشترک موجود وصل می‌کند؛ از انتقال HTML خام یا استایل‌های وابسته به قالب Myron جلوگیری می‌شود. هر صفحه در اپ‌ها فقط ترکیب‌کننده این primitives و مالک داده/مجوز باقی می‌ماند.

## UIهای ایجادشده

| اپ | مسیر | وضعیت UI | منبع داده |
|---|---|---|---|
| Admin | /crm | نمای کلی CRM | نمونه |
| Admin | /crm/leads | سرنخ‌ها و مشتریان بالقوه | نمونه |
| Admin | /crm/pipeline | قیف فرصت‌های فروش | نمونه |
| Admin | /crm/activities | تعاملات و پیگیری‌ها | نمونه |
| Admin | /finance | نمای کلی مالی | نمونه |
| Admin | /finance/settlements | تسویه با شرکت‌ها | نمونه |
| Admin | /finance/transactions | تراکنش‌ها و گردش حساب | نمونه |
| Admin | /finance/invoices | صورتحساب‌ها و اسناد مالی | نمونه |
| Admin | /support/tickets | صندوق تیکت، مکالمه و یادداشت داخلی | نمونه |
| Company | /support/tickets | صندوق و مکالمه تیکت‌های شرکت | نمونه |
| Website / CUSTOMER | /support/tickets | صندوق و مکالمه تیکت‌های مشتری | نمونه |
| Admin | /retail/orders | پیش‌نمایش سفارش خرده‌فروشی، ارسال و مرجوعی | نمونه |
| Company | /retail/orders | سفارش‌های دریافتی شرکت و گردش آماده‌سازی/ارسال | نمونه |
| Website | /cart | سبد خرید محلی با تعداد و جمع اقلام | localStorage؛ قیمت تأییدنشده |
| Website / CUSTOMER | /checkout | اطلاعات تحویل و بازبینی سفارش | UI-only؛ ثبت سفارش غیرفعال |
| Website / CUSTOMER | /orders | پیگیری سفارش‌های خریدار | نمونه |
| Company | /support/tickets | پیش‌نمایش تیکت‌های شرکت و پاسخ کارشناسان | نمونه |
| Company | /finance/settlements | پیش‌نمایش مانده و سوابق تسویه شرکت | نمونه |
| Website / CUSTOMER | /support/tickets | پیش‌نمایش تیکت‌های مشتری و پیگیری درخواست‌ها | نمونه |
| Admin / Company | داشبورد | توسعه شاخص‌ها، میانبرها و پنل‌های عملیاتی | داده API موجود؛ Admin: کاربران فعال، محصولات در انتظار بررسی و استعلام‌های کل؛ Company: نرخ پاسخ‌گویی، رتبه، تعداد کل محصولات و استعلام‌های باز |

منوهای CRM و مالی دارای زیرمنوهای مستقل هستند. بخش پشتیبانی و فروش خرده‌فروشی نیز در گروه‌های جداگانه قرار گرفته‌اند تا مرزبندی حوزه‌ها روشن بماند.

## خلاصه‌های بالای جدول

در صفحات شرکت‌ها، کاربران، دسته‌بندی‌ها، نقش‌ها، مجوزها، محصولات، استعلام‌ها و سفارش‌ها در هر دو پنل Admin و Company KPIهای وضعیت اضافه شده‌اند. همچنین صفحه مدیریت تحویل اعلان‌ها از آمار واقعی endpoint خود استفاده می‌کند. شمارش وضعیت‌ها از رکوردهای بارگذاری‌شده در صفحه فعلی محاسبه می‌شود؛ برای جلوگیری از برداشت اشتباه، برچسب «صفحه جاری» درج شده است. عدد کل از pagination API می‌آید.

**گام API بعدی:** برای نمایش آمار سراسری و دقیق، هر دامنه باید endpoint تجمیعی مجاز و tenant-aware ارائه کند؛ جمع‌زدن صفحات pagination یا استفاده از تعداد رکوردهای صفحه به‌عنوان کل سامانه ممنوع است.

## معماری پشتیبانی

قرارداد دامنه چندکاناله تیکت، سطح دسترسی، یادداشت داخلی، پیوست خصوصی، SLA و APIهای پیشنهادی در [SUPPORT_TICKETING_DOMAIN_DESIGN.md](./SUPPORT_TICKETING_DOMAIN_DESIGN.md) ثبت شده است. هر سه اپ از کامپوننت مشترک `TicketDeskWorkspace` استفاده می‌کنند؛ composer، تخصیص و تغییر وضعیت تا زمان API غیرفعال‌اند.

## فازهای اجرایی بعدی

### فاز A — تثبیت Design System و پوشش صفحات
- بررسی بصری تمام صفحات HTML در tem/ و تطبیق آن‌ها با کامپوننت‌های موجود.
- شناسایی ویجت‌های باقی‌مانده (تقویم، فیلتر پیشرفته، نمودار ترکیبی، activity timeline، attachment، detail drawer، bulk actions).
- حذف تکرار بین KpiCard و TemStatCard فقط پس از بررسی مصرف‌کنندگان و قراردادها.
- تکمیل responsive، dark mode، keyboard/focus و تست واحد برای primitives.

### فاز B — داشبوردهای واقعی و آمار تجمیعی
- تعریف قرارداد آمار برای Admin و Company با تفکیک tenant و مجوز.
- آمار شرکت‌ها: وضعیت تأیید، نوع شرکت، رشد ثبت‌نام، شرکت‌های غیرفعال.
- آمار محصولات: چرخه تأیید، انتشار، دسته‌بندی و عملکرد.
- آمار استعلام: قیف، نرخ پاسخ، زمان پاسخ، نرخ تبدیل.
- آمار فروش خرده‌فروشی: سفارش، مبلغ ناخالص، تحویل، لغو و مرجوعی.
- آمار مالی: کمیسیون، بدهی فروشنده، مبلغ قابل تسویه و مغایرت.
- هر نمودار باید بازه زمانی، timezone، واحد پول و مبنای محاسبه روشن داشته باشد.

### فاز C — CRM

قرارداد حساب، سرنخ، تبدیل، pipeline، فعالیت و وظیفه در [CRM_DOMAIN_DESIGN.md](./CRM_DOMAIN_DESIGN.md) ثبت شده است. نسخه اول CRM داخلی و STAFF-only خواهد بود و هویت User/Company موجود را تکثیر نمی‌کند.
1. مدل حساب مشتری/شرکت و مخاطب با tenant boundaries.
2. سرنخ، منبع جذب، مالک، امتیاز و تبدیل.
3. قیف فرصت فروش و تاریخچه تغییر مرحله.
4. تعاملات: تماس، پیام، جلسه و یادداشت.
5. وظیفه، یادآوری، تقویم و صف پیگیری.
6. اتصال امن به کاربران، شرکت‌ها، استعلام‌ها و تیکت‌ها.
7. مجوزهای جداگانه read/create/update/assign/export و audit trail.

### فاز D — پشتیبانی و تیکتینگ
1. تیکت از سمت کاربر، شرکت و اپراتور.
2. دسته‌بندی، اولویت، وضعیت، مالک و صف تیمی.
3. پاسخ عمومی و یادداشت داخلی مجزا.
4. پیوست امن، تاریخچه و اعلان.
5. SLA، زمان پاسخ/حل، ارجاع و escalation.
6. دسترسی فقط به تیکت‌های متعلق به کاربر/شرکت یا صف مجاز.
7. داشبورد و گزارش کیفیت پشتیبانی.

### فاز E — مالی و تسویه بازارگاه

قرارداد دامنه و مدل مفهومی اولیه در [RETAIL_COMMERCE_AND_SETTLEMENT_DESIGN.md](./RETAIL_COMMERCE_AND_SETTLEMENT_DESIGN.md) ثبت شده است. این سند مرجع طراحی R0 است و پیش از migration باید با سیاست تجاری، درگاه و الزامات حقوقی تطبیق داده شود.
1. تعریف چرخه سفارش و رویدادهای مالی به‌عنوان منبع حقیقت.
2. دفتر ثبت تراکنش immutable و idempotency برای پرداخت/بازپرداخت.
3. محاسبه کمیسیون بر اساس قرارداد و snapshot زمان سفارش.
4. حساب بستانکاری فروشنده و بدهکاری بازارگاه.
5. تطبیق پرداخت درگاه، سفارش، تحویل و مرجوعی.
6. درخواست تسویه، تأیید چندمرحله‌ای، اجرای پرداخت و reconciliation.
7. صورتحساب، سند، خروجی و گزارش audit.
8. تفکیک دسترسی مشاهده، تأیید و اجرای پرداخت؛ هیچ دکمه UI نباید به‌تنهایی پرداخت واقعی انجام دهد.

### فاز F — سفارش خرده‌فروشی
1. مدل سفارش، اقلام، snapshot قیمت و آدرس.
2. رزرو موجودی و کنترل تغییر قیمت.
3. پرداخت، لغو، ارسال، تحویل و مرجوعی.
4. سیاست بازپرداخت و اثر آن بر تسویه فروشنده.
5. اعلان‌های مرحله‌ای و پنل پیگیری مشتری.
6. گزارش فروش، نرخ تحویل و مرجوعی.

## اقدام ایمنی و اصلاح بدهی فنی سفارش‌ها

- route قدیمی Admin به نام `admin-orders` به پیش‌نمایش `/retail/orders` هدایت شد؛ صفحه قدیمی متصل به `ordersApi` دیگر مسیر عملیاتی ندارد.
- route مشتری `/orders` و route شرکت `/retail/orders` به‌عنوان prototype مستقل اضافه شدند؛ هر دو از برچسب داده نمونه در OperationalWorkspace استفاده می‌کنند.
- endpointها و storeهای قدیمی `/orders` deprecated علامت‌گذاری شدند. تا ساخت APIهای `/retail/*` نباید از آن‌ها استفاده شود.
- پیش‌نمایش سفارش‌ها در Admin، Company و Website اکنون هرکدام متناسب با actor و نیاز همان اپ است؛ هیچ عملیات سفارش/پرداخت واقعی اجرا نمی‌شود.

## موارد خارج از محدوده این مرحله

- ساخت API، migration یا مدل دیتابیس برای CRM، مالی، تیکت و سفارش خرده‌فروشی.
- اتصال نمونه‌های UI به endpointهای حدسی.
- نمایش مبالغ و آمار نمونه به‌عنوان داده زنده.
- انجام عملیات مالی یا تغییر وضعیت سفارش از صفحات prototype.

## معیار عبور UI به قابلیت عملیاتی

هر ماژول فقط پس از تکمیل مدل داده، API، مجوزهای سمت سرور، audit، تست‌های دامنه، مدیریت خطا/بارگذاری/خالی، مستندات و بازبینی امنیتی از «پیش‌نمایش» به «عملیاتی» ارتقا می‌یابد.


## سبد خرید و تکمیل سفارش Website — 2026-11-04

صفحات `/cart` و `/checkout` به مسیرهای Website متصل شدند و دسترسی سبد خرید از هدر عمومی فراهم است. سبد فقط localStorage است و قیمت/موجودی را معتبر نمی‌کند. checkout اطلاعات تحویل را برای بازبینی می‌گیرد، اما کارت بانکی دریافت نمی‌کند و سفارش/پرداخت موفقیت‌آمیز جعلی نمی‌سازد؛ ثبت سفارش تا تکمیل API و درگاه غیرفعال است. جزئیات و مرزهای عملیاتی در [WEBSITE_CART_CHECKOUT_STATUS.md](./WEBSITE_CART_CHECKOUT_STATUS.md) آمده است.
