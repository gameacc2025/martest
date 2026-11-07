import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const tokens = read('./assets/design-system/tokens.scss')
const theme = read('./theme.js')
const legacy = read('./assets/design-system/tem.scss')
const overrides = read('./assets/design-system/brand-overrides.scss')
const pages = read('./assets/design-system/pages.scss')

describe('approved Telecom Market design palette', () => {
  it('defines the shared brand primitives and both theme surfaces', () => {
    for (const value of [
      '#22D3EE', '#06B6D4', '#0891B2', '#CFFAFE', '#6366F1', '#8B5CF6',
      '#F0F7FA', '#FFFFFF', '#F0FDFF', '#F1F5F9', '#DCE8EF', '#102A43',
      '#627D98', '#94A3B8', '#0A1625', '#0D1B2A', '#122438', '#193149',
      '#172B40', '#24394D', '#F0F9FF', '#9FB3C8', '#71869B', '#67E8F9',
      '#083344', '#164E63', '#22C55E', '#DCFCE7', '#F59E0B', '#FEF3C7',
      '#EF4444', '#FEE2E2', '#3B82F6', '#DBEAFE',
    ]) expect(tokens).toContain(value)
  })

  it('keeps PrimeVue primary actions theme-aware and uses the approved active color', () => {
    expect(theme).toContain("color:'#0891B2',contrastColor:'#FFFFFF',hoverColor:'#0E7490',activeColor:'#0891B2'")
    expect(theme).toContain("color:'#22D3EE',contrastColor:'#083344',hoverColor:'#67E8F9',activeColor:'#0891B2'")
  })

  it('does not retain the retired violet primary or old dashboard rail palette', () => {
    expect(legacy).not.toMatch(/#7c6cf6|#6c5ce7|#8878f7|#2bb3e8|#0d2b53|#f4f5fa/i)
    expect(legacy).toContain('var(--ds-sidebar-bg)')
    expect(legacy).toContain('var(--ds-primary-button)')
  })

  it('styles button variants through semantic tokens', () => {
    expect(overrides).toContain('var(--ds-primary-button)')
    expect(overrides).toContain('var(--ds-brand-secondary)')
    expect(overrides).toContain('var(--ds-button-danger)')
    expect(overrides).toContain('var(--ds-button-success)')
    expect(pages).toContain('.ds-btn--secondary')
    expect(pages).toContain('.ds-btn--ghost')
  })
})
