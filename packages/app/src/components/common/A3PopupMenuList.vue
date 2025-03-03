<script setup lang="ts">
import A3MenuItem from '~/components/common/A3MenuItem.vue'
import type { A3MenuItemData } from '~/components/common/a3-menu-item'

const emit = defineEmits<{
  click: [value: string]
  cancel: []
}>()

const props = withDefaults(
  defineProps<{
    items: A3MenuItemData[]
    selectedValue?: string | null | undefined
    stretch?: boolean
  }>(),
  {
    selectedValue: undefined,
    stretch: false,
  }
)

const menuList = ref<HTMLDivElement | null>(null)
const keyboardSelectedIndex = ref<number | undefined>(
  props.items.findIndex((item) => item.value == props.selectedValue)
)

useClickOutside(menuList, () => {
  emit('cancel')
})

useListKeyboardSelect(
  props.items,
  keyboardSelectedIndex,
  () => {
    if (keyboardSelectedIndex.value == null) {
      return
    }
    emit('click', props.items[keyboardSelectedIndex.value].value)
  },
  () => {
    emit('cancel')
  }
)

onMounted(() => {
  if (menuList.value == null) {
    return
  }
  menuList.value.style.left = ''
  menuList.value.style.top = ''

  let listWidth = menuList.value.offsetWidth
  if (props.stretch) {
    const parentWidth = menuList.value.parentElement?.offsetWidth ?? 0
    listWidth = Math.max(listWidth, parentWidth)
  }
  menuList.value.style.width = `${listWidth}px`

  // 画面からはみ出さないように位置を調整
  nextTick(() => {
    adjustMenuPosition()
  })
})

// ウィンドウリサイズ時にも位置を調整
onMounted(() => {
  window.addEventListener('resize', adjustMenuPosition)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', adjustMenuPosition)
})

// メニューの位置を画面内に収まるように調整
// 今後同様のロジックが増える場合はcomposable化を検討
function adjustMenuPosition() {
  if (!menuList.value) return

  // 現在の位置を取得
  const menuRect = menuList.value.getBoundingClientRect()

  // 画面の端からのマージン
  const margin = 8

  // 右端からはみ出す場合
  if (menuRect.right > window.innerWidth - margin) {
    const overflowX = menuRect.right - window.innerWidth + margin
    menuList.value.style.left = `${menuRect.left - overflowX}px`
  }

  // 左端からはみ出す場合
  if (menuRect.left < margin) {
    menuList.value.style.left = `${margin}px`
  }

  // 下端からはみ出す場合
  if (menuRect.bottom > window.innerHeight - margin) {
    const overflowY = menuRect.bottom - window.innerHeight + margin
    menuList.value.style.top = `${menuRect.top - overflowY}px`
  }

  // 上端からはみ出す場合
  if (menuRect.top < margin) {
    menuList.value.style.top = `${margin}px`
  }
}

function isActive(index: number) {
  return index === keyboardSelectedIndex.value
}

function handleMenuClick(payload: string) {
  keyboardSelectedIndex.value = props.items.findIndex(
    (item) => item.value === payload
  )
  emit('click', payload)
}
</script>

<template>
  <div
    ref="menuList"
    tabindex="0"
    class="bg-menu-item border-menu absolute flex cursor-pointer flex-col gap-2 whitespace-nowrap rounded-md border p-1 drop-shadow-md backdrop-blur-md"
    @keyup.esc="emit('cancel')"
  >
    <A3MenuItem
      v-for="(item, i) in items"
      :key="item.value"
      :menu="item"
      :active="isActive(i)"
      @click="handleMenuClick"
    />
  </div>
</template>
