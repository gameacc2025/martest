import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from './EmptyState.vue'

/**
 * EmptyState is the "you can fill this" surface (first product, first order).
 *
 * Behaviours under test:
 *   - caller-supplied icon/title/description are actually rendered (these are
 *     the calls to action the user reads to recover from an empty list),
 *   - action buttons arrive via the default slot (the recovery path),
 *   - it renders the tone/size classes so design tokens style it correctly,
 *   - a title-less render does not leave an empty <h3> behind.
 */
function mountEmptyState(props = {}, slots = {}) {
  // StateDisplay is a local import (not globally registered), so it renders
  // for real — the assertions below cover the composed whole, not a stub.
  return mount(EmptyState, { props, slots })
}

describe('EmptyState', () => {
  it('renders the provided title and description', () => {
    const wrapper = mountEmptyState({
      icon: 'pi pi-box',
      title: 'No products yet',
      description: 'Add your first product to start selling.',
    })

    expect(wrapper.find('h3.state-display-title').text()).toBe('No products yet')
    expect(wrapper.find('p.state-display-desc').text()).toBe(
      'Add your first product to start selling.',
    )
    expect(wrapper.find('i.pi.pi-box').exists()).toBe(true)
  })

  it('defaults to the Persian label when no title is supplied', () => {
    const wrapper = mountEmptyState({ description: '' })
    expect(wrapper.find('h3.state-display-title').text()).not.toBe('')
  })

  it('renders recovery actions projected through the default slot', () => {
    const wrapper = mountEmptyState(
      { title: 'Cart is empty' },
      { default: '<button type="button" class="shop-now">Shop now</button>' },
    )

    const action = wrapper.find('.state-display-actions .shop-now')
    expect(action.exists()).toBe(true)
    expect(action.text()).toBe('Shop now')
  })

  it('omits the description element when none is given', () => {
    const wrapper = mountEmptyState({ title: 'Nothing here', description: '' })
    expect(wrapper.find('.state-display-desc').exists()).toBe(false)
  })

  it('applies the primary tone and size classes for token styling', () => {
    const wrapper = mountEmptyState({ size: 'lg' })
    const root = wrapper.find('.state-display')
    expect(root.classes()).toContain('state-display--primary')
    expect(root.classes()).toContain('state-display--lg')
  })
})