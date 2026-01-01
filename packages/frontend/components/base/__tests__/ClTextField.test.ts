import { describe, test, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ClTextField from '../ClTextField.vue'

describe('ClTextField', () => {
  describe('初期値の表示', () => {
    test('modelValueが空文字の場合、入力フィールドが空で表示される', () => {
      const wrapper = mount(ClTextField, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input')
      expect(input.element.value).toBe('')
    })

    test('modelValueが指定された場合、その値が表示される', () => {
      const wrapper = mount(ClTextField, {
        props: {
          modelValue: 'テストテキスト',
        },
      })

      const input = wrapper.find('input')
      expect(input.element.value).toBe('テストテキスト')
    })
  })

  describe('v-modelの双方向バインディング', () => {
    test('入力時にupdate:modelValueイベントが発火する', async () => {
      const wrapper = mount(ClTextField, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input')
      await input.setValue('新しいテキスト')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
        '新しいテキスト',
      ])
    })

    test('入力時にinputイベントが発火する', async () => {
      const wrapper = mount(ClTextField, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input')
      await input.setValue('新しいテキスト')

      expect(wrapper.emitted('input')).toBeTruthy()
      expect(wrapper.emitted('input')?.[0]).toEqual(['新しいテキスト'])
    })
  })

  describe('disabledプロパティの動作', () => {
    test('disabledがtrueの場合、入力フィールドが無効になる', () => {
      const wrapper = mount(ClTextField, {
        props: {
          modelValue: '',
          disabled: true,
        },
      })

      const input = wrapper.find('input')
      expect(input.element.disabled).toBe(true)
    })

    test('disabledがfalseの場合、入力フィールドが有効になる', () => {
      const wrapper = mount(ClTextField, {
        props: {
          modelValue: '',
          disabled: false,
        },
      })

      const input = wrapper.find('input')
      expect(input.element.disabled).toBe(false)
    })

    test('disabledがtrueの場合、opacity-50クラスが適用される', () => {
      const wrapper = mount(ClTextField, {
        props: {
          modelValue: '',
          disabled: true,
        },
      })

      const input = wrapper.find('input')
      expect(input.classes()).toContain('opacity-50')
    })
  })

  describe('placeholder表示', () => {
    test('placeholderが指定された場合、表示される', () => {
      const wrapper = mount(ClTextField, {
        props: {
          modelValue: '',
          placeholder: 'キーワードで検索...',
        },
      })

      const input = wrapper.find('input')
      expect(input.element.placeholder).toBe('キーワードで検索...')
    })

    test('placeholderが空文字の場合、デフォルト値が適用される', () => {
      const wrapper = mount(ClTextField, {
        props: {
          modelValue: '',
          placeholder: '',
        },
      })

      const input = wrapper.find('input')
      expect(input.element.placeholder).toBe('')
    })
  })

  describe('typeプロパティの動作', () => {
    test.each([
      ['text', 'text'],
      ['search', 'search'],
      ['email', 'email'],
      ['password', 'password'],
    ])(
      'type="%s"の場合、input要素のtypeが"%s"になる',
      (inputType, expected) => {
        const wrapper = mount(ClTextField, {
          props: {
            modelValue: '',
            type: inputType as 'text' | 'search' | 'email' | 'password',
          },
        })

        const input = wrapper.find('input')
        expect(input.element.type).toBe(expected)
      }
    )
  })

  describe('ariaLabelプロパティの動作', () => {
    test('ariaLabelが指定された場合、aria-label属性が設定される', () => {
      const wrapper = mount(ClTextField, {
        props: {
          modelValue: '',
          ariaLabel: '検索フィールド',
        },
      })

      const input = wrapper.find('input')
      expect(input.attributes('aria-label')).toBe('検索フィールド')
    })

    test('ariaLabelが指定されない場合、aria-label属性が設定されない', () => {
      const wrapper = mount(ClTextField, {
        props: {
          modelValue: '',
        },
      })

      const input = wrapper.find('input')
      expect(input.attributes('aria-label')).toBeUndefined()
    })
  })

  describe('prefix/suffixスロットの表示', () => {
    test('prefixスロットが正しく表示される', () => {
      const wrapper = mount(ClTextField, {
        props: {
          modelValue: '',
        },
        slots: {
          prefix: '<span class="test-prefix">Prefix</span>',
        },
      })

      expect(wrapper.html()).toContain('test-prefix')
      expect(wrapper.html()).toContain('Prefix')
    })

    test('suffixスロットが正しく表示される', () => {
      const wrapper = mount(ClTextField, {
        props: {
          modelValue: '',
        },
        slots: {
          suffix: '<span class="test-suffix">Suffix</span>',
        },
      })

      expect(wrapper.html()).toContain('test-suffix')
      expect(wrapper.html()).toContain('Suffix')
    })
  })
})
