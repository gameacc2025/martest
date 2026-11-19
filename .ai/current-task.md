# PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-19

**Status:** IN PROGRESS — source and exact-main acceptance verified; tenant/audit coverage review continues.  
**Repository:** gameacc2025/martest  
**Integration branch:** main only; lead owns serialized writes/commits/pushes.  
**Current main / latest fully tested SHA:** fdb9423f986b5ca04a216eb1393f4ba7900cbaa8

## Exact-main verification

- **CI PASS:** 44472290269 — 69 Frontend/Shared test files, 390 Frontend/Shared tests, 18 architecture/session tests, 1,751 Backend tests; Website, Company and Admin production builds.
- **Fresh PostgreSQL migration PASS:** 44472290263 — Prisma validation/client generation, all migrations on a fresh database, Prisma model/table parity and migration-state verification.
- **Runtime PASS:** 44472290208 — Compose config/build, PostgreSQL/backend/all panels healthy, migrations and model/table parity, all development seeds run twice, AD-1/AD-3 grants reconciled, 8/8 Playwright smoke tests, teardown succeeded.

## Repairs verified in this audit

- Public CMS article search now combines search terms with the publication-time window using AND; regression tests prevent early exposure of future-dated published records.
- Auth challenge verify/consume ownership checks are regression-tested against cross-user access.
- COMPANY login and refresh now reject inactive, suspended or soft-deleted companies while preserving each user's independent AccessProfile.isActive state.
- User lifecycle AuditLog events cover create/update/role changes/delete/panel access/company transfer. Metadata excludes contact values and credentials; company scope is attached.
- User updates now return 409 for duplicate email/phone; company creation validates the target company.
- Company lifecycle/profile/settings mutations now write transactional AuditLog events; controllers pass the authenticated actor.
- CRM lead create/update/assign/status/convert/merge use the central action registry and transactional AuditLog writer.
- Audit metadata redaction normalizes snake_case/kebab-case keys and truncates over-depth objects.
- AD-3 wording and the duplicated main-only/publishing instructions were clarified; current task handoff no longer contains literal escaped newline text.

## Remaining work

1. Continue resource-by-resource tenant/IDOR review across Product, Inquiry, Support, CMS, Auth, Notifications and administrative modules. Targeted checks are not an exhaustive sign-off.
2. Expand central AuditLog producers beyond CRM, User and Company (notably Product, Inquiry, Support, CMS, roles/settings and security-sensitive operations).
3. Obtain owner/legal direction for AuditLog retention, archival and deletion policy. Do not invent a retention period.
4. Confirm expected public-catalog behavior for products owned by inactive/suspended/soft-deleted companies. Current product queries enforce product publication/visibility but do not independently require the related company to be ACTIVE; no commercial visibility rule was invented.
5. Finish dashboard/reporting completeness and broader visual/accessibility regression.
6. Live SMTP/Twilio/payment-provider delivery and production deployment remain NOT VERIFIED.
7. Owner's Windows working tree, local Docker daemon and developer PostgreSQL remain NOT VERIFIED by GitHub Actions.

## Governance and handoff

- Repository rulesets endpoint returned an empty list; branch-protection read returned 403 to the GitHub integration. Server-side branch protection is NOT VERIFIED. Repository policy documents main-only work; Git refs observed during this audit expose only main.
- Preserve AD-1 through AD-4. Retail, checkout, cart, wishlist and finance/settlement remain dormant pending owner approval.
- **Next action:** continue the Product/Inquiry tenant-scope review, then instrument the next high-risk domain's AuditLog events with tests.
