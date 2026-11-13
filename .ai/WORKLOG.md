# Project Worklog — Compact Index

این فایل شاخص وضعیت جاری و تحویل‌های تأییدشده است؛ تاریخچه کامل در Git نگهداری می‌شود.

## 2026-11-13 — CI-RUNTIME-RECOVERY

- **Status:** اصلاحات سورس روی `main` انجام شده؛ اجرای CI و Runtime برای SHA جدید در انتظار تکمیل است.
- **Latest code fix before docs:** `06daab07ff446aab577b885092a45c382ccd11ad`.
- **Backlog refresh:** `docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md` با شواهد جدید به‌روز شد.
- **Frozen install:** PASS در CI قبلی؛ quill در importer ادمین lockfile ثبت است، تشخیص mismatch قبلی رد شد.
- **Backend tests + Prisma generation + three-app build:** PASS در اجرای CI قبلی.
- **Frontend tests:** 7 تست Website در اجرای قبلی fail؛ test setup، FAQ fixture، CMS legal page async، responsive selector، theme assertion و profile-tab behavior اصلاح شده‌اند؛ اجرای جدید باید نتیجه را تأیید کند.
- **Audit routes:** mount زیر `/api/v1/audit` و حذف OpenAPI stale duplicateها؛ route inventory/OpenAPI tests در CI قبلی PASS.
- **CMS:** مدل‌های Faq/Page، migration `20261113000100_restore_cms_faq_pages`، CRUD و seed در سورس موجودند.
- **Account Recovery:** forgot/reset routes و SMS OTP service موجودند؛ real provider config و browser flow تأییدنشده‌اند.
- **Runtime root cause:** PostgreSQL enum `AuthChallengePurpose` مقدار `LOGIN_MFA` را نداشت؛ seed شکست می‌خورد و health check را خراب می‌کرد. migration افزایشی `20261113000300_add_login_mfa_challenge_purpose` اضافه شد؛ اجرای آن و seed دو باره منتظر CI است.
- **Still incomplete:** Support vertical slice، CRM functional/E2E acceptance، generic SMS dispatcher، Audit event coverage، واقعی‌سازی داشبوردها.
- **Gated:** Retail/Finance activation requires explicit owner commercial/legal decisions.
- **Local state:** Windows working tree, stashes/untracked files, Docker and user PostgreSQL NOT VERIFIED; no local destructive action taken.

## 2026-11-13 — PROJECT-SOURCE-AUDIT

- Remote source audit and prioritized backlog completed. Initial findings were corrected as new commits and CI evidence became available.
- See `docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md` for current status matrix, evidence, risks and priorities.

## Current verified project facts

- Monorepo: Vue 3/Vite/Pinia/PrimeVue; Fastify/Prisma/PostgreSQL; JS/pnpm.
- Apps: Website/CUSTOMER, Company/COMPANY, Admin/STAFF.
- Core Auth/PKCE, company/product/catalog, B2B Inquiry/RFQ, CMS and CRM source exist.
- Support, Retail and Finance are not yet complete operational vertical slices.
- Canonical branch: `main`; no branches/worktrees/detached checkouts/PRs.
- Browser automation is authorized for acceptance; run sequentially and record evidence.
- Preserve local edits, untracked files, stashes and database state.

## Worklog rules

Append only concise verified entries: task ID, exact source SHA, changed paths, checks/results, commit SHA, blockers and next action. Never store credentials, secrets, personal data or raw logs.
