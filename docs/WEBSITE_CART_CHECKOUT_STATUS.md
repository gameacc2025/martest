# وضعیت رابط سبد خرید و تکمیل سفارش وب‌سایت

**دامنه:** Website / CUSTOMER

**تاریخ به‌روزرسانی:** 2026-11-24  
**وضعیت فعلی:** سبد خرید، کاتالوگ Retail و پیش‌نمایش server-authoritative فعال؛ ثبت سفارش و پرداخت هنوز مسدود است.  
**تصمیم:** ممنوعیت قبلی AD-4 در تاریخ 2026-11-24 توسط مالک لغو شد؛ B2C باید هم‌زمان با B2B توسعه یابد.

## وضعیت اجرایی فعلی — 2026-11-24

- مسیرهای `/cart`، `/checkout` و `/wishlist` ثبت شده‌اند؛ Checkout فقط در CUSTOMER context قابل دسترسی است.
- کاتالوگ B2C از `GET /api/v1/retail/catalog` و جزئیات از `GET /api/v1/retail/catalog/:id` می‌آید؛ محصول باید PUBLISHED/PUBLIC، فروشنده ACTIVE، `retailEnabled=true` و دارای قیمت مثبت و معتبر با minQuantity=1 باشد.
- افزودن به سبد از Product Listing و Product Details برای مهمان/CUSTOMER و فقط محصول retail-enabled و موجود فعال است. B2B inquiry action جداگانه حفظ شده است.
- Checkout از `POST /api/v1/retail/checkout/preview` استفاده می‌کند و قیمت، موجودی و subtotal فروشنده‌ها را از سرور دوباره محاسبه می‌کند.
- تعداد دقیق موجودی در کاتالوگ عمومی افشا نمی‌شود؛ preview احراز هویت‌شده موجودی قابل خرید را نشان می‌دهد.
- هزینه ارسال، مالیات و مبلغ نهایی تا پیکربندی سیاست‌ها null می‌مانند. ثبت سفارش، رزرو موجودی و پرداخت در این مرحله انجام نمی‌شود.
- اجرای واقعی PostgreSQL، 24 محصول واجد شرایط را در کاتالوگ تأیید کرد و ثابت کرد preview هیچ سفارش، پرداخت، رزرو یا حرکت موجودی ایجاد نمی‌کند.
- سفارش، پرداخت sandbox/webhook، تاریخچه سفارش مشتری و عملیات fulfillment شرکت مرحله بعد هستند. هیچ موفقیت پرداختی در کلاینت شبیه‌سازی نمی‌شود.

**شواهد:** CI: 1,864 تست Backend، 74 فایل تست Frontend/Shared، 18 تست معماری/Session، سه Build موفق؛ Migration: 19 مورد و parity مدل/جدول 101؛ Runtime: 8/8 Playwright و Retail PostgreSQL probe موفق. SHA کد: `baa58bd34c500aaa27411f8bc7c77fef2a2a8a31`.

---

## خروجی این مرحله

- مسیر `/cart` به صفحه سبد خرید متصل است و از هدر عمومی وب‌سایت قابل دسترسی است.
- مسیر `/checkout` فقط برای کاربر احراز هویت‌شده در زمینه CUSTOMER فعال است.
- سبد خرید محلی از قرارداد واقعی Pinia store استفاده می‌کند: `addItem`, `removeItem`, `updateQuantity`, `clearCart`.
- تعداد و جمع قیمت از همان store محاسبه می‌شود؛ تخفیف، هزینه ارسال، محصولات پیشنهادی و پیام موفقیت ساختگی حذف شده‌اند.
- اعتبارسنجی فرم نشانی ارقام فارسی و عربی را می‌پذیرد.
- فرم پرداخت کارت، شماره کارت، CVV2 و تاریخ انقضا حذف شده است. این وب‌سایت نباید داده کارت را دریافت یا نگهداری کند.
- دکمه ثبت سفارش غیرفعال است تا API سفارش، کنترل قیمت/موجودی سمت سرور و درگاه معتبر پیاده‌سازی شوند. UI هیچ سفارش، رزرو موجودی یا تراکنش مالی نمی‌سازد.

## محدودیت‌های صریح

1. داده سبد در `localStorage` مرورگر ذخیره می‌شود و منبع حقیقت قیمت یا موجودی نیست.
2. قیمت‌ها ممکن است پس از تغییر کاتالوگ منقضی شوند؛ checkout واقعی باید قیمت و موجودی را سمت سرور دوباره بررسی کند.
3. هزینه ارسال، مالیات، تخفیف و مبلغ قابل پرداخت هنوز از سرور محاسبه نمی‌شوند.
4. مدل Retail Order، SellerOrder، رزرو موجودی، PaymentAttempt، webhook، ledger و settlement هنوز وجود ندارند.
5. دکمه افزودن به سبد در صفحه جزئیات محصول نباید برای همه محصولات فعال شود؛ مجاز بودن فروش خرده‌فروشی باید با فیلد/سیاست backend و قیمت معتبر تعیین شود.

## فایل‌های اصلی

- `apps/website/src/stores/cart.js`
- `apps/website/src/stores/cart.test.js`
- `apps/website/src/pages/public/ShoppingCart.vue`
- `apps/website/src/pages/public/Checkout.vue`
- `apps/website/src/router/index.js`
- `apps/website/src/layouts/PublicLayout.vue`

## معیار فعال‌سازی خرید واقعی

خرید تنها بعد از اجرای فازهای R1 تا R3 در `RETAIL_COMMERCE_AND_SETTLEMENT_DESIGN.md` فعال شود: مجازسازی محصول و قیمت، موجودی و رزرو اتمیک، checkout چندفروشنده‌ای و snapshotها، پرداخت server-to-server، callback امضاشده و idempotent، تست‌های دامنه و audit. تا آن زمان دکمه ثبت سفارش و پرداخت باید غیرفعال بماند.


## UI safety note — 2026-11-04
The storefront fixed-price add-to-cart control is shown disabled with an explanation until authoritative Order and Inventory APIs exist. The localStorage cart is a preview only; it must not be represented as a completed purchase, reservation, payment or order. Do not enable the control from retailEnabled and a displayed price alone.

## بهبود هدر و سبد خرید — 2026-11-06

- هدر عمومی به‌جای فیلد دائمی، جستجوی آیکونی با پنجره بازشونده و ارسال به مسیر نتایج جستجو دارد.
- سبد خرید از هدر در یک drawer ثابت از لبه فیزیکی چپ باز می‌شود؛ تصویر بندانگشتی، قیمت، تعداد، حذف کالا و جمع کل از Pinia cart store خوانده می‌شوند.
- CTA تسویه فقط به مسیر checkout موجود هدایت می‌کند؛ محدودیت‌های خرید واقعی و غیرفعال بودن ثبت سفارش/پرداخت تا زمان ایجاد API معتبر همچنان برقرار است.
- این رابط به‌تنهایی سفارش، رزرو موجودی یا پرداخت ایجاد نمی‌کند.

