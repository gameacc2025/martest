# Project-Wide Remaining Work — Agent Execution Plan

**Repository:** `gameacc2025/martest`  
**Canonical execution branch:** `main` only  
**Plan created:** 2026-11-20  
**Baseline application code verified by CI:** `c78e6d950b54695030518c8963053f8fc13be6f5`  
**Baseline coordination/documentation commit:** `ae9215d502297fe00aa6fa4b7e909f77951698ad`  
**Status:** EXECUTION REQUIRED — this document is a work plan, not evidence that the remaining work is complete.

---

## 1. Mandatory instruction to the coordinating agent

Read this entire file before changing anything. Then execute every actionable work item in the order and dependency model below. Do not stop after producing an audit report: for each confirmed defect, implement the smallest safe fix, add regression tests, run the required checks, and continue to the next item. If a task is blocked by missing owner/legal decisions or unavailable external environments, complete all safe preparatory work, record the exact blocker, and continue with independent tasks.

The human operator should only need to instruct the agent:

> Read `.ai/PROJECT_REMAINING_WORK_EXECUTION_PLAN.md` and execute it fully. Follow the repository's agent instructions and this plan. Continue until every executable task is completed, every blocker is explicitly documented, and the final verification/report is produced.

### 1.1 Source-of-truth and instruction precedence

Before work begins, read and obey the current versions of:

1. `AGENTS.md`
2. `.ai/PROTOCOL.md`
3. `.ai/agent-coordination/ACTIVE.md`
4. `.ai/current-task.md`
5. `.ai/UI_SKILLS.md` when touching UI
6. `docs/AI_AGENT_WORKFLOW.md`
7. Relevant architecture decisions, API contracts, feature documentation, tests and migrations.

If any instruction conflicts, stop the affected operation, identify the conflict, and follow the repository's highest-priority active instruction. Do not silently rewrite project policy.

### 1.2 Non-negotiable Git and collaboration rules

- Work only on the existing `main` branch.
- Never create a branch, worktree, detached checkout, or alternate integration branch.
- Never force-push, hard-reset, clean the working tree, delete stashes, or discard uninspected user changes.
- Never assume the local Windows working tree is clean. Inspect and preserve it if an authorized local environment is available.
- Worker/subagents may inspect, test, and prepare isolated patches, but must not commit or push.
- The main coordinating agent is the sole writer/integrator and the only agent allowed to stage, commit, or push.
- Serialize all writes to shared files. Parallelize independent analysis and isolated patch preparation, not concurrent Git writes.
- Before each write, verify the current `main` SHA. Integrate with a fast-forward/expected-SHA guard. If the remote head changed, stop, fetch and inspect the new head, then reconcile; never overwrite it.
- Commit each small, reviewed, independently testable slice directly to `main`. Do not combine unrelated fixes into a large commit.
- After each commit, verify the remote `main` SHA and inspect relevant CI runs. A commit is not considered verified merely because it was created or pushed.
- Do not claim tests passed unless the exact commit/SHA has successful evidence. Distinguish source-level review, unit tests, CI, migration tests, runtime tests, provider tests and production verification.
- Preserve all owner decisions AD-1 through AD-4. Do not activate or implement dormant retail, checkout, cart, wishlist, accounting, commission or settlement behavior without explicit owner approval.
- Do not invent commercial rules, legal obligations, data-retention periods, billing behavior, or provider credentials.
- Do not expose secrets, tokens, passwords, personal data or full content in logs, test output, audit metadata or reports.

### 1.3 Required execution loop for every task

For every task ID:

