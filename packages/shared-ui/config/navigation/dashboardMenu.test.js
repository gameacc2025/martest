import { describe, expect, it } from 'vitest'
import { dashboardMenu } from './dashboardMenu.js'

describe('dashboard navigation roadmap entries', () => {
  const plannedItems = dashboardMenu
    .filter((section) => section.section === 'ماژول‌های آینده')
    .flatMap((section) => section.items)

  it('keeps future modules explicitly planned and without operational routes', () => {
    expect(plannedItems.length).toBeGreaterThanOrEqual(8)
    for (const item of plannedItems) {
      expect(item.planned).toBe(true)
      expect(item.route).toBeUndefined()
      expect(item.external).not.toBe(true)
      expect(item.badge?.value).toBe('آینده')
    }
  })

  it('covers the agreed enterprise domains without inventing endpoints', () => {
    const titles = plannedItems.map((item) => item.title).join(' ')
    for (const domain of ['مالی', 'فروش خرده‌فروشی', 'منابع انسانی', 'تدارکات', 'لجستیک', 'پروژه‌ها', 'BI', 'امنیت', 'تقویم', 'اسناد', 'ارتباطات', 'مرکز دانش', 'ممیزی']) {
      expect(titles).toContain(domain)
    }
  })

  it('exposes permission-gated B2C oversight and Company retail routes while keeping Finance disabled', () => {
    const flatten = (items) => items.flatMap((item) => [item, ...flatten(item.children || [])])
    const allItems = flatten(dashboardMenu.flatMap((section) => section.items))
    const activeItems = new Map(allItems.filter((item) => item.route).map((item) => [item.route, item]))

    expect(activeItems.get('admin-retail-orders')?.permission).toBe('retail.admin.read')
    expect(activeItems.get('company-retail-orders')?.permission).toBe('retail.orders.read')
    expect(activeItems.get('company-retail-inventory')?.permission).toBe('retail.inventory.read')
    for (const route of [
      'admin-finance',
      'admin-finance-settlements',
      'admin-finance-transactions',
      'admin-finance-invoices',
      'company-finance-settlements',
    ]) {
      expect(activeItems.has(route)).toBe(false)
    }
    for (const section of ['مالی', 'مالی شرکت']) {
      expect(dashboardMenu.some((entry) => entry.section === section)).toBe(false)
    }
  })

  it('limits internal HR and integration/security roadmap items to platform staff', () => {
    const hr = plannedItems.find((item) => item.title.includes('منابع انسانی'))
    const security = plannedItems.find((item) => item.title.includes('یکپارچه‌سازی'))
    expect(hr.roles).toEqual(['SUPER_ADMIN', 'ADMIN', 'MODERATOR'])
    expect(security.roles).toEqual(['SUPER_ADMIN', 'ADMIN', 'MODERATOR'])
  })
})
