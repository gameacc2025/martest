# Agent Task Plan — Phased, Atomic Execution

**Document ID:** AGENT-PLAN-2026-11-14  
**Status:** READY FOR DELEGATION — planning/source-audit only; no implementation task is marked complete here.  
**Repository:** `gameacc2025/martest`  
**Branch:** existing `main` only. No branches, worktrees, detached checkouts or PRs.  
**Code evidence baseline:** `ace67cccc6a4b09b8cf8258dc814aedbb5d0b71b` (source audit baseline; documentation commits followed it).  
**Plan date:** 2026-11-14  
**Communication:** Persian to project owner.

## 1. How to use this plan

- Assign **one ticket per agent at a time**. Every ticket is deliberately small and has a bounded output.
- Agents may perform read-only inspection in parallel. Code-writing tasks may run in parallel only when their file ownership does not overlap and the lead has confirmed the shared main working tree is safe. Serialize writes to shared files.
- Agents do not commit, push, create branches, worktrees or detached checkouts. They return a scoped diff, exact files changed, tests actually run, output, risks and blockers. The lead reviews and integrates each independently verified ticket directly on the existing `main`.
- Before starting, the agent reads `AGENTS.md`, `.ai/PROTOCOL.md`, `.ai/current-task.md`, latest 3–5 relevant WORKLOG entries, and only the relevant source/tests/docs. It checks `git status --short --branch` and recent commits. Preserve all existing changes and data.
- Claim a ticket in `.ai/agent-coordination/ACTIVE.md` and `.ai/WORKLOG.md` before editing. Never take a ticket already claimed.
- A ticket is not DONE until its acceptance criteria pass, its diff is reviewed, relevant docs are updated, and lead confirms the resulting commit is on `main`.
- If a ticket discovers a required schema, migration, permission, authentication, financial or destructive change, stop before applying it; document the evidence and request lead/owner approval.
- Do not infer runtime success from source inspection or CI success. Mark unrun checks `NOT RUN` and unavailable environments `NOT VERIFIED`.

## 2. Phase gates and dependency order

| Phase | Goal | Exit gate | Delegation |
|---|---|---|---|
| 0 | Re-establish current-main quality baseline | CI, migration, seed idempotency and browser workflows checked against the exact current code SHA; blockers documented | Start first; independent read-only checks may parallelize |
| 1 | CRM acceptance | All CRM route families have schemas, permissions/tenant boundaries and service tests; lead lifecycle E2E passes | CRM tickets in listed order |
| 2 | Support completion | Attachments are private/authorized; SLA calendar and escalation behavior tested; assignment/queues and notifications verified | Attachment contract before implementation; calendar before worker |
| 3 | CMS and recovery acceptance | Featured contract decided and tested; five Admin resources CRUD-tested; public content/security journeys pass | Featured decision precedes code/migration |
| 4 | Notifications and Audit | Event producers mapped and tested; delivery retry/dedupe and audit redaction/retention proven; SMS remains gated until provider approval | Event inventory before producer changes |
| 5 | Dashboards, Website and Company | Sample data removed or explicitly labelled; metrics are API-backed and tenant-safe; visual/RTL/accessibility checks pass | APIs before dashboard UI |
| 6 | Full regression and release handoff | Current-main CI, migrations, seed twice, all relevant tests/builds and Playwright pass; docs/route inventories current | Last, after merged code tickets |
| Hold | Retail/Orders/Payments and Finance activation | Written commercial/legal/currency/tax/commission/payout approval | No implementation or checkout activation before owner approval |

## 3. Ticket catalogue

Ticket size target: one focused behavior or test gap, normally 1–3 owned files (excluding the lead-owned documentation handoff). If inspection shows a larger scope, split the ticket before editing.

### Phase 0 — Current-main baseline

| ID | Small task / output | Suggested exclusive ownership | Depends on |
|---|---|---|---|
| BASE-01 | Read latest main SHA and enumerate workflow runs; classify which runs target current HEAD vs historical baseline. Output evidence table only. | Read-only GitHub Actions/workflow inspection | None |
| BASE-02 | Validate Prisma schema and fresh PostgreSQL migration path on disposable CI infrastructure; do not touch user DB. Record exact SHA/run. | Read-only workflow inspection; lead owns migration fixes | BASE-01 |
| BASE-03 | Verify all development seeds run twice and compare counts/idempotency; report seed-specific failures only. | Seed workflow/test files (read-only first) | BASE-01 |
| BASE-04 | Run existing Playwright smoke and report failures by spec/step; no selector weakening. | E2E specs/config (read-only first) | BASE-01 |
| BASE-05 | Produce one consolidated baseline report and mark stale historical PASS claims clearly. | Lead-owned docs only | BASE-01..04 |

