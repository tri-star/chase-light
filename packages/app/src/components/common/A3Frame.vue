<script setup lang="ts">
import { tv } from 'tailwind-variants'

defineProps<{
  title: string
  type: 'default' | 'alert'
}>()

const classes = tv({
  slots: {
    title: ['border-l-4', 'border-default', 'pl-2'],
    bodyFrame: ['bg-card', 'rounded-md', 'p-2', 'drop-shadow-sm'],
  },
  variants: {
    type: {
      default: {
        title: [],
        bodyFrame: [],
      },
      alert: {
        title: ['border-alert'],
        bodyFrame: ['bg-alert', 'rounded-md', 'p-2', 'drop-shadow-sm'],
      },
    },
  },
})

const { bodyFrame, title: titleClasses } = classes()
</script>

<template>
  <section class="border-pri flex flex-col gap-1">
    <h5 :class="titleClasses({ type })">
      {{ title }}
    </h5>
    <article :class="bodyFrame({ type })">
      <slot />
    </article>
  </section>
</template>
