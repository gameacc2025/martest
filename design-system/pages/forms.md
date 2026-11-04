# Forms page override

Applies to create/edit product, inquiry, company, user, role and settings forms.

- Group related inputs into labelled sections with concise descriptions.
- Use a consistent responsive 12-column grid: full-width for long descriptions, 6/6 for related short fields, and 4/4/4 only where field widths remain comfortable.
- Labels are always visible; placeholders are examples, not replacements for labels.
- Required state and validation errors are visible and announced.
- Keep file upload, rich text, technical specifications and pricing groups visually separated.
- Preserve existing field names, validation rules, payload shape and API calls.
- Put primary save/submit and secondary cancel/back actions in a consistent footer.
- During submission, show progress and prevent duplicate submits; after failure, retain entered values.

## Public account profile
- Present account identity as a dedicated summary card with a real avatar or an initials fallback; never reference a missing placeholder image.
- Show access-profile type as a human-readable label, not a raw enum. Use API-backed name, email, phone and creation date with explicit empty-value labels.
- Keep profile edit and password-change dialogs associated with visible labels and 44px controls. Preserve the existing profile/password/avatar API contracts.
- Do not render a fabricated unread count. If the profile page does not load notification totals, show a plain notification navigation action.
## Public address book
- Address cards distinguish the default address with a clear status label and keep edit/delete/default actions visually separate.
- Use PrimeIcons for map markers; avoid decorative text glyphs as interface icons.
- Form fields remain label-wrapped or explicitly associated, with clear required states and 44px input/action targets.
- Keep the address form responsive, preserve the existing create/update/default/delete API contracts, and show an intentional empty state when no addresses are returned.