import { describe, test, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ClMenuItem from '../ClMenuItem.vue'

// NuxtLinkのスタブ
const NuxtLinkStub = {
  name: 'NuxtLink',
  props: ['to'],
  template: '<a :href="typeof to === \'string\' ? to : to.path"><slot /></a>',
}

// useDropdownMenuのモック
const mockRegisterItem = vi.fn()
const mockUnregisterItem = vi.fn()

vi.mock('~/composables/use-dropdown-menu', () => ({
  useDropdownMenu: () => ({
    registerItem: mockRegisterItem,
    unregisterItem: mockUnregisterItem,
  }),
}))

// dropdownMenuコンテキストのモック
const mockDropdownMenuContext = {
  isOpen: ref(true),
  activeItemId: ref<string | undefined>(undefined),
  selectItem: vi.fn(),
  registerItem: mockRegisterItem,
  unregisterItem: mockUnregisterItem,
}

describe('ClMenuItem', () => {
  test('基本的なレンダリングが正常に動作する', () => {
    const wrapper = mount(ClMenuItem, {
      slots: {
        default: 'メニューアイテム',
      },
      global: {
        provide: {
          dropdownMenu: mockDropdownMenuContext,
        },
      },
    })

    expect(wrapper.text()).toBe('メニューアイテム')
    expect(wrapper.find('button').exists()).toBe(true)
  })

  test('type="button"の場合にbuttonタグがレンダリングされる', () => {
    const wrapper = mount(ClMenuItem, {
      props: {
        type: 'button',
      },
      slots: {
        default: 'ボタン',
      },
      global: {
        provide: {
          dropdownMenu: mockDropdownMenuContext,
        },
      },
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('role')).toBe('menuitem')
  })

  test('type="link"でto propが指定された場合にNuxtLinkがレンダリングされる', () => {
    const wrapper = mount(ClMenuItem, {
      props: {
        type: 'link',
        to: '/profile',
      },
      slots: {
        default: 'プロフィール',
      },
      global: {
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
        provide: {
          dropdownMenu: mockDropdownMenuContext,
        },
      },
    })

    const link = wrapper.findComponent(NuxtLinkStub)
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/profile')
  })

  test('type="link"でhref propが指定された場合にaタグがレンダリングされる', () => {
    const wrapper = mount(ClMenuItem, {
      props: {
        type: 'link',
        href: 'https://example.com',
      },
      slots: {
        default: '外部リンク',
      },
      global: {
        provide: {
          dropdownMenu: mockDropdownMenuContext,
        },
      },
    })

    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://example.com')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  test('disabled propが指定された場合に無効化される', () => {
    const wrapper = mount(ClMenuItem, {
      props: {
        disabled: true,
      },
      slots: {
        default: '無効化アイテム',
      },
      global: {
        provide: {
          dropdownMenu: mockDropdownMenuContext,
        },
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-disabled')).toBe('true')
    expect(button.classes()).toContain('cursor-not-allowed')
    expect(button.classes()).toContain('bg-menu-item-disabled')
  })

  test('selected propが指定された場合に選択状態になる', () => {
    const wrapper = mount(ClMenuItem, {
      props: {
        selected: true,
      },
      slots: {
        default: '選択済みアイテム',
      },
      global: {
        provide: {
          dropdownMenu: mockDropdownMenuContext,
        },
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('role')).toBe('menuitemcheckbox')
    expect(button.attributes('aria-checked')).toBe('true')
    expect(button.classes()).toContain('bg-menu-item-selected')
    expect(button.classes()).toContain('text-menu-item-selected')
  })

  test('アクティブ状態の場合にアクティブクラスが適用される', async () => {
    const itemId = 'test-item-1'
    const context = {
      ...mockDropdownMenuContext,
      activeItemId: ref(itemId),
    }

    const wrapper = mount(ClMenuItem, {
      props: {
        id: itemId,
      },
      slots: {
        default: 'アクティブアイテム',
      },
      global: {
        provide: {
          dropdownMenu: context,
        },
      },
    })

    await nextTick()

    const button = wrapper.find('button')
    expect(button.classes()).toContain('bg-menu-item-active')
    expect(button.classes()).toContain('text-menu-item-active')
  })

  test('クリック時にclickイベントとselectItemが呼ばれる', async () => {
    const wrapper = mount(ClMenuItem, {
      props: {
        id: 'test-item',
      },
      slots: {
        default: 'クリック可能アイテム',
      },
      global: {
        provide: {
          dropdownMenu: mockDropdownMenuContext,
        },
      },
    })

    await wrapper.find('button').trigger('click')
    await nextTick()

    expect(mockDropdownMenuContext.selectItem).toHaveBeenCalledWith('test-item')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  test('disabled状態でクリックしても何も起こらない', async () => {
    mockDropdownMenuContext.selectItem.mockClear()

    const wrapper = mount(ClMenuItem, {
      props: {
        id: 'test-item',
        disabled: true,
      },
      slots: {
        default: '無効化アイテム',
      },
      global: {
        provide: {
          dropdownMenu: mockDropdownMenuContext,
        },
      },
    })

    await wrapper.find('button').trigger('click')
    await nextTick()

    expect(mockDropdownMenuContext.selectItem).not.toHaveBeenCalled()
  })

  test('iconスロットが正しく表示される', () => {
    const wrapper = mount(ClMenuItem, {
      slots: {
        default: 'アイテム',
        icon: '<svg data-testid="icon">Icon</svg>',
      },
      global: {
        provide: {
          dropdownMenu: mockDropdownMenuContext,
        },
      },
    })

    expect(wrapper.find('[data-testid="icon"]').exists()).toBe(true)
  })

  test('suffixスロットが正しく表示される', () => {
    const wrapper = mount(ClMenuItem, {
      slots: {
        default: 'アイテム',
        suffix: '<span data-testid="suffix">Suffix</span>',
      },
      global: {
        provide: {
          dropdownMenu: mockDropdownMenuContext,
        },
      },
    })

    expect(wrapper.find('[data-testid="suffix"]').exists()).toBe(true)
  })

  test('ARIA属性が適切に設定される', () => {
    const wrapper = mount(ClMenuItem, {
      slots: {
        default: 'アイテム',
      },
      global: {
        provide: {
          dropdownMenu: mockDropdownMenuContext,
        },
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('role')).toBe('menuitem')
    expect(button.attributes('tabindex')).toBe('-1')
    expect(button.attributes('aria-disabled')).toBe('false')
  })

  test('ホバー状態のクラスが正しく設定される', () => {
    const wrapper = mount(ClMenuItem, {
      slots: {
        default: 'ホバーアイテム',
      },
      global: {
        provide: {
          dropdownMenu: mockDropdownMenuContext,
        },
      },
    })

    const button = wrapper.find('button')
    expect(button.classes()).toContain('hover:bg-menu-item-hovered')
    expect(button.classes()).toContain('hover:text-menu-item-hovered')
  })
})
