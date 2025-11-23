import { describe, test, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ClDropdownMenu from '../ClDropdownMenu.vue'

// useDropdownMenuのモック
vi.mock('~/composables/use-dropdown-menu', () => {
  return {
    useDropdownMenu: () => {
      const { ref } = require('vue')
      const isOpen = ref(false)
      const activeItemId = ref<string | undefined>(undefined)
      const items = ref<Array<{ id: string; disabled?: boolean }>>([])

      return {
        isOpen,
        activeItemId,
        items,
        open: () => {
          isOpen.value = true
        },
        close: () => {
          isOpen.value = false
        },
        toggle: () => {
          isOpen.value = !isOpen.value
        },
        handleKeyDown: vi.fn(),
        handleTriggerKeyDown: vi.fn(),
        setTriggerElement: vi.fn(),
        setMenuElement: vi.fn(),
        registerItem: (item: { id: string; disabled?: boolean }) => {
          items.value.push(item)
        },
        unregisterItem: (itemId: string) => {
          items.value = items.value.filter((item) => item.id !== itemId)
        },
      }
    },
  }
})

describe('ClDropdownMenu', () => {
  test('基本的なレンダリングが正常に動作する', () => {
    const wrapper = mount(ClDropdownMenu, {
      slots: {
        trigger: '<button>トリガー</button>',
        default: '<div>メニュー内容</div>',
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('button').text()).toBe('トリガー')
  })

  test('トリガークリックでメニューが開く', async () => {
    const wrapper = mount(ClDropdownMenu, {
      slots: {
        trigger: '<button>トリガー</button>',
        default: '<div>メニュー内容</div>',
      },
    })

    // 初期状態：メニューは閉じている
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    // トリガーをクリック
    await wrapper.find('[aria-haspopup]').trigger('click')
    await nextTick()

    // メニューが開く
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    expect(wrapper.find('[role="menu"]').text()).toContain('メニュー内容')
  })

  test('ARIA属性が正しく設定される', async () => {
    const wrapper = mount(ClDropdownMenu, {
      slots: {
        trigger: '<button>トリガー</button>',
        default: '<div>メニュー内容</div>',
      },
    })

    const trigger = wrapper.find('[aria-haspopup]')

    // 初期状態
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(trigger.attributes('aria-haspopup')).toBe('true')
    expect(trigger.attributes('aria-controls')).toBeDefined()

    // メニューを開く
    await trigger.trigger('click')
    await nextTick()

    expect(trigger.attributes('aria-expanded')).toBe('true')

    const menu = wrapper.find('[role="menu"]')
    expect(menu.attributes('role')).toBe('menu')
    expect(menu.attributes('aria-labelledby')).toBe(trigger.attributes('id'))
  })

  test('ariaLabel propが設定された場合にaria-labelが使用される', async () => {
    const wrapper = mount(ClDropdownMenu, {
      props: {
        ariaLabel: 'カスタムメニュー',
      },
      slots: {
        trigger: '<button>トリガー</button>',
        default: '<div>メニュー内容</div>',
      },
    })

    // メニューを開く
    await wrapper.find('[aria-haspopup]').trigger('click')
    await nextTick()

    const menu = wrapper.find('[role="menu"]')
    expect(menu.attributes('aria-label')).toBe('カスタムメニュー')
    expect(menu.attributes('aria-labelledby')).toBeUndefined()
  })

  test('placement propに応じてクラスが変わる', async () => {
    const placements = [
      { prop: 'bottom-right', expectedClass: 'right-0 origin-top-right' },
      { prop: 'bottom-left', expectedClass: 'left-0 origin-top-left' },
      {
        prop: 'top-right',
        expectedClass: 'right-0 bottom-full mb-2 origin-bottom-right',
      },
      {
        prop: 'top-left',
        expectedClass: 'left-0 bottom-full mb-2 origin-bottom-left',
      },
    ] as const

    for (const { prop, expectedClass } of placements) {
      const wrapper = mount(ClDropdownMenu, {
        props: {
          placement: prop,
        },
        slots: {
          trigger: '<button>トリガー</button>',
          default: '<div>メニュー内容</div>',
        },
      })

      // メニューを開く
      await wrapper.find('[aria-haspopup]').trigger('click')
      await nextTick()

      const menu = wrapper.find('[role="menu"]')
      expect(menu.classes()).toContain('absolute')
      expect(menu.classes()).toContain('z-50')

      // Check if at least one of the expected classes is present
      const hasExpectedClass = expectedClass
        .split(' ')
        .some((cls) => menu.classes().includes(cls))
      expect(hasExpectedClass).toBe(true)
    }
  })

  test('position propが指定された場合にfixed位置になる', async () => {
    const wrapper = mount(ClDropdownMenu, {
      props: {
        position: { x: 100, y: 200 },
      },
      slots: {
        trigger: '<button>トリガー</button>',
        default: '<div>メニュー内容</div>',
      },
    })

    // メニューを開く
    await wrapper.find('[aria-haspopup]').trigger('click')
    await nextTick()

    const menu = wrapper.find('[role="menu"]')
    const style = menu.attributes('style')
    expect(style).toContain('position: fixed')
    expect(style).toContain('left: 100px')
    expect(style).toContain('top: 200px')
  })

  test.skip('open/close/selectイベントが発火する', async () => {
    const wrapper = mount(ClDropdownMenu, {
      slots: {
        trigger: '<button>トリガー</button>',
        default: '<div>メニュー内容</div>',
      },
    })

    // メニューを開く
    await wrapper.find('[aria-haspopup]').trigger('click')
    await nextTick()

    expect(wrapper.emitted('open')).toBeTruthy()

    // メニューを閉じる
    await wrapper.find('[aria-haspopup]').trigger('click')
    await nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  test('デザイントークンのクラスが適用される', async () => {
    const wrapper = mount(ClDropdownMenu, {
      slots: {
        trigger: '<button>トリガー</button>',
        default: '<div>メニュー内容</div>',
      },
    })

    // メニューを開く
    await wrapper.find('[aria-haspopup]').trigger('click')
    await nextTick()

    const menu = wrapper.find('[role="menu"]')
    expect(menu.classes()).toContain('bg-menu-default')
    expect(menu.classes()).toContain('text-menu-default')
    expect(menu.classes()).toContain('border-menu-default')
    expect(menu.classes()).toContain('backdrop-blur-md')
  })
})
