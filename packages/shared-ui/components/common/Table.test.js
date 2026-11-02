import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Table from './Table.vue'

const PrimeTableStub = {
  name: 'DataTable',
  props: {
    value: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
  },
  template: '<div class="prime-table-stub" :data-loading="String(loading)"><slot name="empty" /></div>',
}

function mountTable(props = {}) {
  return mount(Table, {
    props: {
      columns: [{ key: 'name', label: 'نام' }],
      rows: [{ id: 1, name: 'روتر سازمانی' }],
      ...props,
    },
    global: {
      stubs: {
        DataTable: PrimeTableStub,
        Column: true,
      },
    },
  })
}

describe('shared Table', () => {
  it('forwards rows and loading state to PrimeVue DataTable', () => {
    const rows = [{ id: 7, name: 'سوییچ شبکه' }]
    const wrapper = mountTable({ rows, loading: true })
    const table = wrapper.findComponent(PrimeTableStub)

    expect(table.props('value')).toEqual(rows)
    expect(table.props('loading')).toBe(true)
    expect(wrapper.find('.ds-table-frame').exists()).toBe(true)
  })

  it('renders the configured empty message in the empty slot', () => {
    const wrapper = mountTable({ rows: [], emptyMessage: 'محصولی برای نمایش نیست' })

    expect(wrapper.text()).toContain('محصولی برای نمایش نیست')
    expect(wrapper.find('.ds-table-empty').exists()).toBe(true)
  })

  it('preserves the existing column configuration contract', () => {
    const wrapper = mountTable({
      columns: [
        { key: 'name', label: 'نام محصول', sortable: true },
        { key: 'status', label: 'وضعیت', slot: 'status' },
      ],
    })

    expect(wrapper.findAllComponents({ name: 'Column' })).toHaveLength(2)
  })
})