### Phase 1 — CRM

| ID | Small task / output | Suggested exclusive ownership | Depends on |
|---|---|---|---|
| CRM-01 | Add request/query JSON schemas for Account and Contact list/create/update routes only. Include invalid-input tests. | `backend/src/modules/crm/index.js` + focused route test; exclusive lock on shared index | BASE-01 |
| CRM-02 | Add request/query schemas for Lead Source and Pipeline/Stage routes only; test invalid IDs and enum/filter inputs. | Same CRM index/test files; run after CRM-01 | CRM-01 |
| CRM-03 | Add request/query schemas for Opportunity and Task routes only; add focused contract tests. | Same CRM index/test files; run after CRM-02 | CRM-02 |
| CRM-04 | Add request/query schemas for Activity and Note routes only; add focused contract tests. | Same CRM index/test files; run after CRM-03 |
| CRM-05 | Build route permission matrix for every CRM action and add denial tests for missing permission/wrong STAFF context. | CRM route test file(s) only; do not edit service/UI | CRM-01..04 |
| CRM-06 | Add service tests for lead conversion: already-converted, invalid source state, repeated request and transaction rollback behavior. Fix only defects proven by tests. | CRM service + service test; exclusive CRM service lock | CRM-05 |
| CRM-07 | Add service tests for lead merge: ownership, duplicate relations, repeated request, rollback and data preservation. | CRM service test; serialize with CRM-06 | CRM-06 |
| CRM-08 | Verify Accounts and Contacts Admin workspace CRUD uses real API responses; fix one broken response contract at a time. | One assigned workspace file per ticket; API contract files excluded | CRM-01 |
| CRM-09 | Add Playwright journey for create → update → assign → status transition of a Lead. | One CRM Playwright spec; do not edit shared app setup without lead approval | CRM-05..08 |
| CRM-10 | Add Playwright coverage for conversion/merge and verify resulting related records. | Separate CRM Playwright spec | CRM-06..07, CRM-09 |
| CRM-11 | Verify CRM reports/export filters and CSV formula-injection behavior with focused tests. | CRM reporting service/test only | CRM-05 |

### Phase 2 — Support

| ID | Small task / output | Suggested exclusive ownership | Depends on |
|---|---|---|---|
| SUP-01 | Produce attachment threat model and exact API/storage contract: private access, allowed types/size, scan state, expiry, deletion policy and tenant authorization. No code/migration. | New design note only | BASE-01 |
| SUP-02 | Implement private attachment upload metadata/storage adapter and validation; no public bucket or unrestricted path. | Support attachment backend files only; Prisma schema/migration remain lead-owned | SUP-01 + explicit lead approval if schema required |
| SUP-03 | Implement authorized attachment download and access tests for CUSTOMER/COMPANY/STAFF; prevent cross-tenant IDOR. | Support attachment route/service tests only | SUP-02 |
| SUP-04 | Add Support API-client methods and message composer upload/download states. | Support API-client file + one assigned workspace file | SUP-03 |
| SUP-05 | Implement business-hours calendar calculation as a pure service with timezone, weekends and holidays tests. | New SLA calendar service + unit test | BASE-01 |
| SUP-06 | Add SLA pause/resume rules and deadline recalculation tests for pending/waiting states. | Support SLA service/test only | SUP-05 |
| SUP-07 | Implement idempotent SLA escalation worker with bounded retries and audit/notification hooks. | New worker/service + focused worker test; registration lead-owned | SUP-06 |
| SUP-08 | Add queue visibility and assignment permission tests (unassigned, own queue, other queue, reassignment). | Support route/service test only | BASE-01 |
| SUP-09 | Fix Support workspace queue/assignment UX and pagination using existing APIs. | One assigned Support workspace file per ticket | SUP-08 |
| SUP-10 | Add notification event integration tests for ticket created, reply, assignment and SLA escalation; no provider secrets. | Support notification adapter/test only | NTF-01, SUP-07 |

### Phase 3 — CMS and account recovery

