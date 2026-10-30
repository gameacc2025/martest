# Current Task — 2026-10-30

## Active handoff: Step 11 — Company-owned API authorization and tenant-isolation audit

**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Main after Step 10:** `0da4960d026aa6be532777c5dd66afacca3430de`  
**Feature branch:** `audit/company-tenant-access-step-11`  
**Status:** Company module audit slice merged in PR #38 at `d4d64af9c120d7200e363bdcb7092dfd0554f47b`; feature and post-merge CI/migration passed. **Current audit slice:** Product routes/service reviewed. Existing ownership and nested-resource checks are present; added regression coverage for COMPANY/CUSTOMER wildcard attempts against STAFF-only moderation. CI pending. Inquiry routes are next.

## Completed UI redesign steps

- Steps 1–7: Homepage, Product Listing, Product Details, Categories, Search Results, About Us, and Company Profile changes are merged in PRs #29–#35. Their CI/migration results are recorded in the UI redesign guide; browser-smoke failures are recorded separately.
- Step 8: Companies directory remains intentionally unrouted/dormant because `GET /companies` is STAFF-only and the existing page references missing dependencies. No public exposure without a public-safe endpoint and field allowlist.
- Step 9: FAQ PR #36 merged. Feature and post-merge CI/migration passed; feature and post-merge runtime browser-smoke failed.
- **Step 10:** Terms & Privacy PR #37 merged at `0da4960d026aa6be532777c5dd66afacca3430de`. Feature CI [41096817092](https://github.com/gameacc2025/martest/actions/runs/41096817092) passed; feature migration [41096817046](https://github.com/gameacc2025/martest/actions/runs/41096817046) passed; post-merge CI [41097249357](https://github.com/gameacc2025/martest/actions/runs/41097249357) passed; post-merge migration [41097249463](https://github.com/gameacc2025/martest/actions/runs/41097249463) passed. Post-merge runtime [41097249425](https://github.com/gameacc2025/martest/actions/runs/41097249425) was still running at handoff; browser smoke is not the next debugging task.

## Step 11 — Security audit scope

- Review company-owned API routes, their preHandlers, AccessProfile context requirements, tenant scoping, resource ownership checks, nested attachments, and read/write operations.
- Start with `companies`, `products`, `inquiries`, `addresses`, and `notifications`; inspect every relevant route and service query rather than relying on frontend gating.
- For each suspected gap, prove the path and add a focused regression test before changing behavior.
- Do not claim full security sign-off until the complete route inventory is covered.
- Preserve strict app-context boundaries: STAFF/SUPER_ADMIN must not gain COMPANY context by wildcard permission; COMPANY operations must be scoped to the authenticated company.

## Deferred UI / integration item — Contact Us

`ContactUs.vue` contains hardcoded phone/email/address/social/map details and a submit handler that simulates success with a timeout. No public contact submission API was found in source searches or route inventory. Do not invent an endpoint or claim a message was sent. Define a real contact-message workflow and authoritative business contact details before implementing it.

## Remaining backlog after Step 11

1. Complete the exhaustive company-owned route/tenant/IDOR audit.
2. Complete SMS event-dispatch integration: Twilio adapter, worker, paid quota and tests exist; dispatcher does not enqueue SMS rows. Live delivery unverified.
3. Verify live Zarinpal and SMTP using controlled staging credentials.
4. Complete endpoint/schema/permission API documentation.
5. Refresh Graphify when a workspace is available.
6. Resolve Contact Us functional integration from an approved API and verified contact data.

## Constraints

- No mock data, auth bypass, invented endpoints, or fake success states.
- Do not expose STAFF-only company directory data publicly.
- Preserve app-context/RBAC, tenant ownership, inquiry permission/subscription, payment idempotency and quota invariants.
- Browser-smoke debugging is not the next task; report its result honestly.
- Separate unit/CI tests, builds, migrations, runtime infrastructure, browser smoke and live-provider verification.
- Keep `.ai/current-task.md`, `.ai/WORKLOG.md`, project context, roadmap and relevant docs current.


## Step 11A completion — Companies module

PR #38 merged at `d4d64af9c120d7200e363bdcb7092dfd0554f47b`. Feature CI [41098052152] and migration [41098052018] passed; post-merge CI [41098224830] and migration [41098224693] passed. Runtime [41098225137] remains separate; browser smoke is not pursued next. No confirmed company-route cross-tenant bypass was found. Added tests cover own-vs-other tenant access to company products/statistics/logo and wildcard COMPANY denial for settings.

## Step 11B — Products module (next)

Review product route/controller/service ownership enforcement and nested image/document/price-tier operations. Existing tests already cover many ownership, lifecycle and attachment boundaries; verify gaps against actual route wiring before adding or changing behavior. No vulnerability is asserted at this point.
