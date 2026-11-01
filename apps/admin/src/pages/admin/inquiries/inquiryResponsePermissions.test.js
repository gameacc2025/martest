import { describe, expect, it } from 'vitest'
import { canUseSupplierResponseActions } from './inquiryResponsePermissions.js'

describe('canUseSupplierResponseActions', () => {
  it('allows supplier actions only in COMPANY access context', () => {
    expect(canUseSupplierResponseActions('COMPANY')).toBe(true)
    expect(canUseSupplierResponseActions('STAFF')).toBe(false)
    expect(canUseSupplierResponseActions('CUSTOMER')).toBe(false)
    expect(canUseSupplierResponseActions(null)).toBe(false)
  })
})
