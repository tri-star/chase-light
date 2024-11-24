<script setup lang="ts">
import { tv } from "tailwind-variants"

defineProps<{
  label: string
}>()

const buttonClasses = tv({
  base: [
    "flex",
    "bg-default",
    "hover:bg-default-hover",
    "text-default",
    "rounded",
    "px-4",
    "py-3",
    "gap-1",
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
      primary: ["bg-primary", "hover:bg-primary-hover", "text-primary"],
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
  <button :class="buttonClasses({ type: 'primary' })">
    <span class="font-label text-size-m">{{ label }}</span>
  </button>
</template>

<style scoped></style>
