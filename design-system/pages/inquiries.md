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


## Notification inbox interaction refinement (2026-11-02)
- Keep the three-pane folder/list/reading layout and the fixed system-managed folders; do not introduce user-created folders or alter folder APIs.
- Message selection and message opening are separate controls: use a labeled checkbox for selection and a native button for opening/reading. Never put nested buttons or checkboxes inside an element with role=button.
- Native message-open buttons expose aria-pressed for the selected item and work with Enter/Space without custom keyboard emulation.
- Preserve the established interaction contract: single click selects only; double-click opens and marks unread messages as read.
- Keep row action controls, folder links, bulk actions and reading-pane actions at least 44px; retain clear focus-visible states and responsive wrapping.
