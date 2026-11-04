# طراحی دامنه سفارش خرده‌فروشی و تسویه بازارگاه

**شناسه:** RETAIL-COMMERCE-SETTLEMENT-01  
**وضعیت:** طراحی تأییدنشده برای پیاده‌سازی مرحله‌ای  
**تاریخ:** 2026-11-04  
**دامنه:** فروش خرده‌فروشی B2C، پرداخت، fulfillment فروشنده، مرجوعی و تسویه

> این سند قرارداد پیشنهادی دامنه است، نه اعلام وجود API یا جدول‌های عملیاتی. در شاخه فعلی هیچ مدل مستقل سفارش خرده‌فروشی وجود ندارد و ماژول قدیمی `/orders` در بک‌اند حذف شده است. تا زمان اجرای migration و API، داده‌های UI فقط نمونه‌اند.

## 1. تصمیم‌های معماری

1. **Inquiry و Retail Order دو دامنه مستقل‌اند.** استعلام برای مذاکره B2B و پیشنهاد قیمت است؛ سفارش خرده‌فروشی تعهد خرید قطعی با مبلغ، پرداخت، ارسال و حقوق مرجوعی است. تبدیل خودکار Inquiry به Retail Order در نسخه اول نداریم.
2. **سفارش مشتری از سفارش فروشنده جداست.** یک checkout می‌تواند اقلام چند شرکت را داشته باشد. `Order` سند خرید مشتری و پرداخت کل سبد است؛ برای هر شرکت یک `SellerOrder` ساخته می‌شود تا آماده‌سازی، ارسال، مرجوعی و تسویه هر فروشنده مستقل باشد.
3. **Snapshot زمان خرید منبع حقیقت است.** نام/شناسه محصول، SKU، شرکت، تعداد، قیمت واحد، تخفیف، مالیات، هزینه حمل، آدرس و مشخصات فروشنده در لحظه ثبت سفارش ذخیره می‌شود. تغییر بعدی کاتالوگ یا آدرس نباید فاکتور گذشته را تغییر دهد.
4. **موجودی و قیمت در checkout دوباره کنترل می‌شوند.** قیمت مرورگر یا سبد خرید قابل اعتماد نیست. سرور قیمت معتبر و موجودی قابل فروش را در تراکنش بازخوانی و رزرو می‌کند.
5. **رویدادهای مالی حذف یا ویرایش نمی‌شوند.** اصلاح مالی با سند معکوس/adjustment انجام می‌شود؛ موجودی حساب از دفتر کل دوطرفه محاسبه می‌شود، نه از یک فیلد balance قابل ویرایش.
6. **هر callback پرداخت idempotent است.** شناسه تراکنش درگاه، شناسه رویداد webhook و idempotency key باید یکتا باشند. بازپخش callback نباید سفارش یا سند مالی تکراری بسازد.
7. **تسویه تنها بعد از تحقق شرایط آزادسازی انجام می‌شود.** پرداخت مشتری به‌تنهایی به معنی طلب قطعی و قابل پرداخت فروشنده نیست؛ تحویل، پایان مهلت مرجوعی/اختلاف و وضعیت بازپرداخت باید لحاظ شود.
8. **هیچ UI مجوز مالی ایجاد نمی‌کند.** تأیید تسویه، اجرای پرداخت و ثبت بازپرداخت فقط از API مجاز و audit شده انجام می‌شود؛ نقش مشاهده‌گر، تأییدکننده و پرداخت‌کننده جداست.

## 2. محدوده نسخه اول (MVP)

