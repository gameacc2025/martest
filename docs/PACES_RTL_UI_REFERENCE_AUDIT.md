# Paces RTL — صفحه‌به‌صفحه مرجع طراحی UI

## هدف و روش
این سند ثبت می‌کند کدام صفحات/الگوهای Paces از طریق پیش‌نمایش عمومی و صفحات ایندکس‌شده قابل واکشی بوده‌اند و هر کدام در کدام قسمت Telecom Marketplace به کار می‌آیند. مرجع اصلی کاربر نسخه Bootstrap با RTL است:
https://themes.coderthemes.com/paces/bootstrap/index.html?rtl

**محدودیت واکشی:** صفحه اصلی و برخی URLهای مستقیم در واکشی مستقیم با خطای cache miss مواجه شدند. بنابراین این سند فقط صفحات و محتوایی را ثبت می‌کند که محتوای واقعی‌شان در نتایج قابل مشاهده بوده است؛ این فهرست ادعای مشاهده تمام لینک‌های قالب نیست. صفحات دیگری که هنوز محتوای‌شان قابل واکشی نشده‌اند باید با دریافت ZIP/فایل‌های اصلی قالب یا در دسترس قرار گرفتن URLهایشان بررسی شوند. هیچ جزئیات مشاهده‌نشده‌ای به‌عنوان واقعیت قالب ثبت نمی‌شود.

## صفحات و الگوهای تأییدشده

### 1. داشبورد تجارت الکترونیک
مرجع: https://themes.coderthemes.com/paces/tailwind/index.html?neo=&rtl=
- خوشامدگویی و هدر صفحه با زمان/اطلاعات کاربر
- کارت‌های KPI مانند سفارش، درآمد و رشد با مقایسه دوره‌ای
- بخش تحلیل عملکرد و گزارش فروش با بازه‌های زمانی
- فهرست محصولات پرفروش همراه تصویر، فروشنده، قیمت، تعداد، مبلغ و موجودی
- جدول سفارش‌های اخیر با شناسه، مشتری، تاریخ، مبلغ، پرداخت و وضعیت
- خلاصه جغرافیایی/نقشه درآمد
- جریان فعالیت‌های اخیر و رخدادهای سیستم
- کاربرد در پروژه: داشبورد STAFF و COMPANY؛ شاخص‌ها باید از API واقعی همان نقش و محدوده tenant خوانده شوند. داده نمونه قالب هرگز وارد محصول نشود.

### 2. جدول داده پایه
مرجع: https://themes.coderthemes.com/paces/tailwind/tables-datatables-basic.html
- جدول پرتراکم با سرستون روشن و ستون‌های عددی قابل مقایسه
- ساختار مناسب برای مرتب‌سازی، جستجو، انتخاب تعداد ردیف و صفحه‌بندی
- کاربرد: محصولات، شرکت‌ها، کاربران، استعلام‌ها، پیشنهادها، فاکتورها و گزارش‌ها.
- در پروژه از DataTable/کامپوننت‌های موجود و API pagination/sort/filter واقعی استفاده شود؛ وابستگی jQuery قالب منتقل نشود.

### 3. جدول داده JavaScript
مرجع: https://themes.coderthemes.com/paces/tailwind/tables-datatables-javascript.html
- انتخاب تعداد ردیف، جستجو و صفحه‌بندی با نمایش محدوده نتایج
- کاربرد: قرارداد UX برای فهرست‌های مدیریتی؛ رفتار سمت سرور اولویت دارد و نباید کل داده‌ها صرفاً برای فیلتر سمت کلاینت بارگیری شوند.

### 4. کارت‌ها
مرجع: https://themes.coderthemes.com/paces/bootstrap/ui-cards.html
- کارت پایه با عنوان و توضیح
- کارت با header/subheader و محتوای برجسته
- کارت با ابزارهای کنترلی در header
- حالت‌های border، horizontal، group و stretched link
- کاربرد: KPI، خلاصه موجودیت، پنل جزئیات، کارت محصول، کارت شرکت، خلاصه استعلام و ویجت‌های داشبورد.
- از گرادیان‌ها و رنگ‌های خود قالب استفاده نشود؛ رنگ‌های معنایی از Design System برند پروژه گرفته شوند.

### 5. Badgeها
مرجع: https://themes.coderthemes.com/paces/bootstrap/ui-badges.html
- badge معمولی، pill، outline، soft/light، label، square/circle و badge متصل به آیکون
- کاربرد: وضعیت محصول، استعلام، شرکت، پرداخت، تیکت، تأییدها و شمارنده‌ها.
- معانی وضعیت‌ها باید در سراسر سه اپ یکسان باشند؛ رنگ‌ها از توکن‌های برند و وضعیت پروژه استخراج شوند، نه پالت Paces.

### 6. جزئیات نقش و کاربران
مرجع: https://themes.coderthemes.com/paces/bootstrap/apps-users-role-details.html
- خلاصه نقش با نام، توضیح، مسئولیت‌ها و تعداد کاربران
- فهرست اعضای نقش با جستجو و فیلتر
- فرم ویرایش نقش و تخصیص کاربر
- کاربرد: پنل نقش‌ها و مجوزها؛ در Telecom Marketplace مدل واقعی Role → Permissions و AccessProfile حفظ شود. UI نباید به تخصیص مجوز مستقیم به هر کاربر یا نقش ساختگی منجر شود.

