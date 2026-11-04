import { describe, it, expect, vi, afterEach } from 'vitest'
import HttpRequest from './HttpRequest.js'

/**
 * Regression tests for HttpRequest.execute()'s abort/timeout handling.
 *
 * These tests exist because the existing suite stubs `fetch` with an already
 * fully-buffered `Response`, which hides a real-network race: after `fetch()`
 * resolves the response BODY is still a live stream. If `execute()` aborts its
 * AbortController at that point (as it used to do via cleanup() in `finally`),
 * the stream is errored and the later `response.json()` rejects with
 * AbortError — surfacing to callers as
 * "Failed to parse response: Failed to parse response as json".
 *
 * To reproduce faithfully the stub `fetch` returns a Response backed by a
 * ReadableStream that is only delivered on the next macrotask, and that errors
 * when the request signal aborts.
 */

afterEach(() => {
  vi.unstubAllGlobals()
})

/** A Response whose body is still "in flight" and reacts to the abort signal. */
function streamingJsonResponse(payload, signal) {
  const encoder = new TextEncoder()
  const body = new ReadableStream({
    start(controller) {
      signal?.addEventListener('abort', () => {
        controller.error(new DOMException('The operation was aborted.', 'AbortError'))
      })

      setTimeout(() => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(payload)))
          controller.close()
        } catch {
          /* stream already errored/closed — ignore */
        }
      }, 0)
    },
  })

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('HttpRequest.execute()', () => {
  it('does not abort the response body after fetch resolves', async () => {
    vi.stubGlobal('fetch', (_url, options) =>
      Promise.resolve(streamingJsonResponse({ data: [1, 2, 3] }, options?.signal)),
    )

    const request = new HttpRequest({
      url: 'http://localhost/api/v1/categories',
      method: 'GET',
    })

    const response = await request.execute()

    // Previously threw AbortError because execute() aborted the stream in
    // its `finally` block before the body was read.
    await expect(response.json()).resolves.toEqual({ data: [1, 2, 3] })
  })

  it('still aborts an in-flight request when the timeout fires', async () => {
    vi.stubGlobal(
      'fetch',
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        }),
    )

    const request = new HttpRequest({
      url: 'http://localhost/api/v1/slow',
      method: 'GET',
      timeout: 10,
    })

    await expect(request.execute()).rejects.toMatchObject({ name: 'AbortError' })
  })
})
