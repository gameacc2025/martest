import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Pagination from './Pagination.vue'

/**
 * Pagination wraps PrimeVue's <Paginator>.
 *
 * The behaviours that actually matter:
 *   1. It disappears for a single page (no useless controls in lists of <10).
 *   2. PrimeVue speaks 0-based `page` events; this component's public contract
 *      (what every list binds to) is 1-based `update:currentPage`.
 *   3. `first` (the 0-based row offset PrimeVue expects) is derived, never
 *      stored, so it stays correct when props change.
 *
 * <Paginator> is replaced with a controllable stub driven from the test,
 * because the production component is a third-party widget whose internals
 * are not our contract — the conversion above is.
 */

const PaginatorStub = {
  name: 'Paginator',
  props: {
    first: { type: Number, default: 0 },
    rows: { type: Number, default: 0 },
    totalRecords: { type: Number, default: 0 },
    template: { type: String, default: '' },
    currentPageReportTemplate: { type: String, default: '' },
  },
  emits: ['page'],
  template: '<div class="paginator-stub" />',
}

function mountPagination(props = {}) {
  return mount(Pagination, {
    props: {
      currentPage: 1,
      totalPages: 3,
      totalItems: 30,
      itemsPerPage: 10,
      ...props,
    },
    global: { stubs: { Paginator: PaginatorStub } },
  })
}

describe('Pagination', () => {
  it('renders no controls when there is a single page', () => {
    const wrapper = mountPagination({ totalPages: 1, totalItems: 4 })
    expect(wrapper.findComponent(PaginatorStub).exists()).toBe(false)
  })

  it('renders no controls when there are no pages', () => {
    const wrapper = mountPagination({ totalPages: 0, totalItems: 0 })
    expect(wrapper.findComponent(PaginatorStub).exists()).toBe(false)
  })

  it('passes the derived 0-based row offset and page size to the paginator', () => {
    const wrapper = mountPagination({ currentPage: 3, itemsPerPage: 25, totalItems: 70 })
    const paginator = wrapper.findComponent(PaginatorStub)
    expect(paginator.exists()).toBe(true)
    expect(paginator.props('first')).toBe(50) // (3 - 1) * 25
    expect(paginator.props('rows')).toBe(25)
    expect(paginator.props('totalRecords')).toBe(70)
  })

  it('converts the paginator 0-based page event to 1-based update:currentPage', () => {
    const wrapper = mountPagination({ currentPage: 2, itemsPerPage: 10 })
    wrapper.findComponent(PaginatorStub).vm.$emit('page', { page: 5 })

    const emitted = wrapper.emitted('update:currentPage')
    expect(emitted).toHaveLength(1)
    expect(emitted[0]).toEqual([6])
  })

  it('recomputes the row offset when currentPage changes', async () => {
    const wrapper = mountPagination({ currentPage: 1, itemsPerPage: 20 })
    expect(wrapper.findComponent(PaginatorStub).props('first')).toBe(0)

    await wrapper.setProps({ currentPage: 4 })
    expect(wrapper.findComponent(PaginatorStub).props('first')).toBe(60)
  })

  it('keeps totalPages > 1 controls visible while data is empty', () => {
    // An empty page out of several still needs navigation backwards.
    const wrapper = mountPagination({ currentPage: 3, totalPages: 3, totalItems: 0 })
    expect(wrapper.findComponent(PaginatorStub).exists()).toBe(true)
    expect(wrapper.findComponent(PaginatorStub).props('totalRecords')).toBe(0)
  })
})