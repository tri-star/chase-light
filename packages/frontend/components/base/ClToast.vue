<script setup lang="ts">
const intentIcons = {
  success: 'i-heroicons-check-circle-20-solid',
  info: 'i-heroicons-information-circle-20-solid',
  warn: 'i-heroicons-exclamation-triangle-20-solid',
  alert: 'i-heroicons-x-circle-20-solid',
} as const

type Intent = keyof typeof intentIcons

interface Props {
  title?: string
  message: string
  intent?: Intent
  dismissible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  intent: 'info',
  dismissible: true,
})

const emit = defineEmits<{ (e: 'dismiss'): void }>()

const intentAccentClass = computed(() => {
  switch (props.intent) {
    case 'success':
      return 'text-status-success-default'
    case 'warn':
      return 'text-status-warn-default'
    case 'alert':
      return 'text-status-alert-default'
    default:
      return 'text-status-info-default'
  }
})

const intentBorderClass = computed(() => {
  switch (props.intent) {
    case 'success':
      return 'border-status-success-default'
    case 'warn':
      return 'border-status-warn-default'
    case 'alert':
      return 'border-status-alert-default'
    default:
      return 'border-status-info-default'
  }
})

const intentAriaLive = computed(() => {
  if (props.intent === 'alert' || props.intent === 'warn') {
    return 'assertive'
  }
  return 'polite'
})

const handleDismiss = () => {
  emit('dismiss')
}
</script>

<template>
  <div
    class="focus-visible:ring-status-focus-default shadow-black/10
      pointer-events-auto w-full max-w-sm rounded-lg border
      bg-surface-primary-default shadow-lg focus-visible:ring-2
      focus-visible:outline-none"
    role="status"
    :aria-live="intentAriaLive"
  >
    <div class="flex items-start gap-3 p-4">
      <span
        class="text-xl"
        :class="[intentAccentClass, intentIcons[props.intent]]"
        aria-hidden="true"
      />

      <div class="min-w-0 flex-1">
        <p
          v-if="props.title"
          class="text-sm font-semibold text-content-default"
        >
          {{ props.title }}
        </p>
        <p class="text-sm text-content-default/90">
          {{ props.message }}
        </p>
      </div>

      <button
        v-if="props.dismissible"
        type="button"
        class="focus-visible:ring-status-focus-default rounded-md p-1
          text-content-default/70 transition hover:text-content-default
          focus-visible:ring-2 focus-visible:outline-none"
        aria-label="通知を閉じる"
        data-testid="toast-dismiss-button"
        @click="handleDismiss"
      >
        <span class="i-heroicons-x-mark-20-solid h-5 w-5" aria-hidden="true" />
      </button>
    </div>
    <div
      class="h-1 rounded-b-lg"
      :class="intentBorderClass"
      aria-hidden="true"
    />
  </div>
</template>
