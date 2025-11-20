<script setup lang="ts">
import ClToast from '~/components/base/ClToast.vue'
import ClLayoutDefault from '~/components/base/layouts/default/ClLayoutDefault.vue'
const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)
</script>

<template>
  <ClLayoutDefault>
    <slot />
    <div>
      <ClToast
        v-for="toast in toasts"
        :id="toast.id"
        :key="toast.id"
        :type="toast.type"
        :duration="toast.durationMs"
        :message="toast.message"
        :bottom-y="toast.bottomY"
        @destroy="toastStore.handleDestroyToast"
      />
    </div>
  </ClLayoutDefault>
</template>
