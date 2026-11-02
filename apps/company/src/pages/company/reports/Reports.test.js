import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const candidates = [
  resolve(process.cwd(), 'apps/company/src/pages/company/reports/Reports.vue'),
  resolve(process.cwd(), 'src/pages/company/reports/Reports.vue'),
]
const filePath = candidates.find(existsSync)
if (!filePath) throw new Error('Could not locate Reports.vue')
const source = readFileSync(filePath, 'utf8')

describe('Company Reports API states', () => {
  const productsTab = source.slice(
    source.indexOf('<TabPanel value="products">'),
    source.indexOf('<!-- Inquiries Tab -->'),
  )
  const inquiriesTab = source.slice(source.indexOf('<TabPanel value="inquiries">'))

  it('keeps the product API error and retry inside the products tab', () => {
    expect(productsTab).toContain('v-else-if="productsError"')
    expect(productsTab).toContain('@click="fetchProducts"')
    expect(productsTab).not.toContain('inquiriesError')
  })

  it('keeps the inquiry API error and retry inside the inquiries tab', () => {
    expect(inquiriesTab).toContain('v-else-if="inquiriesError"')
    expect(inquiriesTab).toContain('@click="fetchInquiryStats"')
  })

  it('clears each error before retry and retains the existing API methods', () => {
    expect(source).toContain("productsError.value = ''")
    expect(source).toContain("inquiriesError.value = ''")
    expect(source).toContain('productsApi.myProducts({ limit: 500 })')
    expect(source).toContain('inquiriesApi.getStats()')
  })
})
