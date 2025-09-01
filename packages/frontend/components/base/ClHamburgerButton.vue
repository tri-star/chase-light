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
    class="inline-flex items-center justify-center p-2 rounded-md text-interactive-default hover:bg-interactive-hovered hover:text-interactive-hovered focus:outline-none focus:ring-2 focus:ring-status-focus-default transition-colors"
    :aria-label="props.ariaLabel"
    :aria-expanded="props.isOpen"
    @click="emit('click')"
  >
    <!-- Hamburger icon -->
    <svg
      class="w-6 h-6"
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
