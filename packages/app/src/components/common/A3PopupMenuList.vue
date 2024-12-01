<script setup lang="ts">
import A3MenuItem from "~/components/common/A3MenuItem.vue"
import type { A3MenuItemData } from "~/components/common/a3-menu-item"

const isOpen = defineModel<boolean>("open")
const menuList = ref<HTMLDivElement | null>(null)

const props = withDefaults(
  defineProps<{
    items: A3MenuItemData[]
    stretch?: boolean
  }>(),
  {
    stretch: false,
  }
)

watch(isOpen, (newValue) => {
  if (menuList.value == null) {
    return
  }
  if (newValue) {
    menuList.value.style.left = ""
    menuList.value.style.top = ""

    let listWidth = menuList.value.offsetWidth
    if (props.stretch) {
      const parentWidth = menuList.value.parentElement?.offsetWidth ?? 0
      listWidth = Math.max(listWidth, parentWidth)
    }
    menuList.value.style.width = `${listWidth}px`
  }
})

function handleMenuClick() {
  isOpen.value = false
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      ref="menuList"
      class="bg-menu-item flex cursor-pointer flex-col gap-2 rounded-md p-1 backdrop-blur-md"
      @click="handleMenuClick"
    >
      <A3MenuItem v-for="item in items" :key="item.value" :menu="item" />
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
