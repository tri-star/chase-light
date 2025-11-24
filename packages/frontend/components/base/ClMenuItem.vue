<script setup lang="ts">
import type { Ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { DropdownMenuItem } from '~/composables/use-dropdown-menu'

interface Props {
  /**
   * メニューアイテムのタイプ
   * @default 'button'
   */
  type?: 'button' | 'link'
  /**
   * リンク先（type='link'の場合）
   */
  to?: RouteLocationRaw
  /**
   * 外部リンク（type='link'の場合）
   */
  href?: string
  /**
   * 無効化フラグ
   */
  disabled?: boolean
  /**
   * 選択済みフラグ
   */
  selected?: boolean
  /**
   * アイコンスロット用の名前
   */
  icon?: string
  /**
   * アイテムのID（一意である必要がある）
   */
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  to: undefined,
  href: undefined,
  disabled: false,
  selected: false,
  icon: undefined,
  id: undefined,
})

const emit = defineEmits<{
  click: []
}>()

// IDが指定されていない場合は一意なIDを生成
const itemId = props.id || useId()

const dropdownMenu = inject<{
  isOpen: Ref<boolean>
  activeItemId: Ref<string | undefined>
  selectItem: (itemId: string) => void
  registerItem: (item: DropdownMenuItem) => void
  unregisterItem: (itemId: string) => void
}>('dropdownMenu', {
  isOpen: ref(false),
  activeItemId: ref(undefined),
  selectItem: () => {},
  registerItem: () => {},
  unregisterItem: () => {},
})

const elementRef = ref<HTMLElement | null>(null)

onMounted(() => {
  dropdownMenu.registerItem({
    id: itemId,
    disabled: props.disabled,
    element: elementRef.value || undefined,
  })
})

onUnmounted(() => {
  dropdownMenu.unregisterItem(itemId)
})

watch(
  () => props.disabled,
  (disabled) => {
    dropdownMenu.unregisterItem(itemId)
    dropdownMenu.registerItem({
      id: itemId,
      disabled,
      element: elementRef.value || undefined,
    })
  }
)

const isActive = computed(() => dropdownMenu.activeItemId.value === itemId)

const itemClasses = computed(() => {
  const baseClasses =
    'block w-full px-4 py-2 text-sm text-left transition-colors focus:outline-none'

  if (props.disabled) {
    return `${baseClasses} cursor-not-allowed bg-menu-item-disabled text-menu-item-disabled`
  }

  if (props.selected) {
    return `${baseClasses} bg-menu-item-selected text-menu-item-selected border-l-2 border-menu-item-selected`
  }

  if (isActive.value) {
    return `${baseClasses} bg-menu-item-active text-menu-item-active cursor-pointer`
  }

  return `${baseClasses} bg-menu-item-default text-menu-item-default hover:bg-menu-item-hovered hover:text-menu-item-hovered cursor-pointer`
})

const handleClick = (event: Event) => {
  if (props.disabled) {
    event.preventDefault()
    return
  }

  emit('click')
  dropdownMenu.selectItem(itemId)
}

const component = computed(() => {
  if (props.type === 'link' && props.to) {
    return resolveComponent('NuxtLink')
  }
  if (props.type === 'link' && props.href) {
    return 'a'
  }
  return 'button'
})

const componentProps = computed(() => {
  if (props.type === 'link' && props.to) {
    return {
      to: props.to,
      role: 'menuitem',
      'aria-disabled': props.disabled,
      tabindex: -1,
    }
  }
  if (props.type === 'link' && props.href) {
    return {
      href: props.href,
      target: '_blank',
      rel: 'noopener noreferrer',
      role: 'menuitem',
      'aria-disabled': props.disabled,
      tabindex: -1,
    }
  }
  return {
    type: 'button',
    role: props.selected ? 'menuitemcheckbox' : 'menuitem',
    'aria-checked': props.selected ? 'true' : undefined,
    'aria-disabled': props.disabled,
    tabindex: -1,
  }
})
</script>

<template>
  <component
    :is="component"
    :id="itemId"
    ref="elementRef"
    v-bind="componentProps"
    :class="itemClasses"
    @click="handleClick"
  >
    <div class="flex items-center gap-3">
      <slot name="icon" />
      <span class="flex-1">
        <slot />
      </span>
      <slot name="suffix" />
    </div>
  </component>
</template>
