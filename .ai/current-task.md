# Current Task / Agent Handoff

## PRODUCT-ACCESS-AUDIT-2026-10-26-01 — Product security, lifecycle, and retail price chart history

- **Status:** IN_PROGRESS — service-level access and lifecycle logic reviewed; retail-only snapshot logic, full-history API behavior, focused regression tests, and API/database documentation updated. Continue until CI for the latest HEAD is green and the remaining source/test audit is complete.
- **Canonical branch:** `main`.
- **User authorization:** Full implementation of Task 1 (STAFF/COMPANY/CUSTOMER access control and tenant ownership) and Task 2 (product lifecycle/pricing/specifications/media/publication workflow), including tests and docs. No follow-up approval is required for in-scope fixes.
- **Price-history requirement:** Persist only retail tier history (`minQuantity = 1`) in the existing `ProductPriceSnapshot` table. Snapshot writes must share the price mutation transaction. Wholesale changes and metadata-only edits must not create chart points. Return the complete stored public series in ascending timestamp order for currently PUBLISHED + PUBLIC products. Historical prices predating snapshot activation must not be fabricated.
- **Current implementation commits:** `fcfdf919577affcd590b55ca423e1b3d2f5de6d1` (retail-only snapshot guard); `03da519bf207f6bc9fa376fb377b8a37b9981ce9` (complete retail series); `5f3fef964ae838be41ac63db2c160ae6808b400a` (retail history edge-case tests); `cff8b70da5670b5af3897de2622dd08e3270a9e1` (API docs); `64358664d517316a4ef303db24c80be0263bfb4c` (database docs). Further commits may follow.
- **Initial verification:** CI runs `40311461581`, `40311689207`, `40311709695`, and `40311758998` passed on their respective commits. CI for later documentation/refactor commits is still to be checked.
- **Remaining work:** Inspect complete product workflow and authorization paths (including direct service entrypoints, workflow transitions, image/document ownership, price reconciliation); add focused tests where gaps remain; verify latest CI; update worklog; report what is and is not verified. PostgreSQL migration application, Docker/Compose startup, browser E2E/visual checks, and live service connectivity must remain explicitly unverified unless actually run in an available environment.
- **Do not expand scope:** Do not implement cart/checkout/payment/CRM in this task.
