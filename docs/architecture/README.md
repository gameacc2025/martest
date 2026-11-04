# معماری و گراف وابستگی

## مرجع اصلی

- ساختار workspace و وابستگی‌های بسته‌ها: `package.json`های ریشه، `apps/*/package.json` و `packages/*/package.json`
- اتصال API به ماژول‌ها: `backend/src/app.js`
- مدل داده: `backend/prisma/schema.prisma`
- تاریخچه تغییرات دیتابیس: `backend/prisma/migrations/`
- گراف قابل مشاهده: [DEPENDENCY_GRAPH.generated.mmd](DEPENDENCY_GRAPH.generated.mmd)

گراف Mermaid خروجی اسکریپت است و نباید دستی ویرایش شود. این گراف وابستگی‌های اعلام‌شده در manifestها، سه اپ، ماژول‌های route ثبت‌شده در app.js و رابطه کلی backend با PostgreSQL را نشان می‌دهد؛ این گراف جایگزین call graph در سطح function یا تحلیل runtime نیست.

## بازسازی و اعتبارسنجی

از ریشه مخزن اجرا کنید:

```bash
node scripts/generate-architecture-graph.mjs --write
node scripts/generate-architecture-graph.mjs --check
```

- `--write` گراف Mermaid را از فایل‌های جاری تولید می‌کند.
- `--check` خروجی تولیدشده را با فایل version-controlled مقایسه می‌کند و در صورت اختلاف exit code غیرصفر می‌دهد.
- پس از افزودن/حذف اپ، package، یا ثبت ماژول route، گراف را بازسازی و فایل generated را همراه تغییر کد commit کنید.
- برای بررسی dependencyهای اجرایی واقعی، از tests و traces جداگانه استفاده کنید؛ وجود یک edge در manifest صرفاً وابستگی اعلام‌شده را ثابت می‌کند.
