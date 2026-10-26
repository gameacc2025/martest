# ماتریس دامنه دسترسی و مجوزها

> این سند مرزهای معماری را توضیح می‌دهد، نه فهرست ثابت همه مجوزهای seed. نام نقش به‌تنهایی مرز امنیتی نیست. برای نقش‌ها و مجوزهای جاری به `backend/prisma/seed.js`، `backend/src/middlewares/rbac.js` و routeهای هر ماژول رجوع کنید.

## سه دامنه دسترسی

| `AccessProfile.type` | پنل اصلی | محدوده |
|---|---|---|
| `STAFF` | `apps/admin` | عملیات داخلی/مدیریتی بر اساس permissionهای نقش |
| `COMPANY` | `apps/company` | منابع شرکت مربوط به پروفایل؛ مالکیت در backend بررسی می‌شود |
| `CUSTOMER` | `apps/website` | تجربه خریدار/بازار عمومی و جریان‌های صریحاً مجاز |

`AccessProfile.type` از `Role.name` مستقل است. `Role.scope` نیز برای محدودکردن roleهای قابل‌تخصیص تعریف شده است. نقش سفارشی باید scope صحیح داشته باشد؛ نامی مانند `COMPANY_ACCOUNTANT` به‌تنهایی scope را تعیین نمی‌کند.

## کنترل دسترسی در backend

1. احراز هویت با auth plugin انجام می‌شود.
2. routeهای محافظت‌شده از middleware مرکزی `backend/src/middlewares/rbac.js` برای access type و permission استفاده می‌کنند.
3. سرویس‌ها علاوه بر route guard، مالکیت شرکت و دسترسی به رکورد/عملیات را در نقاط لازم بررسی می‌کنند.
4. Router guardهای فرانت‌اند تجربه کاربری را کنترل می‌کنند و مرز امنیتی محسوب نمی‌شوند.
5. درخواست با شناسه دلخواه (companyId/productId/inquiryId) نباید بدون کنترل مالکیت، دسترسی به داده دیگران بدهد.

## قواعد مهم حوزه‌ای

- مدیریت محصول برای STAFF و COMPANY است؛ CUSTOMER نباید به routeهای مدیریت محصول دسترسی بگیرد.
- عملیات تأیید/رد/پنهان‌سازی/آرشیو در حوزه STAFF قرار دارد؛ انتشار شرکت تابع وضعیت تأیید و مالکیت است.
- دسترسی شرکت به محصولات/کاربران/استعلام‌ها باید در سرویس با شرکت متصل به AccessProfile محدود شود.
- Inquiry فقط با فرض «فقط STAFF/COMPANY» مستند نشود: routeهای جاری بعضی جریان‌های list/create را برای STAFF، COMPANY و CUSTOMER ثبت کرده‌اند. مجوز دقیق و مالکیت باید از route + service + تست‌ها خوانده شود.
- عملیات اعلان شخصی باید فقط روی اعلان‌های متعلق به کاربر انجام شود؛ عملیات مدیریت/ارسال اعلان permission جداگانه دارد.
- `SUPER_ADMIN` در middleware فعلی bypassهای تعریف‌شده دارد؛ این رفتار را از روی اسم نقش تعمیم ندهید و تغییر آن را با تست امنیتی همراه کنید.

## نگاشت routeهای نمونه

| حوزه | مسیر | الگوی کنترل |
|---|---|---|
| Auth | `/api/v1/auth/*` | عمومی برای login/register؛ cookie/origin guard برای refresh/logout؛ access token برای me/logout-all |
| Products | `/api/v1/products/*` | public read در محدوده انتشار/visibility؛ management با type + permission؛ مالکیت در service |
| Inquiries | `/api/v1/inquiries/*` | type + permission + مالکیت استعلام/پاسخ |
| Notifications | `/api/v1/settings/notifications/*` | authenticate و مالکیت داده کاربر |
| Roles/Permissions | `/api/v1/roles/*`, `/api/v1/permissions/*` | مجوزهای مدیریت نقش/مجوز |

## فرایند تغییر نقش/مجوز

- seed و enumهای `RoleScope` / `AccessProfileType` را بررسی کنید.
- هر تغییر را در route guards و service-level ownership checks اعمال کنید.
- تست مثبت و منفی برای STAFF/COMPANY/CUSTOMER اضافه کنید؛ برای COMPANY دو tenant مستقل را تست کنید.
- `pnpm --dir backend test` و CI را اجرا کنید.
- فقط بعد از بررسی route/service/test، ماتریس را به‌روزرسانی کنید.
