<script setup lang="ts">
import { tv } from 'tailwind-variants'
import A3Spinner from '~/components/common/A3Spinner.vue'
import NotificationCard from '~/components/common/notification/NotificationCard.vue'

const emit = defineEmits<{
  close: []
}>()

const frameRef = ref<HTMLElement | null>(null)

const { data, status } = useA3Fetch('/api/notifications')

useClickOutside(frameRef, () => {
  console.log('close event')
  emit('close')
})

const frameClasses = tv({
  base: [
    'fixed', //
    'top-16',
    'right-0',
    'mr-2',
    'transition-all',
    'duration-300',
    'bg-default',
    'p-2',
    'w-80',
    'h-screen',
    'drop-shadow-lg',
    'overflow-hidden',
  ],
})
</script>

<template>
  <div ref="frameRef" :class="frameClasses()">
    <div v-if="status === 'pending'" class="flex justify-center p-4">
      <A3Spinner color="gray" size-class="w-8 h-8" />
    </div>
    <div v-else class="flex flex-col gap-3">
      <NotificationCard
        v-for="notification of data"
        :key="notification.id"
        :notification="notification"
      />
    </div>
  </div>
</template>
