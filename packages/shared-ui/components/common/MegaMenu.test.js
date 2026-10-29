import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}))

import MegaMenu from './MegaMenu.vue'

describe('MegaMenu', () => {
  beforeEach(() => {
    routerPush.mockReset()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('opens the menu and navigates to the selected category using the existing route contract', async () => {
    const wrapper = mount(MegaMenu, {
      attachTo: document.body,
      props: {
        categories: [
          {
            id: 12,
            slug: 'fiber-optics',
            nameFa: 'فیبر نوری',
            subcategories: [{ id: 13, slug: 'cables', nameFa: 'کابل' }],
          },
        ],
      },
    })

    await wrapper.find('.mega-trigger').trigger('click')
    expect(wrapper.find('.mega-dropdown').isVisible()).toBe(true)

    await wrapper.find('.mega-cat-item').trigger('click')
    await flushPromises()

    expect(routerPush).toHaveBeenCalledWith({
      name: 'products',
      query: { category: 'fiber-optics' },
    })
    wrapper.unmount()
  })

  it('closes when a click occurs outside the menu', async () => {
    const wrapper = mount(MegaMenu, {
      attachTo: document.body,
      props: { categories: [{ id: 1, slug: 'network', nameFa: 'شبکه', subcategories: [] }] },
    })

    await wrapper.find('.mega-trigger').trigger('click')
    expect(wrapper.find('.mega-dropdown').isVisible()).toBe(true)

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(wrapper.find('.mega-dropdown').isVisible()).toBe(false)
    wrapper.unmount()
  })
})
