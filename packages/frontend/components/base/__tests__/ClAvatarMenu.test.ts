import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import ClAvatarMenu from '../ClAvatarMenu.vue'
import ClDropdownMenu from '../ClDropdownMenu.vue'
import ClMenuItem from '../ClMenuItem.vue'

// useAuthのモック
const mockLogout = vi.fn()
const mockUser = ref<{
  name: string
  email: string
  avatar: string | null
} | null>({
  name: 'テストユーザー',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.png',
})

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}))

// useDropdownMenuのモック
const mockIsOpen = ref(false)
const mockActiveItemId = ref<string | undefined>(undefined)
const mockItems = ref<Array<{ id: string; disabled?: boolean }>>([])

vi.mock('~/composables/use-dropdown-menu', () => ({
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
}))

// NuxtLinkのスタブ
const NuxtLinkStub = {
  name: 'NuxtLink',
  props: ['to'],
  template: '<a :href="typeof to === \'string\' ? to : to.path"><slot /></a>',
}

describe('ClAvatarMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトユーザー情報をリセット
    mockUser.value = {
      name: 'テストユーザー',
      email: 'test@example.com',
      avatar: 'https://example.com/avatar.png',
    }
    // モックの状態をリセット
    mockIsOpen.value = false
    mockActiveItemId.value = undefined
    mockItems.value = []
  })

  test('基本的なレンダリングが正常に動作する', () => {
    const wrapper = mount(ClAvatarMenu, {
      global: {
        components: {
          ClDropdownMenu,
          ClMenuItem,
        },
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('img').exists()).toBe(true)
  })

  test.each([
    [
      'アバター画像がある場合',
      {
        avatar: 'https://example.com/test.png',
        name: 'テスト',
        email: 'test@example.com',
      },
      true,
      false,
    ],
    [
      'アバター画像がない場合',
      { avatar: null, name: 'テスト', email: 'test@example.com' },
      false,
      true,
    ],
    ['ユーザー情報がない場合', null, false, true],
  ])('ユーザー状態に応じた表示: %s', (_, user, hasImage, hasSvg) => {
    mockUser.value = user

    const wrapper = mount(ClAvatarMenu, {
      global: {
        components: {
          ClDropdownMenu,
          ClMenuItem,
        },
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    })

    expect({
      image: wrapper.find('img').exists(),
      svg: wrapper.find('svg').exists(),
    }).toEqual({
      image: hasImage,
      svg: hasSvg,
    })
  })

  test('アバターボタンをクリックしてメニューを開閉できる', async () => {
    const wrapper = mount(ClAvatarMenu, {
      global: {
        components: {
          ClDropdownMenu,
          ClMenuItem,
        },
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    })

    const button = wrapper.find('button')

    // 初期状態：メニューは閉じている
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    // クリックしてメニューを開く
    await button.trigger('click')
    await nextTick()

    expect(wrapper.find('[role="menu"]').exists()).toBe(true)

    // 再度クリックしてメニューを閉じる
    await button.trigger('click')
    await nextTick()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  test('ログアウトボタンをクリックしてlogout関数が呼ばれる', async () => {
    const wrapper = mount(ClAvatarMenu, {
      global: {
        components: {
          ClDropdownMenu,
          ClMenuItem,
        },
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    })

    // メニューを開く
    await wrapper.find('button').trigger('click')
    await nextTick()

    // ログアウトボタンをクリック（最後のClMenuItem）
    const menuItems = wrapper.findAllComponents(ClMenuItem)
    const logoutButton = menuItems[menuItems.length - 1]
    await logoutButton.trigger('click')
    await nextTick()

    expect(mockLogout).toHaveBeenCalledOnce()
  })

  test('プロフィールリンクが正常に表示される', async () => {
    const wrapper = mount(ClAvatarMenu, {
      global: {
        components: {
          ClDropdownMenu,
          ClMenuItem,
        },
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    })

    // メニューを開く
    await wrapper.find('button').trigger('click')
    await nextTick()

    // NuxtLinkコンポーネントを直接探す
    const profileLink = wrapper.findComponent(NuxtLinkStub)
    expect({
      exists: profileLink.exists(),
      text: profileLink.text(),
      href: profileLink.attributes('href'),
    }).toEqual({
      exists: true,
      text: 'プロフィール',
      href: '/profile',
    })
  })

  test('ユーザー情報がメニューに正しく表示される', async () => {
    mockUser.value = {
      name: 'テストユーザー',
      email: 'test@example.com',
      avatar: null,
    }

    const wrapper = mount(ClAvatarMenu, {
      global: {
        components: {
          ClDropdownMenu,
          ClMenuItem,
        },
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    })

    // メニューを開く
    await wrapper.find('button').trigger('click')
    await nextTick()

    const userInfo = wrapper.find('.font-medium')
    const userEmail = wrapper.find('.text-xs')

    expect({
      name: userInfo.text(),
      email: userEmail.text(),
    }).toEqual({
      name: 'テストユーザー',
      email: 'test@example.com',
    })
  })

  test('aria属性が適切に設定される', () => {
    const wrapper = mount(ClAvatarMenu, {
      global: {
        components: {
          ClDropdownMenu,
          ClMenuItem,
        },
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    })

    const button = wrapper.find('button')

    expect({
      ariaExpanded: button.attributes('aria-expanded'),
      type: button.attributes('type'),
    }).toEqual({
      ariaExpanded: 'false',
      type: 'button',
    })
  })

  test('メニューが開いている時のaria-expanded属性', async () => {
    const wrapper = mount(ClAvatarMenu, {
      global: {
        components: {
          ClDropdownMenu,
          ClMenuItem,
        },
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    })

    const button = wrapper.find('button')

    // メニューを開く
    await button.trigger('click')
    await nextTick()

    expect(button.attributes('aria-expanded')).toBe('true')
  })

  test('境界値テスト: ユーザー情報がnullの場合', async () => {
    mockUser.value = null

    const wrapper = mount(ClAvatarMenu, {
      global: {
        components: {
          ClDropdownMenu,
          ClMenuItem,
        },
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    })

    // メニューを開く
    await wrapper.find('button').trigger('click')
    await nextTick()

    const userInfo = wrapper.find('.font-medium')
    expect(userInfo.text()).toBe('ゲスト')
  })

  test('境界値テスト: ユーザー名が空文字列の場合', () => {
    mockUser.value = {
      name: '',
      email: 'test@example.com',
      avatar: null,
    }

    const wrapper = mount(ClAvatarMenu, {
      global: {
        components: {
          ClDropdownMenu,
          ClMenuItem,
        },
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    })

    // 名前表示部分が存在しないことを確認
    const nameSpan = wrapper.find('.text-sm.text-content-default')
    expect(nameSpan.exists()).toBe(false)
  })

  test('SVGアイコンにaria-hiddenが設定される', () => {
    mockUser.value = { name: 'テスト', email: 'test@example.com', avatar: null }

    const wrapper = mount(ClAvatarMenu, {
      global: {
        components: {
          ClDropdownMenu,
          ClMenuItem,
        },
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    })

    const svg = wrapper.find('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
  })

  test('アバター画像のalt属性が適切に設定される', () => {
    mockUser.value = {
      name: 'テストユーザー',
      email: 'test@example.com',
      avatar: 'https://example.com/avatar.png',
    }

    const wrapper = mount(ClAvatarMenu, {
      global: {
        components: {
          ClDropdownMenu,
          ClMenuItem,
        },
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    })

    const img = wrapper.find('img')
    expect({
      src: img.attributes('src'),
      alt: img.attributes('alt'),
    }).toEqual({
      src: 'https://example.com/avatar.png',
      alt: 'テストユーザー',
    })
  })
})
