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

  it('ignores stale responses when a newer report refresh has already started', () => {
    expect(source).toContain('let productsRequestId = 0')
    expect(source).toContain('let inquiriesRequestId = 0')
    expect(source).toContain('if (requestId === productsRequestId) products.value = result')
    expect(source).toContain('if (requestId === inquiriesRequestId) inquiryStats.value = data')
    expect(source).toContain('if (requestId === productsRequestId) productsLoading.value = false')
    expect(source).toContain('if (requestId === inquiriesRequestId) inquiriesLoading.value = false')
  })

  it('clears stale report data after the latest request fails', () => {
    expect(source).toContain('products.value = []')
    expect(source).toContain('inquiryStats.value = null')
  })

  it('clears each error before retry and retains the existing API methods', () => {
    expect(source).toContain("productsError.value = ''")
    expect(source).toContain("inquiriesError.value = ''")
    expect(source).toContain('fetchAllPages(')
    expect(source).toContain("sortBy: 'createdAt'")
    expect(source).not.toContain('limit: 500')
    expect(source).toContain('inquiriesApi.getStats()')
    expect(source).toContain('buildInquiryReportKpis(data)')
    expect(source).toContain('INQUIRY_REPORT_STATUSES.map')
    expect(source).toContain('مجموع ارسالی و دریافتی')
  })
})
