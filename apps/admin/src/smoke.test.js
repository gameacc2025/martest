import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { setAuthRouter } from '@telecom/auth'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import MultiSelect from 'primevue/multiselect'
import InputSwitch from 'primevue/inputswitch'
import Select from 'primevue/select'
import Card from 'primevue/card'
import Panel from 'primevue/panel'
import Toolbar from 'primevue/toolbar'
import Textarea from 'primevue/textarea'
import Password from 'primevue/password'
import Badge from 'primevue/badge'
import Paginator from 'primevue/paginator'
import ProgressSpinner from 'primevue/progressspinner'
import ToggleSwitch from 'primevue/toggleswitch'
import Checkbox from 'primevue/checkbox'
import ConfirmDialog from 'primevue/confirmdialog'
import Message from 'primevue/message'
import Avatar from 'primevue/avatar'
import Tooltip from 'primevue/tooltip'
import { theme as TelecomPreset } from '@telecom/shared-ui'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

/**
 * ADMIN APP SMOKE TEST — see TESTING.md for the full do/don't list.
 *
 * Verifies: with the SAME plugin + global-component wiring main.js uses
 * (pinia, router, PrimeVue, toast/confirmation services, component registry),
 * the app boots at its real root gate, renders the matched route, applies
 * route-meta titles, and performs a client-side guarded navigation — with
 * every HTTP call intercepted at the fetch boundary.
 *
 * Does NOT verify: visual styling (stylesheet layer not loaded), real API
 * data, session handoff flows, other routes, or cross-browser behaviour.
 */

const appComponents = {
  Button, InputText, DataTable, Column, Tag, Dialog, MultiSelect,
  InputSwitch, Select, Card, Panel, Toolbar, Textarea, Password, Badge,
  Paginator, ProgressSpinner, ToggleSwitch, Checkbox, ConfirmDialog, Message, Avatar,
}

let pinia
let fetchMock
let warnings

beforeEach(async () => {
  vi.unstubAllGlobals()
  localStorage.clear()
  window.sessionStorage.clear()
  setActivePinia(createPinia())
  pinia = undefined
  setAuthRouter(null) // isolate boot rendering from browser-exit redirects

  // Deterministic network: empty envelopes for whatever the boot path calls.
  fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)

  // Surface any component-resolution problem as a failure condition.
  warnings = []
  for (const level of ['warn', 'error']) {
    const original = console[level]
    console[level] = (...args) => {
      const text = String(args[0])
      if (/Failed to resolve component|Unhandled error|Cannot read/.test(text)) {
        warnings.push(text)
      }
      return original.apply(console, args)
    }
  }
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function mountApp() {
  pinia = pinia || createPinia()
  setActivePinia(pinia)
  return mount(App, {
    global: {
      plugins: [
        pinia,
        router,
        [PrimeVue, {
          theme: { preset: TelecomPreset, options: { darkModeSelector: '.app-dark' } },
          rtl: true,
          inputStyle: 'outlined',
        }],
        ToastService,
        ConfirmationService,
      ],
      components: appComponents,
      directives: { tooltip: Tooltip },
    },
  })
}

describe('admin app boot smoke', () => {
  it('boots at the root gate, titles the page, and only talks to the stubbed network', async () => {
    await router.replace('/')

    const wrapper = mountApp()
    await flushPromises()

    // Root gate renders for an anonymous visitor (never the public layout).
    expect(wrapper.find('.landing-gate').exists()).toBe(true)
    expect(wrapper.find('.landing-gate i.pi-spinner').exists()).toBe(true)
    expect(wrapper.find('router-view').exists()).toBe(false) // consumed by the gate

    // Route meta reached the document title (guard ran during boot).
    expect(document.title).toContain('پنل مدیریت')
    expect(document.title).toContain('Telecom Marketplace')

    // The boot path really evaluated the session offline (logout attempt),
    // entirely inside the fetch stub — no external host was reachable.
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/auth/logout'))).toBe(true)

    expect(warnings).toEqual([])
    wrapper.unmount()
  })

  it('performs a guarded client-side navigation and renders the target page', async () => {
    const wrapper = mountApp()
    await flushPromises()

    await router.push('/forgot-password')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('forgot-password')
    expect(wrapper.find('.forgot-password-page').exists()).toBe(true)
    // Form pieces resolve through the main.js registry (Card/InputText/Button).
    expect(wrapper.find('.fp-title').exists()).toBe(true)
    expect(wrapper.find('form.fp-form').exists()).toBe(true)
    expect(document.title).toContain('فراموشی رمز عبور')

    expect(warnings).toEqual([])
    wrapper.unmount()
  })

  it('keeps protected routes out of reach for the anonymous boot session', async () => {
    const store = useAuthStore()
    const wrapper = mountApp()
    await flushPromises()

    await router.push('/admin-users').catch(() => {})
    await flushPromises()

    expect(router.currentRoute.value.name).not.toBe('admin-users')
    expect(store.isAuthenticated).toBe(false)
    wrapper.unmount()
  })
})