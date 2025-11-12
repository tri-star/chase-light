import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { mount } from '@vue/test-utils'
import AddDataSourceModal from '../AddDataSourceModal.vue'

const showToastMock = vi.fn()

vi.mock('~/composables/use-toast', () => ({
  useToast: () => ({
    showToast: showToastMock,
    dismissToast: vi.fn(),
    clearToasts: vi.fn(),
    toasts: { value: [] },
  }),
}))

const fetchMock = vi.fn()

const originalShowModal = HTMLDialogElement.prototype.showModal
const originalClose = HTMLDialogElement.prototype.close

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
  }
})

describe('AddDataSourceModal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    showToastMock.mockReset()
    fetchMock.mockReset()
    vi.stubGlobal(
      '$fetch',
      fetchMock.mockImplementation(() =>
        Promise.resolve({
          success: true,
        })
      )
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  afterAll(() => {
    HTMLDialogElement.prototype.showModal = originalShowModal
    HTMLDialogElement.prototype.close = originalClose
  })

  it('初期状態で既定値がセットされる', () => {
    const wrapper = mount(AddDataSourceModal, {
      props: {
        open: true,
      },
    })

    const inputElement = wrapper.find('input#repository-url')
      .element as HTMLInputElement
    expect(inputElement.value).toBe('')
    expect(wrapper.findAllComponents({ name: 'ClCheckbox' }).length).toBe(3)
  })

  it('無効なURLの場合、バリデーションエラーを表示しAPIを呼び出さない', async () => {
    const wrapper = mount(AddDataSourceModal, {
      props: {
        open: true,
      },
    })

    const input = wrapper.get('#repository-url')
    await input.setValue('https://example.com/invalid')

    const form = wrapper.get('#add-data-source-form')
    await form.trigger('submit')

    expect(wrapper.text()).toContain(
      'https://github.com/{owner}/{repo} の形式で入力してください。'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('成功時にAPIを呼び出しトーストとイベントを発火する', async () => {
    const wrapper = mount(AddDataSourceModal, {
      props: {
        open: true,
      },
    })

    const input = wrapper.get('#repository-url')
    await input.setValue('https://github.com/nuxt/nuxt')

    const form = wrapper.get('#add-data-source-form')
    await form.trigger('submit')

    await vi.runAllTimersAsync()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(showToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'success',
      })
    )
    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
  })

  it('失敗時にエラートーストを表示する', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Backend unavailable'))
    const wrapper = mount(AddDataSourceModal, {
      props: {
        open: true,
      },
    })

    const input = wrapper.get('#repository-url')
    await input.setValue('https://github.com/vuejs/core')

    const form = wrapper.get('#add-data-source-form')
    await form.trigger('submit')
    await vi.runAllTimersAsync()

    expect(showToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'alert',
      })
    )
    expect(wrapper.emitted('error')).toBeTruthy()
  })
})