### داخل محدوده
- فروش کالای دارای وضعیت انتشار مجاز و پرچم فروش خرده‌فروشی.
- قیمت خرده‌فروشی معتبر برای تعداد خرید؛ در نسخه اول هر checkout فقط یک ارز دارد.
- سبد و checkout مشتری، انتخاب آدرس، هزینه حمل و snapshot مبلغ.
- سفارش اصلی و سفارش‌های تفکیک‌شده فروشنده.
- پرداخت درگاه با شروع، callback امن، استعلام وضعیت و ثبت رویداد تکرارناپذیر.
- رزرو/آزادسازی موجودی با انقضای رزرو.
- گردش وضعیت آماده‌سازی، ارسال و تحویل هر SellerOrder.
- درخواست مرجوعی و بازپرداخت کامل/جزئی با ثبت اثر مالی.
- دفتر کل دوبل، محاسبه کمیسیون snapshot شده و حساب بستانکاری فروشنده.
- درخواست تسویه، بررسی دو مرحله‌ای، ثبت پرداخت بانکی و reconciliation.
- پنل پیگیری سفارش مشتری، عملیات Admin و مشاهده سفارش/تسویه مختص شرکت.

### خارج از محدوده نسخه اول
- خرید اعتباری/اقساطی، کیف پول مشتری و پرداخت چندارزی.
- تقسیم یک قلم کالا بین چند انبار یا چند فروشنده.
- مزایده، پیش‌فروش و سفارش سفارشی متصل به Inquiry.
- حسابداری کامل عمومی، حقوق و دستمزد، مالیات‌ستانی خودکار و ERP.
- تسویه خودکار بدون تأیید و تطبیق انسانی درگاه/بانک.

## 3. مدل مفهومی و مالکیت داده

| موجودیت | مالک دامنه | مسئولیت |
|---|---|---|
| Cart / CartItem | Retail Commerce | سبد قابل تغییر مشتری؛ داده مرجع مالی نیست |
| Order | Retail Commerce | checkout و تعهد خرید مشتری، مبلغ کل و وضعیت پرداخت |
| OrderItem | Retail Commerce | snapshot هر قلم، قیمت و تعداد |
| SellerOrder | Retail Fulfillment | سهم هر شرکت از سفارش، وضعیت آماده‌سازی/ارسال |
| InventoryBalance | Inventory | موجودی فیزیکی و رزروشده هر محصول |
| InventoryReservation | Inventory | رزرو موقت متصل به checkout/order |
| InventoryMovement | Inventory | دفتر تغییرات موجودی و علت آن |
| PaymentAttempt | Payments | تلاش پرداخت به درگاه |
| PaymentTransaction | Payments | capture/void/refund تأییدشده |
| PaymentWebhookEvent | Payments | inbox رویدادهای درگاه و idempotency |
| Shipment | Fulfillment | مرسوله، حامل، کد رهگیری و تاریخ‌های حمل |
| ReturnRequest / ReturnItem | Returns | درخواست مرجوعی و اقلام/مقادیر قابل بازگشت |
| JournalEntry / JournalLine | Finance Ledger | ثبت مالی دوبل و immutable |
| CommissionRuleSnapshot | Marketplace Finance | نرخ/قاعده کمیسیون تثبیت‌شده در زمان خرید |
| SellerSettlement | Seller Payables | مبلغ واجد شرایط تسویه برای یک شرکت |
| SettlementPayout | Treasury | دستور پرداخت بانکی و نتیجه آن |
| AuditLog | Platform | عامل، عملیات حساس، دلیل، زمان و منبع |

### روابط اصلی

- `Order 1—N SellerOrder`
- `SellerOrder 1—N OrderItem`
- `Order 1—N PaymentAttempt` و `PaymentAttempt 1—N PaymentTransaction`
- `SellerOrder 1—N Shipment`
- `OrderItem 1—N ReturnItem`; هر ReturnRequest می‌تواند چند قلم را شامل شود.
- `SellerOrder 1—N SellerSettlement` فقط در صورت نیاز به چند دوره/تعدیل؛ پرداخت‌ها با SettlementPayout ثبت می‌شوند.
- `JournalEntry 1—N JournalLine`; مجموع بدهکار و بستانکار برای هر ارز باید برابر باشد.

## 4. قرارداد فیلدهای مهم

