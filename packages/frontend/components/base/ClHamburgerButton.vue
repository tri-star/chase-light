<script setup lang="ts">
interface Props {
  isOpen?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  ariaLabel: 'メニューを開閉',
})

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <button
    type="button"
    class="focus:ring-status-focus-default inline-flex items-center
      justify-center rounded-md p-2 text-interactive-default transition-colors
      hover:bg-interactive-hovered hover:text-interactive-hovered focus:ring-2
      focus:outline-none"
    :aria-label="props.ariaLabel"
    :aria-expanded="props.isOpen"
    @click="emit('click')"
  >
    <!-- Hamburger icon -->
    <svg
      class="h-6 w-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        v-if="!props.isOpen"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 6h16M4 12h16M4 18h16"
      />
      <path
        v-else
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>
</template>
