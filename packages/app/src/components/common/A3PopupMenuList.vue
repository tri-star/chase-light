<script setup lang="ts">
import A3MenuItem from "~/components/common/A3MenuItem.vue"
import type { A3MenuItemData } from "~/components/common/a3-menu-item"

const menuList = ref<HTMLDivElement | null>(null)

const emit = defineEmits<{
  click: [value: string]
  cancel: []
}>()

const props = withDefaults(
  defineProps<{
    items: A3MenuItemData[]
    stretch?: boolean
  }>(),
  {
    stretch: false,
  }
)

useClickOutSide(menuList, () => {
  emit("cancel")
})

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

function handleMenuClick(payload: string) {
  emit("click", payload)
}
</script>

<template>
  <div
    ref="menuList"
    tabindex="0"
    class="bg-menu-item flex cursor-pointer flex-col gap-2 rounded-md p-1 backdrop-blur-md"
    @keyup.esc="emit('cancel')"
  >
    <A3MenuItem
      v-for="item in items"
      :key="item.value"
      :menu="item"
      @click="handleMenuClick"
    />
  </div>
</template>
