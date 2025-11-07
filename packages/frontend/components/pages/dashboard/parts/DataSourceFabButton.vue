<script setup lang="ts">
import ClFabButton from '~/components/base/ClFabButton.vue'

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>

<template>
  <!-- TODO: ClFabButtonはFABなので、fixedで画面上のどこかで表示するところまではClFabButtonの責務にする。
    - 画面のどの位置に配置するかをpropsで受け付けるようにする
    - z-indexは新しくデザイントークンを設け、fab用のz-index(=1050)を定義する
  -->
  <div
    class="pointer-events-none fixed bottom-5 right-5 z-[1050] sm:bottom-10 sm:right-10"
  >
    <ClFabButton
      data-testid="fab-button"
      class="pointer-events-auto shadow-lg shadow-black/20"
      icon="mdi:plus"
      @click="handleClick"
    />
  </div>
</template>
