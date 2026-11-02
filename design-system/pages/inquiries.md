# Inquiry workflow page override

Applies to Admin and Company inquiry list, create and detail pages.

## Operational hierarchy
- Page heading communicates whether this is the Admin review queue or the Company's sales/sourcing inbox.
- Keep sent/received scope, status filters and search controls visually distinct.
- Preserve the distinction between inquiry status, response status, priority, deadline and subscription/usage information.
- Deadlines must show explicit dates and urgency text; color is supplementary.
- Detail pages prioritize inquiry identity and status, then buyer/request information, response timeline and allowed actions.

## Permissions and data
- The API and existing permission checks decide which actions exist. Do not expose creation or response actions to unauthorized roles.
- Do not synthesize counts, deadlines, responses, supplier offers or subscription balances.
- Preserve server-side pagination, sorting, filters and scope parameters.
- Use clear loading, empty, error and access-denied states.
