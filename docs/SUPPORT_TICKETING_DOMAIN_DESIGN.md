# طراحی دامنه پشتیبانی و تیکتینگ چندکاناله

**شناسه:** SUPPORT-TICKETING-01  
**وضعیت:** دامنه پیاده‌سازی‌شده؛ این سند اکنون قرارداد و وضعیت as-built را ثبت می‌کند  
**تاریخ بازبینی:** 2026-11-26

## 1. هدف و مرزبندی

یک Ticket باید از سه نقطه قابل ایجاد و پیگیری باشد: Website برای CUSTOMER، Company برای کاربران شرکت، و Admin برای تیم STAFF. هر سه تجربه از یک دامنه و یک تاریخچه مکالمه استفاده می‌کنند، اما سطح دسترسی و داده قابل مشاهده متفاوت است.

تیکت با Inquiry یکی نیست:
- Inquiry برای خرید سازمانی، دعوت تأمین‌کنندگان و دریافت پیشنهاد قیمت است.
- Ticket برای درخواست کمک، گزارش مشکل، پیگیری و ارتباط پشتیبانی است.
- Ticket می‌تواند به Inquiry یا سفارش خرده‌فروشی مرتبط شود، اما وضعیت و چرخه عمر مستقلی دارد.

## 2. موجودیت‌ها

| موجودیت | مسئولیت |
|---|---|
| SupportTicket | موضوع، کد عمومی، درخواست‌کننده، شرکت، دسته، اولویت، وضعیت، SLA و مالک |
| SupportMessage | پیام عمومی یا یادداشت داخلی، نویسنده، زمان و وضعیت ویرایش |
| SupportAttachment | فایل خصوصی مرتبط با پیام، metadata و مجوز دانلود |
| SupportQueue | صف تخصصی مانند حساب، محصولات، سفارش، مالی و فنی |
| SupportAssignment | تاریخچه تخصیص کارشناس/صف، عامل و زمان |
| SupportStatusHistory | تغییر وضعیت با actor و reason |
| SupportCategory | دسته‌بندی قابل مدیریت و قواعد SLA |
| SupportSlaPolicy | زمان پاسخ اول و زمان حل بر اساس اولویت/دسته |
| SupportEvent | رخدادهای دامنه برای اعلان، گزارش و audit |

### SupportTicket
- `ticketNumber` عمومی، یکتا و غیرقابل حدس.
- `requesterUserId` همیشه کاربر واقعی ثبت‌کننده است.
- `requesterCompanyId` برای تیکت‌های شرکتی اجباری و برای CUSTOMER تهی است.
- `createdFrom`: WEBSITE, COMPANY, ADMIN.
- `categoryId`, `priority`, `status`, `subject`, `firstResponseDueAt`, `resolveDueAt`.
- `assignedQueueId`, `assignedUserId`, `firstRespondedAt`, `resolvedAt`, `closedAt`.
- فیلدهای اختیاری reference باید در نسخه اول به صورت شناسه نوع‌دار و validate شده نگهداری شوند؛ برای Inquiry و RetailOrder پس از وجود مدل مربوط، relation صریح اضافه شود.
- Soft delete برای تیکت مجاز نیست؛ آرشیو وضعیت جداگانه و retention policy دارد.

### SupportMessage
- `ticketId`, `senderUserId`, `body`, `visibility` (PUBLIC یا INTERNAL), `createdAt`.
- فقط STAFF می‌تواند INTERNAL ایجاد کند؛ COMPANY و CUSTOMER حتی با دستکاری payload قادر به ساخت یا خواندن یادداشت داخلی نیستند.
- پیام ارسال‌شده immutable است؛ اصلاح با پیام follow-up یا audit ثبت می‌شود.
- اعلان برای پیام عمومی به طرف مقابل ارسال می‌شود؛ یادداشت داخلی نباید اعلان مشتری/شرکت بسازد.

### SupportAttachment
- فایل‌ها private هستند و URL عمومی دائمی ندارند.
- دانلود از endpoint دارای authorization و بررسی تعلق به تیکت انجام می‌شود.
- نوع MIME، اندازه، checksum، نام امن و وضعیت اسکن ثبت شود.
- فایل پیوست یادداشت داخلی فقط برای STAFF قابل دانلود است.

## 3. ماشین وضعیت پیشنهادی

- `OPEN`: تازه ثبت‌شده و در صف رسیدگی.
- `IN_PROGRESS`: کارشناس رسیدگی را آغاز کرده.
- `WAITING_CUSTOMER`: پاسخ/مدرک از مشتری لازم است.
- `WAITING_COMPANY`: پاسخ/مدرک از شرکت لازم است.
- `RESOLVED`: پاسخ ارائه شده و منتظر تأیید/بسته‌شدن.
- `CLOSED`: نهایی؛ بازگشایی فقط طبق policy و با audit.
- `SPAM`: هرزنامه یا مورد نامعتبر؛ فقط نقش STAFF مجاز.

