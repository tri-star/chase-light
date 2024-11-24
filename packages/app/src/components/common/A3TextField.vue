<script setup lang="ts">
import { tv } from "tailwind-variants"

withDefaults(
  defineProps<{
    error?: boolean
    disabled?: boolean
    placeHolder?: string
  }>(),
  {
    error: false,
    disabled: false,
    placeHolder: "",
  }
)

const value = defineModel()

const inputClasses = tv({
  base: [
    "flex",
    "px-3",
    "py-3",
    "gap-4",
    "rounded-md",
    "border",
    "bg-default-input",
    "border-default-input",
    "font-label",
    "text-size-m",
    "transition-all",
    "duration-300",
  ],
  variants: {
    error: {
      true: ["border-alert", "bg-alert", "text-alert"],
    },
    disabled: {
      true: ["border-disabled", "bg-disabled", "text-disabled"],
    },
  },
})
</script>

<template>
  <input
    type="text"
    :class="inputClasses({ error, disabled })"
    v-model="value"
    :placeholder="placeHolder"
  />
</template>

<style scoped></style>