| ID | Small task / output | Suggested exclusive ownership | Depends on |
|---|---|---|---|
| CMS-01 | Inspect existing Article model/API/UI and write a decision note: remove unsupported `featured` filter or request owner approval for a persisted field. No migration. | New decision note only | BASE-01 |
| CMS-02 | After lead/owner selects CMS-01 option, implement only the chosen featured contract and regression test. Migration/Prisma changes are lead-owned and require explicit approval. | Article route/controller/service/test; no schema unless approved | CMS-01 |
| CMS-03 | Test Article Admin create/update/delete and publication/visibility lifecycle through actual API. | One Article Playwright spec | CMS-02 |
| CMS-04 | Test Category and Tag CRUD, granular permission hiding and backend denial. | Category/Tag tests/spec only | BASE-01 |
| CMS-05 | Test FAQ and Static Page CRUD plus public rendering, draft/published visibility. | FAQ/Page tests/spec only | BASE-01 |
| CMS-06 | Audit rich-text sanitization and media upload/download authorization; add security regression tests for confirmed gaps. | CMS sanitization/media test files; implementation scope split if >3 files | CMS-03..05 |
| REC-01 | Verify password recovery OTP rate limits, expiry, attempt limit, one-time use and session revocation with tests. | Recovery service/test only | BASE-01 |
| REC-02 | Add staging-only end-to-end recovery test using a controlled fake provider; do not claim real SMS delivery. | Recovery E2E/test config only | REC-01 |

### Phase 4 — Notifications and Audit

| ID | Small task / output | Suggested exclusive ownership | Depends on |
|---|---|---|---|
| NTF-01 | Create event-to-producer/channel matrix for Auth, CRM, Support, CMS and company lifecycle; mark missing events. | New inventory doc only | BASE-01 |
| NTF-02 | Add one producer + unit test for CRM lead assignment event. | CRM event producer/test only | NTF-01 |
| NTF-03 | Add one producer + unit test for Support ticket/reply/assignment events. | Support event producer/test only | NTF-01 |
| NTF-04 | Add tests for email worker retry/backoff, terminal failure and dedupe; do not contact live SMTP. | Notification delivery worker/test only | BASE-01 |
| NTF-05 | Produce SMS provider decision checklist (provider, region, sender ID, consent, templates, quota, secrets, costs); do not store credentials. | New decision note only | NTF-01 |
| NTF-06 | Implement SMS only after explicit provider/consent/cost approval; add fake-adapter tests first. | New SMS adapter/tests; provider secrets/config are lead-owned | NTF-05 + owner approval |
| AUD-01 | Build audit producer coverage matrix by domain/action and classify sensitive fields. | New audit matrix doc only | BASE-01 |
| AUD-02 | Add one tested audit producer for CRM lead create/update/assign, with actor/resource metadata. | CRM audit adapter/test only | AUD-01 |
| AUD-03 | Add one tested audit producer for Support ticket status/assignment changes. | Support audit adapter/test only | AUD-01 |
| AUD-04 | Define and test redaction for passwords, OTPs, tokens, payment data and private message/attachment content. | Audit redaction utility/test only | AUD-01 |
| AUD-05 | Define retention/archival policy and verify query/export honor it; no destructive purge job until approval. | Policy doc + read-only query tests | AUD-01, AUD-04 |

### Phase 5 — Dashboards, Website and Company

| ID | Small task / output | Suggested exclusive ownership | Depends on |
|---|---|---|---|
| DASH-01 | Replace one hard-coded Admin CRM KPI/list with a real tenant-safe aggregate endpoint; correct metric definitions. | Admin CRM dashboard component only; API endpoint separate ticket if missing | CRM tests |
| DASH-02 | Replace Admin Support sample KPI with a real Support aggregate or explicitly mark as unavailable. | Admin Support dashboard component only | SUP-08 |
| DASH-03 | Correct Admin `orders` vs `totalInquiries` semantic mismatch; never label inquiries as orders. | Admin stats service/component + test | BASE-01 |
| DASH-04 | Replace or clearly label Admin Finance samples; do not imply active settlement or payout. | Admin finance dashboard component only | Finance remains gated |
| DASH-05 | Inventory CompanyDashboard sample panels and identify backing APIs; one panel per follow-up ticket. | Read-only audit, then one Company panel per ticket | BASE-01 |
| WEB-01 | Add Website responsive regression coverage for key public pages and mobile overflow. | Website Playwright spec only | BASE-01 |
| WEB-02 | Add Website RTL/keyboard/focus accessibility checks for navigation, FAQ and forms. | Website test/spec only | WEB-01 |
| COMPANY-01 | Replace one explicitly sample Company panel with API-backed data or retain a visible Demo label. | One Company panel file only | DASH-05 |
| COMPANY-02 | Add Company tenant-isolation and responsive E2E checks for dashboard/inquiries. | Company Playwright spec only | COMPANY-01 |

