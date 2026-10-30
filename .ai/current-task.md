# Current Task — 2026-10-30

## Active handoff: Step 10 — Website Terms & Privacy page redesign

**Repository:** `gameacc2025/martest`  
**Canonical branch:** `main`  
**Feature branch:** `feat/website-terms-redesign-step-10`  
**Base commit:** `89c490b6273188e10b66a685794c9edbe9bfed01` plus current-task handoff docs  
**Status:** Step 10 Terms page redesign, regression tests, and documentation updates are committed on the feature branch. CI/migration validation has not yet been triggered or verified.

## Completed UI steps

- **Step 1 Homepage:** PR #29 merged; CI/migration and post-merge checks passed.
- **Step 2 Product Listing:** PR #30 merged; CI/migration and post-merge checks passed.
- **Step 3 Product Details:** PR #31 merged; CI/migration and post-merge checks passed.
- **Step 4 Categories:** PR #32 merged; CI/migration checks passed.
- **Step 5 Search Results:** PR #33 merged; CI/migration passed; runtime browser smoke failed.
- **Step 6 About Us:** PR #34 merged; CI/migration passed; runtime browser smoke failed.
- **Step 7 Company Profile:** PR #35 merged; CI/migration passed; runtime browser smoke failed on feature run.
- **Step 8 Companies directory:** intentionally remains unrouted/dormant. Backend GET /companies is STAFF-only and current page references missing dependencies. Do not make it public without a public-safe endpoint and explicit field allowlist.
- **Step 9 FAQ:** PR #36 merged at `89c490b6273188e10b66a685794c9edbe9bfed01`. Feature CI [40884581248](https://github.com/gameacc2025/martest/actions/runs/40884581248) passed; migration [40884581108](https://github.com/gameacc2025/martest/actions/runs/40884581108) passed; post-merge CI [40884769582](https://github.com/gameacc2025/martest/actions/runs/40884769582) passed; post-merge migration [40884769425](https://github.com/gameacc2025/martest/actions/runs/40884769425) passed. Runtime [40884581818](https://github.com/gameacc2025/martest/actions/runs/40884581818) and post-merge [40884769750](https://github.com/gameacc2025/martest/actions/runs/40884769750) failed at browser smoke; do not claim runtime green.

## Step 10 — Terms & Privacy (next)

- Redesign `apps/website/src/pages/public/Terms.vue` using shared design-system tokens and responsive, readable legal-document layout.
- Preserve existing legal wording and meaning; this is a visual/accessibility pass, not legal drafting. Do not add claims about data retention, sharing, security certifications, processors, cookies, or legal compliance without authoritative source material.
- Add a focused component test covering headings/sections, content preservation, RTL semantics and responsive design hooks.
- Do not change routes, auth, API behavior, or other pages in this step.

## Deferred / blocked UI item — Contact Us

The current `ContactUs.vue` displays hardcoded phone, email, postal address, social URLs and a map embed, and its submit handler simulates success with a one-second timeout instead of calling a verified contact API. Search found no matching public contact submission endpoint. Do not merely restyle and preserve a misleading successful-send claim. Defer the page until the real contact submission contract and verified business contact details are established; record this as a functional integration task.

## Remaining cross-project backlog

1. Complete remaining safe page-by-page UI work, one page per branch/PR.
2. Exhaustive company-owned route/tenant/IDOR review.
3. Complete SMS event-dispatch integration. Twilio adapter, worker, paid quota and tests exist; dispatcher does not enqueue SMS rows. Live delivery unverified.
4. Controlled live Zarinpal and SMTP verification.
5. Complete endpoint/schema/permission API documentation.
6. Refresh Graphify when a workspace is available.

## Constraints

- No mock data, auth bypass, invented endpoints, or fake success states.
- Do not expose STAFF-only company directory data publicly.
- Preserve app-context/RBAC, tenant ownership, inquiry permission/subscription, payment idempotency and quota invariants.
- Browser-smoke debugging is not the next task; report its failure honestly.
- Keep tests/build/migration/runtime/browser/provider verification as separate statuses.
- Update this file, `.ai/WORKLOG.md`, project context, roadmap and relevant feature docs at each meaningful stage.
