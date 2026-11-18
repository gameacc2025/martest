import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Loading from './Loading.vue';

describe('shared Loading component', () => {
  it('renders a text-free fullscreen fiber optic loader', () => {
    const wrapper = mount(Loading, { props: { fullscreen: true } });

    expect(wrapper.find('.fiber-loader-svg').exists()).toBe(true);
    expect(wrapper.find('.app-loading-text').exists()).toBe(false);
    expect(wrapper.attributes('aria-label')).toBe('در حال بارگذاری');
  });

  it('keeps optional status text on inline loaders', () => {
    const wrapper = mount(Loading, { props: { text: 'در حال دریافت اطلاعات' } });

    expect(wrapper.find('.inline-fiber-spinner').exists()).toBe(true);
    expect(wrapper.find('.app-loading-text-sm').text()).toBe('در حال دریافت اطلاعات');
  });
});
