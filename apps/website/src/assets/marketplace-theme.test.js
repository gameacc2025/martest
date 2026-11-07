import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const theme = readFileSync(new URL('./marketplace-theme.scss', import.meta.url), 'utf8')
const entry = readFileSync(new URL('../main.js', import.meta.url), 'utf8')
const loader = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
const home = readFileSync(new URL('../pages/public/Home.vue', import.meta.url), 'utf8')
const layout = readFileSync(new URL('../layouts/PublicLayout.vue', import.meta.url), 'utf8')
const inquiries = readFileSync(new URL('../pages/public/MyInquiries.vue', import.meta.url), 'utf8')
const notifications = readFileSync(new URL('../pages/public/Notifications.vue', import.meta.url), 'utf8')
const productDetails = readFileSync(new URL('../pages/public/ProductDetails.vue', import.meta.url), 'utf8')

describe('Website visual system — latest owner-supplied prototype', () => {
  it('loads a Website-only palette with the exact light and dark prototype tokens', () => {
    expect(entry).toContain("import './assets/marketplace-theme.scss'")
    for (const color of [
      '#22D3EE', '#06B6D4', '#0891B2', '#0E7490', '#6366F1', '#8B5CF6',
      '#0A1625', '#122438', '#F0F7FA', '#F0FDFF', '#F1F5F9', '#DCE8EF',
      '#102A43', '#627D98', '#94A3B8', '#0D1B2A', '#193149', '#172B40',
      '#24394D', '#F0F9FF', '#9FB3C8', '#71869B'
    ]) expect(theme).toContain(color)
    expect(theme).toContain(':root.app-dark')
    expect(theme).toContain('--ds-color-primary: #0891B2')
    expect(theme).toContain('--ds-primary-button: #22D3EE')
    expect(theme).toContain('--p-primary-color: #0891B2 !important')
  })

  it('styles the real public header and all public page surfaces with the prototype tokens', () => {
    expect(layout).toContain('class="public-header"')
    expect(layout).toContain('class="public-theme-toggle"')
    expect(layout).toContain('class="tm-btn tm-btn--accent public-rfq-link"')
    expect(theme).toContain('--primary-color: #0891B2')
    expect(theme).toContain('--surface-ground: #F0F7FA')
    expect(theme).toContain('--p-red-500: #EF4444 !important')
    expect(theme).toContain('.public-shell .public-utility-bar')
    expect(theme).toContain('.public-shell .public-header')
    expect(theme).toContain('.public-shell .public-logo-symbol')
    expect(theme).toContain('.public-shell .public-nav-link-active')
    expect(theme).toContain('.public-shell .public-footer')
    expect(theme).toContain('.reference-home')
    expect(theme).toContain('.reference-products')
    expect(theme).toContain('.reference-categories')
  })

  it('removes legacy teal and fixed white surfaces from public operational pages', () => {
    expect(inquiries).not.toContain('#01bec2')
    expect(inquiries).not.toContain('#01BEC2')
    expect(notifications).not.toContain('#087f7818')
    expect(notifications).not.toContain('background:#fff')
    expect(notifications).toContain('var(--tm-cyan-soft)')
    expect(productDetails).not.toContain('#0c8a6e')
    expect(productDetails).not.toContain('#a72727')
    expect(productDetails).toContain('background: var(--tm-surface)')
  })

  it('uses the network-transmission loader and animated cyan/violet fiber hero from the prototype', () => {
    expect(loader).toContain('background: #060D17')
    expect(loader).toContain('fiber-loader-svg')
    expect(loader).toContain('fiber-flow--cyan')
    expect(loader).toContain('fiber-flow--violet')
    expect(loader).toContain('stroke-dasharray: 12 42')
    expect(loader).toContain('animation-duration: 4.8s !important')
    expect(loader).toContain('لطفا منتظر بمانید...')
    expect(loader).toContain('#22D3EE')
    expect(loader).toContain('#8B5CF6')
    expect(home).toContain('class="hero-bg-network"')
    expect(home).toContain('class="fiber-wave fiber-wave--cyan"')
    expect(home).toContain('class="fiber-wave fiber-wave--violet"')
    expect(theme).toContain('@media (prefers-reduced-motion: reduce)')
    expect(theme).toContain('fiber-network-glow 4.8s')
    expect(theme).toContain('hero-copy-enter .65s')
    expect(theme).toContain('hero-feature-float 7s')
    expect(theme).not.toContain('.public-shell *,')
  })
})
