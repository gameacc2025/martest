import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const theme = readFileSync(new URL('./marketplace-theme.scss', import.meta.url), 'utf8')
const entry = readFileSync(new URL('../main.js', import.meta.url), 'utf8')
const loader = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')

describe('Website storefront theme — owner-supplied visual prototype', () => {
  it('loads a Website-only palette without changing the shared Admin/Company theme', () => {
    expect(entry).toContain("import './assets/marketplace-theme.scss'")
    for (const color of ['#22D3EE', '#06B6D4', '#0A1625', '#122438', '#8B5CF6', '#0891B2', '#F8FAFC', '#FFFFFF', '#0F172A', '#E2E8F0']) {
      expect(theme).toContain(color)
    }
    expect(theme).toContain('.public-shell {')
    expect(theme).toContain('.app-dark .public-shell {')
  })

  it('preserves the prototype glass, gradient-border, cyan/purple glow and hover treatments', () => {
    expect(theme).toContain('backdrop-filter: blur(16px)')
    expect(theme).toContain('mask-composite: exclude')
    expect(theme).toContain('radial-gradient(ellipse at 16% 18%')
    expect(theme).toContain('linear-gradient(135deg, rgba(34, 211, 238, 0.62), rgba(139, 92, 246, 0.34)')
    expect(theme).toContain('animation: tm-card-glow 5s ease-in-out infinite')
    expect(theme).toContain('translateY(-4px)')
  })

  it('respects reduced motion and applies the same cyan identity to the fiber loader', () => {
    expect(theme).toContain('@media (prefers-reduced-motion: reduce)')
    expect(loader).toContain('stroke: #22D3EE')
    expect(loader).toContain('stop-color="#8B5CF6"')
    expect(loader).toContain('background: #F8FAFC')
    expect(loader).toContain('background: #0A1625')
  })
})
