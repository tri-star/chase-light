/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { createApp } from 'vue'
import { useDropdownMenu } from '../use-dropdown-menu'
import type { DropdownMenuItem } from '../use-dropdown-menu'

// Vueコンポーネントのセットアップコンテキスト内でcomposableをテストするヘルパー
function withSetup<T>(composable: () => T): [T, () => void] {
  let result: T
  const app = createApp({
    setup() {
      result = composable()
      return () => {}
    },
  })
  const el = document.createElement('div')
  app.mount(el)
  return [result!, () => app.unmount()]
}

describe('useDropdownMenu', () => {
  let mockTriggerElement: HTMLElement
  let mockMenuElement: HTMLElement

  beforeEach(() => {
    // モック要素を作成
    mockTriggerElement = document.createElement('button')
    mockMenuElement = document.createElement('div')
    document.body.appendChild(mockTriggerElement)
    document.body.appendChild(mockMenuElement)
  })

  afterEach(() => {
    // クリーンアップ
    document.body.removeChild(mockTriggerElement)
    document.body.removeChild(mockMenuElement)
    vi.clearAllMocks()
  })

  test('初期状態が正しく設定される', () => {
    const { isOpen, activeIndex, activeItemId, items } = useDropdownMenu()

    expect(isOpen.value).toBe(false)
    expect(activeIndex.value).toBe(-1)
    expect(activeItemId.value).toBeUndefined()
    expect(items.value).toEqual([])
  })

  test('openメソッドでメニューが開く', () => {
    const onOpen = vi.fn()
    const { isOpen, open } = useDropdownMenu({ onOpen })

    open()

    expect(isOpen.value).toBe(true)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  test('closeメソッドでメニューが閉じ、トリガーにフォーカスが戻る', async () => {
    const onClose = vi.fn()
    const mockFocus = vi.fn()
    mockTriggerElement.focus = mockFocus

    const [composable, unmount] = withSetup(() =>
      useDropdownMenu({
        onClose,
      })
    )

    const { isOpen, open, close, setTriggerElement } = composable

    setTriggerElement(mockTriggerElement)
    open()

    // open()のnextTickを待つ
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(isOpen.value).toBe(true)

    close()

    expect(isOpen.value).toBe(false)
    expect(onClose).toHaveBeenCalledTimes(1)

    // close()のnextTickを待つ
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockFocus).toHaveBeenCalledTimes(1)

    unmount()
  })

  test('toggleメソッドでメニューの開閉が切り替わる', () => {
    const { isOpen, toggle } = useDropdownMenu()

    expect(isOpen.value).toBe(false)

    toggle()
    expect(isOpen.value).toBe(true)

    toggle()
    expect(isOpen.value).toBe(false)
  })

  test('アイテムの登録と解除ができる', () => {
    const { items, registerItem, unregisterItem } = useDropdownMenu()

    const item1: DropdownMenuItem = { id: 'item-1' }
    const item2: DropdownMenuItem = { id: 'item-2' }

    registerItem(item1)
    registerItem(item2)

    expect(items.value).toHaveLength(2)
    expect(items.value).toEqual([item1, item2])

    unregisterItem('item-1')

    expect(items.value).toHaveLength(1)
    expect(items.value).toEqual([item2])
  })

  test('clearItemsですべてのアイテムが削除される', () => {
    const { items, registerItem, clearItems } = useDropdownMenu()

    registerItem({ id: 'item-1' })
    registerItem({ id: 'item-2' })

    expect(items.value).toHaveLength(2)

    clearItems()

    expect(items.value).toHaveLength(0)
  })

  test('ArrowDownキーで次のアイテムがアクティブになる', () => {
    const { activeIndex, open, handleKeyDown, registerItem } = useDropdownMenu()

    registerItem({ id: 'item-1' })
    registerItem({ id: 'item-2' })
    registerItem({ id: 'item-3' })

    open()

    const event1 = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    handleKeyDown(event1)
    expect(activeIndex.value).toBe(0)

    const event2 = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    handleKeyDown(event2)
    expect(activeIndex.value).toBe(1)
  })

  test('ArrowUpキーで前のアイテムがアクティブになる', () => {
    const { activeIndex, open, handleKeyDown, registerItem } = useDropdownMenu()

    registerItem({ id: 'item-1' })
    registerItem({ id: 'item-2' })
    registerItem({ id: 'item-3' })

    open()

    // 最初にArrowUpを押すと最後のアイテムに移動（循環）
    const event1 = new KeyboardEvent('keydown', { key: 'ArrowUp' })
    handleKeyDown(event1)
    expect(activeIndex.value).toBe(2)

    const event2 = new KeyboardEvent('keydown', { key: 'ArrowUp' })
    handleKeyDown(event2)
    expect(activeIndex.value).toBe(1)
  })

  test('disabledなアイテムはスキップされる', () => {
    const { activeIndex, open, handleKeyDown, registerItem } = useDropdownMenu()

    registerItem({ id: 'item-1' })
    registerItem({ id: 'item-2', disabled: true })
    registerItem({ id: 'item-3' })

    open()

    const event1 = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    handleKeyDown(event1)
    expect(activeIndex.value).toBe(0)

    // item-2はdisabledなのでスキップされ、item-3がアクティブになる
    const event2 = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    handleKeyDown(event2)
    expect(activeIndex.value).toBe(2)
  })

  test('Enterキーでアクティブなアイテムが選択される', () => {
    const onSelect = vi.fn()
    const { open, handleKeyDown, registerItem } = useDropdownMenu({
      onSelect,
    })

    const item1 = { id: 'item-1' }
    const item2 = { id: 'item-2' }
    registerItem(item1)
    registerItem(item2)

    open()

    // 最初のアイテムをアクティブにする
    const event1 = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    handleKeyDown(event1)

    // Enterキーで選択
    const event2 = new KeyboardEvent('keydown', { key: 'Enter' })
    handleKeyDown(event2)

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(item1)
  })

  test('Spaceキーでアクティブなアイテムが選択される', () => {
    const onSelect = vi.fn()
    const { open, handleKeyDown, registerItem } = useDropdownMenu({
      onSelect,
    })

    const item1 = { id: 'item-1' }
    registerItem(item1)

    open()

    // 最初のアイテムをアクティブにする
    const event1 = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    handleKeyDown(event1)

    // Spaceキーで選択
    const event2 = new KeyboardEvent('keydown', { key: ' ' })
    handleKeyDown(event2)

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(item1)
  })

  test('Escapeキーでメニューが閉じる', () => {
    const { isOpen, open, handleKeyDown } = useDropdownMenu()

    open()
    expect(isOpen.value).toBe(true)

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    handleKeyDown(event)

    expect(isOpen.value).toBe(false)
  })

  test('Tabキーでメニューが閉じる', () => {
    const { isOpen, open, handleKeyDown } = useDropdownMenu()

    open()
    expect(isOpen.value).toBe(true)

    const event = new KeyboardEvent('keydown', { key: 'Tab' })
    handleKeyDown(event)

    expect(isOpen.value).toBe(false)
  })

  test('トリガーのキーボード操作でメニューが開く', () => {
    const { isOpen, handleTriggerKeyDown, registerItem } = useDropdownMenu()

    registerItem({ id: 'item-1' })

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
    handleTriggerKeyDown(enterEvent)

    expect(isOpen.value).toBe(true)
  })

  test('外部クリックでメニューが閉じる', async () => {
    const { isOpen, open, setTriggerElement, setMenuElement } =
      useDropdownMenu()

    setTriggerElement(mockTriggerElement)
    setMenuElement(mockMenuElement)

    open()

    // nextTickを待ってイベントリスナーが登録されることを確認
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(isOpen.value).toBe(true)

    // 外部要素をクリック
    const outsideElement = document.createElement('div')
    document.body.appendChild(outsideElement)

    const clickEvent = new MouseEvent('click', { bubbles: true })
    Object.defineProperty(clickEvent, 'target', {
      value: outsideElement,
      enumerable: true,
    })
    document.dispatchEvent(clickEvent)

    document.body.removeChild(outsideElement)

    expect(isOpen.value).toBe(false)
  })

  test('メニュー内のクリックではメニューが閉じない', () => {
    const { isOpen, open, setMenuElement } = useDropdownMenu()

    setMenuElement(mockMenuElement)

    open()
    expect(isOpen.value).toBe(true)

    // メニュー内をクリック
    const clickEvent = new MouseEvent('click', { bubbles: true })
    Object.defineProperty(clickEvent, 'target', {
      value: mockMenuElement,
      enumerable: true,
    })
    document.dispatchEvent(clickEvent)

    expect(isOpen.value).toBe(true)
  })

  test('activeItemIdが正しく計算される', () => {
    const { activeItemId, open, handleKeyDown, registerItem } =
      useDropdownMenu()

    registerItem({ id: 'item-1' })
    registerItem({ id: 'item-2' })

    expect(activeItemId.value).toBeUndefined()

    open()

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    handleKeyDown(event)

    expect(activeItemId.value).toBe('item-1')
  })

  test('selectItemByIndexで指定インデックスのアイテムが選択される', () => {
    const onSelect = vi.fn()
    const { open, selectItemByIndex, registerItem } = useDropdownMenu({
      onSelect,
    })

    const item1 = { id: 'item-1' }
    const item2 = { id: 'item-2' }
    registerItem(item1)
    registerItem(item2)

    open()

    selectItemByIndex(1)

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(item2)
  })

  test('disabledなアイテムは選択されない', () => {
    const onSelect = vi.fn()
    const { open, selectItemByIndex, registerItem } = useDropdownMenu({
      onSelect,
    })

    registerItem({ id: 'item-1', disabled: true })

    open()

    selectItemByIndex(0)

    expect(onSelect).not.toHaveBeenCalled()
  })
})
