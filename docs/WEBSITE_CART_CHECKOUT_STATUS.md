# وضعیت رابط سبد خرید و تکمیل سفارش وب‌سایت

**تاریخ:** 2026-11-04  
**وضعیت:** رابط کاربری مرحله‌ای؛ خرید عملیاتی نیست  
**دامنه:** Website / CUSTOMER

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
