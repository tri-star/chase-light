<script setup lang="ts">
import { tv } from 'tailwind-variants'

defineProps<{
  name: string
  disabled: boolean
  error: boolean
}>()

const classes = tv({
  base: ['text-default'],
  variants: {
    error: {
      true: ['text-alert'],
    },
    disabled: {
      true: ['text-disabled'],
    },
  },
})
</script>

<template>
  <Icon :name="name" :class="classes({ error, disabled })" size="24"> </Icon>
</template>
