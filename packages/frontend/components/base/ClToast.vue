<script setup lang="ts">
import { tv } from 'tailwind-variants'

const props = withDefaults(
  defineProps<{
    id: string
    type?: 'success' | 'alert'
    message: string
    duration?: number
    bottomY?: number
  }>(),
  {
    type: 'success',
    duration: 5000,
    bottomY: 16,
  }
)

const emit = defineEmits<{
  destroy: [id: string]
}>()

const toastRef = ref<HTMLElement | null>(null)
const state = ref<'initial' | 'enter' | 'leave'>('initial')
const left = ref(0)

const variant = tv({
  base: [
    'block',
    'fixed',
    'sm:max-w-md',
    'max-w-lg',
    'rounded-md',
    'drop-shadow-md',
    'min-h-12',
    'p-6',
    'whitespace-pre',
    'duration-300',
    'transform',
    'ease-in-out',
  ],
  variants: {
    type: {
      success: [
        'bg-status-success-default',
        'border-status-success-default',
        'text-status-success-default',
      ],
      alert: [
        'bg-status-alert-default',
        'border-status-alert-default',
        'text-status-alert-default',
      ],
    },
    state: {
      initial: ['translate-y-32', 'opacity-0'],
      enter: ['translate-y-0', 'opacity-100'],
      leave: ['translate-y-32', 'translate-x-8', 'opacity-0'],
    },
  },
})

const positionStyles = computed(() => {
  // left: 0px がDOMに反映されるとアニメーションがleft:0からスタートしてしまうので、
  // leftが1以上の時にstyleに反映されるようにする
  const styles: Record<string, string> = {
    bottom: `${props.bottomY}px`,
  }
  if (left.value) {
    styles['left'] = `${left.value}px`
  }
  return styles
})

let timerId: NodeJS.Timeout | undefined = undefined

onMounted(() => {
  setTimeout(() => {
    if (toastRef.value == null) {
      return
    }
    state.value = 'enter'

    const windowWidth = window.innerWidth
    const toastWidth = toastRef.value.clientWidth
    left.value = (windowWidth - toastWidth) / 2
  })

  timerId = setTimeout(() => {
    state.value = 'leave'
    setTimeout(() => {
      emit('destroy', props.id)
    }, 300)
  }, props.duration)
})

onBeforeUnmount(() => {
  clearTimeout(timerId)
})
</script>

<template>
  <div
    :id="id"
    ref="toastRef"
    role="status"
    :aria-live="type === 'alert' ? 'assertive' : 'polite'"
    :class="variant({ type, state })"
    :style="positionStyles"
  >
    {{ message }}
  </div>
</template>
