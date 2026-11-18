import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ProductCard from './ProductCard.vue';

const product = {
  id: 42,
  name: 'روتر سازمانی',
  price: 1250000,
  finalPrice: 1250000,
  discount: 0,
  rating: 0,
  reviewsCount: 0,
  company: { name: 'تأمین‌کننده نمونه' },
  specs: {},
};

const mountCard = (props = {}) => mount(ProductCard, {
  props: { product, ...props },
  global: {
    stubs: {
      Card: { template: '<article><slot name="header" /><slot name="content" /><slot name="footer" /></article>' },
      Button: {
        props: ['label', 'ariaLabel'],
        emits: ['click'],
        template: '<button :data-label="label" @click="$emit(\'click\')">{{ label }}</button>',
      },
      Badge: true,
      Rating: true,
    },
  },
});

describe('ProductCard B2C controls', () => {
  it('hides cart and wishlist actions by default', () => {
    const wrapper = mountCard();
    expect(wrapper.find('.product-wishlist').exists()).toBe(false);
    expect(wrapper.find('[data-label="افزودن به سبد"]').exists()).toBe(false);
    expect(wrapper.find('[data-label="مشاهده محصول"]').exists()).toBe(true);
  });

  it('exposes commerce actions only when explicitly enabled for a future phase', () => {
    const wrapper = mountCard({ showCommerceActions: true });
    expect(wrapper.find('.product-wishlist').exists()).toBe(true);
    expect(wrapper.find('[data-label="افزودن به سبد"]').exists()).toBe(true);
  });
});