1. **Inspect:** read the relevant routes, middleware/preHandlers, controllers, services, schemas, Prisma models, migrations, tests, UI consumers and existing domain-history mechanisms.
2. **Map:** document the current behavior and trust boundaries before changing code.
3. **Confirm:** distinguish a proven defect from a hypothesis or missing evidence.
4. **Scope:** define the smallest file/function/test scope. Avoid unrelated cleanup.
5. **Fix:** implement only the confirmed defect, preserving existing contracts and owner decisions.
6. **Test:** add a regression test that fails before the fix and passes after it. Include negative authorization cases and transaction/error cases where relevant.
7. **Verify:** run focused tests first, then relevant package tests/builds, and required CI/migration/runtime workflows for the final integrated source.
8. **Review:** inspect the diff for security, data loss, API compatibility, duplicate events, migration risks and accidental policy changes.
9. **Integrate:** the lead serially commits the reviewed slice to `main).
10. **Record:** update the work log/current task/ACTIVE board with task ID, files, commit SHA, test commands/results, workflow links, remaining risks and status.

Allowed task statuses: `NOT STARTED`, `IN PROGRESS`, `PASS`, `FAIL`, `BLOCKED — OWNER DECISION`, `BLOCKED — ENVIRONMENT`, `NOT APPLICABLE — EVIDENCE`. Never convert a blocker or untested assumption into PASS.

---

## 2. Verified baseline and completed work

The previous 20 scoped audit slices are recorded as completed in the project coordination files. The latest fully tested application-code SHA recorded there is:

`c78e6d950b54695030518c8963053f8fc13be6f5`

Recorded successful evidence for that exact code SHA:

- CI: [44655876783](https://github.com/gameacc2025/martest/actions/runs/44655876783)
  - 69 Frontend/Shared test files and 390 tests
  - 18/18 architecture/session tests
  - 1,775/1,775 backend tests
  - Website, Company and Admin production builds
- Fresh PostgreSQL migration validation: [44655876652](https://github.com/gameacc2025/martest/actions/runs/44655876652)
  - Prisma validation/client generation
  - fresh migrations and Prisma model/table parity
- Runtime validation: [44655876772](https://github.com/gameacc2025/martest/actions/runs/44655876772)
  - Compose/service health, migrations, model parity
  - all development seeds run twice
  - AD-1/AD-3 role-grant checks
  - 8/8 Playwright smoke tests across Website/Company/Admin and API proxies
  - teardown succeeded

The coordination documentation commit after that code baseline is `ae9215d502297fe00aa6fa4b7e909f77951698ad`.

These results are historical baseline evidence, not proof that new work is complete. Re-run the required checks after integrating new code. Do not claim local Windows, local Docker/PostgreSQL, live SMTP/Twilio/payment-provider delivery or Production deployment has been verified; those were explicitly NOT VERIFIED in the baseline.

---

## 3. Priority and dependency overview

| Workstream | Priority | Depends on | Parallelizable with |
|---|---|---|---|
| A. Product nested-resource authorization / IDOR | P0 | Current Product service and route contracts | CMS, AuditLog inventory, Dashboard audit |
| B. Product price-range concurrency | P0 | A's Price Tier ownership/operation map; database behavior inspection | CMS, AuditLog inventory, UI audit |
| C. CMS category and revision edge cases | P1 | Current CMS contracts and category semantics | A/B, D inventory, F |
| D. Remaining central AuditLog coverage | P1 | Existing event registry and domain-history inventory | A/B, C, F |
| E. AuditLog retention/archival policy | BLOCKED for policy implementation | Explicit owner/legal decision | Technical options assessment can run in parallel |
| F. Dashboard/reporting and visual/accessibility regression | P1/P2 | API contracts and permission behavior for data correctness | A/B, C, D |
| G. Real environment, external provider and Production validation | Release gate | Environment access, credentials, owner-approved deployment window | Preparation/checklist can run in parallel |

### 3.1 Critical path

1. A — complete Product nested-resource authorization review and fixes.
2. B — close the Product price-range concurrency/integrity risk.
3. C — close CMS category/revision correctness gaps.
4. D — complete the sensitive-operation AuditLog inventory and required producers.
5. F — finish dashboard/reporting and broad UI/accessibility regression.
6. Run integrated exact-main CI, migration and runtime acceptance.
7. G — perform owner-environment, real-provider and Production verification when authorized and available.

E is a policy-dependent stream. Do not block unrelated work while waiting for owner/legal direction.

### 3.2 Safe parallel work

The following can be investigated in parallel if agents have isolated scopes and the lead serializes integration:

- A: Product nested-resource IDOR and route/service permission matrix.
- C: CMS category activation/deactivation and revision edge cases.
- D: inventory of missing AuditLog producers in roles/settings/Auth/session.
- F: dashboard/reporting contract inventory and accessibility/UI audit.
- E: technical options and cost/risk assessment only; no retention/deletion policy implementation.
- G: deployment/provider readiness checklist and configuration inventory; no live external actions without authorization.

Do not let two workers edit the same service, shared registry, Prisma schema/migration, shared test fixture, or coordination document concurrently. Parallel analysis is encouraged; shared-file writes are serialized by the lead.

---

## 4. Workstream A — Product nested-resource authorization and IDOR

**Priority:** P0 / security  
**Goal:** Prove that every Product nested-resource operation enforces both the correct actor permission and the correct tenant/resource ownership boundary at the route and service layers.

### A1. Build a complete operation inventory

Inspect Product routes, preHandlers, controllers, services and tests. Enumerate every operation for:

- Product read/detail/list and management.
- Price Tier read/create/update/delete and any history/snapshot endpoints.
- Image list/read/upload/delete/set-primary/reorder.
- Document list/read/download/upload/delete.
- Product status transitions and soft deletion/restore if supported.
- Any nested resource endpoint that accepts a product ID, price-tier ID, image ID or document ID.

For each operation, record:

| Field | Required evidence |
|---|---|
| HTTP route and method | Exact route declaration |
| Actor/app context | STAFF, COMPANY, CUSTOMER or other supported context |
| Required permission | Exact permission key and role grant |
| Resource ownership | How product/company/resource relationship is established |
| Route guard | Exact preHandler or middleware |
| Service guard | Exact service-level check |
| Query scope | Whether lookup is scoped before returning or mutating data |
| Negative test | Cross-company or insufficient-permission regression test |
| Result | PASS, defect, or evidence gap |

Do not assume a route guard is sufficient. Direct service calls, background jobs and internal callers must not bypass tenant authorization where the service is an authorization boundary.

### A2. Price Tier cross-tenant authorization

Test all Price Tier operations using at least two distinct companies and products:

- Company A can operate on its own eligible product with the exact required permission.
- Company A cannot read, create, update or delete a Price Tier belonging to Company B.
- Replacing only a nested resource ID with a foreign ID must not expose or mutate that resource.
- A Price Tier ID must be verified against its parent Product; do not trust a caller-supplied product ID independently.
- STAFF behavior must follow the existing exact STAFF permission and app-context contract; do not broaden STAFF or COMPANY access.
- Insufficient COMPANY permissions must be denied even when the product belongs to that company.
- Verify not-found/forbidden behavior does not leak foreign resource details beyond the established API contract.

Add service-level and route/controller tests where each layer owns a distinct guarantee.

### A3. Image cross-tenant authorization

Cover image listing, upload, deletion, primary-image changes and reordering:

- A foreign image ID cannot be deleted, promoted, reordered or otherwise mutated by another company.
- A supplied product ID and image ID must refer to the same product.
- Upload authorization must be checked before persistent side effects.
- Failed authorization must not leave files on disk or create database rows/audit events.
- Verify cleanup behavior when database writes or AuditLog writes fail.
- Verify the image's tenant ownership through the parent Product, not only through a client-provided identifier.

### A4. Document cross-tenant authorization

Cover document listing, metadata reads, downloads, upload and deletion:

- Foreign document IDs cannot be read, downloaded, replaced or deleted by another company.
- Document ID and parent Product ID must match.
- File paths/storage keys must be derived from trusted database records or server-generated values, never arbitrary client paths.
- Failed authorization must not disclose file existence, storage paths or metadata beyond the established API contract.
- Failed writes/audit operations must not leave orphaned files or database records.

### A5. Route/service permission parity

For every operation, compare exact route permission with the service permission. Test:
- authorized COMPANY actor;
- same-company actor missing the exact permission;
- foreign-company actor with the permission;
- STAFF actor with and without the relevant STAFF permission;
- CUSTOMER/unsupported actor where applicable;
- direct service invocation without route middleware.

Do not add wildcard permission shortcuts or weaken role checks to make tests pass.

### A6. Product IDOR completion criteria

A is complete only when:
- The inventory covers every nested resource operation found in source.
- Every operation has an explicit route guard, service authorization decision and ownership check (or a documented justified exception).
- Cross-company tests cover read and mutation paths for Price Tier, Image and Document.
- Parent-child ID mismatch cases are covered.
- Failed operations have no unintended database, file-system or AuditLog side effects.
- Focused tests and the relevant backend suite pass.
- The lead records exact file paths, test evidence and unresolved exceptions.

Do not describe the entire Product domain as IDOR-safe based only on a few representative tests.

---

## 5. Workstream B — Product Price Tier concurrency and range integrity

**Priority:** P0 / data integrity  
**Dependency:** Complete A's Price Tier operation/ownership map first. This work may be analyzed in parallel but final design must use A's confirmed resource model.

### B1. Confirm the current invariant

Inspect the Price Tier schema, service validation, date/range semantics, uniqueness constraints, indexes and all create/update/delete paths. Determine:
- Whether range endpoints are inclusive or exclusive.
- How open-ended/null endpoints are interpreted.
- Whether ranges are scoped by product, currency, customer/quantity tier, or another dimension.
- Whether disabled/deleted tiers participate in overlap checks.
- Whether update excludes the current record correctly.
- Whether time zones/date precision affect comparison.
- Whether any other writer bypasses the service check.

Do not invent or change business semantics. Derive them from existing contracts and tests; if ambiguous, document the ambiguity and request owner clarification before changing semantics.

### B2. Prove or disprove the concurrency race

The recorded concern is that overlap validation may run before the transaction. Verify the exact current implementation and reproduce the scenario conceptually or with an integration test:

- Two concurrent requests create overlapping ranges for the same conflict scope.
- Two concurrent requests update different tiers into overlapping ranges.
- Create and update race against each other.
- Boundary-touching ranges follow the existing inclusive/exclusive contract.
- Null/open-ended boundaries are covered.

A race is confirmed only with a test or a database-level proof. Do not label it a confirmed defect solely from the previous note.

### B3. Select the database-safe solution

Evaluate options against the actual Prisma/PostgreSQL version and project migration conventions, including:
- Transaction isolation/serialization with retry handling.
- Row/advisory locking scoped to the exact conflict domain.
- PostgreSQL exclusion constraints where the range model and deployment compatibility support them.
- A safe combination of database constraint and service validation.

Choose the smallest robust approach. Avoid global locks if a narrower lock is possible. Handle serialization/constraint errors with the established API error contract. Ensure retries are bounded and do not duplicate AuditLog events or side effects.

### B4. Migration and operational safety

If a database migration is required:
- Check existing production-like data for overlaps before adding the constraint.
- Provide a safe preflight/report or migration guard; do not silently delete or rewrite existing business data.
- Use the repository's migration naming and rollback/forward-fix conventions.
- Verify fresh database migration and migration from the current schema.
- Do not change unrelated Prisma models.

### B5. Completion criteria

- The overlap invariant is documented from the actual business contract.
- Concurrent create/create, update/update and create/update tests demonstrate that conflicting writes cannot both commit.
- Boundary and null endpoint tests pass.
- Existing valid ranges remain accepted.
- Error mapping is deterministic and does not leak database internals.
- AuditLog and price-history writes remain transactionally correct.
- Fresh PostgreSQL migration validation and backend tests pass.

---

## 6. Workstream C — CMS category activation and Article revision/relationship edge cases

**Priority:** P1 / content correctness

### C1. Establish category lifecycle semantics

Inspect Article Category schema, service, routes, public queries, admin UI and existing documentation. Determine the intended meaning of active/inactive, deletion, slug changes and category assignment. Do not invent behavior where the product contract is silent.

Test and document:
- Activating an inactive category.
- Deactivating a category currently assigned to published articles.
- Creating/updating an article assigned to an inactive category.
- Public listing/detail/search for articles whose category becomes inactive.
- Category deletion/archive behavior if supported.
- Re-activating a category and the resulting visibility/assignment behavior.
- STAFF permission requirements for each mutation.

If semantics are ambiguous or require a product decision, preserve existing safe behavior and mark the exact question as owner-blocked; continue other CMS tasks.

### C2. Article relationship integrity

Review Article create/update and category/tag assignment code:
- Category assignments use the declared `{ categoryId, sortOrder }` contract.
- Duplicate category/tag assignments are rejected or normalized according to existing API contract.
- Invalid, deleted or inactive related records are handled consistently.
- Relationship replacement does not unintentionally drop unrelated assignments.
- Ordering is preserved across create, update and restore.
- Cross-tenant or unauthorized category/tag IDs cannot be attached if the data model is scoped.

Add tests for each confirmed edge case.

### C3. Revision lifecycle

Inspect revision creation, list/read, restore, ownership, authorization and transactional behavior:
- Revision belongs to the expected Article.
- A revision ID from another Article cannot be restored into the current Article.
- Restore handles deleted/inactive category and tag relations safely.
- Restore preserves category IDs, tag IDs and sort order where valid.
- Restore does not unintentionally overwrite fields outside the revision contract.
- Concurrent restore/update behavior is deterministic.
- AuditLog event is committed atomically with the restore.
- Failed restore leaves the Article and relationships unchanged.

### C4. Public visibility and cache behavior

Verify public Article routes/search only expose content allowed by publication status/time and category lifecycle rules. Ensure category activation changes do not create stale public visibility through caches or search queries. Keep the existing publication-window/search AND behavior intact.

### C5. Completion criteria

- Category lifecycle semantics are evidenced by current contracts or explicitly owner-blocked.
- Article/category/tag relationship edge cases have regression tests.
- Revision ownership and restore integrity are covered.
- Public visibility is correct for active/inactive and publication states.
- CMS permission and AuditLog behavior remain correct.
- CMS focused tests and relevant backend/frontend builds pass.

---

## 7. Workstream D — Remaining central AuditLog coverage

**Priority:** P1 / security and accountability

### D1. Inventory before implementation

Search all mutation routes/services for sensitive operations in:
- Roles and permission grants/revocations.
- User access profiles and panel access.
- Company settings and administrative settings.
- Authentication, MFA/challenge/session lifecycle and refresh-token revocation.
- Security configuration and credential rotation metadata (never secret values).
- Remaining administrative mutations identified by source inspection.

For each mutation, record:
- Existing central AuditLog event, if any.
- Existing domain-specific history/activity record.
- Actor identity and app context.
- Company/resource scope.
- Transaction boundary.
- Sensitive fields that must be excluded.
- Whether a new central event is necessary.

Do not add duplicate central events where an existing central event already fully covers the operation. Do not delete existing domain history.

### D2. Roles and permissions

Check role creation/update/assignment, permission grant/revoke, role activation/deactivation and any built-in role restrictions:
- The authenticated actor is passed from the controller.
- The affected subject and scope are recorded safely.
- Before/after metadata contains only minimized identifiers and safe changed-field names.
- No credential, token, secret or unnecessary personal data is recorded.
- Audit write is transaction-bound to the mutation where supported.
- Unauthorized attempts do not create success events; failed-attempt security logging must follow an explicit existing convention.

### D3. Settings and administrative configuration

Inventory user, company and global settings separately. Add events only for sensitive mutations not already covered. Ensure settings values are classified before inclusion; never dump entire settings objects into metadata. Exclude secrets and private values. Record changed keys and safe non-sensitive state only.

### D4. Auth/session

Review security-sensitive state changes such as challenge issue/consume/revoke, session revocation, password/security setting changes, role/panel access changes and recovery flows. Preserve existing atomicity and ownership checks. Never store passwords, password hashes, OTP values, access/refresh tokens, session secrets or raw challenge secrets in AuditLog.

### D5. Registry, redaction and transaction integrity

- Verify every emitted action exists in the central action registry.
- Verify action names are unique and follow the existing format.
- Verify key normalization/redaction cannot be bypassed with snake_case, kebab-case or nested objects.
- Verify metadata depth/size limits.
- Verify actor and company scope are attached correctly.
- Verify the audit write uses the same transaction client as the primary mutation where atomicity is required.
- Verify an AuditLog failure rolls back the primary mutation where the operation promises atomic audit.
- Avoid duplicate events from nested service calls or retries.

### D6. Completion criteria

- A source-backed inventory exists for all sensitive mutations inspected.
- Each operation is marked covered, newly instrumented, intentionally excluded with reason, or owner-blocked.
- Required producers have focused service tests for actor/scope, safe metadata, transaction binding and failure behavior.
- Existing domain-specific histories remain intact.
- Relevant backend tests and exact-main CI pass.

---

## 8. Workstream E — AuditLog retention, archival and deletion policy

**Priority:** BLOCKED for policy decisions; technical assessment may proceed.

### E1. Prepare decision brief only

Prepare a short owner/legal decision document covering:
- Data categories stored in AuditLog.
- Operational, security, legal and business use cases.
- Potential retention periods as options, not recommendations presented as legal facts.
- Storage growth and archival cost implications.
- Access controls and access logging for archived records.
- Backup and restore implications.
- Legal hold and deletion exceptions, if applicable.
- Privacy/data minimization and applicable jurisdiction questions.
- Whether immutable/tamper-evident storage is required.

### E2. Do not implement unapproved policy

Until explicit owner/legal approval:
- Do not set a retention duration.
- Do not schedule automatic deletion.
- Do not archive or purge existing AuditLog records.
- Do not add a destructive cleanup job.
- Do not infer legal requirements.
- Do not change existing audit availability.

### E3. After approval

Record the exact approved policy and approval reference. Then design and implement retention/archival in a separate reviewed task with dry-run reporting, observability, backup/recovery plan, tests and a non-destructive rollout. Require explicit approval before any production deletion or purge.

---

## 9. Workstream F — Dashboard, reporting, visual and accessibility regression

**Priority:** P1 for data correctness; P2 for broader polish

### F1. Dashboard/API contract audit

Inspect Admin and Company dashboard components, API clients, backend endpoints, response schemas and tests. For every KPI/chart/table:
- Identify the exact API field and aggregation.
- Confirm date/time boundaries and timezone assumptions.
- Confirm filters and pagination.
- Confirm loading, empty, partial and error states.
- Confirm values are not fabricated from fallback totals or unrelated counters.
- Confirm Company users only receive their own tenant data.
- Confirm Admin-only metrics require correct permissions.
- Confirm currency, quantity and percentage formatting.
- Confirm chart labels and totals reconcile with API data.

Do not change business definitions of KPIs without owner approval. If a metric's definition is missing, document the question and avoid presenting a misleading number.

### F2. Reporting correctness

Test:
- Date range boundaries, including same-day and month/year transitions.
- Empty datasets and zero values.
- Pagination/export consistency.
- Filter composition.
- Timezone conversion.
- Aggregation totals against source records.
- Unauthorized cross-company access.
- Large result handling and performance where measurable.

### F3. Visual consistency

Use the approved palette and existing design tokens. Do not invent a new design system.

Approved palette:
- Primary `#22D3EE`
- Hover `#06B6D4`
- Active `#0891B2`
- Subtle `#CFFAFE`
- Secondary `#6366F1`
- Accent `#8B5CF6`
- Light page `#F0F7FA`; light surfaces `#FFFFFF`; light card hover `#F0FDFF`
- Dark page `#0A1625`; dark sidebar/header `#0D1B2A`; dark card `#122438`; dark card hover `#193149`

