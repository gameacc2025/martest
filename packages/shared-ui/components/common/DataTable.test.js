import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTable from './DataTable.vue'

const PrimeTableStub = {
  name: 'DataTable',
  template: '<div class="prime-table-stub"><slot name="empty" /></div>',
}

function mountTable(props = {}) {
  return mount(DataTable, {
    props: {
      columns: [{ field: 'name', header: 'نام' }],
      rows: [{ id: 1, name: 'اول' }, { id: 2, name: 'دوم' }],
      ...props,
    },
    global: {
      stubs: {
        DataTable: PrimeTableStub,
        Column: true,
        Button: true,
        InputText: true,
        Select: true,
        Skeleton: true,
        Popover: true,
        Checkbox: true,
        Tag: true,
      },
    },
  })
}

describe('DataTable', () => {
  it('shows the number of client-side rows in the table toolbar', () => {
    const wrapper = mountTable()
    expect(wrapper.find('.ent-table-record-count').text()).toContain('۲')
    expect(wrapper.find('.ent-table-record-count').text()).toContain('رکورد')
  })

  it('uses the server total in lazy mode instead of the current page length', () => {
    const wrapper = mountTable({
      lazy: true,
      rows: [{ id: 1, name: 'فقط یک ردیف' }],
      totalRecords: 147,
    })
    expect(wrapper.find('.ent-table-record-count').text()).toContain('۱۴۷')
  })


  it('uses the responsive card layout by default on narrow screens', () => {
    const wrapper = mountTable()
    expect(wrapper.classes()).toContain('ent-table--mobile-cards')
  })

  it('allows a page to retain the classic scroll table layout when required', () => {
    const wrapper = mountTable({ mobileCardLayout: false })
    expect(wrapper.classes()).not.toContain('ent-table--mobile-cards')
  })

  it('uses the filtered client-side result count', async () => {
    const wrapper = mountTable()
    // The search ref is reflected in the computed count; update it through
    // the component's public input model rather than reaching into internals.
    await wrapper.findComponent({ name: 'InputText' }).vm.$emit('update:modelValue', 'اول')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ent-table-record-count').text()).toContain('۱')
  })
})
