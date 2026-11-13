import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { getProfile, updateProfile, changePassword, uploadAvatar, logout, routerPush } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  uploadAvatar: vi.fn(),
  logout: vi.fn(),
  routerPush: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}))

vi.mock('../../stores/auth', () => ({
  useAuthStore: () => ({ getProfile, updateProfile, changePassword, uploadAvatar, logout }),
}))

import UserProfile from './UserProfile.vue'

describe('Website account profile workspace', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    getProfile.mockResolvedValue({
      user: { id: 4, email: 'buyer@example.com', phone: '09120000000', createdAt: '2026-01-01T00:00:00.000Z' },
      profile: { firstName: 'مریم', lastName: 'احمدی' },
      accessProfile: { type: 'CUSTOMER' },
      roles: ['CUSTOMER_USER'],
    })
    updateProfile.mockResolvedValue({ success: true })
    changePassword.mockResolvedValue({ success: true })
    uploadAvatar.mockResolvedValue({ success: true })
    logout.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountPage() {
    wrapper = mount(UserProfile, {
      global: {
        stubs: {
          WorkspacePageHeading: {
            props: ['title', 'description', 'headingId'],
            template: '<header><h1 :id="headingId">{{ title }}</h1><slot name="actions" /></header>',
          },
          Card: { template: '<section><slot name="title" /><slot name="content" /></section>' },
          Breadcrumb: true,
          Button: {
            inheritAttrs: false,
            props: ['label', 'icon'],
            emits: ['click'],
            template: '<button v-bind="$attrs" type="button" @click="$emit(\'click\')">{{ label }}</button>',
          },
          Dialog: {
            props: ['visible', 'header'],
            template: '<div v-if="visible" role="dialog"><h2>{{ header }}</h2><slot /></div>',
          },
          InputText: { inheritAttrs: false, props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
          Password: { inheritAttrs: false, props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
          Tabs: { props: ['value'], emits: ['update:value'], template: '<div><slot /></div>' },
          TabList: { template: '<div><slot /></div>' },
          Tab: { props: ['value'], template: '<button type="button"><slot /></button>' },
          TabPanels: { template: '<div><slot /></div>' },
          TabPanel: { props: ['value'], template: '<div><slot /></div>' },
          FileUpload: { template: '<button type="button">انتخاب تصویر</button>' },
        },
      },
    })
    return wrapper
  }

  it('renders API-backed identity and account details without placeholder counts or broken avatar URLs', async () => {
    mountPage()
    await flushPromises()

    expect(getProfile).toHaveBeenCalledOnce()
    expect(wrapper.find('.profile-identity h2').text()).toBe('مریم احمدی')
    expect(wrapper.find('.profile-email').text()).toBe('buyer@example.com')
    expect(wrapper.find('.profile-type').text()).toContain('کاربر عادی')
    expect(wrapper.find('.profile-avatar-fallback').text()).toBe('م')
    expect(wrapper.find('.profile-avatar').exists()).toBe(false)
    expect(wrapper.findAll('.profile-detail-row')).toHaveLength(5)
    expect(wrapper.text()).toContain('09120000000')
    expect(wrapper.text()).not.toContain('0 اعلان')
  })

  it('opens the existing profile editor from the primary account action', async () => {
    mountPage()
    await flushPromises()

    await wrapper.find('.profile-primary-actions button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').text()).toContain('ویرایش پروفایل')
    expect(wrapper.find('#profile-first-name').exists()).toBe(true)
    expect(wrapper.find('#profile-last-name').exists()).toBe(true)
  })

  it('shows a retryable error state when the profile API cannot be loaded', async () => {
    getProfile.mockRejectedValueOnce(new Error('offline'))
    mountPage()
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('offline')
    getProfile.mockResolvedValueOnce({
      user: { email: 'buyer@example.com' },
      profile: { firstName: 'مریم', lastName: 'احمدی' },
      accessProfile: { type: 'CUSTOMER' },
      roles: ['CUSTOMER_USER'],
    })
    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(getProfile).toHaveBeenCalledTimes(2)
    expect(wrapper.find('.profile-identity h2').text()).toBe('مریم احمدی')
  })
  it('does not submit an empty profile name to the backend', async () => {
    mountPage()
    await flushPromises()
    await wrapper.find('.profile-primary-actions button').trigger('click')
    await flushPromises()

    await wrapper.find('#profile-first-name').setValue(' ')
    await wrapper.find('#profile-last-name').setValue('احمدی')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(updateProfile).not.toHaveBeenCalled()
    expect(wrapper.find('[role="alert"]').text()).toContain('نام و نام خانوادگی الزامی است')
  })

  it('validates password length and confirmation before calling the API', async () => {
    mountPage()
    await flushPromises()
    await wrapper.findAll('.profile-primary-actions button')[1].trigger('click')
    await flushPromises()

    const fields = wrapper.findAll('[role="dialog"] input')
    await fields[0].setValue('old-password')
    await fields[1].setValue('short')
    await fields[2].setValue('short')
    await wrapper.find('[role="dialog"] form').trigger('submit')
    await flushPromises()

    expect(changePassword).not.toHaveBeenCalled()
    expect(wrapper.find('[role="alert"]').text()).toContain('حداقل ۸ نویسه')
  })

})
