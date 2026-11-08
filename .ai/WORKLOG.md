## 2026-11-08 — REMAINING-FEATURES-BACKLOG-01 — Comprehensive implementation inventory
- **Status:** IN_PROGRESS
- **Agent:** ChatGPT via GitHub repository tools
- **Goal:** Reconcile implemented marketplace capabilities, existing UI prototypes, current schema/routes, and prior domain designs into one prioritized implementation backlog for the owner (Persian conversation) and AI agents (English repository documentation).
- **Claimed scope:** Read-only architecture/source audit plus new English master backlog; update project handoff and worklog. No schema, migration, API, UI, permission, or business-rule implementation in this task.
- **Evidence reviewed:** `backend/prisma/schema.prisma` (42 models / 21 enums), registered API route inventory, API-client endpoint definitions, Website/Company/Admin routers, `.ai/` context/decisions/worklog, architecture roadmap, and existing CRM, Support, Retail/Settlement, Operations UI and Website cart status documents.
- **Verification plan:** Cross-check each status against source evidence; clearly distinguish live backend, partial/UI prototype, deprecated contract and deferred scope; verify document and handoff commits on `main`.
- **Next:** Publish `docs/REMAINING_FEATURES_IMPLEMENTATION_BACKLOG.md`; record unresolved AD-4/cart route conflict and database-first dependency plan. Tests/build not applicable to documentation-only change.