Verify Website, Admin and Company experiences follow the established product design. Avoid broad restyling unrelated to confirmed defects.

### F4. Accessibility and responsive regression

Review:
- Semantic headings and landmarks.
- Accessible names/labels for inputs and icon-only controls.
- Keyboard navigation and visible focus.
- Dialog, dropdown and accordion keyboard behavior.
- Color contrast in light and dark themes.
- Form errors and status announcements.
- Table semantics and chart alternatives.
- Responsive layout at mobile, tablet and desktop breakpoints.
- Zoom/reflow and overflow.
- Reduced-motion behavior where animations exist.

Fix concrete defects and add component tests where practical. Use browser tests for critical user journeys.

### F5. Completion criteria

- KPI/report contract matrix is complete for inspected dashboards.
- Tenant/role access is verified at API level, not merely hidden in UI.
- Critical loading/empty/error states work.
- Visual palette is consistent with approved tokens.
- Keyboard/focus/labels/contrast and responsive checks are recorded.
- Relevant frontend tests and all three production builds pass.

---

## 10. Workstream G — Environment, provider and Production readiness

**Priority:** Release gate; some work is environment-blocked.

### G1. Local Windows / Docker / PostgreSQL

When authorized access to the owner's environment is available:
- Inspect Git branch, current SHA, uncommitted changes and stashes without altering them.
- Verify the owner is on the intended `main) branch and identify divergence before any sync.
- Inspect Docker daemon and Compose configuration.
- Start only the intended development stack using documented commands.
- Verify PostgreSQL health, backend health and Website/Company/Admin panels.
- Run migrations and seeds according to the runbook; verify seed idempotency.
- Run focused tests and browser smoke tests.
- Do not delete volumes, databases, files, containers or stashes as a cleanup shortcut.
- If local access is unavailable, record `BLOCKED — ENVIRONMENT`; do not claim local validation.

### G2. SMTP

- Inspect provider configuration and environment-variable names without printing secret values.
- Verify sender/domain configuration and TLS requirements.
- Use a provider sandbox/test mode if available.
- Perform a real delivery test only with explicit authorization and a designated test recipient.
- Record message/provider IDs safely; never record credentials or message contents containing personal data.
- Distinguish configuration validation from successful external delivery.

### G3. Twilio/SMS

- Confirm SMS remains explicit opt-in and provider-gated.
- Inspect quota, subscription, consent and failure behavior.
- Use a test number/sandbox where supported.
- Send a real SMS only with explicit authorization and an approved test recipient.
- Verify provider response, delivery status callback if configured, quota behavior and fail-closed behavior.
- Do not use real customer numbers for testing.

### G4. Payment provider

- Do not activate checkout, cart, billing, retail or settlement features without owner approval under AD-1 through AD-4.
- If payment integration is already present but dormant, inspect configuration and code without initiating a charge.
- Use sandbox-only tests when authorized.
- Never run a live charge/refund/payout without explicit owner approval and a controlled test plan.

### G5. Production deployment

Before any deployment:
- Obtain explicit deployment authorization and target environment.
- Verify release SHA, CI, migrations, backup, secrets, health checks, observability and rollback plan.
- Confirm migrations are backward-compatible or have an approved maintenance plan.
- Perform a pre-deployment backup and verify restore procedure.
- Deploy only through the repository's approved process.
- Verify health and critical journeys after deployment.
- Do not claim Production readiness solely from GitHub Actions or local Docker tests.
- Do not deploy automatically as part of this audit without explicit authorization.

### G6. Completion criteria

G is complete only for the environments actually tested, with evidence and exact SHA. Separate statuses must be reported for:
- Owner Windows workspace.
- Local Docker/Compose.
- Developer PostgreSQL.
- SMTP delivery.
- Twilio delivery.
- Payment sandbox/live status.
- Production deployment and post-deployment smoke tests.

---

## 11. Integrated final acceptance

After A, B, C, D and F code changes are integrated, the lead must run or verify the repository's required acceptance workflows on the exact final `main` SHA.

Minimum acceptance:
1. Focused tests for each changed domain.
2. Full backend test suite.
3. Frontend/shared tests.
4. Architecture/session tests.
5. Website, Company and Admin production builds.
6. Prisma schema validation and client generation.
7. Fresh PostgreSQL migration deployment and model/table parity.
8. Runtime Compose health and seed idempotency checks.
9. AD-1/AD-3 role-grant checks where covered by the existing workflow.
10. Playwright smoke tests across Website, Company, Admin and API proxies.
11. Review of workflow logs for warnings/errors; classify non-blocking deprecations separately.
12. Verify all commits are on `main` and the final remote SHA matches the tested SHA.

If any workflow fails:
- Inspect the failing job logs.
- Determine whether the failure is a code defect, test-fixture issue, environment issue or infrastructure issue.
- Fix only the smallest relevant slice.
- Add/adjust tests without weakening assertions or authorization.
- Commit the fix on `main`, then rerun the affected and required acceptance workflows.
- Do not report the failed gate as PASS.

---

## 12. Documentation and reporting requirements

Keep these documents accurate and concise:
- `.ai/agent-coordination/ACTIVE.md`
- `.ai/current-task.md`
- `.ai/WORKLOG.md)
- Relevant feature/API/architecture documentation.
- This plan: update task statuses and evidence without deleting unresolved risks.

