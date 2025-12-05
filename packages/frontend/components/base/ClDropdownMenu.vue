<script setup lang="ts">
import type { UseDropdownMenuOptions } from '~/composables/use-dropdown-menu'

interface Props {
  /**
   * メニューの表示位置（コンテキストメニュー用）
   * 未指定の場合はトリガー要素の直下に表示
   */
  position?: { x: number; y: number }
  /**
   * メニューの配置位置
   * @default 'bottom-right'
   */
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  /**
   * メニューのラベル（スクリーンリーダー用）
   */
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'bottom-right',
  position: undefined,
  ariaLabel: undefined,
})

const emit = defineEmits<{
  open: []
  close: []
  select: [itemId: string]
}>()

const menuId = useId()
const triggerId = useId()

const options: UseDropdownMenuOptions = {
  onOpen: () => emit('open'),
  onClose: () => emit('close'),
  onSelect: (item) => emit('select', item.id),
}

const {
  isOpen,
  activeItemId,
  open,
  close,
  toggle,
  handleKeyDown,
  handleTriggerKeyDown,
  setTriggerElement,
  setMenuElement,
  registerItem,
  unregisterItem,
} = useDropdownMenu(options)

const menuRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const adjustedPosition = ref<{ left?: string; right?: string } | null>(null)

// トリガー要素を設定し、内部refも保持
const handleTriggerRef = (el: HTMLElement | null) => {
  triggerRef.value = el
  setTriggerElement(el)
}

// メニューの位置を画面境界内に調整
const adjustMenuPosition = async () => {
  await nextTick()

  if (!menuRef.value || !triggerRef.value) {
    adjustedPosition.value = null
    return
  }

  const menuRect = menuRef.value.getBoundingClientRect()
  const triggerRect = triggerRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const padding = 8 // 画面端からの最小余白

  // 現在の配置に基づいて位置を調整
  const isRightAligned = props.placement.includes('right')

  if (isRightAligned) {
    // 右寄せの場合：左端がはみ出していないかチェック
    if (menuRect.left < padding) {
      // 左端がはみ出している場合、左寄せに変更
      adjustedPosition.value = {
        left: '0',
        right: 'auto',
      }
    } else {
      adjustedPosition.value = null
    }
  } else {
    // 左寄せの場合：右端がはみ出していないかチェック
    if (menuRect.right > viewportWidth - padding) {
      // 右端がはみ出している場合、右寄せに変更
      adjustedPosition.value = {
        left: 'auto',
        right: '0',
      }
    } else {
      adjustedPosition.value = null
    }
  }

  // メニュー幅が画面幅を超える場合、幅を制限
  if (menuRect.width > viewportWidth - padding * 2) {
    const maxWidth = viewportWidth - padding * 2
    menuRef.value.style.maxWidth = `${maxWidth}px`
    // 中央に配置
    const leftOffset = Math.max(
      padding,
      triggerRect.left - (maxWidth - triggerRect.width) / 2
    )
    adjustedPosition.value = {
      left: `${leftOffset - triggerRect.left}px`,
      right: 'auto',
    }
  }
}

watch(menuRef, (el) => {
  if (el) {
    setMenuElement(el)
    adjustMenuPosition()
  }
})

// メニューが開いたときに位置を調整
watch(isOpen, (open) => {
  if (open) {
    adjustMenuPosition()
  } else {
    adjustedPosition.value = null
  }
})

// トリガー要素に適用するprops
const triggerProps = computed(() => ({
  id: triggerId,
  'aria-haspopup': true,
  'aria-expanded': isOpen.value,
  'aria-controls': menuId,
}))

// トリガー要素に適用するイベント
const triggerEvents = {
  onClick: toggle,
  onKeydown: handleTriggerKeyDown,
}

const menuStyle = computed(() => {
  if (props.position) {
    return {
      position: 'fixed' as const,
      left: `${props.position.x}px`,
      top: `${props.position.y}px`,
    }
  }

  // 調整された位置がある場合、それを適用
  if (adjustedPosition.value) {
    return adjustedPosition.value
  }

  return {}
})

const placementClasses = computed(() => {
  const baseClasses = 'absolute z-50 mt-2'

  // 調整された位置がある場合、配置クラスを変更
  if (adjustedPosition.value) {
    const verticalPlacement = props.placement.includes('top')
      ? 'bottom-full mb-2'
      : ''
    const origin = props.placement.includes('top')
      ? 'origin-bottom-left'
      : 'origin-top-left'
    return `${baseClasses} ${verticalPlacement} ${origin}`
  }

  const alignments = {
    'bottom-right': 'right-0 origin-top-right',
    'bottom-left': 'left-0 origin-top-left',
    'top-right': 'right-0 bottom-full mb-2 origin-bottom-right',
    'top-left': 'left-0 bottom-full mb-2 origin-bottom-left',
  }
  return `${baseClasses} ${alignments[props.placement] || alignments['bottom-right']}`
})

// ClMenuItem用のコンテキストを提供
provide('dropdownMenu', {
  isOpen,
  activeItemId,
  selectItem: (itemId: string) => {
    emit('select', itemId)
    close()
  },
  registerItem,
  unregisterItem,
})
</script>

<template>
  <div class="relative">
    <!-- トリガースロット -->
    <slot
      name="trigger"
      :is-open="isOpen"
      :trigger-props="triggerProps"
      :trigger-events="triggerEvents"
      :trigger-ref="handleTriggerRef"
      :toggle="toggle"
      :open="open"
      :close="close"
    />

    <!-- ドロップダウンメニュー -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        :id="menuId"
        ref="menuRef"
        role="menu"
        tabindex="-1"
        :aria-labelledby="ariaLabel ? undefined : triggerId"
        :aria-label="ariaLabel"
        :aria-activedescendant="activeItemId"
        :class="placementClasses"
        :style="menuStyle"
        class="w-64 max-w-[calc(100vw-1rem)] rounded-lg border
          border-menu-default bg-menu-default text-menu-default shadow-lg
          backdrop-blur-md"
        @keydown="handleKeyDown"
      >
        <div class="py-1">
          <slot :close="close" />
        </div>
      </div>
    </Transition>
  </div>
</template>
