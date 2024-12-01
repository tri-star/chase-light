<script setup lang="ts">
import { tv } from "tailwind-variants"
import type { A3MenuItemData } from "./a3-menu-item"
import A3PopupMenuList from "~/components/common/A3PopupMenuList.vue"

const props = withDefaults(
  defineProps<{
    placeholder?: string
    menus: A3MenuItemData[]
    disabled?: boolean
  }>(),
  {
    placeholder: undefined,
    disabled: false,
  }
)

const classes = tv({
  slots: {
    menu: "border-default-input bg-default-input hover:bg-default-input-hover flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-4 py-2 transition-colors duration-300",
  },
  variants: {
    disabled: {
      true: {
        menu: "border-disabled bg-disabled text-disabled hover:bg-disabled cursor-not-allowed",
      },
    },
  },
})

const expanded = ref(false)

const arrowClasses = computed(() => {
  const className = " text-default transition-all duration-300"
  const effectClass = !expanded.value ? "transform rotate-180" : ""
  return `${className} ${effectClass}`
})

const { menu: menuClasses } = classes({ disabled: props.disabled })

function handleToggleExpanded() {
  if (props.disabled) {
    return
  }
  expanded.value = !expanded.value
}
</script>

<template>
  <div class="flex flex-col gap-0">
    <div
      :class="menuClasses({ disabled: props.disabled })"
      :aria-disabled="disabled"
      @click="handleToggleExpanded"
    >
      <p v-if="placeholder" class="text-disabled flex-1">{{ placeholder }}</p>
      <p v-else class="text-default flex-1">text</p>
      <Icon name="material-symbols:keyboard-arrow-down" :class="arrowClasses" />
    </div>
    <div class="relative">
      <A3PopupMenuList :open="expanded" :items="props.menus" />
    </div>
  </div>
</template>

<style scoped></style>
