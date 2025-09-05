import { describe, test, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ClHamburgerButton from '../ClHamburgerButton.vue'

describe('ClHamburgerButton', () => {
  test('基本的なレンダリングが正常に動作する', () => {
    const wrapper = mount(ClHamburgerButton)

    expect(wrapper.find('button').exists()).toBe(true)
  })

  test.each([
    [false, 'メニューを開閉', false],
    [true, 'カスタムラベル', true],
  ])(
    'propsが正常に動作する: isOpen=%s, ariaLabel=%s',
    (isOpen, ariaLabel, expected) => {
      const wrapper = mount(ClHamburgerButton, {
        props: { isOpen, ariaLabel },
      })

      const button = wrapper.find('button')

      expect({
        ariaLabel: button.attributes('aria-label'),
        ariaExpanded: button.attributes('aria-expanded') === 'true',
      }).toEqual({
        ariaLabel,
        ariaExpanded: expected,
      })
    }
  )

  test('クリックイベントが正常にemitされる', async () => {
    const wrapper = mount(ClHamburgerButton)

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  test('アイコンが開閉状態に応じて切り替わる', () => {
    // 閉じた状態のアイコン
    const closedWrapper = mount(ClHamburgerButton, {
      props: { isOpen: false },
    })

    const closedIcon = closedWrapper.find('svg path').attributes('d')
    expect(closedIcon).toBe('M4 6h16M4 12h16M4 18h16')

    // 開いた状態のアイコン
    const openWrapper = mount(ClHamburgerButton, {
      props: { isOpen: true },
    })

    const openIcon = openWrapper.find('svg path').attributes('d')
    expect(openIcon).toBe('M6 18L18 6M6 6l12 12')
  })

  test('デフォルトのprops値が正常に適用される', () => {
    const wrapper = mount(ClHamburgerButton)
    const button = wrapper.find('button')

    expect({
      ariaLabel: button.attributes('aria-label'),
      ariaExpanded: button.attributes('aria-expanded'),
    }).toEqual({
      ariaLabel: 'メニューを開閉',
      ariaExpanded: 'false',
    })
  })

  test('aria属性が適切に設定される', () => {
    const wrapper = mount(ClHamburgerButton, {
      props: { isOpen: true, ariaLabel: 'テストメニュー' },
    })

    const button = wrapper.find('button')

    expect({
      ariaLabel: button.attributes('aria-label'),
      ariaExpanded: button.attributes('aria-expanded'),
      type: button.attributes('type'),
    }).toEqual({
      ariaLabel: 'テストメニュー',
      ariaExpanded: 'true',
      type: 'button',
    })
  })

  test('SVG要素にaria-hiddenが設定される', () => {
    const wrapper = mount(ClHamburgerButton)
    const svg = wrapper.find('svg')

    expect(svg.attributes('aria-hidden')).toBe('true')
  })

  test('境界値テスト: 空文字列のariaLabelでもエラーにならない', () => {
    const wrapper = mount(ClHamburgerButton, {
      props: { ariaLabel: '' },
    })

    expect(wrapper.find('button').attributes('aria-label')).toBe('')
  })
})
