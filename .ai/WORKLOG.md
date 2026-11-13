# Project Worklog — Compact Index

این فایل فقط شاخص وضعیت جاری و تحویل‌های تأییدشده است؛ تاریخچه جزئی در Git نگهداری می‌شود.

## 2026-11-13 — PROJECT-SOURCE-AUDIT — ممیزی کامل سورس و اولویت‌بندی

- **Status:** ممیزی Remote source-level انجام شد؛ runtime محلی و Docker/PostgreSQL کاربر NOT VERIFIED.
- **Code baseline:** `48e73952e277703b70a351d4f0569fed48944b76`.
- **Documentation commit:** `d891824aad406b9017e09ea45a189d4584cdbab3` — به‌روزرسانی `docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md`.
- **Memory handoff commit:** `3d450b6431ea2b8ee7df700e032441fa9af879ce` — به‌روزرسانی `.ai/current-task.md`.
- **GitHub Actions evidence on code baseline:** Prisma migrations PASS؛ Prisma Client generation و Backend tests PASS؛ workspace dependency installation FAIL؛ frontend/shared tests SKIPPED؛ frontend build FAILURE؛ Runtime Validation FAIL در dependency installation و Compose/browser مراحل بعدی SKIPPED.
- **Key source findings:** Admin quill dependency با importer در pnpm-lock mismatch؛ CMS FAQ/Page service به Prisma delegateهای غایب ارجاع می‌دهند؛ self-service forgot/reset routes غایب و AuthChallenge delivery TODO/authenticated است؛ Support فقط DB foundation و UI نمونه دارد؛ CRM source موجود اما schema/functional tests/E2E ناکافی؛ Retail/Finance فقط DB foundation و UIهای preview؛ SMS عمومی در dispatcher queue نمی‌شود؛ API docs/inventory CMS/CRM را کامل پوشش نمی‌دهند؛ agent policy و palette docs تناقض دارند.
- **Priority:** P0 lockfile/CI → CMS FAQ/Page consistency → account recovery → API/docs/policy reconciliation → safe runtime/seed validation. سپس P1 CRM acceptance، Support vertical slice، SMS/Audit، real dashboards و سه اپ regression. Retail/Finance در P2 و gated باقی می‌مانند.
- **No local claims:** local Git status، stash/untracked، Docker، PostgreSQL و اجرای seed روی سیستم کاربر بررسی نشده‌اند.
- **Audit detail:** `docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md`; current handoff: `.ai/current-task.md`.

## 2026-11-13 — PHASE-0-DOC-AUDIT — Documentation and agent-memory normalization

- Remote docs were normalized; current-task/WORKLOG/ACTIVE were compacted and Persian communication, main-only policy and browser-testing authorization were recorded.
- Previous oversized task/worklog histories remain available in Git history.
- Local workspace/runtime checks were not run in that documentation-only pass.

## Current verified project facts (source-level)

- Monorepo: Vue 3/Vite/Pinia/PrimeVue frontend; Fastify/Prisma/PostgreSQL backend; JavaScript and pnpm workspace.
- Apps: Website/CUSTOMER, Company/COMPANY, Admin/STAFF.
- Core source areas exist for Auth/session/PKCE, company/product/catalog, B2B Inquiry/RFQ, notifications, CMS Article, and CRM.
- Support, Retail and Finance are not operational vertical slices despite their Prisma DB foundations.
- Canonical branch is `main`; no branches/worktrees/detached checkouts/PRs.
- Browser automation is authorized for acceptance workflows; run sequentially and record exact evidence.
- Retail and Finance activation require owner decisions.

## Worklog rules

- Append concise verified entries only: task ID, status, scope, exact checks/results, commit SHA, push verification, blockers and next action.
- Do not store credentials, secrets, personal data or raw command logs.
- Use Git history for detailed chronology; do not treat historical claims as current proof.
