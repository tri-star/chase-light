<script setup lang="ts">
import A3Button from "~/components/common/A3Button.vue"
import A3RadioButton from "~/components/common/A3RadioButton.vue"
import A3TextField from "~/components/common/A3TextField.vue"
import { SIDE_MENU_ITEM_MAP } from "~/components/common/side-menu/side-menu"

const name = ref("")
const cycle = ref<string[]>([])

definePageMeta({
  allowGuest: false,
  menuId: SIDE_MENU_ITEM_MAP.feeds.id,
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="flex-1">フィード登録</h1>

    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <label class="text-size-h5 font-heading font-bold">フィード名</label>
        <div class="flex gap-2 items-center">
          <A3TextField v-model="name" class="flex-1" />
          <A3Button label="URLから自動入力" :disabled="true" />
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-size-h5 font-heading font-bold">URL</label>
        <A3TextField v-model="name" class="flex-1" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-size-h5 font-heading font-bold">通知サイクル</label>
        <div class="flex flex-col gap-2">
          <A3RadioButton name="cycle" v-model="cycle" label="日次" />
          <A3RadioButton name="cycle" v-model="cycle" label="週次" />
        </div>
      </div>
      <div class="flex gap-4 justify-center">
        <A3Button label="登録" type="primary" class="w-40" />
        <A3Button label="キャンセル" type="default" class="w-40" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
