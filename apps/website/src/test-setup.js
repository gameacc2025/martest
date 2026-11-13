import { beforeEach } from 'vitest'
import { config } from '@vue/test-utils'
import { createPinia } from 'pinia'

beforeEach(() => {
  config.global.plugins = [createPinia()]
  config.global.stubs = {
    RouterLink: {
      props: ['to'],
      template: '<a :href="typeof to === \'string\' ? to : to?.name"><slot /></a>',
    },
    RouterView: { template: '<div><slot /></div>' },
  }
})
