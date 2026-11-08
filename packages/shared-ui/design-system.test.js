import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const tokens = read('./assets/design-system/tokens.scss')
const theme = read('./theme.js')
const legacy = read('./assets/design-system/tem.scss')
const overrides = read('./assets/design-system/brand-overrides.scss')
const newTemp = read('./assets/design-system/newtemp-reference.scss')
const loading = read('./components/common/Loading.vue')
const sharedStyles = read('./assets/main.scss')
const adminEntry = read('../../apps/admin/src/main.js')
const companyEntry = read('../../apps/company/src/main.js')
const websiteEntry = read('../../apps/website/src/main.js')
const websiteTheme = read('../../apps/website/src/assets/marketplace-theme.scss')
const pages = read('./assets/design-system/pages.scss')
const sidebar = read('./components/dashboard/DashboardSidebar.vue')
const companyDashboard = read('../../apps/company/src/pages/user/dashboard/CompanyDashboard.vue')
const companyLayout = read('../../apps/company/src/layouts/CompanyLayout.vue')
const websiteHome = read('../../apps/website/src/pages/public/Home.vue')
const publicLayout = read('../../apps/website/src/layouts/PublicLayout.vue')
const temButton = read('./components/tem/TemButton.vue')
const temBadge = read('./components/tem/TemBadge.vue')
const temStatCard = read('./components/tem/TemStatCard.vue')
const storeProductCard = read('./components/store/StoreProductCard.vue')
const storeCategoryCard = read('./components/store/StoreCategoryCard.vue')
const storeSectionHeading = read('./components/store/StoreSectionHeading.vue')
const storeFilterPanel = read('./components/store/StoreFilterPanel.vue')
const storeBenefitGrid = read('./components/store/StoreBenefitGrid.vue')

describe('approved Telecom Market design palette', () => {
  it('loads the NewTemp.html reference theme as the final shared layer for all apps', () => {
    expect(sharedStyles).not.toContain('newtemp-reference.scss')
    for (const entry of [adminEntry, companyEntry]) {
      expect(entry.indexOf('assets/design-system/tem.scss')).toBeLessThan(entry.indexOf('assets/main.scss'))
      expect(entry.indexOf('assets/main.scss')).toBeLessThan(entry.indexOf('assets/design-system/newtemp-reference.scss'))
    }
    expect(websiteEntry.indexOf('assets/design-system/tem.scss')).toBeLessThan(websiteEntry.indexOf('assets/main.scss'))
    expect(websiteEntry.indexOf('assets/main.scss')).toBeLessThan(websiteEntry.indexOf('marketplace-theme.scss'))
    expect(websiteEntry.indexOf('marketplace-theme.scss')).toBeLessThan(websiteEntry.indexOf('assets/design-system/newtemp-reference.scss'))
    for (const value of ['#22D3EE', '#06B6D4', '#0891B2', '#6366F1', '#8B5CF6', '#0A1625', '#122438', '#F0F7FA', '#F0FDFF', '#DCE8EF', '#102A43', '#627D98', '#94A3B8', '#193149', '#24394D', '#F0F9FF', '#9FB3C8', '#71869B', '#67E8F9', '#083344']) expect(newTemp).toContain(value)
    expect(newTemp).toContain(':root.app-dark')
    expect(newTemp).toContain("font-family:var(--ds-font-family-persian)")
    expect(newTemp).toContain('.p-datatable .p-datatable-tbody')
    expect(newTemp).toContain('.tm-btn--accent')
    expect(newTemp).toContain('var(--ds-primary-button-text)')
    expect(newTemp).toContain('--ds-status-muted-bg:#172B40')
  })

  it('keeps Website, Admin and Company on one shared source of truth for brand and surface tokens', () => {
    expect(websiteEntry.indexOf('marketplace-theme.scss')).toBeLessThan(websiteEntry.indexOf('assets/design-system/newtemp-reference.scss'))
    expect(websiteTheme).not.toMatch(/^\\s*:root(?:\\.app-dark)?\\s*\\{/m)
    expect(newTemp).toContain(':root {')
    expect(newTemp).toContain(':root.app-dark')
    for (const entry of [adminEntry, companyEntry, websiteEntry]) {
      expect(entry).toContain('assets/design-system/newtemp-reference.scss')
    }
  })

  it('uses the animated fiber loader from NewTemp for fullscreen and inline loading states', () => {
    expect(loading).toContain('fiber-loader-svg')
    expect(loading).toContain('fiber-data-flow')
    expect(loading).toContain('fiber-core-pulse')
    expect(loading).toContain('prefers-reduced-motion: reduce')
    expect(loading).not.toContain('ProgressSpinner')
  })

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

  it('removes the retired purple/orange palette from shared store and Tem widgets', () => {
    for (const source of [temButton, temBadge, temStatCard, storeProductCard, storeCategoryCard, storeSectionHeading, storeFilterPanel, storeBenefitGrid]) {
      expect(source).not.toMatch(/#8c7bf7|#ff5c39|#eeebfe|#7564dc|#7c6cf6|#6c5ce7|#eceaff|#f4f5fa|#12182b|#6b7390/i)
    }
    expect(temButton).toContain('var(--ds-primary-button)')
    expect(temBadge).toContain('var(--ds-status-success-bg)')
    expect(temStatCard).toContain('var(--ds-color-surface)')
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

  it('keeps dashboard and public website surfaces on the approved theme tokens', () => {
    expect(sidebar).toContain('var(--ds-sidebar-width)')
    expect(sidebar).toContain('var(--ds-sidebar-active-bg)')
    for (const source of [companyDashboard, companyLayout, websiteHome, publicLayout]) {
      expect(source).not.toMatch(/#7c6cf6|#6c5ce7|#7b2ff7|#4b3bd6/i)
    }
  })

  it('styles button variants through semantic tokens', () => {
    expect(overrides).toContain('var(--ds-primary-button)')
    expect(overrides).toContain('var(--ds-brand-secondary)')
    expect(overrides).toContain('var(--ds-button-danger)')
    expect(overrides).toContain('var(--ds-button-success)')
    expect(overrides).toContain('var(--ds-outline-text)')
    expect(overrides).toContain('var(--ds-ghost-text)')
    expect(tokens).toContain('--ds-outline-text: #67E8F9;')
    expect(tokens).toContain('--ds-ghost-text: #22D3EE;')
    expect(pages).toContain('.ds-btn--secondary')
    expect(pages).toContain('.ds-btn--ghost')
  })
})
