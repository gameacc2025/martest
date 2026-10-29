# Supplier response authorization

## Rule

Supplier quote operations are company actions, not staff administration actions. Creating or editing a response, withdrawing a response, and managing response attachments require both:

- `accessType === COMPANY`
- the `inquiries.respond` permission

The administrative `leads.update` permission does not grant supplier impersonation. The API routes enforce this boundary before invoking controllers; service-level ownership checks remain mandatory as defense in depth.

## Buyer decisions

Selecting or rejecting a supplier response is a buyer-side decision. It remains protected by the inquiry ownership checks and the buyer permissions defined by the inquiry module; this is separate from supplier response permissions.

## Regression coverage

`backend/src/modules/inquiries/inquiry.routes.test.js` verifies that a STAFF caller with `leads.update` cannot submit, edit, withdraw, or delete supplier response attachments. The COMPANY path with `inquiries.respond` remains covered by the existing route tests.

## Validation

The pull request's automated CI and database migration checks must pass before this change is considered complete. Browser E2E is intentionally outside the requested verification scope.
