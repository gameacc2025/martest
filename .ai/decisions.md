# martest — Architectural Decisions

Only decisions that materially affect future development. Not a changelog —
see git history for that.

---

Date: (pre-existing, documented in BACKEND_AUDIT_REPORT.md)
Decision: Split `User` into `User` (auth identity) + `Profile` (personal
info: firstName/lastName/avatar) + `AccessProfile` (app context: type,
companyId, isActive), instead of one flat User table.
Reason: A single human can in principle need distinct app-access contexts;
separating identity from access-context also lets `Profile` be optional/
shared cleanly. Application selection (STAFF/COMPANY/CUSTOMER →
admin/company/website) is driven ONLY by `AccessProfile.type`.
Impact: Every query that used to filter `User.companyId` or `User.status`
directly now has to go through `AccessProfile` (e.g.
`getStatistics`/`changeStatus` in `company.service.js` scope user counts via
`accessProfile: { companyId }`, not a `companyId` column on `User`). Roles
never select the application — only permissions within it. This is
repeated as a comment in multiple files; treat it as load-bearing.

---

Date: 2026-08-08
Decision: Backend test suite uses Node's built-in `node --test`, not Jest/
Mocha/Vitest. Mocking is done by hand — `require.cache` injection to swap a
relative-import target (typically `../../config/db`) for a plain object —
rather than a mocking library.
Reason: Zero extra test-framework dependency; the pattern was already
established by the one pre-existing test file (`category.service.test.js`)
before the coverage work in this session, so it was continued for
consistency rather than introducing a second testing paradigm.
Impact: Any new backend test file should follow the same `injectMock()`
helper pattern (see any `*.test.js` for the ~15-line boilerplate) rather
than reaching for `jest.mock` or similar — those don't apply here.

---

Date: 2026-08-08
Decision: Coverage-gate thresholds in `npm run test:ci` (85% lines / 85%
branches / 75% functions) were set to the ACTUAL baseline at the time
(86.4/88.1/78.9%), not to a round "ideal" number.
Reason: `inquiry.service.js` (~31% lines) and `product.service.js` (~58%
lines) were pre-existing, already-partially-tested files out of scope for
that pass; setting thresholds above the real baseline would have made CI
red on day one for unrelated reasons.
Impact: The gate will pass today but is deliberately not aspirational —
raise it as those two files get fuller coverage, don't just leave it here
permanently. Don't lower it to "make CI green" if a change drops coverage;
that defeats the point.

---

Date: 2026-08-08
Decision: `.ai/project-context.md` explicitly documents the two-apiClient
situation (`packages/api-client` vs `packages/shared-core/http`) as an
open question rather than "fixing" it by consolidating.
Reason: `packages/auth/store.js` actively imports from both for different,
non-overlapping exports (`apiGet/apiPost/...` from shared-core/http,
`handleApiError`/`endpoints`/`showSessionToast` from api-client) — this
could be intentional separation of concerns (transport vs. error/endpoint
concerns) rather than an accident, and wasn't investigated deeply enough
during context creation to say which.
Impact: Don't consolidate these two packages as a "cleanup" side-effect of
an unrelated task. If asked to investigate, read both packages fully
first, then propose a decision here.

---

Date: 2026-09-29
Decision: The `test:ci` coverage gate was raised from 85/85/75 to
95 lines / 90 branches / 90 functions, now that the two files that held
the baseline down are done.
Reason: `inquiry.service.js` (was 31% lines) and `product.service.js`
(was ~66%) were completed to 100% lines / >92% branches / >96% functions,
so repo-wide coverage is 97.9/92.6/95.9 — the 2026-08-08 entry explicitly
said to raise the gate once that happened rather than leave it at the old
baseline forever.
Impact: CI now fails if a change drops repo-wide line coverage below 95%.
If a legitimately hard-to-cover area lands (e.g. a new file with no tests
yet), prefer writing the tests over lowering the gate; lowering it needs a
new dated entry here saying why.


---

Date: 2026-10-25
Decision: `main` is the only intended long-lived branch. All coding agents must read root `AGENTS.md` and `.ai/PROTOCOL.md`, claim work in `.ai/WORKLOG.md`, update durable project memory, verify changes, and record commit/push state before handoff.
Reason: Multiple AI tools/agents need one consistent project context and should not create divergent long-lived branches or repeat work from missing conversation history.
Impact: Do not create feature branches by default. Preserve user changes, coordinate overlapping tasks through WORKLOG, do not rewrite history, and do not delete a branch unless its work is confirmed integrated and deletion is authorized. The repository owner may still authorize temporary branches for a specific workflow.


