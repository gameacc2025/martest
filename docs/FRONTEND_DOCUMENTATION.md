# مستندات Frontend — Telecom Marketplace

## معماری

Frontend پروژه سه برنامه مستقل Vue 3/Vite دارد. این پروژه Next.js نیست و مسیر قدیمی `frontend/src/` مرجع ساختار فعلی نیست.

| برنامه | مسیر | زمینه دسترسی |
|---|---|---|
| وب‌سایت بازارگاه | `apps/website` | CUSTOMER و تجربه عمومی |
| پنل شرکت | `apps/company` | COMPANY |
| پنل مدیریت | `apps/admin` | STAFF |

فناوری‌های مشترک شامل Vue 3، Vite، Vue Router و PrimeVue است. Pinia در برنامه‌ها و بخش‌هایی که نیاز دارند استفاده می‌شود. بسته‌های مشترک در `packages/` قرار دارند.

## ساختار سطح بالا

```text
apps/
  website/
    src/
      pages/
      layouts/
      router/
      stores/
  company/
    src/
      pages/
      layouts/
      router/
      stores/
  admin/
    src/
      pages/
      layouts/
      router/
      stores/
packages/
  api-client/
  auth/
  permissions/
  shared-core/
  shared-ui/
  vite-config/
```

این نمودار سطح بالا است؛ نام و محل دقیق هر صفحه را در برنامه مربوطه بررسی کنید. از ساختن مسیر یا store جدید بر اساس ساختار قدیمی مستندات خودداری کنید.

## دستورات

از ریشه monorepo:

```bash
pnpm dev:website
pnpm dev:company
pnpm dev:admin
pnpm build
pnpm test
```

هر برنامه نیز دارای manifest مستقل است. پیش از افزودن script یا انتخاب دستور تست، `package.json` همان برنامه و پیکربندی Vitest را بررسی کنید.

## ارتباط با API

- قرارداد پایه API در بک‌اند با prefix `/api/v1` ثبت می‌شود.
- برای درخواست‌ها از `@telecom/api-client` و الگوی موجود در همان برنامه استفاده کنید؛ در صورت نیاز به response صفحه‌بندی‌شده، قرارداد helper را بررسی کنید و فرض نکنید `apiGet` و `apiGetPaginated` خروجی یکسان دارند.
- خطاهای احراز هویت، پاسخ صفحه‌بندی‌شده و خطاهای API باید مطابق helperهای موجود پردازش شوند.
- از افزودن مستقیم fetch/axios یا client موازی بدون بررسی الگوی فعلی خودداری کنید.

## احراز هویت و مرز پنل‌ها

- زمینه برنامه از access profile می‌آید: `CUSTOMER`، `COMPANY` یا `STAFF`.
- role/permission برای تعیین عملیات مجاز استفاده می‌شود و جایگزین بررسی زمینه دسترسی یا مالکیت رکورد نیست.
- router guard برای تجربه کاربری است؛ بک‌اند باید مجوز و مالکیت را دوباره بررسی کند.
- نقش `SUPER_ADMIN` در middleware عمومی هنوز یک رفتار legacy برای عبور از برخی بررسی‌های نوع برنامه دارد؛ این موضوع در بررسی امنیتی جداگانه ثبت شده و نباید مستندات آن را به‌عنوان سیاست نهایی تأییدشده معرفی کنند.

## تست و build

CI باید تست‌های frontend/shared و build تولیدی هر سه برنامه را اجرا کند. سبز بودن build تضمین‌کننده ظاهر صحیح در مرورگر، رفتار responsive یا صحت session واقعی نیست؛ جریان‌های کلیدی باید با تست مرورگر یا QA محیطی نیز بررسی شوند.

## راهنمای تغییر

1. ابتدا route، page، store و API helper موجود را در همان برنامه پیدا کنید.
2. تغییرات UI را با تست رگرسیون مناسب پوشش دهید.
3. برای عملیات حساس، مجوز و مالکیت سمت بک‌اند را نیز بررسی کنید.
4. تست‌های مربوطه و سپس `pnpm test` و `pnpm build` را اجرا کنید.
5. اگر قرارداد مشترک تغییر کرده، مستندات API و سایر برنامه‌های مصرف‌کننده را نیز به‌روز کنید.
