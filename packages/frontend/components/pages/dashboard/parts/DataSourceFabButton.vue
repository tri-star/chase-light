<script setup lang="ts">
import ClFabButton from '~/components/base/ClFabButton.vue'

interface Props {
  label?: string
  size?: 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  label: 'データソースを追加',
  size: 'md',
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>

<template>
  <div
    class="pointer-events-none fixed bottom-5 right-5 z-[1050] sm:bottom-10 sm:right-10"
  >
    <ClFabButton
      class="pointer-events-auto shadow-lg shadow-black/20"
      :label="props.label"
      :size="props.size"
      @click="handleClick"
    />
  </div>
</template>
