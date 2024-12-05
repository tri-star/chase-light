<script setup lang="ts">
import A3MenuItem from "~/components/common/A3MenuItem.vue"
import type { A3MenuItemData } from "~/components/common/a3-menu-item"

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

useClickOutSide(menuList, () => {
  emit("cancel")
})

useListKeyboardSelect(
  props.items,
  keyboardSelectedIndex,
  () => {
    if (keyboardSelectedIndex.value == null) {
      return
    }
    emit("click", props.items[keyboardSelectedIndex.value].value)
  },
  () => {
    emit("cancel")
  }
)

onMounted(() => {
  if (menuList.value == null) {
    return
  }
  menuList.value.style.left = ""
  menuList.value.style.top = ""

  let listWidth = menuList.value.offsetWidth
  if (props.stretch) {
    const parentWidth = menuList.value.parentElement?.offsetWidth ?? 0
    listWidth = Math.max(listWidth, parentWidth)
  }
  menuList.value.style.width = `${listWidth}px`
})

function isActive(index: number) {
  return index === keyboardSelectedIndex.value
}

function handleMenuClick(payload: string) {
  keyboardSelectedIndex.value = props.items.findIndex(
    (item) => item.value === payload
  )
  emit("click", payload)
}
</script>

<template>
  <div
    ref="menuList"
    tabindex="0"
    class="bg-menu-item border-menu absolute flex cursor-pointer flex-col gap-2 rounded-md border p-1 drop-shadow-md backdrop-blur-md"
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
