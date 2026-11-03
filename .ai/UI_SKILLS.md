# UI/UX Skills — Mandatory Project Standard

These skills are the project's reusable design and frontend-quality toolkit. They must be used for every meaningful UI change across Website, Company Portal, Admin, and shared UI packages.

## Installed skills and intended use

| Skill | Install target | Use it for |
|---|---|---|
| UI UX Pro Max | All assistants supported by `uipro init --ai all`; universal skill copy plus agent-specific locations; existing OpenCode copy: `.opencode/skills/ui-ux-pro-max` | Design-system decisions, layout patterns, palettes, typography pairings, component and page design guidance |
| Taste Skill (`design-taste-frontend`) | All supported agent directories selected by Skills CLI `--agent '*'` (including `.agents/skills/`) | Distinctive art direction, composition, typography, spacing, visual hierarchy, motion, and avoiding generic/template-like UI |
| Impeccable | All supported agent directories selected by Skills CLI `--agent '*'` (including `.agents/skills/`) | UX planning, critique, polish, responsive/accessibility audits, interaction and edge-case quality |
| Vercel Web Design Guidelines | All supported agent directories selected by Skills CLI `--agent '*'` (including `.agents/skills/`) | Review UI implementation against current web-interface, accessibility, responsive, and interaction guidelines |

The upstream skills are maintained by their respective authors. Do not replace their full skill files with summaries. The installer targets all supported agent directories at project scope so the skills are shared with the repository/team.

## Mandatory workflow for every UI task

1. Read `AGENTS.md`, `.ai/PROTOCOL.md`, this file, and the current handoff in `.ai/current-task.md`.
2. Identify the surface and task type:
   - Public/marketing/product page: use Taste Skill and UI UX Pro Max for direction and structure; use Impeccable for planning/polish.
   - App/dashboard/admin/company workflow: use UI UX Pro Max for system consistency, Impeccable's Operate mode for task efficiency, and Taste Skill's app-screen guidance where applicable.
   - Shared component/design-token work: inspect the current design system first; use UI UX Pro Max and Impeccable to preserve consistency.
3. Read the relevant `SKILL.md` files before design or UI edits. Follow the referenced playbooks and supporting files that apply to the task; do not assume a skill is loaded merely because it is installed.
4. Inspect the existing implementation, design tokens, shared components, target route, responsive behavior, RTL/Persian content, and dark/light themes before changing anything.
5. State the intended direction and acceptance criteria in the task notes. Do not invent a new brand, palette, font, or design system when the current project identity already governs the surface.
6. Implement the smallest coherent change. Preserve existing behavior, API contracts, permissions, business rules, data flow, and accessibility semantics unless the task explicitly authorizes changing them.
7. Before handoff, use the Vercel guideline skill for a targeted code review and Impeccable for the applicable critique/polish/audit pass. Record findings and fixes in the worklog.

## Project-specific guardrails

- Stack is Vue 3 + Vite + Pinia + PrimeVue 4 + Tailwind, JavaScript only. Do not introduce React, TypeScript, another UI kit, or new dependencies without explicit approval.
- Respect the current brand/design tokens and shared components. The historical primary token is `#01bec2`; inspect the live design-system files before relying on any remembered value.
- Preserve Vazirmatn, Persian copy, RTL behavior, correct Persian/Arabic shaping, and localized number/date conventions where already used.
- All three apps must remain coherent while retaining their distinct user contexts: Website/CUSTOMER, Company/COMPANY, Admin/STAFF.
- Do not add fake content, unsupported business claims, invented contact details, vanity metrics, decorative controls, or nonfunctional interactions.
- Do not make visual changes that silently alter API calls, authentication, authorization, permissions, RFQ/inquiry flows, or other business behavior.
- Prefer existing Lucide/PrimeIcons and project components over emoji icons or one-off visual primitives.
- Keep responsive layouts and keyboard/focus/accessibility behavior in scope, not as optional afterthoughts.

## Verification policy

- The repository owner has explicitly asked not to focus on browser testing. Do not run browser automation, screenshot inspection, or browser-based skill loops unless the owner later authorizes them.
- Static code review, targeted Vercel guideline review, existing test authoring, and non-browser checks remain appropriate. Do not claim a visual/runtime check was performed when it was not.
- If a skill's default workflow requires a browser, screenshots, or an interactive visual picker, follow its non-browser/static guidance where possible and record that step as `NOT RUN — owner instruction`; never fake its output.
- Add or update tests for behavior changed by UI work, but do not execute tests/builds when the owner has instructed not to run them. Record `NOT RUN` accurately.
- Resolve conflicts in this order: explicit user request and product requirements; repository architecture/brand/accepted decisions; these project guardrails; skill recommendations. Skills are expert references, not permission to override project constraints.

## Installation and updates

Run from the repository root in PowerShell:

```powershell
.\scripts\install-ui-skills.ps1
```

The script installs/updates all four upstream skills at project scope for all supported agents. UI UX Pro Max uses its native `uipro init --ai all` mode; the other three use the Skills CLI `--agent '*'` target. The Skills CLI documents `--agent '*'` as installing a specific skill to all supported agents. To update later, rerun the same script. Impeccable's native installer can optionally add agent-specific integrations via `npx impeccable install`; the shared skill itself is installed for all agents by the script. Upstream URLs and install names are maintained in the script. Do not commit generated local caches, browser binaries, credentials, or environment files.