### 7. حضور و غیاب
مرجع: https://themes.coderthemes.com/paces/bootstrap/apps-hrm-attendance.html
- کارت‌های خلاصه روزهای کاری، حضور، مرخصی، غیبت و میانگین ساعات
- جدول سوابق با تاریخ، وضعیت، شیفت، ورود/خروج، اضافه‌کاری، نوع مرخصی و تأییدکننده
- فرم ایجاد رکورد حضور و غیاب
- کاربرد: ماژول آتی HR؛ فقط پس از طراحی مدل HR، قواعد شیفت، مجوزها و الزامات حقوقی فعال شود.

## الگوهای طراحی که باید از کل مرجع در UI پروژه دنبال شوند
این موارد «قواعد اقتباس» هستند، نه ادعای مشاهده صفحه مشخص:
- پوسته RTL منسجم با سایدبار، topbar، breadcrumb، عنوان صفحه و محتوای دارای عرض کنترل‌شده
- سلسله‌مراتب مشخص بین عنوان صفحه، توضیح، عملیات اصلی و ابزارهای ثانویه
- کارت‌های KPI و محتوایی با ترازبندی و ارتفاع کنترل‌شده
- جدول‌های مدیریتی با toolbar، فیلتر، جستجو، sort، pagination، bulk actions و empty/loading/error states
- فرم‌های بخش‌بندی‌شده با label، hint، validation، پیام خطا و footer عملیات
- صفحات جزئیات با summary header، status badge، action group و تب‌های محتوایی
- الگوی inbox برای اعلان/پیام و الگوی timeline برای تاریخچه/فعالیت
- حالت‌های responsive، sidebar collapse، موبایل، روشن/تیره و RTL واقعی
- سازگاری با دسترس‌پذیری: focus-visible، keyboard، contrast و reduced motion

## نگاشت به سه اپلیکیشن

### Admin / STAFF
- داشبورد عملیاتی: KPI، روندها، صف‌های کاری، فعالیت اخیر و وضعیت سیستم
- مدیریت کاربران/شرکت‌ها/نقش‌ها: الگوی جدول و جزئیات نقش
- مدیریت محصولات/استعلام‌ها: جدول‌های غنی، فیلترهای دامنه‌ای، جزئیات با timeline و عملیات مجاز
- ماژول‌های آینده CRM/مالی/HR/عملیات: در IA و design system لحاظ شوند، ولی تا وجود قابلیت واقعی در منو به‌صورت عملیاتی نمایش داده نشوند.

### Company / COMPANY
- داشبورد شرکت: عملکرد محصولات، استعلام‌های ورودی، پاسخ‌ها و سهمیه‌ها
- محصولات: فهرست، جزئیات، ایجاد/ویرایش و وضعیت بررسی
- استعلام‌ها: inbox، جزئیات، پیشنهاد قیمت و تاریخچه مکالمه
- تنظیمات شرکت و کاربران مطابق مجوزهای فعلی؛ ساختار آینده CRM/مالی شرکت می‌تواند بعداً به‌صورت ماژول‌های مستقل افزوده شود.

### Website / CUSTOMER
- از الگوهای کارت و جدول فقط در جای مناسب استفاده شود؛ Website نباید پوسته Admin را عیناً دریافت کند.
- هویت فروشگاهی، تجربه جستجو، دسته‌بندی، فهرست/جزئیات محصول، پروفایل و جریان خرید حفظ شود.
- رنگ‌ها و تایپوگرافی با Design System مشترک هماهنگ باشند.

## محدودیت‌های فنی و حفظ رفتار
- Paces یک مرجع بصری است؛ Bootstrap/jQuery/plugins آن را به پروژه Vue/PrimeVue منتقل نکنید.
- همه داده‌ها از APIهای واقعی و storeهای فعلی بیایند.
- قرارداد endpoint، schema، permission، tenant isolation، route guard و رفتارهای تجاری بدون نیازمندی مستقل تغییر نکنند.
- برای ماژول‌های آینده، فقط نقشه اطلاعات و وضعیت planned قابل نمایش است؛ هیچ action ظاهری که عمل نمی‌کند ساخته نشود.
- هر صفحه جداگانه پورت شود: ابتدا بررسی API و state موجود، سپس تغییر template/style، سپس تست regression و build.

## صفحات بررسی‌نشده
صفحات Email/Chat/Calendar/File Manager/Invoice/Project/Task/Ticket/Product Details/Order/CRM/Finance/Recruitment/Employee Details و سایر لینک‌های قالب در این مرحله محتوای کامل قابل واکشی نداشتند. نام این‌ها در نتایج/فهرست‌های قالب یا به‌عنوان دسته‌های مورد انتظار دیده می‌شود، اما جزئیات دقیق هر صفحه در این سند عمداً جعل نشده است. بررسی دقیق آن‌ها نیازمند URL قابل دسترس یا فایل‌های خود قالب است.

## منابع واکشی‌شده
- Paces Cards: https://themes.coderthemes.com/paces/bootstrap/ui-cards.html
- Paces Badges: https://themes.coderthemes.com/paces/bootstrap/ui-badges.html
- Paces Role Details: https://themes.coderthemes.com/paces/bootstrap/apps-users-role-details.html
- Paces HRM Attendance: https://themes.coderthemes.com/paces/bootstrap/apps-hrm-attendance.html
- Paces DataTables Basic: https://themes.coderthemes.com/paces/tailwind/tables-datatables-basic.html
- Paces DataTables JavaScript: https://themes.coderthemes.com/paces/tailwind/tables-datatables-javascript.html
- Paces eCommerce Dashboard: https://themes.coderthemes.com/paces/tailwind/index.html?neo=&rtl=
