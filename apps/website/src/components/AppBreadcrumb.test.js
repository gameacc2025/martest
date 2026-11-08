import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppBreadcrumb from './AppBreadcrumb.vue'

const mountBreadcrumb = items => mount(AppBreadcrumb, {
  props: { items },
  global: {
    stubs: {
      RouterLink: {
        props: ['to'],
        template: '<a :data-route="to.name || to"><slot /></a>',
      },
    },
  },
})

describe('AppBreadcrumb', () => {
  it('renders a semantic RTL breadcrumb with a home link and current page', () => {
    const wrapper = mountBreadcrumb([{ label: 'همه محصولات' }])
    expect(wrapper.get('nav.breadcrumb').attributes('aria-label')).toBe('مسیر راهنما')
    expect(wrapper.get('.breadcrumb-home a').attributes('data-route')).toBe('home')
    expect(wrapper.get('[aria-current="page"]').text()).toBe('همه محصولات')
  })

  it('supports linked parent pages before the current page', () => {
    const wrapper = mountBreadcrumb([
      { label: 'محصولات', to: { name: 'products' } },
      { label: 'روتر فیبر نوری' },
    ])
    expect(wrapper.findAll('.breadcrumb-item')).toHaveLength(3)
    expect(wrapper.findAll('.breadcrumb-item a').map(link => link.text())).toEqual(['صفحه اصلی', 'محصولات'])
    expect(wrapper.get('[aria-current="page"]').text()).toBe('روتر فیبر نوری')
  })
})