### Order
- شناسه داخلی و `orderNumber` عمومی یکتا و غیرقابل حدس.
- `buyerUserId` اجباری؛ مالک سفارش از session استخراج می‌شود، نه body.
- وضعیت‌های مستقل `orderStatus` و `paymentStatus`.
- `currency`، `subtotal`، `discountTotal`، `shippingTotal`، `taxTotal`، `grandTotal` با Decimal دقیق.
- snapshot آدرس تحویل و اطلاعات تماس؛ رابطه به Address اختیاری و صرفاً برای trace.
- `placedAt`, `paidAt`, `completedAt`, `cancelledAt`.
- `idempotencyKey` checkout و کلید یکتای درخواست برای جلوگیری از سفارش تکراری.

### SellerOrder
- `orderId`, `companyId`, `sellerOrderNumber` یکتا.
- وضعیت fulfillment مستقل از وضعیت کل Order.
- snapshot نام/شناسه حقوقی شرکت و نشانی مبدا در لحظه سفارش.
- جمع اقلام، تخفیف تخصیص‌یافته، حمل، مالیات و سهم خالص فروشنده.
- `acceptedAt`, `packedAt`, `shippedAt`, `deliveredAt`.
- فقط کاربران فعال همان Company و نقش‌های STAFF مجاز می‌توانند آن را بخوانند/تغییر دهند.

### OrderItem
- `productId` و شناسه شرکت فروشنده برای trace؛ حذف محصول نباید snapshot را حذف کند.
- `productTitle`, `sku`, `brand`, `model`, `imageUrl`, `companyName` به‌صورت snapshot.
- `quantity`, `unitPrice`, `discountAmount`, `taxAmount`, `lineTotal`, `currency`.
- snapshot قاعده قیمت/price tier و کمیسیون مربوط به همان قلم.
- محدودیت CHECK برای quantity مثبت و مبلغ غیرمنفی.

### Inventory
- در MVP یک موجودی قابل فروش برای هر Product کافی است؛ ساختار Warehouse برای فاز بعدی محفوظ بماند.
- `onHand`، `reserved` و `available = onHand - reserved`; available منفی نشود.
- رزرو باید با update شرطی اتمیک انجام شود؛ خواندن موجودی و سپس نوشتن ساده در دو درخواست مجاز نیست.
- رزرو دارای `expiresAt` و وضعیت ACTIVE/CONSUMED/RELEASED/EXPIRED است.
- ثبت ارسال، مرجوعی قابل قبول و اصلاح انبار فقط با InventoryMovement ممیزی‌شده انجام می‌شود.

## 5. ماشین وضعیت‌ها

### Order (سفارش مشتری)
- `PENDING_PAYMENT` → `PAID` → `PROCESSING` → `PARTIALLY_FULFILLED` → `FULFILLED` → `COMPLETED`
- از قبل از پرداخت: `CANCELLED` یا `PAYMENT_EXPIRED`
- پس از پرداخت: لغو/مرجوعی باید با `CANCELLED` یا `PARTIALLY_CANCELLED` و وضعیت مستقل refund ثبت شود؛ رکورد مالی حذف نمی‌شود.
- `COMPLETED` فقط وقتی همه SellerOrderها تحویل شده، اختلاف باز ندارند و مهلت سیاست مرجوعی تمام شده باشد.

### SellerOrder (تعهد فروشنده)
- `PENDING_ACCEPTANCE` → `ACCEPTED` → `PROCESSING` → `READY_TO_SHIP` → `SHIPPED` → `DELIVERED`
- مسیرهای استثنا: `REJECTED`, `CANCELLED`, `RETURN_REQUESTED`, `PARTIALLY_RETURNED`, `RETURNED`.
- انتقال وضعیت فقط از command مجاز با اعتبارسنجی transition انجام شود؛ PATCH آزاد status ممنوع.

### Payment
- Attempt: `CREATED`, `REDIRECTED`, `PENDING`, `SUCCEEDED`, `FAILED`, `EXPIRED`, `CANCELLED`.
- Transaction: `AUTHORIZED`, `CAPTURED`, `VOIDED`, `PARTIALLY_REFUNDED`, `REFUNDED`, `DISPUTED`.
- وضعیت پرداخت Order از مجموع تراکنش‌های تأییدشده محاسبه شود؛ callback نامعتبر یا برگشت مرورگر موفقیت پرداخت نیست.

