import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ClToast from '../ClToast.vue'

describe('ClToast', () => {
  it('renders title and message', () => {
    const wrapper = mount(ClToast, {
      props: {
        title: '完了しました',
        message: '処理が正常に完了しました。',
        intent: 'success',
      },
    })

    expect(wrapper.text()).toContain('完了しました')
    expect(wrapper.text()).toContain('処理が正常に完了しました。')
  })

  it('emits dismiss event when close button clicked', async () => {
    const wrapper = mount(ClToast, {
      props: {
        message: '閉じるテスト',
      },
    })

    await wrapper.get('[data-testid="toast-dismiss-button"]').trigger('click')

    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })

  it('sets aria-live politely for info intent', () => {
    const wrapper = mount(ClToast, {
      props: {
        message: '情報です',
        intent: 'info',
      },
    })

    expect(wrapper.attributes('aria-live')).toBe('polite')
  })

  it('sets aria-live assertive for alert intent', () => {
    const wrapper = mount(ClToast, {
      props: {
        message: '重要なお知らせ',
        intent: 'alert',
      },
    })

    expect(wrapper.attributes('aria-live')).toBe('assertive')
  })

  it('hides dismiss button when not dismissible', () => {
    const wrapper = mount(ClToast, {
      props: {
        message: '閉じられません',
        dismissible: false,
      },
    })

    expect(wrapper.find('[data-testid="toast-dismiss-button"]').exists()).toBe(
      false
    )
  })
})
