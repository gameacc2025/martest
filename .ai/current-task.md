# Current Task / Agent Handoff

## INQUIRY-COMPLETION-2026-10-26-01 — Complete Inquiry / RFQ workflow

- **Status:** IN_PROGRESS
- **Branch:** `feature/inquiry-completion`, based on `main`.
- **User priority:** Finish Inquiry completely before returning to customer dashboard, addresses follow-ups, or B2C commerce.
- **Scope:** Customer-created inquiries, inquiry ownership/model/API, normal/sealed/anonymous-sealed privacy, status/deadline/publish lifecycle, Company responses, STAFF oversight, notification events, Website inquiry history/details, tests, and docs.
- **Confirmed current defects:** Website permits inquiry create for CUSTOMER_USER, but service insists on a companyId; Inquiry has no buyerUserId. Sealed modes are not enforced when getInquiry includes all responses. Inquiry lifecycle does not dispatch catalog events. Scheduled publish/deadline/autoclose behavior must be implemented or explicitly surfaced as unsupported.
- **Plan:** Backward-compatible owner relation and SQL constraint/migration; service authorization and response redaction; notifications via notification.dispatch.service.js; customer inquiry UI; regression coverage; API/database/notification docs.
- **Verification:** NOT RUN for this task yet.
- **Deferred:** PR #11 is not merged and customer dashboard/B2C work is paused until this task is complete.