### Settlement
- `ELIGIBLE` → `REQUESTED` → `UNDER_REVIEW` → `APPROVED` → `PAYOUT_PENDING` → `PAID` → `RECONCILED`.
- مسیرهای استثنا: `ON_HOLD`, `REJECTED`, `PAYOUT_FAILED`, `ADJUSTED`.
- تأییدکننده و اجراکننده پرداخت باید دو actor مجزا باشند. پرداخت ناموفق با retry جدید و همان settlement قابل پیگیری است؛ ثبت پرداخت بانکی تکراری ممنوع.

## 6. دفتر کل و فرمول تسویه

### اصل حسابداری
برای هر رویداد مالی، JournalEntry و JournalLine در یک تراکنش دیتابیس ثبت شوند. برای هر ارز:

`SUM(debit) = SUM(credit)`

سند posted immutable است. برای برگشت وجه، لغو، اختلاف یا اصلاح کمیسیون سند معکوس/تعدیلی ایجاد می‌شود. ذخیره یک `sellerBalance` mutable به‌عنوان منبع حقیقت ممنوع است؛ balance صرفاً projection قابل بازسازی از ledger است.

### نمونه مفهومی ثبت capture
- بدهکار: وجه نزد درگاه / وجوه در راه
- بستانکار: بدهی به فروشنده
- بستانکار: درآمد کمیسیون بازارگاه
- بستانکار: مالیات/عوارض قابل پرداخت، در صورت اعمال

در صورت کارمزد درگاه، تخفیف یارانه‌ای، هزینه حمل یا مالیات، حساب‌های جدا و تخصیص روشن تعریف شود. مبلغ کمیسیون از snapshot سفارش و قرارداد زمان خرید محاسبه می‌شود، نه از نرخ جاری هنگام تسویه.

### مبلغ واجد شرایط تسویه
`sellerNet = sellerGross - marketplaceCommission - sellerFundedDiscount - sellerChargebacks - sellerRefunds - agreedSellerFees`

هزینه حمل و مالیات باید طبق مسئولیت قراردادی به فروشنده/بازارگاه/حامل تخصیص یابد. هر قلم باید مشخص کند کدام طرف آن را تأمین می‌کند. مبلغ واجد شرایط تسویه فقط بعد از تحویل قطعی و پایان hold/return window (یا تأیید استثنای مستند) آزاد می‌شود.

**توجه حقوقی/عملیاتی:** نگهداری وجوه مشتری و زمان‌بندی آزادسازی باید با قرارداد درگاه، قوانین پرداخت و الزامات قضایی بازارگاه تطبیق داده شود. این سند فرض نمی‌کند پلتفرم مجاز به escrow یا نگهداری وجوه است.

## 7. APIهای پیشنهادی

### Customer
- `GET /api/v1/retail/cart`
- `PUT /api/v1/retail/cart/items/:productId`
- `DELETE /api/v1/retail/cart/items/:productId`
- `POST /api/v1/retail/checkout` با `Idempotency-Key`
- `GET /api/v1/retail/orders`
- `GET /api/v1/retail/orders/:orderNumber`
- `POST /api/v1/retail/orders/:id/cancel` فقط در انتقال مجاز
- `POST /api/v1/retail/orders/:id/returns`

### Company
- `GET /api/v1/company/retail/orders`
- `GET /api/v1/company/retail/orders/:id`
- `POST /api/v1/company/retail/orders/:id/accept`
- `POST /api/v1/company/retail/orders/:id/reject`
- `POST /api/v1/company/retail/orders/:id/shipments`
- `GET /api/v1/company/finance/settlements`
- `GET /api/v1/company/finance/ledger-summary`

### Admin / Finance
- `GET /api/v1/admin/retail/orders`
- `GET /api/v1/admin/retail/orders/:id`
- `POST /api/v1/admin/retail/orders/:id/resolve` با reason اجباری
- `GET /api/v1/admin/finance/settlements`
- `POST /api/v1/admin/finance/settlements/:id/approve`
- `POST /api/v1/admin/finance/settlements/:id/hold`
- `POST /api/v1/admin/finance/settlements/:id/payout`
- `POST /api/v1/admin/finance/settlements/:id/reconcile`
- `GET /api/v1/admin/finance/ledger`

