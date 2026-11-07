# Telecom Market — Approved Design Palette

**Status:** Owner-approved final specification  
**Applies to:** Website, Company Portal, Admin and shared UI  
**Implementation source:** `packages/shared-ui/assets/design-system/tokens.scss`, `packages/shared-ui/theme.js`

This document is the canonical palette and component contract. It supersedes older palette values retained in historical notes or page references.

## 1. Shared brand colors

| Token | Value |
| --- | --- |
| Primary | `#22D3EE` |
| Primary Hover | `#06B6D4` |
| Primary Active | `#0891B2` |
| Primary Subtle | `#CFFAFE` |
| Secondary | `#6366F1` |
| Accent | `#8B5CF6` |

The shared brand primitives remain stable in both themes. Theme-specific primary actions are separate semantic tokens.

## 2. Light theme

| Token | Value |
| --- | --- |
| Page Background | `#F0F7FA` |
| Sidebar | `#FFFFFF` |
| Header | `#FFFFFF` |
| Card / Surface | `#FFFFFF` |
| Card Hover | `#F0FDFF` |
| Surface Secondary | `#F1F5F9` |
| Border | `#DCE8EF` |
| Text Primary | `#102A43` |
| Text Secondary | `#627D98` |
| Text Muted | `#94A3B8` |
| Primary Button | `#0891B2` |
| Primary Button Hover | `#0E7490` |
| Primary Button Text | `#FFFFFF` |
| Active Menu | `#CFFAFE` |
| Active Menu Text | `#0E7490` |

## 3. Dark theme

| Token | Value |
| --- | --- |
| Page Background | `#0A1625` |
| Sidebar | `#0D1B2A` |
| Header | `#0D1B2A` |
| Card / Surface | `#122438` |
| Card Hover | `#193149` |
| Surface Secondary | `#172B40` |
| Border | `#24394D` |
| Text Primary | `#F0F9FF` |
| Text Secondary | `#9FB3C8` |
| Text Muted | `#71869B` |
| Primary Button | `#22D3EE` |
| Primary Button Hover | `#67E8F9` |
| Primary Button Text | `#083344` |
| Active Menu | `#164E63` |
| Active Menu Text | `#67E8F9` |

## 4. Shared semantic colors

| Token | Foreground | Background |
| --- | --- | --- |
| Success | `#22C55E` | `#DCFCE7` |
| Warning | `#F59E0B` | `#FEF3C7` |
| Error | `#EF4444` | `#FEE2E2` |
| Info | `#3B82F6` | `#DBEAFE` |

Button variants use their separately specified action colors: Secondary `#6366F1` with white text; Danger `#DC2626` with white text; Success `#16A34A` with white text. Outline stays transparent with text `#0891B2` in Light and `#67E8F9` in Dark. Ghost stays transparent with text `#0891B2` in Light and `#22D3EE` in Dark.

## 5. Component geometry

| Component | Size | Radius |
| --- | --- | --- |
| Header | 64–72px (token: 68px) | 0 |
| Sidebar expanded | 260px | 0 |
| Sidebar collapsed | 76px | 0 |
| Button small | 32px | 6px |
| Button medium | 40px | 8px |
| Button large | 48px | 10px |
| Input | 44px | 8px |
| Card | Auto | 12px |
| Modal | Auto | 16px |
| Dropdown | Auto | 10px |
| Badge | 24px | 6px |
| Table row | 52–60px (token: 56px) | 0 |
| Footer | 56–64px (token: 60px) | 0 |

## 6. Typography and spacing

- English: Inter
- Persian: Vazirmatn
- Base: 14px
- H1: 30px
- H2: 24px
- H3: 20px
- Small: 12px
- Body weight: 400
- Button weight: 600
- Spacing base: 4px
- Approved scale: 4, 8, 12, 16, 24, 32, 48px

## 7. Implementation rules

1. Use semantic `--ds-*` tokens in shared components; do not introduce local palettes or hard-coded theme colors.
2. `--ds-brand-primary` is the shared cyan brand primitive. `--ds-primary-button` and its hover/text tokens are theme-aware action colors.
3. Sidebar, header, cards, hover surfaces, borders and text must switch through `:root.app-dark`.
4. Status colors remain shared between themes; do not silently invent a second dark semantic palette.
5. Preserve existing app behavior, routes, APIs, auth, permissions and business rules when applying visual tokens.
