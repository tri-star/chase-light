<script setup lang="ts">
import { tv } from "tailwind-variants"
import A3Spinner from "./A3Spinner.vue"

withDefaults(
  defineProps<{
    label: string
    type?: "primary" | "default"
    loading?: false
    disabled?: boolean
  }>(),
  {
    type: "default",
    loading: false,
    disabled: false,
  }
)

const buttonClasses = tv({
  base: [
    "flex",
    "bg-default",
    "hover:bg-default-hover",
    "text-default",
    "rounded",
    "px-4",
    "py-3",
    "gap-2",
    "justify-center",
    "items-center",
    "shadow-lg",
    "active:shadow-none",
    "transition-all",
    "duration-300",
    "h-min",
    "translate-y-[-4px]",
    "active:translate-y-0",
  ],
  variants: {
    type: {
      default: [],
      primary: ["bg-primary", "hover:bg-primary-hover", "text-primary"],
    },
    loading: {
      true: [
        "bg-disabled",
        "hover:bg-disabled",
        "text-disabled",
        "translate-y-0",
        "shadow-none",
        "cursor-wait",
      ],
    },
    disabled: {
      true: [
        "bg-disabled",
        "hover:bg-disabled",
        "text-disabled",
        "translate-y-0",
        "shadow-none",
        "cursor-not-allowed",
      ],
    },
  },
})
</script>

<template>
  <button :class="buttonClasses({ type, loading, disabled })">
    <A3Spinner v-if="loading" />
    <span class="font-label text-size-m">{{ label }}</span>
  </button>
</template>

<style scoped></style>
