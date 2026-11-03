# Notifications inbox — approved visual reference

This is the first production page family used to validate the Turquoise / Sky / Dark Navy system.

## Composition (RTL)
- Dark fixed folder/navigation rail on the right, with brand mark, fixed INBOX/SAVED folders and their independent counts.
- Main mail workspace uses a compact title, search/filter toolbar, icon-only bulk actions with accessible labels, and a real API-backed message list.
- Message rows show sender, subject, preview, timestamp, category and unread state. Selected/unread states use a restrained turquoise wash and a clear edge marker.
- Reading drawer remains a dedicated mail-reader surface with subject, sender, timestamp, body and existing message actions.
- On narrow screens, folder navigation becomes a compact horizontal strip; the list and reader use the available viewport width.

## Tokens
- Brand: `#12B8A6`; accessible action shade: `#087F78`.
- Sky accent: `#39BFE0`; deep navy: `#173B63`; dark sidebar: `#142B46`.
- Canvas: `#F2F7FA`; surface: `#FFFFFF`; text: `#203247`.
- Vazirmatn, compact 13–15px row typography, 20–22px page heading, 4px spacing base.

## Interaction and data constraints
- Use only existing notification APIs and existing store state. No static sample messages or fabricated counts.
- Preserve fixed INBOX/SAVED semantics, folder membership filtering, search, pagination, bulk read/unread/delete, copy/move behavior and double-click-to-mark-read.
- Do not alter API endpoints, request payloads, permission checks, routes or backend behavior.
- Maintain keyboard focus, semantic controls, RTL, mobile layout and reduced-motion behavior.

## Review checklist
- [ ] Sidebar dark surface and legible text in light/dark application themes.
- [ ] Turquoise selected/unread accents are distinct but not overpowering.
- [ ] Search and bulk toolbar remain usable at tablet/mobile widths.
- [ ] Reading drawer remains a readable email-client layout.
- [ ] No mock data and no notification behavior/API changes.
