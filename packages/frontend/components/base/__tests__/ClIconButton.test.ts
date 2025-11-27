import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import ClIconButton from '../ClIconButton.vue'

describe('ClIconButton', () => {
  test('クリックイベントをemitする', async () => {
    const wrapper = mount(ClIconButton, {
      props: {
        ariaLabel: '共有する',
        icon: 'i-heroicons-share-20-solid',
      },
    })

    await wrapper.get('[data-testid="cl-icon-button"]').trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  test('disabled時はクリックイベントをemitしない', async () => {
    const wrapper = mount(ClIconButton, {
      props: {
        ariaLabel: '保存',
        icon: 'i-heroicons-bookmark-20-solid',
        disabled: true,
      },
    })

    await wrapper.get('[data-testid="cl-icon-button"]').trigger('click')

    expect(wrapper.emitted('click')).toBeUndefined()
    expect(
      wrapper.get('[data-testid="cl-icon-button"]').attributes('disabled')
    ).toBeDefined()
  })

  test('variantに応じたクラスが適用される', () => {
    const wrapper = mount(ClIconButton, {
      props: {
        ariaLabel: 'like',
        icon: 'i-heroicons-heart-20-solid',
        variant: 'solid',
      },
    })

    const classes = wrapper.get('[data-testid="cl-icon-button"]').classes()
    expect(classes).toContain('bg-interactive-default')
    expect(classes).toContain('border-interactive-default')
  })

  test('sizeに応じたクラスが適用される', () => {
    const wrapper = mount(ClIconButton, {
      props: {
        ariaLabel: '拡大',
        icon: 'i-heroicons-magnifying-glass-20-solid',
        size: 'lg',
      },
    })

    const classes = wrapper.get('[data-testid="cl-icon-button"]').classes()
    expect(classes).toContain('h-12')
    expect(classes).toContain('w-12')
  })
})
