import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPageLoadingController } from './pageLoading'

function createDocumentStub() {
  const attributes = new Map()
  const classes = new Set()
  const overlay = {
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    },
    setAttribute: (name, value) => attributes.set(name, value),
    getAttribute: (name) => attributes.get(name),
  }
  const app = {
    setAttribute: (name, value) => attributes.set(`app:${name}`, value),
    getAttribute: (name) => attributes.get(`app:${name}`),
  }

  return {
    overlay,
    app,
    getElementById: (id) => (id === 'page-loading' ? overlay : id === 'app' ? app : null),
  }
}

describe('page loading controller', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-07T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the fiber loader visible for its minimum display time', () => {
    const documentRef = createDocumentStub()
    const loading = createPageLoadingController({ documentRef, minimumVisibleMs: 420 })

    loading.hide()
    vi.advanceTimersByTime(419)
    expect(documentRef.overlay.classList.contains('is-hidden')).toBe(false)

    vi.advanceTimersByTime(1)
    expect(documentRef.overlay.classList.contains('is-hidden')).toBe(true)
    expect(documentRef.overlay.getAttribute('aria-hidden')).toBe('true')
    expect(documentRef.app.getAttribute('aria-busy')).toBe('false')
  })

  it('cancels a pending hide when another route starts loading', () => {
    const documentRef = createDocumentStub()
    const loading = createPageLoadingController({ documentRef, minimumVisibleMs: 420 })

    loading.hide()
    vi.advanceTimersByTime(200)
    loading.show()
    vi.advanceTimersByTime(500)

    expect(documentRef.overlay.classList.contains('is-hidden')).toBe(false)
    expect(documentRef.overlay.getAttribute('aria-hidden')).toBe('false')
    expect(documentRef.app.getAttribute('aria-busy')).toBe('true')

    loading.hide()
    vi.advanceTimersByTime(420)
    expect(documentRef.overlay.classList.contains('is-hidden')).toBe(true)
  })

  it('can hide immediately after a route loading error', () => {
    const documentRef = createDocumentStub()
    const loading = createPageLoadingController({ documentRef })

    loading.hide({ immediate: true })
    vi.runOnlyPendingTimers()

    expect(documentRef.overlay.classList.contains('is-hidden')).toBe(true)
  })
})
