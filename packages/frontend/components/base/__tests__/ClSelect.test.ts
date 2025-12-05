import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ClSelect from '../ClSelect.vue'

// useDropdownMenuのモック
const mockIsOpen = ref(false)
const mockActiveItemId = ref<string | undefined>(undefined)
const mockItems = ref<Array<{ id: string; disabled?: boolean }>>([])

vi.mock('~/composables/use-dropdown-menu', () => {
  return {
    useDropdownMenu: () => ({
      isOpen: mockIsOpen,
      activeItemId: mockActiveItemId,
      items: mockItems,
      open: () => {
        mockIsOpen.value = true
      },
      close: () => {
        mockIsOpen.value = false
      },
      toggle: () => {
        mockIsOpen.value = !mockIsOpen.value
      },
      handleKeyDown: vi.fn(),
      handleTriggerKeyDown: vi.fn(),
      setTriggerElement: vi.fn(),
      setMenuElement: vi.fn(),
      registerItem: (item: { id: string; disabled?: boolean }) => {
        mockItems.value.push(item)
      },
      unregisterItem: (itemId: string) => {
        mockItems.value = mockItems.value.filter((i) => i.id !== itemId)
      },
    }),
  }
})

// getBoundingClientRectのモック
const mockGetBoundingClientRect = vi.fn(() => ({
  left: 100,
  right: 300,
  top: 100,
  bottom: 200,
  width: 200,
  height: 100,
  x: 100,
  y: 100,
  toJSON: () => {},
}))

describe('ClSelect', () => {
  const defaultOptions = [
    { value: 'option1', label: 'オプション1' },
    { value: 'option2', label: 'オプション2' },
    { value: 'option3', label: 'オプション3' },
  ]

  beforeEach(() => {
    mockIsOpen.value = false
    mockActiveItemId.value = undefined
    mockItems.value = []

    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect

    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('基本的なレンダリングが正常に動作する', () => {
    const wrapper = mount(ClSelect, {
      props: {
        options: defaultOptions,
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toContain('選択してください')
  })

  test('選択中の値に対応するラベルが表示される', () => {
    const wrapper = mount(ClSelect, {
      props: {
        options: defaultOptions,
        modelValue: 'option2',
      },
    })

    expect(wrapper.text()).toContain('オプション2')
  })

  test('placeholderが表示される', () => {
    const wrapper = mount(ClSelect, {
      props: {
        options: defaultOptions,
        placeholder: 'カスタムプレースホルダー',
      },
    })

    expect(wrapper.text()).toContain('カスタムプレースホルダー')
  })

  test('disabled状態で操作できない', async () => {
    const wrapper = mount(ClSelect, {
      props: {
        options: defaultOptions,
        disabled: true,
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.classes()).toContain('cursor-not-allowed')
    expect(button.classes()).toContain('opacity-50')
  })

  test('クリックでドロップダウンが開く', async () => {
    const wrapper = mount(ClSelect, {
      props: {
        options: defaultOptions,
      },
    })

    await wrapper.find('button').trigger('click')
    await nextTick()

    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
  })

  test('オプション選択でイベントが発火する', async () => {
    const wrapper = mount(ClSelect, {
      props: {
        options: defaultOptions,
        modelValue: 'option1',
      },
    })

    // メニューを開く
    await wrapper.find('button').trigger('click')
    await nextTick()

    // オプションをクリック
    const menuItems = wrapper.findAll('[role="menuitem"]')
    await menuItems[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  test('数値型のオプションも正しく動作する', async () => {
    const numberOptions = [
      { value: 1, label: '数値1' },
      { value: 2, label: '数値2' },
      { value: 3, label: '数値3' },
    ]

    const wrapper = mount(ClSelect, {
      props: {
        options: numberOptions,
        modelValue: 2,
      },
    })

    expect(wrapper.text()).toContain('数値2')
  })

  test('selectedオプションが正しくマークされる', async () => {
    const wrapper = mount(ClSelect, {
      props: {
        options: defaultOptions,
        modelValue: 'option2',
      },
    })

    // メニューを開く
    await wrapper.find('button').trigger('click')
    await nextTick()

    // 選択中のオプションが正しくマークされているか確認
    // ClMenuItemではselected時にaria-checkedが"true"で、roleが"menuitemcheckbox"になる
    const selectedItem = wrapper.find('[aria-checked="true"]')
    expect(selectedItem.exists()).toBe(true)
    expect(selectedItem.attributes('role')).toBe('menuitemcheckbox')
  })

  test('aria-label propが正しく設定される', async () => {
    const wrapper = mount(ClSelect, {
      props: {
        options: defaultOptions,
        ariaLabel: 'カスタムラベル',
      },
    })

    await wrapper.find('button').trigger('click')
    await nextTick()

    const menu = wrapper.find('[role="menu"]')
    expect(menu.attributes('aria-label')).toBe('カスタムラベル')
  })

  test('disabledオプションは選択できない', async () => {
    const optionsWithDisabled = [
      { value: 'option1', label: 'オプション1' },
      { value: 'option2', label: 'オプション2', disabled: true },
      { value: 'option3', label: 'オプション3' },
    ]

    const wrapper = mount(ClSelect, {
      props: {
        options: optionsWithDisabled,
      },
    })

    // メニューを開く
    await wrapper.find('button').trigger('click')
    await nextTick()

    // 無効なオプションをクリック
    const menuItems = wrapper.findAll('[role="menuitem"]')
    await menuItems[1].trigger('click')

    // イベントが発火しないことを確認
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  test('triggerClassが正しく適用される', () => {
    const wrapper = mount(ClSelect, {
      props: {
        options: defaultOptions,
        triggerClass: 'custom-class',
      },
    })

    expect(wrapper.find('button').classes()).toContain('custom-class')
  })
})