تغییر وضعیت باید command-specific باشد؛ PATCH عمومی status مجاز نیست. انتقال به WAITING_* باید دلیل و زمان follow-up داشته باشد. پاسخ مشتری/شرکت می‌تواند طبق policy تیکت را از WAITING_* به IN_PROGRESS برگرداند.

## 4. قواعد دسترسی و جداسازی

| Actor | مشاهده | پاسخ عمومی | یادداشت داخلی | تخصیص/بستن |
|---|---|---|---|---|
| CUSTOMER | فقط تیکت‌های requesterUserId خود | تیکت خود | هرگز | درخواست بستن/بازگشایی طبق policy |
| COMPANY | فقط تیکت‌های requesterCompanyId شرکت متصل به AccessProfile | تیکت‌های شرکت خود | هرگز | پاسخ و درخواست بازگشایی؛ تخصیص داخلی ممنوع |
| STAFF | بر اساس صف و مجوز support.tickets.* | مجاز طبق مجوز | فقط مجوز جداگانه | فقط مجوز assign/resolve/close |
| SUPER_ADMIN | همه تیکت‌ها با audit | مجاز | مجاز | مجاز؛ همچنان maker/audit rules برقرار |

- Company user نباید با تغییر ticket ID تیکت شرکت دیگر را بخواند.
- Customer نباید تیکت ثبت‌شده با حساب دیگر را ببیند، حتی اگر شماره موبایل مشترک باشد.
- STAFF دسترسی کلی فقط از permission مشخص و صف مجاز می‌آید؛ role به‌تنهایی کنترل داده نیست.
- API باید در query اولیه tenant/requester scope را اعمال کند؛ فیلتر کردن پس از fetch ممنوع.
- عدم دسترسی به شناسه ناموجود و شناسه متعلق به دیگری می‌تواند پاسخ 404 یکسان بدهد تا enumeration دشوار شود.

## 5. SLA و اعلان

- SLA از زمان ایجاد تیکت شروع می‌شود و باید timezone/تقویم کاری و تعطیلات قابل تنظیم داشته باشد.
- first response فقط با اولین پاسخ عمومی کارشناس محاسبه شود؛ یادداشت داخلی پاسخ اول نیست.
- زمان انتظار CUSTOMER/COMPANY در صورت نیاز طبق policy از زمان SLA کسر/متوقف شود و تمام pause/resumeها audit شوند.
- اولویت‌ها: LOW, NORMAL, HIGH, URGENT.
- هشدار نزدیک سررسید، نقض SLA، تخصیص، پاسخ جدید و بسته‌شدن از Notification domain موجود استفاده می‌کنند.
- retry اعلان باید idempotent باشد؛ شکست ارسال اعلان نباید پیام تیکت را rollback کند.

## 6. API پیاده‌سازی‌شده

Base path: /api/v1/support.

- GET /categories؛ GET/POST /tickets؛ GET /tickets/:id؛ POST /tickets/:id/messages.
- STAFF-only: PATCH /tickets/:id/status، POST /tickets/:id/assign، GET /queues، GET /queues/:queueId/tickets و /stats.
- SLA: GET /tickets/:id/sla، POST /tickets/:id/sla/pause و /resume؛ pause/resume فقط STAFF است.
- پیوست: POST /tickets/:id/messages/:messageId/attachments، GET همان مسیر با /:attachmentId/download و DELETE همان attachment.
- فهرست تیکت‌ها pagination سروری، search روی شماره/موضوع و status group را اعمال می‌کند؛ فیلترها با tenant scope در یک query ترکیب می‌شوند.
- هر فایل در مسیر خصوصی uploads/support نگهداری می‌شود؛ دانلود با بررسی هم‌زمان ticketId/messageId/attachmentId و مجوز requester/company/STAFF انجام می‌شود.

## 7. مجوزهای فعال

- CUSTOMER، COMPANY و STAFF با tickets.read به دسته‌ها/تیکت‌های مجاز خود دسترسی دارند.
- CUSTOMER، COMPANY و STAFF با tickets.create تیکت می‌سازند؛ با tickets.reply پیام عمومی و پیوست مجاز را ارسال می‌کنند.
- تغییر وضعیت، تخصیص صف/کارشناس، صف‌ها و عملیات SLA فقط با exact STAFF access type و tickets.update یا tickets.read مجازند.
- scope در service نیز enforce می‌شود: CUSTOMER فقط requesterUserId خودش؛ COMPANY فقط requesterCompanyId شرکت فعال؛ STAFF طبق مجوز داخلی.
- visibility=INTERNAL فقط برای STAFF قابل ثبت/خواندن است و از پاسخ API مشتری/شرکت حذف می‌شود.

