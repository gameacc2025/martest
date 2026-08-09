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
