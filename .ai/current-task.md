# Current Task / Agent Handoff

## RFQ monetization and entitlement enforcement — IN_PROGRESS

- **Task ID:** RFQ-MONETIZATION-01
- **Started:** 2026-10-26
- **Goal:** Complete the inquiry workflow as a permission-gated, subscription-based revenue feature.
- **Requirements:** Separate permissions from subscription entitlement; gate inquiry creation and company response participation independently; configurable period-based quotas; track internal inquiry-message allowances and paid SMS usage; prevent bypass through direct API calls; expose clear quota/plan state to authorized UIs; update tests, docs, and project memory.
- **Initial audit:** `backend/prisma/schema.prisma` contains inquiry buyer, response, `CompanyLimit` and `CompanyInquiryLimit` models. `backend/src/modules/companies/company-rule.service.js` checks open inquiry and active/daily/monthly response counts, but configured limits are optional and missing rows mean unlimited. No subscription model was found in the inspected schema section; payment, messaging, and SMS integrations still need tracing.
- **Guardrails:** Preserve existing inquiry lifecycle/visibility semantics and backward compatibility. Do not treat COMPANY access as automatic inquiry access. Do not assume or invent provider prices. Backend is authoritative.
- **Verification target:** targeted authorization/quota tests, full backend tests, Prisma validate/generate/migration validation, and all three frontend builds; record unrun checks honestly.
- **Status:** Backend foundation implemented on branch `feat/rfq-monetization`; integration and verification still in progress.
- **Implemented so far:** Added `InquiryPlan`, `InquirySubscription`, and `InquiryUsageEvent` models with a migration; period-based quota service for inquiry creation, company responses, internal messages and SMS; backend hooks for inquiry creation/response submission; caller quota summary endpoint; protected admin APIs to configure plans, inspect subscriptions, toggle enforcement, and manually grant a subscription; targeted unit tests for quota enforcement.
- **Important limitations:** No payment gateway was found in backend dependencies during initial tracing. The manual admin grant is not a payment callback and must not be used as proof of payment. SMS delivery is explicitly unimplemented in the current notification worker. No separate internal-message domain/module was found in the audited module list, so those quota types are defined but not yet connected to an actual message send path. Frontend plan purchase/management UI and provider integration remain outstanding.
- **Rollout safety:** Enforcement defaults OFF until the protected admin setting `inquiry.subscription_enforcement` is enabled. Create/configure plans and grant subscriptions before enabling it; enabling without active subscriptions will block inquiry creation and company responses.
- **Next step:** Verify Prisma schema/migration and backend tests, then trace frontend inquiry entry points and determine payment/SMS provider integration before enabling monetization in production.