### Payment provider
- `POST /api/v1/payments/retail/webhooks/:provider` فقط با امضای معتبر، replay protection و ثبت inbox.
- ایجاد پرداخت، verify و refund باید از provider adapter سمت سرور انجام شود؛ اطلاعات حساس کارت هرگز ذخیره نشود.

همه endpointها باید schema، pagination، error code پایدار، authorization سمت سرور، tenant scope، rate limit مناسب و audit برای commandهای حساس داشته باشند. شناسه داخلی ترتیبی نباید به‌تنهایی مجوز دسترسی باشد.

## 8. مجوزهای دامنه پیشنهادی

| Permission | Admin/Finance | Company | Customer |
|---|---|---|---|
| `retail.orders.read.all` | مجاز طبق نقش | خیر | خیر |
| `retail.orders.read.company` | مجاز طبق نقش | سفارش‌های شرکت خود | خیر |
| `retail.orders.read.own` | خیر | خیر | سفارش‌های خود |
| `retail.orders.fulfill` | نظارت/override ممیزی‌شده | سفارش‌های شرکت خود | خیر |
| `retail.orders.cancel` | استثنا با دلیل | رد سفارش پیش از fulfillment طبق policy | لغو در بازه مجاز |
| `retail.returns.review` | صف مرجوعی | پاسخ/مدرک فروشنده | ثبت درخواست خود |
| `finance.ledger.read` | مالی مجاز | فقط خلاصه ledger شرکت خود | خیر |
| `finance.settlements.read` | مالی مجاز | تسویه‌های شرکت خود | خیر |
| `finance.settlements.approve` | تأییدکننده مجاز | خیر | خیر |
| `finance.payout.execute` | پرداخت‌کننده مجاز و جدا از تأییدکننده | خیر | خیر |
| `finance.refunds.execute` | نقش مالی/پشتیبانی مجاز | خیر | درخواست، نه اجرا |

Roleهای COMPANY از طریق `AccessProfile.companyId` و RoleScope محدود می‌شوند. STAFF نیز فقط با permission صریح مجاز است. مخفی کردن menu یا بررسی role در Vue جایگزین کنترل سرور نیست.

## 9. سناریوهای پذیرش دامنه

1. دو شرکت در یک checkout: یک Order، دو SellerOrder، پرداخت یکپارچه، fulfillment و تسویه مستقل.
2. دو درخواست هم‌زمان برای آخرین موجودی: فقط یکی رزرو را موفق می‌کند.
3. دوبار رسیدن webhook موفق: فقط یک PaymentTransaction و یک JournalEntry مؤثر ثبت می‌شود.
4. پرداخت موفق اما ایجاد سفارش ناموفق: تراکنش باید با idempotency/reconciliation قابل بازیابی باشد؛ سفارش پرداخت‌شده گم نشود.
5. فروشنده سفارش را رد می‌کند: سهم همان SellerOrder لغو/بازپرداخت و رزرو آزاد می‌شود؛ سفارش فروشندگان دیگر ادامه می‌یابد.
6. مرجوعی جزئی از سفارش چندقلمی: فقط همان OrderItem/quantity اثر می‌گیرد؛ کمیسیون و بدهی فروشنده متناسب تعدیل می‌شود.
7. درخواست تسویه قبل از پایان hold: قابل تأیید/پرداخت نیست.
8. تأیید و پرداخت توسط یک کاربر: ممنوع مگر سیاست break-glass با ثبت دلیل و هشدار امنیتی؛ پیش‌فرض maker-checker.
9. کاربر شرکت A با تغییر ID سفارش شرکت B را می‌خواند: پاسخ 404/403 بدون افشای داده.
10. اصلاح محصول/قیمت/آدرس بعد از خرید: snapshot فاکتور و سابقه سفارش تغییر نمی‌کند.

