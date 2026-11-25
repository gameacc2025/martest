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

import { authApi, cmsArticlesApi, crmApi, inquiriesApi } from './apiClient.js'

describe('CRM API body contracts', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.post.mockReset().mockResolvedValue({ data: { success: true } })
    mocks.patch.mockReset()
    mocks.put.mockReset()
    mocks.delete.mockReset()
  })

  it('sends explicit JSON bodies for other command-only POST endpoints', async () => {
    await authApi.logout()
    await authApi.refresh()
    await inquiriesApi.revealResponses(7)
    await cmsArticlesApi.restoreRevision(11, 2)
    await cmsArticlesApi.generatePreviewToken(11)

    expect(mocks.post).toHaveBeenNthCalledWith(1, expect.stringContaining('/auth/logout'), {})
    expect(mocks.post).toHaveBeenNthCalledWith(2, expect.stringContaining('/auth/refresh'), {})
    expect(mocks.post).toHaveBeenNthCalledWith(3, expect.stringContaining('/inquiries/7/reveal'), {})
    expect(mocks.post).toHaveBeenNthCalledWith(4, expect.stringContaining('/cms/articles/manage/11/revisions/2/restore'), {})
    expect(mocks.post).toHaveBeenNthCalledWith(5, expect.stringContaining('/cms/articles/manage/11/preview-token'), {})
  })

  it('sends an explicit empty JSON object for bodyless conversion and completion commands', async () => {
    await crmApi.convertLead(42)
    await crmApi.completeTask(61)

    expect(mocks.post).toHaveBeenNthCalledWith(1, '/crm/leads/42/convert', {})
    expect(mocks.post).toHaveBeenNthCalledWith(2, '/crm/tasks/61/complete', {})
  })
})
