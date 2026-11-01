import { describe, expect, it } from 'vitest'
import { getInquiryDateWindowError, INQUIRY_DATE_WINDOW_ERRORS as errors } from './inquiryDateWindow.js'

const now = new Date('2026-11-01T10:00:00.000Z')

describe('getInquiryDateWindowError', () => {
  it('allows an immediate inquiry without a response deadline', () => {
    expect(getInquiryDateWindowError({ now })).toBeNull()
  })

  it('allows a future deadline when publishing immediately', () => {
    expect(getInquiryDateWindowError({
      responseDeadline: '2026-11-01T11:00:00.000Z',
      now,
    })).toBeNull()
  })

  it('rejects a deadline equal to or earlier than now', () => {
    expect(getInquiryDateWindowError({
      responseDeadline: '2026-11-01T10:00:00.000Z',
      now,
    })).toBe(errors.DEADLINE_NOT_FUTURE)
    expect(getInquiryDateWindowError({
      responseDeadline: '2026-11-01T09:59:59.000Z',
      now,
    })).toBe(errors.DEADLINE_NOT_FUTURE)
  })

  it('requires a scheduled publish date to precede the response deadline', () => {
    expect(getInquiryDateWindowError({
      publishDate: '2026-11-01T12:00:00.000Z',
      responseDeadline: '2026-11-01T12:00:00.000Z',
      now,
    })).toBe(errors.DEADLINE_NOT_AFTER_PUBLISH)
    expect(getInquiryDateWindowError({
      publishDate: '2026-11-01T13:00:00.000Z',
      responseDeadline: '2026-11-01T12:00:00.000Z',
      now,
    })).toBe(errors.DEADLINE_NOT_AFTER_PUBLISH)
  })

  it('rejects malformed persisted draft date values', () => {
    expect(getInquiryDateWindowError({ publishDate: 'not-a-date', now })).toBe(errors.INVALID_PUBLISH_DATE)
    expect(getInquiryDateWindowError({ responseDeadline: 'not-a-date', now })).toBe(errors.INVALID_RESPONSE_DEADLINE)
  })

  it('allows a scheduled publication only when the deadline remains in the future and after publication', () => {
    expect(getInquiryDateWindowError({
      publishDate: '2026-11-01T12:00:00.000Z',
      responseDeadline: '2026-11-01T14:00:00.000Z',
      now,
    })).toBeNull()
  })
})