### Phase 6 — Full release regression and documentation

| ID | Small task / output | Suggested exclusive ownership | Depends on |
|---|---|---|---|
| REG-01 | Run frozen install, architecture checks, unit/service tests and all three builds on final main SHA. | Lead/CI operator | All merged code tickets |
| REG-02 | Run fresh PostgreSQL migration validation and migration status on disposable CI DB. | Lead/DB owner | All schema tickets |
| REG-03 | Run all relevant seeds twice and verify deterministic/idempotent counts. | Lead/seed owner | All seed-affecting tickets |
| REG-04 | Run full Playwright suite sequentially; report exact pass/fail and artifacts. | Lead/E2E operator | All UI tickets |
| REG-05 | Update API route inventory, permission matrix, database docs and domain docs to match merged implementation. | Documentation agent; no code files | REG-01..04 |
| REG-06 | Final main-only review: inspect diffs, confirm no unreviewed files/data loss, verify commits and produce Persian release report. | Lead only | REG-01..05 |

### Hold — explicit owner decisions required

- Retail checkout, orders, payments, fulfillment and returns activation.
- Finance ledger posting, commission, tax, settlement, reconciliation and payouts.
- CMS Featured persisted field/migration, if chosen.
- SMS provider, sender ID, consent, regional compliance and spend limits.
- Any production data migration, destructive retention purge or external provider activation.

## 4. Definition of done for every ticket

A ticket is DONE only when all apply:

1. Exact base main SHA and owned file list recorded.
2. Behavior and root cause traced across caller, route, service, persistence and UI where relevant.
3. Backend permission and tenant ownership checked for every protected resource.
4. Focused tests added/updated and actually run; exact command + result recorded.
5. Relevant build/type/lint checks run where applicable.
6. Full scoped diff reviewed; no unrelated edits, secrets, destructive operations or weakened tests.
7. Relevant API/DB/UI documentation updated.
8. Lead integrates one scoped commit directly to existing `main`, verifies remote commit SHA, and updates WORKLOG/current-task.
9. Any unavailable check is explicitly `NOT RUN` / `NOT VERIFIED`; no inferred PASS.

## 5. Agent handoff template

Copy one ticket at a time and fill the bracketed fields:

```text
زبان گزارش و ارتباط با صاحب پروژه: فارسی.
مخزن: gameacc2025/martest
شاخه مجاز: فقط main موجود؛ branch/worktree/detached checkout نساز.
شناسه تسک: [TICKET-ID]
عنوان: [exact ticket title]
SHA مبنا: [current main SHA supplied by lead]
مالک فایل: [exact exclusive files from plan/ACTIVE.md]
وابستگی: [dependency tickets already DONE]
هدف: فقط خروجی کوچک همین تسک؛ دامنه را گسترش نده.
معیار پذیرش: [copy ticket acceptance]
قواعد: قبل از تغییر git status و آخرین commit را بررسی کن؛ تغییرات موجود و داده‌ها را حفظ کن؛ migration/permission/auth/financial/destructive changes بدون تأیید lead/owner انجام نشود.
تست: تست مرتبط را واقعاً اجرا کن؛ دستور، نتیجه و محدودیت‌ها را گزارش کن. تست اجرا نشده را PASS اعلام نکن.
تحویل: diff محدود، فایل‌های تغییرکرده، شواهد، تست‌ها، ریسک‌ها و موارد NOT VERIFIED را به Lead بده. خودت commit/push نکن.
```

## 6. Current execution state

- No ticket in this plan is claimed or implemented by this documentation change.
- First ticket to activate: **BASE-01** (current-main workflow evidence audit).
- After BASE-01, start CRM-01 and independent read-only Support/CMS/Notifications/Audit inventories. Do not start dependent implementation tickets before their dependency gate is met.
- Local Windows working tree, Docker and PostgreSQL are still `NOT VERIFIED` unless directly inspected in that environment.
