<script setup lang="ts">
import { tv } from "tailwind-variants"
import type { A3MenuItemData } from "./a3-menu-item"
import A3PopupMenuList from "~/components/common/A3PopupMenuList.vue"

const props = withDefaults(
  defineProps<{
    value: string | undefined | null
    placeholder?: string
    icon?: string
    menus: A3MenuItemData[]
    disabled?: boolean
  }>(),
  {
    value: undefined,
    placeholder: undefined,
    icon: undefined,
    disabled: false,
  }
)

const classes = tv({
  slots: {
    menu: "border-default-input bg-default-input hover:bg-default-input-hover flex min-h-10 cursor-pointer items-center gap-2 text-nowrap rounded-md border px-3 py-3 transition-colors duration-300",
  },
  variants: {
    disabled: {
      true: {
        menu: "border-disabled bg-disabled text-disabled hover:bg-disabled cursor-not-allowed",
      },
    },
  },
})

const innerValue = ref<string | undefined | null>(props.value)
const labelText = computed(() => {
  return props.menus.find((menu) => menu.value === innerValue.value)?.label
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

function handleMenuClick(value: string) {
  innerValue.value = value
  expanded.value = false
}

function handleCancel() {
  expanded.value = false
}
</script>

<template>
  <div class="flex flex-col gap-0">
    <div
      :class="menuClasses({ disabled: props.disabled })"
      :aria-disabled="disabled"
      @click="handleToggleExpanded"
    >
      <Icon v-if="icon" size="24" :name="icon" class="text-default" />
      <!-- TODO: プレースホルダ用の色定義 -->
      <p v-if="labelText == null" class="text-disabled flex-1">
        {{ placeholder }}
      </p>
      <p v-else class="text-default flex-1">{{ labelText }}</p>
      <Icon name="material-symbols:keyboard-arrow-down" :class="arrowClasses" />
    </div>
    <div class="relative">
      <Transition name="fade">
        <A3PopupMenuList
          v-if="expanded"
          :items="props.menus"
          :stretch="true"
          @click="handleMenuClick"
          @cancel="handleCancel"
        />
      </Transition>
    </div>
  </div>
</template>

<style scoped></style>
