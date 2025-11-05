import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'

type StateMap = Map<string, ReturnType<typeof ref<unknown>>>
const stateMap: StateMap = new Map()
const processStub = process as NodeJS.Process & {
  client?: boolean
  server?: boolean
}

vi.mock('#app', () => ({
  useState: <T>(key: string, init: () => T) => {
    if (!stateMap.has(key)) {
      stateMap.set(key, ref(init()))
    }

    return stateMap.get(key) as ReturnType<typeof ref<T>>
  },
}))

// eslint-disable-next-line import/first
import { useToast } from '~/composables/use-toast'
// eslint-disable-next-line import/first
import ToastContainer from '../ToastContainer.vue'

describe('ToastContainer', () => {
  beforeEach(() => {
    stateMap.clear()
    vi.useFakeTimers()
    processStub.client = true
    processStub.server = false
  })

  it('renders active toasts', async () => {
    const { showToast } = useToast()
    showToast({ intent: 'info', message: '情報です', duration: null })

    const wrapper = mount(ToastContainer, {
      global: {
        stubs: {
          teleport: true,
        },
      },
    })

    await nextTick()

    const container = wrapper.find('[role="region"]')
    expect(container.exists()).toBe(true)
    expect(container.attributes('aria-live')).toBe('assertive')

    const toast = container.find('[role="status"]')
    expect(toast.exists()).toBe(true)
    expect(toast.text()).toContain('情報です')
  })

  it('dismisses toast when close clicked', async () => {
    const { showToast } = useToast()
    showToast({ intent: 'success', message: '完了', duration: null })

    const wrapper = mount(ToastContainer, {
      global: {
        stubs: {
          teleport: true,
        },
      },
    })

    await nextTick()

    const button = wrapper.get('[data-testid="toast-dismiss-button"]')
    await button.trigger('click')
    await nextTick()

    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })
})
