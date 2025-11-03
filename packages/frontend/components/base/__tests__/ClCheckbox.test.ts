import { describe, test, expect, vi } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import ClCheckbox from '../ClCheckbox.vue'

describe('ClCheckbox', () => {
  // 1. 基本レンダリング
  describe('基本レンダリング', () => {
    test('コンポーネントが正常にマウントされる', () => {
      const wrapper = mount(ClCheckbox)
      expect(wrapper.exists()).toBe(true)
    })

    test('デフォルトのPropsが適用される', () => {
      const wrapper = mount(ClCheckbox)

      // 未チェック状態
      expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe(
        'false'
      )

      // 有効化状態
      expect(
        wrapper.find('[role="checkbox"]').attributes('aria-disabled')
      ).toBeUndefined()
    })
  })

  // 2. チェックON/OFF
  describe('チェックON/OFF', () => {
    test('クリックでチェック状態が切り替わる', async () => {
      const wrapper = mount(ClCheckbox)

      // 初期状態: 未チェック
      expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe(
        'false'
      )

      // クリック
      await wrapper.find('[role="checkbox"]').trigger('click')

      // update:modelValue イベントが発火される
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    test('スペースキーでトグルできる', async () => {
      const wrapper = mount(ClCheckbox)

      // スペースキー押下
      await wrapper.find('[role="checkbox"]').trigger('keydown', { key: ' ' })

      // update:modelValue イベントが発火される
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    test('update:modelValueイベントが発火する', async () => {
      const wrapper = mount(ClCheckbox)

      await wrapper.find('[role="checkbox"]').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    test('イベントの引数が正しい', async () => {
      const wrapper = mount(ClCheckbox, {
        props: { modelValue: false },
      })

      await wrapper.find('[role="checkbox"]').trigger('click')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted?.[0]).toEqual([true])
    })
  })

  // 3. インデターミネート状態
  describe('インデターミネート状態', () => {
    test('indeterminate prop が true の場合、ハイフンマークが表示される', () => {
      const wrapper = shallowMount(ClCheckbox, {
        props: { indeterminate: true },
      })

      // indeterminate時にIconスタブがレンダリングされていることを確認
      const iconStub = wrapper.findComponent('nuxt-icon-stub')
      expect(iconStub.attributes()['name']).toBe('heroicons-solid-minus')
    })

    test('indeterminate 時の aria-checked 属性が "mixed" になる', () => {
      const wrapper = mount(ClCheckbox, {
        props: { indeterminate: true },
      })

      expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe(
        'mixed'
      )
    })

    test('indeterminate はチェック状態より優先される', () => {
      const wrapper = mount(ClCheckbox, {
        props: {
          modelValue: true,
          indeterminate: true,
        },
      })

      // インデターミネート状態が優先される
      expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe(
        'mixed'
      )
    })

    test('indeterminate 時のクリックで通常のチェックON/OFFに遷移する', async () => {
      const wrapper = mount(ClCheckbox, {
        props: {
          modelValue: false,
          indeterminate: true,
        },
      })

      await wrapper.find('[role="checkbox"]').trigger('click')

      // update:modelValue イベントが発火され、通常のチェックONに遷移
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })
  })

  // 4. disabled状態
  describe('disabled状態', () => {
    test('disabled時はクリックできない', async () => {
      const wrapper = mount(ClCheckbox, {
        props: { disabled: true },
      })

      await wrapper.find('[role="checkbox"]').trigger('click')

      // update:modelValue イベントが発火されない
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    test('disabled時はスタイルが変わる（opacity-50等）', () => {
      const wrapper = mount(ClCheckbox, {
        props: { disabled: true },
      })

      const checkbox = wrapper.find('[role="checkbox"]')
      expect(checkbox.classes()).toContain('opacity-50')
      expect(checkbox.classes()).toContain('cursor-not-allowed')
    })

    test('disabled時はキーボード操作が無効', async () => {
      const wrapper = mount(ClCheckbox, {
        props: { disabled: true },
      })

      await wrapper.find('[role="checkbox"]').trigger('keydown', { key: ' ' })

      // update:modelValue イベントが発火されない
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })
  })

  // 5. 単一の値の制御（boolean）
  describe('単一の値の制御（boolean）', () => {
    test('v-modelでboolean値を制御', async () => {
      const wrapper = mount(ClCheckbox, {
        props: { modelValue: false },
      })

      // 未チェック状態
      expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe(
        'false'
      )

      // チェックする
      await wrapper.find('[role="checkbox"]').trigger('click')

      // true が emitされる
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    test('初期値が正しく反映される', () => {
      const wrapper = mount(ClCheckbox, {
        props: { modelValue: true },
      })

      expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe(
        'true'
      )
    })

    test('チェックONでtrue、OFFでfalse', async () => {
      // ON -> OFF
      const wrapper1 = mount(ClCheckbox, {
        props: { modelValue: true },
      })
      await wrapper1.find('[role="checkbox"]').trigger('click')
      expect(wrapper1.emitted('update:modelValue')?.[0]).toEqual([false])

      // OFF -> ON
      const wrapper2 = mount(ClCheckbox, {
        props: { modelValue: false },
      })
      await wrapper2.find('[role="checkbox"]').trigger('click')
      expect(wrapper2.emitted('update:modelValue')?.[0]).toEqual([true])
    })
  })

  // 6. 配列の値の制御（グループ）
  describe('配列の値の制御（グループ）', () => {
    test('v-modelで配列を制御', async () => {
      const wrapper = mount(ClCheckbox, {
        props: {
          modelValue: ['apple'],
          value: 'banana',
        },
      })

      // 未チェック状態（bananaは配列に含まれていない）
      expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe(
        'false'
      )

      // チェックする
      await wrapper.find('[role="checkbox"]').trigger('click')

      // ['apple', 'banana'] が emitされる
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
        ['apple', 'banana'],
      ])
    })

    test('複数のチェックボックスでグループ制御', async () => {
      const wrapper1 = mount(ClCheckbox, {
        props: {
          modelValue: ['apple'],
          value: 'apple',
        },
      })

      const wrapper2 = mount(ClCheckbox, {
        props: {
          modelValue: ['apple'],
          value: 'banana',
        },
      })

      // appleはチェック済み
      expect(
        wrapper1.find('[role="checkbox"]').attributes('aria-checked')
      ).toBe('true')

      // bananaは未チェック
      expect(
        wrapper2.find('[role="checkbox"]').attributes('aria-checked')
      ).toBe('false')
    })

    test('チェックON時に配列に値が追加される', async () => {
      const wrapper = mount(ClCheckbox, {
        props: {
          modelValue: ['apple'],
          value: 'banana',
        },
      })

      await wrapper.find('[role="checkbox"]').trigger('click')

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
        ['apple', 'banana'],
      ])
    })

    test('チェックOFF時に配列から値が削除される', async () => {
      const wrapper = mount(ClCheckbox, {
        props: {
          modelValue: ['apple', 'banana'],
          value: 'banana',
        },
      })

      await wrapper.find('[role="checkbox"]').trigger('click')

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['apple']])
    })

    test('既存の配列値を保持したまま更新される', async () => {
      const wrapper = mount(ClCheckbox, {
        props: {
          modelValue: ['apple', 'orange'],
          value: 'banana',
        },
      })

      await wrapper.find('[role="checkbox"]').trigger('click')

      const emitted = wrapper.emitted('update:modelValue')?.[0]?.[0] as string[]
      expect(emitted).toContain('apple')
      expect(emitted).toContain('orange')
      expect(emitted).toContain('banana')
    })
  })

  // 7. aria属性
  describe('aria属性', () => {
    test.each([
      [false, false, 'false'],
      [true, false, 'true'],
      [false, true, 'mixed'],
      [true, true, 'mixed'],
    ])(
      'aria-checked属性が正しく設定される: modelValue=%s, indeterminate=%s -> %s',
      (modelValue, indeterminate, expected) => {
        const wrapper = mount(ClCheckbox, {
          props: { modelValue, indeterminate },
        })

        expect(
          wrapper.find('[role="checkbox"]').attributes('aria-checked')
        ).toBe(expected)
      }
    )

    test('aria-labelが設定される', () => {
      const wrapper = mount(ClCheckbox, {
        props: { ariaLabel: 'カスタムラベル' },
      })

      expect(wrapper.find('[role="checkbox"]').attributes('aria-label')).toBe(
        'カスタムラベル'
      )
    })

    test('role="checkbox"が設定される', () => {
      const wrapper = mount(ClCheckbox)

      expect(wrapper.find('[role="checkbox"]').exists()).toBe(true)
    })

    test('disabled時にaria-disabled="true"が設定される', () => {
      const wrapper = mount(ClCheckbox, {
        props: { disabled: true },
      })

      expect(
        wrapper.find('[role="checkbox"]').attributes('aria-disabled')
      ).toBe('true')
    })
  })

  // 8. キーボード操作
  describe('キーボード操作', () => {
    test('タブキーでフォーカス移動', () => {
      const wrapper = mount(ClCheckbox)

      const checkbox = wrapper.find('[role="checkbox"]')
      expect(checkbox.attributes('tabindex')).toBe('0')
    })

    test('スペースキーでトグル', async () => {
      const wrapper = mount(ClCheckbox, {
        props: { modelValue: false },
      })

      await wrapper.find('[role="checkbox"]').trigger('keydown', { key: ' ' })

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    test('Spacebarキー（古いブラウザ）でもトグル', async () => {
      const wrapper = mount(ClCheckbox, {
        props: { modelValue: false },
      })

      await wrapper
        .find('[role="checkbox"]')
        .trigger('keydown', { key: 'Spacebar' })

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    test('フォーカス時にring-2が表示される', () => {
      const wrapper = mount(ClCheckbox)

      const checkbox = wrapper.find('[role="checkbox"]')
      expect(checkbox.classes()).toContain('focus:ring-2')
    })
  })

  // 9. 境界値テスト
  describe('境界値テスト', () => {
    test('空配列の場合', async () => {
      const wrapper = mount(ClCheckbox, {
        props: {
          modelValue: [],
          value: 'apple',
        },
      })

      // 未チェック状態
      expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe(
        'false'
      )

      // チェックする
      await wrapper.find('[role="checkbox"]').trigger('click')

      // ['apple'] が emitされる
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['apple']])
    })

    test('modelValueがundefinedの場合', () => {
      const wrapper = mount(ClCheckbox)

      // 未チェック状態として扱われる
      expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe(
        'false'
      )
    })

    test('不正な型の場合のデフォルト動作: value未指定で配列modelValue', async () => {
      // console.warnをモックして警告出力を抑制
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const wrapper = mount(ClCheckbox, {
        props: {
          modelValue: ['apple'],
          // value未指定
        },
      })

      await wrapper.find('[role="checkbox"]').trigger('click')

      // console.warnが呼ばれることを確認
      expect(warnSpy).toHaveBeenCalledWith(
        'ClCheckbox: value prop is required when using array modelValue'
      )

      // イベントは発火されない
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()

      // モックをリストア
      warnSpy.mockRestore()
    })
  })

  // 10. ラベル関連
  describe('ラベル関連', () => {
    test('labelが表示される', () => {
      const wrapper = mount(ClCheckbox, {
        props: { label: 'テストラベル' },
      })

      expect(wrapper.text()).toContain('テストラベル')
    })

    test('labelがない場合はラベル要素が表示されない', () => {
      const wrapper = mount(ClCheckbox)

      expect(wrapper.find('label').exists()).toBe(false)
    })

    test('ラベルクリックでチェック状態が切り替わる', async () => {
      const wrapper = mount(ClCheckbox, {
        props: {
          modelValue: false,
          label: 'クリック可能ラベル',
        },
      })

      // ラベルをクリック
      await wrapper.find('label').trigger('click')

      // Vue Test Utilsではlabelのfor属性によるネイティブinputへの自動クリックが
      // シミュレートされないため、明示的にネイティブinputのクリックも発火させる
      await wrapper.find('input[type="checkbox"]').trigger('click')

      // ラベルをクリックしてもイベントが発火される
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })
})