---

Date: 2026-10-25
Decision: All AI agents and coding assistants must communicate with the user in English regardless of the language used in the user's messages.
Reason: The user explicitly requires consistent English communication across all models and agents.
Impact: Plans, questions, progress updates, explanations, recommendations, and final reports are English. Product deliverables such as localized UI text or translations may use their required language, while explanations to the user remain English.


---

Date: 2026-10-25
Decision: Notification folders must remain simple for end users: Saved is a fixed system folder and users cannot create or manage folders. Admin owns folder configuration, with options for system-wide availability or availability scoped to Website, Company Portal, or Admin.
Reason: The user explicitly requested centralized admin control and wants to avoid the complexity of user-created folders.
Impact: Future folder work must include admin controls and app-scope authorization. Copy adds a notification-folder association without removing the source association; Move changes the association without deleting the canonical notification. Read state belongs to the canonical notification, not to each folder association. The schema/API design and implementation remain pending separate user approval; do not change them during the read-state fix.


---

Date: 2026-10-26
Decision: Product featured placement is a separately privileged action. Only SUPER_ADMIN or a caller with `products.feature` may set `isFeatured=true` at creation or change an existing `isFeatured` value. Callers without this permission must omit the field on update so they cannot clear or overwrite an existing featured value.
Reason: Featured placement affects public catalog promotion and must not be implicitly granted by generic create/update access.
Impact: Backend service checks are authoritative; Company/Admin forms hide the toggle and omit the field when the caller lacks the permission. A create without the field defaults to non-featured.

Date: 2026-10-26
Decision: STAFF may perform cross-company product operations only when they have the exact granular permission for that operation; COMPANY ownership remains mandatory and cannot be bypassed with a supplied `companyId`.
Reason: STAFF are marketplace moderators, not tenant-owned sellers. Cross-company access is necessary for explicitly authorized moderation/content operations, but broad access based on STAFF identity alone would violate least privilege.
Impact: Product services enforce STAFF permissions for create/update/delete, price tiers, image/document operations, and lifecycle actions, not only at HTTP routes. STAFF creation requires an explicit target `companyId`. COMPANY callers remain restricted to their own company's products. Public catalog routes remain clamped to PUBLISHED + PUBLIC.


## 2026-10-27 — Company user management and tenant-context boundaries
- COMPANY users may list/view only users belonging to their own COMPANY access profile and may enable/disable those users only through the exact `users.activate` or `users.deactivate` permission.
- COMPANY users must not create/delete users, edit other users' profile data, assign roles/permissions, or move users between companies. These restrictions are enforced in backend services, not only by hiding UI controls.
- Role assignment requires `users.assign_roles`, the role scope must match the target user's `AccessProfile.type`, and only a STAFF-context global administrator may assign the `SUPER_ADMIN` role.
- Company profile updates are tenant-scoped. Company users cannot alter company limits, lifecycle status, verification, or company type. Product/inquiry/company/user service-level global overrides apply only in STAFF context.
- Roles, permissions, categories, and admin management routes use strict STAFF-context guards so wildcard permissions or a legacy SUPER_ADMIN role in COMPANY context cannot cross those domain boundaries.
- Decision (2026-10-27): `AccessProfile.type` is the strict STAFF/COMPANY app-context boundary. `SUPER_ADMIN` wildcard permissions do not bypass login app-selection, generic `requireAccessType`, or PKCE handoff target-app checks. Customer registration intentionally has no AccessProfile; only `CUSTOMER_USER` may use the default Website context, and that fallback never grants panel access. Platform-wide operations require a STAFF access profile and the relevant permission; cross-app role membership is not an app-context grant. Regression tests cover login, middleware, and handoff.
- Decision (2026-10-27): B2C Cart / Checkout / Orders / Wishlist remain disabled, not deleted. Keep their files if useful for future development, but do not expose active routes or links until the architecture decision is explicitly changed.


- Decision (2026-10-28): Inquiry response mutations and buyer decisions must serialize by locking the parent `Inquiry` row inside their transaction before reading its current status. Keep compare-and-set status updates and all authorization/ownership checks; do not rely on a prior unlocked read to coordinate quote submission with inquiry closure.


- Decision (2026-10-28): Payment callbacks must re-read subscription state after acquiring the owner lock. A callback that observes a previously verified ACTIVE subscription must return success without changing its period; keep provider verification and conditional activation as defense in depth.
