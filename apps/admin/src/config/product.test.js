import { describe, expect, it } from 'vitest'
import {
  canApprove,
  canArchive,
  canHide,
  canPublish,
  canReject,
  canRestoreDraft,
  getAllowedActions,
} from './product'

describe('admin product lifecycle actions', () => {
  it('allows approve/reject only while a product is pending review', () => {
    expect(canApprove({ status: 'PENDING_REVIEW' })).toBe(true)
    expect(canReject({ status: 'PENDING_REVIEW' })).toBe(true)
    expect(canApprove({ status: 'DRAFT' })).toBe(false)
    expect(canReject({ status: 'APPROVED' })).toBe(false)
  })

  it('matches publish and hide actions to backend transitions', () => {
    expect(canPublish({ status: 'APPROVED' })).toBe(true)
    expect(canPublish({ status: 'HIDDEN' })).toBe(true)
    expect(canPublish({ status: 'PENDING_REVIEW' })).toBe(false)
    expect(canHide({ status: 'PUBLISHED' })).toBe(true)
    expect(canHide({ status: 'APPROVED' })).toBe(false)
  })

  it('only exposes archive and restore actions for backend-supported statuses', () => {
    expect(canArchive({ status: 'PENDING_REVIEW' })).toBe(false)
    expect(canArchive({ status: 'PUBLISHED' })).toBe(true)
    expect(canRestoreDraft({ status: 'ARCHIVED' })).toBe(true)
    expect(canRestoreDraft({ status: 'PUBLISHED' })).toBe(false)
    expect(getAllowedActions({ status: 'PUBLISHED' })).toEqual(['hide', 'archive', 'duplicate'])
    expect(getAllowedActions({ status: 'PENDING_REVIEW' })).toEqual(['approve', 'reject', 'restoreDraft', 'duplicate'])
  })
})
