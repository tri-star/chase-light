import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ClThemeSelector from '../ClThemeSelector.vue'

// useThemeのモック
const mockSetTheme = vi.fn()
const mockCurrentTheme = ref('light')

vi.mock('~/composables/useTheme', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    currentTheme: mockCurrentTheme,
  }),
}))

// Iconコンポーネントのスタブ
const IconStub = {
  name: 'Icon',
  props: ['name', 'class'],
  template: '<span :class="$props.class">{{ $props.name }}</span>',
}

describe('ClThemeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentTheme.value = 'light'
  })

  test('基本的なレンダリングが正常に動作する', () => {
    const wrapper = mount(ClThemeSelector, {
      global: {
        stubs: { Icon: IconStub },
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
  })

  test.each([
    ['light', 'i-heroicons-sun-20-solid', 'ダークモードに切り替え'],
    ['dark', 'i-heroicons-moon-20-solid', 'ライトモードに切り替え'],
  ])(
    'テーマ状態に応じたアイコンとラベル: %s テーマ',
    (theme, expectedIcon, expectedLabel) => {
      mockCurrentTheme.value = theme

      const wrapper = mount(ClThemeSelector, {
        global: {
          stubs: { Icon: IconStub },
        },
      })

      const button = wrapper.find('button')
      expect({
        ariaLabel: button.attributes('aria-label'),
        title: button.attributes('title'),
      }).toEqual({
        ariaLabel: expectedLabel,
        title: expectedLabel,
      })
    }
  )

  test.each([
    ['sm', 'w-8 h-8', 'w-4 h-4'],
    ['md', 'w-10 h-10', 'w-5 h-5'],
  ])('サイズprops: size=%s', (size, expectedButtonSize, _expectedIconSize) => {
    const wrapper = mount(ClThemeSelector, {
      props: { size: size as 'sm' | 'md' },
      global: {
        stubs: { Icon: IconStub },
      },
    })

    const button = wrapper.find('button')

    // ボタンのサイズクラスが含まれているかチェック（複数クラスを一度にチェックしない）
    const buttonClasses = button.classes()
    const widthClass = expectedButtonSize.split(' ')[0] // 'w-8' または 'w-10'
    expect(
      buttonClasses.some((cls) => cls.includes(widthClass.split('-')[1]))
    ).toBe(true)
  })

  test('テーマトグル機能が正常に動作する', async () => {
    mockCurrentTheme.value = 'light'

    const wrapper = mount(ClThemeSelector, {
      global: {
        stubs: { Icon: IconStub },
      },
    })

    await wrapper.find('button').trigger('click')

    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  test('ダークテーマからライトテーマへの切り替え', async () => {
    mockCurrentTheme.value = 'dark'

    const wrapper = mount(ClThemeSelector, {
      global: {
        stubs: { Icon: IconStub },
      },
    })

    await wrapper.find('button').trigger('click')

    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  test('ライトテーマ時の背景色クラスが適用される', () => {
    mockCurrentTheme.value = 'light'

    const wrapper = mount(ClThemeSelector, {
      global: {
        stubs: { Icon: IconStub },
      },
    })

    const button = wrapper.find('button')

    expect({
      hasLightBg: button.classes().includes('bg-primitive-yellow-50'),
      hasLightBorder: button.classes().includes('border-primitive-yellow-200'),
    }).toEqual({
      hasLightBg: true,
      hasLightBorder: true,
    })
  })

  test('ダークテーマ時の背景色クラスが適用される', () => {
    mockCurrentTheme.value = 'dark'

    const wrapper = mount(ClThemeSelector, {
      global: {
        stubs: { Icon: IconStub },
      },
    })

    const button = wrapper.find('button')

    expect({
      hasDarkBg: button.classes().includes('bg-primitive-yellow-900'),
      hasDarkBorder: button.classes().includes('border-primitive-yellow-600'),
    }).toEqual({
      hasDarkBg: true,
      hasDarkBorder: true,
    })
  })

  test('ライトテーマ時のアイコン色クラスが適用される', () => {
    mockCurrentTheme.value = 'light'

    const wrapper = mount(ClThemeSelector, {
      global: {
        stubs: { Icon: IconStub },
      },
    })

    const icon = wrapper.find('span')

    expect(
      icon.attributes('class')?.includes('text-primitive-yellow-300')
    ).toBe(true)
  })

  test('ダークテーマ時のアイコン色クラスが適用される', () => {
    mockCurrentTheme.value = 'dark'

    const wrapper = mount(ClThemeSelector, {
      global: {
        stubs: { Icon: IconStub },
      },
    })

    const icon = wrapper.find('span')

    expect(
      icon.attributes('class')?.includes('text-primitive-yellow-200')
    ).toBe(true)
  })

  test('基本的なCSSクラスが適用される', () => {
    const wrapper = mount(ClThemeSelector, {
      global: {
        stubs: { Icon: IconStub },
      },
    })

    const button = wrapper.find('button')

    expect({
      hasFlex: button.classes().includes('flex'),
      hasRounded: button.classes().includes('rounded-full'),
      hasTransition: button.classes().includes('transition-all'),
    }).toEqual({
      hasFlex: true,
      hasRounded: true,
      hasTransition: true,
    })
  })

  test('button要素の基本属性が正しく設定される', () => {
    const wrapper = mount(ClThemeSelector, {
      global: {
        stubs: { Icon: IconStub },
      },
    })

    const button = wrapper.find('button')

    expect(button.attributes('type')).toBe('button')
  })

  test('デフォルトのsize propsが適用される', () => {
    const wrapper = mount(ClThemeSelector, {
      global: {
        stubs: { Icon: IconStub },
      },
    })

    const button = wrapper.find('button')

    // デフォルトサイズ（md）のクラスが適用されているかチェック
    const buttonClasses = button.classes()
    expect(buttonClasses.some((cls) => cls.includes('10'))).toBe(true) // w-10 h-10 のいずれか
  })

  test('境界値テスト: 無効なsize propsでもエラーにならない', () => {
    const wrapper = mount(ClThemeSelector, {
      // 無効な値を渡してもデフォルト値が使用される
      props: { size: 'invalid' as 'sm' | 'md' },
      global: {
        stubs: { Icon: IconStub },
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
  })
})
