import { describe, expect, it } from 'vitest'
import { canSubmitInquiryResponse } from './inquiryResponseActions.js'

describe('canSubmitInquiryResponse', () => {
  it('allows a supplier without an existing response while the inquiry is open and before deadline', () => {
    expect(canSubmitInquiryResponse({ isOpen: true, deadlinePassed: false, isBuyer: false, existingResponse: null })).toBe(true)
  })

  it('blocks resubmission when an existing response was withdrawn', () => {
    expect(canSubmitInquiryResponse({ isOpen: true, deadlinePassed: false, isBuyer: false, existingResponse: { status: 'WITHDRAWN' } })).toBe(false)
  })

  it('blocks duplicate submissions for a pending or decided response', () => {
    for (const status of ['PENDING', 'SELECTED', 'REJECTED']) {
      expect(canSubmitInquiryResponse({ isOpen: true, deadlinePassed: false, isBuyer: false, existingResponse: { status } })).toBe(false)
    }
  })

  it('blocks closed, expired, deadline-passed and buyer-owned inquiries', () => {
    expect(canSubmitInquiryResponse({ isOpen: false, deadlinePassed: false, isBuyer: false })).toBe(false)
    expect(canSubmitInquiryResponse({ isOpen: true, deadlinePassed: true, isBuyer: false })).toBe(false)
    expect(canSubmitInquiryResponse({ isOpen: true, deadlinePassed: false, isBuyer: true })).toBe(false)
  })
})
