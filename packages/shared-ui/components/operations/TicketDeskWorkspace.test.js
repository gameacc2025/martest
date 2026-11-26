import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  listCategories: vi.fn(),
  listTickets: vi.fn(),
  getTicket: vi.fn(),
  createTicket: vi.fn(),
  addMessage: vi.fn(),
  uploadAttachment: vi.fn(),
  downloadAttachment: vi.fn(),
  changeStatus: vi.fn(),
  assignTicket: vi.fn(),
  listQueues: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
}))

vi.mock('@telecom/api-client', () => ({
  supportApi: {
    listCategories: mocks.listCategories,
    listTickets: mocks.listTickets,
    getTicket: mocks.getTicket,
    createTicket: mocks.createTicket,
    addMessage: mocks.addMessage,
    uploadAttachment: mocks.uploadAttachment,
    downloadAttachment: mocks.downloadAttachment,
    changeStatus: mocks.changeStatus,
    assignTicket: mocks.assignTicket,
    listQueues: mocks.listQueues,
  },
}))

import TicketDeskWorkspace from './TicketDeskWorkspace.vue'

const ticketFixture = () => ({
  id: 7,
  ticketNumber: 'SUP-TEST-7',
  subject: 'درخواست آزمایشی',
  status: 'OPEN',
  priority: 'NORMAL',
  createdFrom: 'WEBSITE',
  requesterUserId: 21,
  messages: [],
})

function mountDesk(props = {}) {
  return mount(TicketDeskWorkspace, {
    props: { title: 'پشتیبانی', ...props },
    global: {
      stubs: {
        TemPageHeader: true,
        TemStatCard: true,
        TemStatusPill: true,
      },
    },
  })
}

describe('TicketDeskWorkspace secure attachment journey', () => {
  let wrapper

  beforeEach(() => {
    mocks.listCategories.mockReset().mockResolvedValue({ data: [] })
    mocks.listTickets.mockReset().mockResolvedValue({ data: [ticketFixture()] })
    mocks.getTicket.mockReset().mockResolvedValue({ data: ticketFixture() })
    mocks.createTicket.mockReset()
    mocks.addMessage.mockReset().mockResolvedValue({ data: { id: 55, body: 'پاسخ همراه فایل' } })
    mocks.uploadAttachment.mockReset().mockResolvedValue({ data: { id: 91, originalName: 'evidence.txt' } })
    mocks.downloadAttachment.mockReset()
    mocks.changeStatus.mockReset()
    mocks.assignTicket.mockReset()
    mocks.listQueues.mockReset().mockResolvedValue({ data: [] })
  })

  it('creates a message first and uploads the selected file through the ticket-scoped API', async () => {
    wrapper = mountDesk()
    await flushPromises()

    const file = new File(['support evidence'], 'evidence.txt', { type: 'text/plain' })
    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
    await input.trigger('change')
    await wrapper.get('[aria-label="متن پاسخ"]').setValue('پاسخ همراه فایل')
    await wrapper.get('button.send').trigger('click')
    await flushPromises()

    expect(mocks.addMessage).toHaveBeenCalledWith(7, {
      body: 'پاسخ همراه فایل',
      visibility: 'PUBLIC',
    })
    expect(mocks.uploadAttachment).toHaveBeenCalledTimes(1)
    const [ticketId, messageId, formData] = mocks.uploadAttachment.mock.calls[0]
    expect(ticketId).toBe(7)
    expect(messageId).toBe(55)
    expect(formData).toBeInstanceOf(FormData)
    expect(formData.get('file')).toBe(file)
    expect(wrapper.find('.tm-ticket-desk__selected-files').exists()).toBe(false)
  })

  it('rejects unsupported and over-limit attachments before upload', async () => {
    wrapper = mountDesk()
    await flushPromises()

    const invalid = new File(['executable'], 'payload.exe', { type: 'application/x-msdownload' })
    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', { configurable: true, value: [invalid] })
    await input.trigger('change')

    expect(wrapper.find('[role="alert"]').text()).toContain('PDF')
    expect(mocks.uploadAttachment).not.toHaveBeenCalled()
    expect(wrapper.find('.tm-ticket-desk__selected-files').exists()).toBe(false)
  })

  it('keeps failed attachments queued against the already-created message for a safe retry', async () => {
    mocks.uploadAttachment
      .mockRejectedValueOnce(new Error('Temporary upload failure'))
      .mockResolvedValueOnce({ data: { id: 92 } })
    wrapper = mountDesk()
    await flushPromises()

    const file = new File(['support evidence'], 'evidence.txt', { type: 'text/plain' })
    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
    await input.trigger('change')
    await wrapper.get('[aria-label="متن پاسخ"]').setValue('پاسخ همراه فایل')
    await wrapper.get('button.send').trigger('click')
    await flushPromises()

    expect(mocks.addMessage).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('بارگذاری بعضی پیوست‌ها ناموفق بود')
    await wrapper.get('button.send').trigger('click')
    await flushPromises()

    expect(mocks.addMessage).toHaveBeenCalledTimes(1)
    expect(mocks.uploadAttachment).toHaveBeenCalledTimes(2)
    expect(wrapper.find('.tm-ticket-desk__selected-files').exists()).toBe(false)
  })
})