For each completed task, record:
- Task ID and concise title.
- Status.
- Exact files changed.
- Defect confirmed and evidence.
- Fix summary.
- Tests actually executed and results.
- CI/migration/runtime workflow URLs and exact tested SHA.
- Commit SHA on `main`.
- Remaining risks and explicit non-verifications.

Final report must be in Persian and include:
1. Completed tasks grouped by workstream.
2. Blocked tasks and the exact reason/required decision.
3. Parallel workstreams completed and any integration conflicts.
4. Changed files and commit links.
5. Test commands and actual results.
6. Exact final `main` SHA and matching CI/migration/runtime evidence.
7. Explicit list of environments/providers/Production items not verified.
8. Remaining risks; never hide failures or partial coverage.

---

## 13. Execution checklist

The lead must maintain this checklist and update it as work progresses.

### P0 — Product security and data integrity
- [ ] A1 — Inventory all Product nested-resource operations.
- [ ] A2 — Price Tier cross-company read/write authorization.
- [ ] A3 — Image cross-company read/upload/delete/primary/reorder authorization.
- [ ] A4 — Document cross-company read/download/upload/delete authorization.
- [ ] A5 — Route/service permission parity and direct-service tests.
- [ ] A6 — Parent-child ID mismatch and side-effect cleanup tests.
- [ ] A7 — Product authorization acceptance evidence.
- [ ] B1 — Confirm Price Tier range semantics.
- [ ] B2 — Reproduce or disprove concurrent overlap race.
- [ ] B3 — Implement database-safe concurrency protection if defect is confirmed.
- [ ] B4 — Migration/data preflight and compatibility checks if needed.
- [ ] B5 — Concurrent and boundary regression tests.
- [ ] B6 — Price integrity acceptance evidence.

