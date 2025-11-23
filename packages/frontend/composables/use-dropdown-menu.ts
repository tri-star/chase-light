import type { Ref } from 'vue'

export interface DropdownMenuItem {
  id: string
  disabled?: boolean
  element?: HTMLElement
}

export interface UseDropdownMenuOptions {
  /**
   * メニューが開いたときのコールバック
   */
  onOpen?: () => void
  /**
   * メニューが閉じたときのコールバック
   */
  onClose?: () => void
  /**
   * メニューアイテムが選択されたときのコールバック
   */
  onSelect?: (item: DropdownMenuItem) => void
}

export const useDropdownMenu = (options: UseDropdownMenuOptions = {}) => {
  // 状態管理
  const isOpen = ref(false)
  const activeIndex = ref(-1)
  const items = ref<DropdownMenuItem[]>([])
  const triggerElement = ref<HTMLElement | null>(null)
  const menuElement = ref<HTMLElement | null>(null)

  // アクティブなアイテムID（aria-activedescendant用）
  const activeItemId = computed(() => {
    if (activeIndex.value >= 0 && activeIndex.value < items.value.length) {
      return items.value[activeIndex.value].id
    }
    return undefined
  })

  /**
   * メニューを開く
   */
  const open = () => {
    if (isOpen.value) return

    isOpen.value = true
    activeIndex.value = -1
    options.onOpen?.()

    // 次のティックでイベントリスナーを設定（メニューのDOMが確実に存在するように）
    nextTick(() => {
      if (import.meta.client) {
        document.addEventListener('click', handleClickOutside)
        document.addEventListener('scroll', handleScroll, true)
      }
    })
  }

  /**
   * メニューを閉じる
   */
  const close = () => {
    if (!isOpen.value) return

    isOpen.value = false
    activeIndex.value = -1
    options.onClose?.()

    // イベントリスナーを解除
    if (import.meta.client) {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('scroll', handleScroll, true)
    }

    // トリガーにフォーカスを戻す
    nextTick(() => {
      triggerElement.value?.focus()
    })
  }

  /**
   * メニューの開閉をトグル
   */
  const toggle = () => {
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }

  /**
   * メニューアイテムを登録
   */
  const registerItem = (item: DropdownMenuItem) => {
    items.value.push(item)
  }

  /**
   * メニューアイテムを解除
   */
  const unregisterItem = (itemId: string) => {
    items.value = items.value.filter((item) => item.id !== itemId)
  }

  /**
   * すべてのアイテムを解除
   */
  const clearItems = () => {
    items.value = []
  }

  /**
   * 次の有効なアイテムのインデックスを取得
   */
  const getNextEnabledIndex = (currentIndex: number): number => {
    const totalItems = items.value.length
    if (totalItems === 0) return -1

    let nextIndex = currentIndex + 1
    for (let i = 0; i < totalItems; i++) {
      if (nextIndex >= totalItems) {
        nextIndex = 0 // 循環
      }
      if (!items.value[nextIndex].disabled) {
        return nextIndex
      }
      nextIndex++
    }
    return currentIndex // すべて無効な場合は現在のインデックスを返す
  }

  /**
   * 前の有効なアイテムのインデックスを取得
   */
  const getPreviousEnabledIndex = (currentIndex: number): number => {
    const totalItems = items.value.length
    if (totalItems === 0) return -1

    let prevIndex = currentIndex - 1
    for (let i = 0; i < totalItems; i++) {
      if (prevIndex < 0) {
        prevIndex = totalItems - 1 // 循環
      }
      if (!items.value[prevIndex].disabled) {
        return prevIndex
      }
      prevIndex--
    }
    return currentIndex // すべて無効な場合は現在のインデックスを返す
  }

  /**
   * キーボードハンドラ（メニュー用）
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isOpen.value) return

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault()
        activeIndex.value = getNextEnabledIndex(activeIndex.value)
        break
      }
      case 'ArrowUp': {
        event.preventDefault()
        activeIndex.value = getPreviousEnabledIndex(activeIndex.value)
        break
      }
      case 'Enter':
      case ' ': {
        event.preventDefault()
        if (activeIndex.value >= 0 && activeIndex.value < items.value.length) {
          const item = items.value[activeIndex.value]
          if (!item.disabled) {
            options.onSelect?.(item)
            close()
          }
        }
        break
      }
      case 'Escape': {
        event.preventDefault()
        close()
        break
      }
      case 'Tab': {
        // Tabキーでメニューを閉じる（フォーカストラップ）
        close()
        break
      }
      default:
        break
    }
  }

  /**
   * トリガー用キーボードハンドラ
   */
  const handleTriggerKeyDown = (event: KeyboardEvent) => {
    if (isOpen.value) return

    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown': {
        event.preventDefault()
        open()
        // メニューを開いた後、最初の有効なアイテムをアクティブにする
        nextTick(() => {
          activeIndex.value = getNextEnabledIndex(-1)
        })
        break
      }
      default:
        break
    }
  }

  /**
   * 外部クリックハンドラ
   */
  const handleClickOutside = (event: MouseEvent) => {
    if (!isOpen.value) return

    const target = event.target as Node
    const isInsideMenu = menuElement.value?.contains(target)
    const isInsideTrigger = triggerElement.value?.contains(target)

    if (!isInsideMenu && !isInsideTrigger) {
      close()
    }
  }

  /**
   * スクロールハンドラ
   */
  const handleScroll = (_event: Event) => {
    // スクロールが発生したらメニューを閉じる
    // （メニューの位置がずれることを防ぐため）
    close()
  }

  /**
   * インデックスでアイテムを選択
   */
  const selectItemByIndex = (index: number) => {
    if (index >= 0 && index < items.value.length) {
      const item = items.value[index]
      if (!item.disabled) {
        options.onSelect?.(item)
        close()
      }
    }
  }

  /**
   * トリガー要素を設定
   */
  const setTriggerElement = (element: HTMLElement | null) => {
    triggerElement.value = element
  }

  /**
   * メニュー要素を設定
   */
  const setMenuElement = (element: HTMLElement | null) => {
    menuElement.value = element
  }

  // クリーンアップ
  onUnmounted(() => {
    if (import.meta.client) {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('scroll', handleScroll, true)
    }
  })

  return {
    // 状態
    isOpen: readonly(isOpen) as Readonly<Ref<boolean>>,
    activeIndex: readonly(activeIndex) as Readonly<Ref<number>>,
    activeItemId: readonly(activeItemId) as Readonly<Ref<string | undefined>>,
    items: readonly(items) as Readonly<Ref<DropdownMenuItem[]>>,

    // メソッド
    open,
    close,
    toggle,
    registerItem,
    unregisterItem,
    clearItems,
    handleKeyDown,
    handleTriggerKeyDown,
    selectItemByIndex,
    setTriggerElement,
    setMenuElement,
  }
}
