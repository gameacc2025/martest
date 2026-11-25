import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  permissions: new Set(),
  dashboard: vi.fn(),
  listSources: vi.fn(),
  listLeads: vi.fn(),
  listAccounts: vi.fn(),
  listPipelines: vi.fn(),
  listOpportunities: vi.fn(),
  listTasks: vi.fn(),
  listActivities: vi.fn(),
}))

vi.mock('../../../stores/auth', () => ({
  useAuthStore: () => ({
    hasPermission: (permission) => mocks.permissions.has(permission),
  }),
}))

vi.mock('@telecom/api-client', () => ({
  crmApi: {
    dashboard: mocks.dashboard,
    listSources: mocks.listSources,
    listLeads: mocks.listLeads,
    listAccounts: mocks.listAccounts,
    listPipelines: mocks.listPipelines,
    listOpportunities: mocks.listOpportunities,
    listTasks: mocks.listTasks,
    listActivities: mocks.listActivities,
  },
}))

import CRMWorkspace from './CRMWorkspace.vue'

function mountWorkspace(section) {
  return mount(CRMWorkspace, { props: { section } })
}

describe('Admin CRM permission-gated workspace actions', () => {
  beforeEach(() => {
    mocks.permissions = new Set()
    mocks.dashboard.mockReset().mockResolvedValue({ data: { data: {} } })
    mocks.listSources.mockReset().mockResolvedValue({ data: [] })
    mocks.listLeads.mockReset().mockResolvedValue({ data: { data: [], meta: { total: 0, page: 1, limit: 25, totalPages: 0 } } })
    mocks.listAccounts.mockReset().mockResolvedValue({ data: { data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } } })
    mocks.listPipelines.mockReset().mockResolvedValue({ data: [] })
    mocks.listOpportunities.mockReset().mockResolvedValue({ data: [] })
    mocks.listTasks.mockReset().mockResolvedValue({ data: [] })
    mocks.listActivities.mockReset().mockResolvedValue({ data: [] })
  })

  it('shows lead-source management only with crm.sources.manage', async () => {
    mocks.permissions.add('crm.sources.manage')
    const wrapper = mountWorkspace('leads')
    await flushPromises()

    expect(wrapper.get('h1').text()).toContain('سرنخ‌های فروش')
    expect(wrapper.get('button').exists()).toBe(true)
    expect(wrapper.text()).toContain('مدیریت منابع')
  })

  it('shows account creation only with account create/update permission', async () => {
    mocks.permissions.add('crm.accounts.create')
    const wrapper = mountWorkspace('accounts')
    await flushPromises()

    expect(wrapper.text()).toContain('ایجاد حساب')
    expect(wrapper.findAll('button').some(button => button.text().includes('ایجاد حساب'))).toBe(true)
  })

  it('shows opportunity creation only with opportunity create/update permission', async () => {
    mocks.permissions.add('crm.opportunities.create')
    mocks.listPipelines.mockResolvedValueOnce({
      data: [{ id: 3, name: 'Main', isDefault: true, stages: [{ id: 10, label: 'New', isWon: false, isLost: false }] }],
    })
    const wrapper = mountWorkspace('pipeline')
    await flushPromises()

    expect(wrapper.text()).toContain('ایجاد فرصت')
    expect(wrapper.findAll('button').some(button => button.text().includes('ایجاد فرصت'))).toBe(true)
  })

  it('does not expose privileged management actions without permissions', async () => {
    const wrapper = mountWorkspace('leads')
    await flushPromises()

    expect(wrapper.text()).not.toContain('مدیریت منابع')
    expect(wrapper.text()).not.toContain('ثبت سرنخ جدید')
  })
})
