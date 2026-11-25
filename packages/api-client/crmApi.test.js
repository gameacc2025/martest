import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@telecom/shared-core/http/presets/browser.js', () => ({
  default: () => ({
    get: mocks.get,
    post: mocks.post,
    patch: mocks.patch,
    put: mocks.put,
    delete: mocks.delete,
  }),
}))

vi.mock('@telecom/shared-core/http/tokenMemory.js', () => ({
  getAccessToken: () => null,
}))

import { crmApi } from './apiClient.js'

describe('CRM API body contracts', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.post.mockReset().mockResolvedValue({ data: { success: true } })
    mocks.patch.mockReset()
    mocks.put.mockReset()
    mocks.delete.mockReset()
  })

  it('sends an explicit empty JSON object for bodyless conversion and completion commands', async () => {
    await crmApi.convertLead(42)
    await crmApi.completeTask(61)

    expect(mocks.post).toHaveBeenNthCalledWith(1, '/crm/leads/42/convert', {})
    expect(mocks.post).toHaveBeenNthCalledWith(2, '/crm/tasks/61/complete', {})
  })
})
