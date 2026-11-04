import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getAccessToken, setAccessToken, clearAccessToken, onAccessTokenChange } from './tokenMemory.js'

/**
 * The access token lives in JS memory ONLY — never localStorage/sessionStorage.
 * That is a hard security invariant of the app (a reload re-obtains a token via
 * the httpOnly cookie), so these tests fail if anything ever persists it.
 * This suite runs in happy-dom, which provides real Web Storage to write to.
 */

let unsubscribers = []
let storageSnapshots

function snapshotStorage() {
  const dump = (storage) => {
    const out = {}
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i)
      out[key] = storage.getItem(key)
    }
    return out
  }
  return {
    local: dump(window.localStorage),
    session: dump(window.sessionStorage),
  }
}

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  storageSnapshots = snapshotStorage()
})

afterEach(() => {
  // Every test's listener must be detached so tests cannot leak state.
  unsubscribers.forEach((unsub) => unsub())
  unsubscribers = []
  clearAccessToken()
})

function subscribe(fn) {
  const unsub = onAccessTokenChange(fn)
  unsubscribers.push(unsub)
  return unsub
}

describe('memory-only token store', () => {
  it('stores and returns the access token', () => {
    setAccessToken('abc.def.ghi')
    expect(getAccessToken()).toBe('abc.def.ghi')
  })

  it('treats nullish input as "no token"', () => {
    setAccessToken('x')
    setAccessToken(null)
    expect(getAccessToken()).toBeNull()

    setAccessToken('x')
    setAccessToken(undefined)
    expect(getAccessToken()).toBeNull()
  })

  it('clearAccessToken drops the token', () => {
    setAccessToken('x')
    clearAccessToken()
    expect(getAccessToken()).toBeNull()
  })

  it('never writes the token to localStorage or sessionStorage', () => {
    setAccessToken('super-secret-token')

    expect(getAccessToken()).toBe('super-secret-token')
    expect(snapshotStorage()).toEqual(storageSnapshots)

    clearAccessToken()
    expect(snapshotStorage()).toEqual(storageSnapshots)
  })
})

describe('change listeners', () => {
  it('notifies listeners with the new token on every change', () => {
    const seen = []
    subscribe((value) => seen.push(value))

    setAccessToken('t1')
    setAccessToken('t2')
    clearAccessToken()

    expect(seen).toEqual(['t1', 't2', null])
  })

  it('unsubscribing stops future notifications', () => {
    const seen = []
    subscribe((value) => seen.push(value))
    const unsub = onAccessTokenChange((value) => seen.push(`second:${value}`))

    setAccessToken('a')
    unsub()
    setAccessToken('b')

    expect(seen).toEqual(['a', 'second:a', 'b'])
  })

  it('one throwing listener cannot break the others', () => {
    const seen = []
    subscribe(() => {
      throw new Error('listener exploded')
    })
    subscribe((value) => seen.push(value))

    expect(() => setAccessToken('still-works')).not.toThrow()
    expect(seen).toEqual(['still-works'])
    expect(getAccessToken()).toBe('still-works')
  })

  it('notifies immediately on subscribe? no — listeners are change-driven only', () => {
    setAccessToken('preexisting')
    const seen = []
    subscribe((value) => seen.push(value))

    expect(seen).toEqual([])
    setAccessToken('changed')
    expect(seen).toEqual(['changed'])
  })
})