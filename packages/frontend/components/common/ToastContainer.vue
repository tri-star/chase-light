<script setup lang="ts">
import { computed } from 'vue'
import ClToast from '~/components/base/ClToast.vue'
import { useToast } from '~/composables/use-toast'

const toastStore = useToast()
const toasts = computed(() => toastStore.toasts.value)
const hasToasts = computed(() => toasts.value.length > 0)

const handleDismiss = (id: string) => {
  toastStore.dismissToast(id)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="hasToasts"
      class="pointer-events-none fixed inset-x-0 top-0 z-[1100] flex flex-col items-end gap-3 px-4 py-6 sm:px-6 sm:py-8"
      aria-live="assertive"
      aria-atomic="true"
      role="region"
    >
      <TransitionGroup
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 -translate-y-3"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-3"
        tag="div"
        class="flex w-full flex-col items-end gap-3"
      >
        <ClToast
          v-for="toast in toasts"
          :key="toast.id"
          :title="toast.title"
          :message="toast.message"
          :intent="toast.intent"
          :dismissible="toast.dismissible"
          class="pointer-events-auto"
          @dismiss="handleDismiss(toast.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>