## 8. سناریوهای پذیرش

1. CUSTOMER فقط تیکت‌های خودش را می‌بیند.
2. کاربر COMPANY فقط تیکت‌های شرکت فعال خود را می‌بیند؛ چند کاربر یک شرکت طبق policy به تاریخچه مشترک شرکت دسترسی دارند.
3. Company A با ticketNumber شرکت B هیچ داده‌ای دریافت نمی‌کند.
4. مشتری نمی‌تواند با ارسال `visibility=INTERNAL` یادداشت داخلی بسازد.
5. پیام داخلی در Website/Company API، شمارنده unread و notification طرف مقابل دیده نمی‌شود.
6. پیام عمومی به طرف مقابل اعلان می‌دهد، اما خطای provider پیام را حذف نمی‌کند.
7. پیوست تیکت دیگر با حدس URL یا attachmentId قابل دانلود نیست.
8. first response SLA با یادداشت داخلی محاسبه نمی‌شود.
9. تغییر وضعیت غیرمجاز با API command رد می‌شود و status history باقی می‌ماند.
10. بسته‌شدن تیکت توسط مشتری با بستن توسط STAFF از نظر actor/source قابل تشخیص است.

## 9. ترتیب پیاده‌سازی

| فاز | خروجی |
|---|---|
| T0 | مدل داده، state machine، permission matrix و SLA policy |
| T1 | SupportTicket/Message/StatusHistory و API ایجاد/فهرست/جزئیات |
| T2 | پاسخ عمومی، یادداشت داخلی، attachment private و audit |
| T3 | صف‌ها، assignment، SLA worker و اعلان‌ها |
| T4 | UI سه اپ با API واقعی، unread counts، filters و conversation |
| T5 | گزارش SLA، کیفیت پاسخ، دسته‌بندی و یکپارچگی CRM/Order/Inquiry |

## 10. وضعیت پیاده‌سازی فعلی — 2026-11-26

Support از حالت prototype خارج شده و در هر سه پنل به API واقعی متصل است.

- مدل‌های Prisma شامل SupportTicket، SupportMessage، SupportAttachment، SupportStatusHistory، SupportQueue، SupportAssignment، SupportSlaPolicy و SupportEvent هستند.
- backend/src/modules/support مسیرهای /api/v1/support را ثبت می‌کند؛ کنترل دسترسی در route و service و tenant scope انجام می‌شود.
- Website CUSTOMER، Company و Admin از کامپوننت مشترک packages/shared-ui/components/operations/TicketDeskWorkspace.vue استفاده می‌کنند.
- قابلیت‌ها: ایجاد/فهرست/جزئیات تیکت، پیام عمومی، یادداشت داخلی STAFF، وضعیت و تاریخچه، تخصیص صف، صف و آمار، SLA detail/pause/resume، اعلان، upload/download/delete پیوست خصوصی.
- صندوق تیکت صفحه‌بندی سروری ۲۵‌تایی، total count، search شماره/موضوع و فیلتر OPEN/CLOSED سروری دارد؛ debounce و request-sequence از race پاسخ‌ها جلوگیری می‌کنند.
- تست مرورگری e2e/tests/support-acceptance.spec.js جداسازی CUSTOMER/COMPANY و عدم نمایش یادداشت داخلی به مشتری را روی Docker/PostgreSQL بررسی می‌کند.
- تست‌های service/route/component برای tenant scope، پیام داخلی، پیوست، SLA، صف و pagination/filter وجود دارند.

### موارد باز و مرزهای تصمیم

- مقادیر workingCalendar seed (timezone، ساعات کاری و تعطیلات نمونه) داده توسعه‌اند؛ قبل از production باید timezone، روزهای کاری، تعطیلات رسمی و تقویم هر tenant توسط مالک تأیید شود.
- ارسال واقعی SMTP/Twilio و callback/retry ارائه‌دهنده با credential واقعی در این اعتبارسنجی انجام نشده است؛ خطاهای provider نباید پیام ذخیره‌شده را حذف کنند.
- ذخیره‌سازی فعلی پیوست روی storage محلی backend است؛ سیاست production برای object storage، backup، retention و malware scanning باید جداگانه تأیید شود.
- پذیرش گسترده‌تر SLA analytics، staff assignment edge cases، keyboard/accessibility و تست بازیابی storage همچنان باز است.
