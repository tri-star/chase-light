<script setup lang="ts">
import { tv } from "tailwind-variants"

const props = withDefaults(
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

const classes = tv({
  slots: {
    frame: [
      "relative",
      "flex",
      "gap-4",
      "rounded-md",
      "border",
      "bg-default-input",
      "border-default-input",
      "transition-all",
      "duration-300",
    ],
    input: [
      "flex",
      "flex-1",
      "font-label",
      "text-size-m",
      "px-3",
      "py-3",
      "rounded-md",
      "bg-transparent",
    ],
    icon: ["absolute", "right-3", "top-3"],
  },
  variants: {
    error: {
      true: {
        frame: ["border-alert", "bg-alert"],
        input: ["text-alert"],
      },
    },
    disabled: {
      true: {
        frame: ["border-disabled", "bg-disabled"],
        input: ["text-disabled"],
      },
    },
  },
})

const {
  frame: frameClasses,
  input: inputClasses,
  icon: iconClasses,
} = classes({
  error: props.error,
  disabled: props.disabled,
})
</script>

<template>
  <div :class="frameClasses({ error, disabled })">
    <input
      type="text"
      :class="inputClasses({ error, disabled })"
      :placeholder="placeHolder"
      :disabled="disabled"
      v-bind="$attrs"
    />
    <div :class="iconClasses()">
      <slot name="tail-icon" :error="error" :disabled="disabled" />
    </div>
  </div>
</template>

<style scoped></style>
