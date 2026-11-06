# قالب «میرون» — پنل مدیریت فروشگاه + فروشگاه اینترنتی

HTML، CSS و JavaScript ساده (بدون React و بدون وابستگی)، فارسی و راست‌به‌چپ (RTL).
طراحی از روی تصاویر مرجع (v3.zip) استخراج شده است: پالت رنگ، سایدبار تیره با آیتم فعال گرادیانی، کارت‌ها، جدول‌ها، منوهای کشویی و ...
> **توجه:** همه‌ی داده‌ها نمونه است. **پرداخت، احراز هویت و ثبت سفارش واقعی سمت سرور پیاده‌سازی نشده‌اند.**
> داده‌ها (سبد خرید، سفارش‌های ثبت‌شده، تنظیمات و ...) فقط در `localStorage` مرورگر ذخیره می‌شوند.

## اجرا
ویجت‌ها با `fetch` بارگذاری می‌شوند، پس باید از طریق سرور محلی اجرا شود (نه با دوبار کلیک روی فایل):

```bash
cd store-template
python -m http.server 8000
# سپس باز کنید: http://localhost:8000/
```
فونت Vazirmatn از Google Fonts بارگذاری می‌شود؛ در حالت آفلاین به Tahoma برمی‌گردد.

## ساختار فایل‌ها
```
index.html                 ← انتقال به داشبورد
admin/                     ← پنل مدیریت (هر صفحه یک HTML مستقل)
  dashboard, products, product-details, categories, inventory, cart, checkout,
  orders, order-details, customers, transactions, reports, settings,
  invoice-list, invoice, plans, profile, blog-details, blog-create, faqs,
  chat, mail, security, roles, login
  ui/  alerts, badges, buttons, cards, ribbons, tooltips, colors, widgets
shop/                      ← فروشگاه اینترنتی
  index, products, product, cart, checkout, login, register
components/                ← کامپوننت‌های قابل‌استفاده‌مجدد (فایل HTML جدا)
  layout/     sidebar, header, page-header, footer, shop-header, shop-footer
  dropdowns/  cart-dropdown, notifications-dropdown, profile-dropdown
  widgets/    stat-card*, tracking-card, progress-row, filter-panel, product-card,
              cart-item, order-summary, role-card, plan-card, faq-item, mail-row, chat-bubble, ...
  ui/         alert*, badge, button, card-border, card-actions, ribbon-card, tooltip, swatch, code-panel
assets/
  css/  tokens.css (توکن‌های طراحی) · base.css · layout.css · components.css · pages.css
  js/   core.js (لودر کامپوننت، قالب‌ساز، Store/Cart) · ui.js (رفتار مشترک) · charts.js (نمودار SVG) · data.js (داده نمونه)
        pages/ dashboard, ecommerce, content, apps, uikit, shop, auth
  img/products/  تصاویر نمونه‌ی محصول (برش‌خورده از مرجع)
tools/  lib.py + p_*.py ← (اختیاری) تولیدکننده‌ی صفحه‌های HTML
```

## کامپوننت‌ها چطور کار می‌کنند؟
هر کامپوننت یک فایل HTML است با جای‌نگهدارهای `{{name}}` و آیکن `{{icon:cart}}`.

۱) داخل HTML:
```html
<div data-component="widgets/stat-card"
     data-title="درآمد" data-value="۱۲٬۰۰۰" data-icon="dollar" data-color="primary"
     data-trend="+۴٪" data-dir="up" data-sub="نسبت به ماه قبل"></div>
```
۲) داخل JavaScript:
```js
html = Core.tpl('widgets/stat-card', {title:'درآمد', value:'۱۲٬۰۰۰', icon:'dollar', color:'primary', trend:'+۴٪', dir:'up', sub:''});
```
محتوای داخل تگ (`data-component`) در `{{slot}}` قرار می‌گیرد. `{{root}}` مسیر ریشه‌ی پروژه است.

## افزودن کامپوننت (ویجت) جدید
1. فایل `components/widgets/my-widget.html` را بسازید (می‌توانید `{{title}}` و … استفاده کنید).
2. نام آن (`widgets/my-widget`) را به آرایه‌ی `MANIFEST` در `assets/js/core.js` اضافه کنید.
3. در هر صفحه با `data-component="widgets/my-widget"` یا `Core.tpl(...)` استفاده کنید.

## افزودن صفحه‌ی جدید
۱) بدون ابزار: یکی از صفحه‌های `admin/*.html` را کپی کنید، عنوان و `data-crumbs` را عوض کنید و محتوا را در `<main class="content">` بگذارید.
اسکریپت صفحه را در پایین ثبت کنید و `Core.boot(async()=>{ ... })` را صدا بزنید.

۲) با تولیدکننده (Python 3):
```python
# tools/p_mypage.py
from lib import page
page('admin/my-page.html','عنوان صفحه',body='<div id="page"></div>',
     crumbs='گروه|عنوان صفحه', js=['pages/my-page'], init='await Pages.myPage()')
```
سپس `cd tools && python p_mypage.py`. برای ظاهر فروشگاه `shell='shop'` و برای صفحه‌ی بدون چارچوب `shell='bare'` بدهید.
لینک صفحه را در `components/layout/sidebar.html` اضافه کنید.

## تعامل‌های پیاده‌سازی‌شده (بدون بک‌اند)
جست‌وجو و فیلتر محصولات (دسته، برند، رنگ، قیمت، مرتب‌سازی) · افزودن/حذف/تغییر تعداد در سبد · جمع، تخفیف (کد نمونه `OFF10`) و مبلغ نهایی · ثبت سفارش با اعتبارسنجی و نمایش وضعیت · جدول سفارش‌ها (جست‌وجو، فیلتر، صفحه‌بندی، حذف) · مشتریان، دسته‌بندی‌ها، موجودی انبار · چت، ایمیل (کشوی مشاهده)، پروفایل، نقش‌ها، تنظیمات · حالت تیره · منوی موبایل.
