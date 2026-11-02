import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Table from './Table.vue'

const PrimeTableStub = {
  name: 'DataTable',
  props: {
    value: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
  },
  template: '<div class="prime-table-stub" :data-loading="String(loading)"><slot /><slot name="empty" /></div>',
}

const ColumnStub = {\n  name: 'Column',\n  props: ['field', 'header', 'sortable'],\n  template: '<div class="column-stub" :data-field="field" :data-header="header" :data-sortable="String(sortable)" />',\n}\n\nfunction mountTable(props = {}) {
  return mount(Table, {
    props: {
      columns: [{ key: 'name', label: 'نام' }],
      rows: [{ id: 1, name: 'روتر سازمانی' }],
      ...props,
    },
    global: {
      stubs: {
        DataTable: PrimeTableStub,
        Column: ColumnStub,
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

    expect(wrapper.findAll('.column-stub')).toHaveLength(2)\n    expect(wrapper.findAll('.column-stub')[0].attributes('data-field')).toBe('name')\n    expect(wrapper.findAll('.column-stub')[1].attributes('data-header')).toBe('وضعیت')
  })
})
