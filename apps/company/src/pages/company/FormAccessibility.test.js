import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readPage(path) {
  const candidates = [
    resolve(process.cwd(), `apps/company/src/pages/company/${path}`),
    resolve(process.cwd(), path),
  ]
  const filePath = candidates.find(existsSync)
  if (!filePath) throw new Error(`Could not locate ${path}`)
  return readFileSync(filePath, 'utf8')
}

const productForm = readPage('products/ProductForm.vue')
const inquiryCreate = readPage('inquiries/InquiryCreate.vue')

describe('Company form accessibility contracts', () => {
  it('associates product editor labels with static and dynamic fields', () => {
    for (const id of ['product-title','product-short-description','product-description','product-sku','product-brand','product-model','product-category','product-subcategory','product-visibility']) {
      expect(productForm).toContain(id)
    }
    expect(productForm).toContain(':for="\'product-spec-\' + field.key"')
    expect(productForm).toContain(':inputId="\'product-spec-\' + field.key"')
    expect(productForm).toContain(':inputId="\'price-min-\' + index"')
    expect(productForm).toContain(':inputId="\'price-value-\' + index"')
  })

  it('associates inquiry creation labels and names icon-only row actions', () => {
    for (const id of ['inquiry-title','inquiry-description','inquiry-product','inquiry-quantity','inquiry-item-description','inquiry-visibility','inquiry-priority','inquiry-deadline','inquiry-publish-date']) {
      expect(inquiryCreate).toContain(id)
    }
    expect(inquiryCreate).toContain(':aria-label="\'حذف قلم \' + (index + 1)"')
    expect(inquiryCreate).toContain('min-height: 2.75rem')
  })
})
