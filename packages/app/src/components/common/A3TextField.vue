<script setup lang="ts">
import { tv } from 'tailwind-variants'
import A3Spinner from './A3Spinner.vue'

const props = withDefaults(
  defineProps<{
    error?: boolean
    disabled?: boolean
    placeHolder?: string
    loading?: boolean
  }>(),
  {
    error: false,
    disabled: false,
    placeHolder: '',
    loading: false,
  }
)

const classes = tv({
  slots: {
    frame: [
      'relative',
      'flex',
      'px-3',
      'py-3',
      'gap-1',
      'rounded-md',
      'border',
      'bg-default-input',
      'border-default-input',
      'transition-all',
      'duration-300',
      'focus-within:outline-1',
      'focus-within:outline-double',
    ],
    input: [
      'w-full',
      'font-label',
      'text-size-m',
      'rounded-md',
      'bg-transparent',
      'outline-none',
    ],
    icon: ['flex', 'items-center'],
  },
  variants: {
    error: {
      true: {
        frame: ['border-alert', 'bg-alert'],
        input: ['text-alert'],
      },
    },
    disabled: {
      true: {
        frame: ['border-disabled', 'bg-disabled'],
        input: ['text-disabled'],
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
    <div v-if="loading" class="flex w-7 items-center">
      <A3Spinner color="gray" />
    </div>
    <div :class="iconClasses()">
      <slot name="tail-icon" :error="error" :disabled="disabled" />
    </div>
  </div>
</template>

<style scoped></style>
