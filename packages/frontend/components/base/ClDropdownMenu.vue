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

watch(menuRef, (el) => {
  if (el) setMenuElement(el)
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
  return {}
})

const placementClasses = computed(() => {
  const baseClasses = 'absolute z-50 mt-2'
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
      :trigger-ref="setTriggerElement"
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
        class="w-64 rounded-lg border border-menu-default bg-menu-default
          text-menu-default shadow-lg backdrop-blur-md"
        @keydown="handleKeyDown"
      >
        <div class="py-1">
          <slot :close="close" />
        </div>
      </div>
    </Transition>
  </div>
</template>
