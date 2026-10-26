import { describe, expect, it } from 'vitest'
import { canEdit, canSubmitForReview } from './product'

describe('company product lifecycle actions', () => {
  it('allows draft and rejected products to be submitted for review', () => {
    expect(canSubmitForReview({ status: 'DRAFT' })).toBe(true)
    expect(canSubmitForReview({ status: 'REJECTED' })).toBe(true)
    expect(canSubmitForReview({ status: 'PENDING_REVIEW' })).toBe(false)
  })

  it('keeps products locked only while pending review or archived', () => {
    expect(canEdit({ status: 'REJECTED' })).toBe(true)
    expect(canEdit({ status: 'PUBLISHED' })).toBe(true)
    expect(canEdit({ status: 'PENDING_REVIEW' })).toBe(false)
    expect(canEdit({ status: 'ARCHIVED' })).toBe(false)
  })
})
