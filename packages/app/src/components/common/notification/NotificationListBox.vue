<script setup lang="ts">
import { tv } from 'tailwind-variants'
import A3Spinner from '~/components/common/A3Spinner.vue'
import NotificationCard from '~/components/common/notification/NotificationCard.vue'

const emit = defineEmits<{
  close: []
}>()

const frameRef = ref<HTMLElement | null>(null)

const { data, status, refresh } = useA3Fetch('/api/notifications')

useClickOutside(frameRef, () => {
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

// 既読処理
const markAsRead = async () => {
  if (data.value?.result && data.value.result.length > 0) {
    const unreadNotifications = data.value.result.filter(
      (notification) => !notification.read
    )
    if (unreadNotifications.length === 0) return

    const notificationIds = unreadNotifications.map(
      (notification) => notification.id
    )

    try {
      await $fetch('/api/notifications/mark-as-read', {
        method: 'POST',
        body: {
          notificationIds,
        },
      })
      // データを更新
      refresh()
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  }
}

// コンポーネントが表示されたとき
onMounted(() => {
  // ステータスがdoneになったら（データロード完了）、既読処理を実行
  watch(
    () => status.value,
    (newStatus) => {
      if (newStatus === 'success') {
        // 少し時間を空けて既読にする
        setTimeout(() => {
          markAsRead()
        }, 500)
      }
    },
    { immediate: true }
  )
})
</script>

<template>
  <div ref="frameRef" :class="frameClasses()">
    <div v-if="status === 'pending'" class="flex justify-center p-4">
      <A3Spinner color="gray" size-class="w-8 h-8" />
    </div>
    <div v-else-if="data != null" class="flex flex-col gap-3">
      <NotificationCard
        v-for="notification of data.result"
        :key="notification.id"
        :notification="notification"
      />
    </div>
  </div>
</template>
