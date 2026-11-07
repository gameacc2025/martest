import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (path) => {
  const candidates = [
    resolve(root, 'apps/website/src', path),
    resolve(root, 'src', path),
  ]
  const file = candidates.find(existsSync)
  if (!file) throw new Error(`Could not locate storefront source: ${path}`)
  return readFileSync(file, 'utf8').replace(/\s+/g, '')
}

const readShared = (path) => {
  const candidates = [
    resolve(root, 'packages/shared-ui', path),
    resolve(root, '../../packages/shared-ui', path),
  ]
  const file = candidates.find(existsSync)
  if (!file) throw new Error(`Could not locate shared product card: ${path}`)
  return readFileSync(file, 'utf8').replace(/\s+/g, '')
}

const surfaces = {
  home: read('pages/public/Home.vue'),
  catalogue: read('pages/public/ProductListing.vue'),
  search: read('pages/public/SearchResults.vue'),
  legacyCatalogue: read('pages/public/Products.vue'),
  wishlist: read('pages/public/Wishlist.vue'),
}

describe('Website storefront product-card sizing contract', () => {
  it('keeps the supplied reference HTML desktop grid geometry on home and catalogue', () => {
    expect(surfaces.home).toContain('.prods{display:grid;grid-template-columns:repeat(4,1fr)')
    expect(surfaces.catalogue).toContain('.pg.prods{grid-template-columns:repeat(3,1fr)}')
    expect(surfaces.home).toContain('.prods,.why{grid-template-columns:repeat(2,1fr)}')
    expect(surfaces.catalogue).toContain('.pg.prods,.cbig{grid-template-columns:repeat(2,1fr)}')
  })

  it('retains compact shared card tracks on the other product surfaces', () => {
    for (const surface of ['search', 'legacyCatalogue', 'wishlist']) {
      expect(surfaces[surface], surface).toContain('repeat(auto-fill,minmax(min(100%,168px),210px))')
      expect(surfaces[surface], surface).toContain('repeat(auto-fill,minmax(min(100%,150px),210px))')
    }
  })

  it('keeps shared product-card image, body and title dimensions compact', () => {
    const sharedCard = readShared('components/products/ProductCard.vue')
    const temCard = readShared('components/tem/TemProductCard.vue')
    expect(sharedCard).toContain('aspect-ratio:4/5')
    expect(sharedCard).toContain('padding:11px')
    expect(sharedCard).toContain('min-height:44px')
    expect(sharedCard).toContain('object-fit:contain')
    expect(temCard).toContain('aspect-ratio:4/5')
    expect(temCard).toContain('padding:11px')
    expect(temCard).toContain('min-height:44px')
  })
})