### P1 — CMS and AuditLog
- [ ] C1 — Category activation/deactivation semantics.
- [ ] C2 — Category/tag relationship integrity.
- [ ] C3 — Article revision ownership and restore edge cases.
- [ ] C4 — Public visibility and search/cache behavior.
- [ ] C5 — CMS permission and AuditLog acceptance.
- [ ] D1 — Inventory sensitive mutation coverage.
- [ ] D2 — Role/permission AuditLog coverage.
- [ ] D3 — Settings/admin AuditLog coverage.
- [ ] D4 — Auth/session AuditLog coverage.
- [ ] D5 — Registry/redaction/transaction integrity.
- [ ] D6 — AuditLog coverage matrix and tests.

### Policy-dependent
- [ ] E1 — Prepare retention/archival decision brief.
- [ ] E2 — Obtain explicit owner/legal decision.
- [ ] E3 — Implement only the approved policy in a separately reviewed change.

### P1/P2 — Dashboard and UI
- [ ] F1 — Admin/Company dashboard API contract matrix.
- [ ] F2 — KPI/reporting correctness and tenant authorization.
- [ ] F3 — Loading/empty/error states.
- [ ] F4 — Palette and design consistency.
- [ ] F5 — Accessibility and keyboard/focus checks.
- [ ] F6 — Responsive and browser regression.
- [ ] F7 — Frontend test/build acceptance.

### Release/environment gates
- [ ] G1 — Owner Windows workspace verification.
- [ ] G2 — Local Docker/Compose verification.
- [ ] G3 — Developer PostgreSQL verification.
- [ ] G4 — SMTP test delivery.
- [ ] G5 — Twilio test delivery.
- [ ] G6 — Payment sandbox validation, only if approved and applicable.
- [ ] G7 — Production backup/deployment/rollback authorization and verification.
- [ ] G8 — Post-deployment smoke tests, only if deployment is explicitly authorized.

### Final closeout
- [ ] All completed slices committed to existing `main` by the lead only.
- [ ] No branches, worktrees, detached checkouts, force-pushes or destructive cleanup.
- [ ] Exact final SHA matches the successful required workflows.
- [ ] ACTIVE/current-task/WORKLOG reflect the actual final state.
- [ ] Final Persian report lists all completed, blocked and unverified items.

**Definition of done:** all executable work is completed and verified on the exact final `main` SHA; all remaining blockers have a named reason and required next action; no unresolved failure is presented as success; and the final Persian report is delivered.