## 10. فازهای اجرایی پس از تصویب قرارداد

| فاز | خروجی | وابستگی / معیار خروج |
|---|---|---|
| R0 | قرارداد دامنه، وضعیت‌ها، permission matrix و ADR | بازبینی محصول/مالی؛ بدون migration |
| R1 | Product retail eligibility، قیمت و inventory reservation | migration، سرویس اتمیک و تست رقابت |
| R2 | Cart، checkout، Order، SellerOrder و snapshotها | تست multi-seller و idempotency |
| R3 | Payment adapter، webhook inbox، refund و reconciliation | sandbox درگاه، تست replay و شکست |
| R4 | Shipment، تحویل، مرجوعی و اعلان‌ها | تست lifecycle و inventory movement |
| R5 | Ledger دوبل، کمیسیون snapshot و seller payable | توازن سند و گزارش audit |
| R6 | Settlement request، maker-checker، payout و reconciliation | کنترل دسترسی و تطبیق بانکی |
| R7 | اتصال UI Admin/Company/Website به APIهای واقعی | حذف sample data، تست E2E و مستندات |

## 11. وضعیت کد فعلی و بدهی فنی شناخته‌شده

- بک‌اند فعلی در `backend/src/app.js` صریحاً اعلام می‌کند ماژول قدیمی orders حذف شده و هیچ Order model در schema وجود ندارد.
- `packages/api-client/endpoints.js` هنوز مسیرهای legacy `/orders` را تعریف می‌کند؛ این مسیرها قرارداد فعال بک‌اند نیستند.
- `apps/admin/src/pages/admin/orders/OrderList.vue` از `ordersApi` استفاده می‌کند و نباید به‌عنوان صفحه عملیاتی در دسترس باشد.
- `apps/admin/src/stores/orders.js` و `apps/website/src/stores/orders.js` کلاینت‌های legacy هستند؛ تا زمان ساخت API جدید نباید برای عملیات واقعی استفاده شوند.
- `apps/website/src/pages/public/Orders.vue` هنوز داده خالی placeholder تولید می‌کند و route فعال سفارش مشتری در router فعلی ثبت نشده است.
- صفحه `/retail/orders` در Admin و صفحه تسویه Company پیش‌نمایش‌اند و ارقام آن‌ها داده واقعی نیستند.

### اقدام ایمنی موقت
تا پیش از اجرای R1–R3، route قدیمی Admin با نام `admin-orders` باید به صفحه پیش‌نمایش `admin-retail-orders` هدایت شود و endpoint/storeهای legacy فقط با برچسب deprecated باقی بمانند. هیچ تغییر وضعیت سفارش یا پرداخت از این مسیرها انجام نشود.

## 12. تصمیم‌های باز برای مرحله طراحی تفصیلی

این موارد قبل از R1 باید در ADR/تنظیمات کسب‌وکار نهایی شوند:
- آیا همه محصولات برای خرده‌فروشی مجازند یا فقط محصولات دارای retail flag و موجودی؟
- مهلت پذیرش سفارش توسط فروشنده و مهلت ارسال استاندارد هر دسته چیست؟
- دوره hold پس از تحویل و مهلت مرجوعی هر دسته/گروه کالا چقدر است؟
- کمیسیون درصدی، ثابت، پلکانی یا ترکیبی است و هزینه درگاه با کدام طرف است؟
- آیا ارسال توسط فروشنده است یا بازارگاه/حامل مرکزی؟ هزینه و مسئولیت خسارت چگونه تخصیص می‌یابد؟
- سیاست لغو پس از capture و refund جزئی چیست؟
- درگاه و روش قانونی پرداخت/تسویه در بازار هدف کدام است؟
- آیا فروش چندفروشنده‌ای در یک checkout از نسخه اول فعال باشد؟ پیشنهاد معماری: بله، ولی release تدریجی با feature flag.
- واحد ذخیره و نمایش پول در UI چیست؟ پیشنهاد: مقدار اصلی به‌صورت Decimal در IRR، با نمایش شفاف ریال/تومان و تبدیل فقط در مرز UI.
