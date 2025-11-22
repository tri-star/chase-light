import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import ClButton from '../ClButton.vue'

describe('ClButton', () => {
  test('クリックイベントをemitする', async () => {
    const wrapper = mount(ClButton, {
      slots: {
        default: '送信',
      },
    })

    await wrapper.get('[data-testid="cl-button"]').trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  test('disabled時はクリックイベントをemitしない', async () => {
    const wrapper = mount(ClButton, {
      props: { disabled: true },
      slots: {
        default: '送信',
      },
    })

    await wrapper.get('[data-testid="cl-button"]').trigger('click')

    expect(wrapper.emitted('click')).toBeUndefined()
  })

  test('loading時はスピナーが表示される', () => {
    const wrapper = mount(ClButton, {
      props: { loading: true },
      slots: {
        default: '送信中',
      },
    })

    expect(wrapper.find('[data-testid="cl-spinner"]').exists()).toBe(true)
    expect(
      wrapper.get('[data-testid="cl-button"]').attributes('aria-busy')
    ).toBe('true')
  })

  test('variantに応じたクラスが適用される', () => {
    const wrapper = mount(ClButton, {
      props: { intent: 'primary' },
      slots: {
        default: '送信',
      },
    })

    const classes = wrapper.get('[data-testid="cl-button"]').classes()
    expect(classes).toContain('bg-surface-primary-default')
    expect(classes).toContain('border-surface-primary-default')
  })

  test('sizeに応じたクラスが適用される', () => {
    const wrapper = mount(ClButton, {
      props: { size: 'lg' },
      slots: {
        default: '送信',
      },
    })

    const classes = wrapper.get('[data-testid="cl-button"]').classes()
    expect(classes).toContain('h-12')
    expect(classes).toContain('px-5')
  })
})
