<script setup lang="ts">
import A3Button from '~/components/common/A3Button.vue';
import { SIDE_MENU_ITEM_MAP } from '~/components/common/side-menu/side-menu'
import LogCard from '~/components/feed/LogCard.vue'

definePageMeta({
  allowGuest: false,
  menuId: SIDE_MENU_ITEM_MAP.dashboard.id,
})

const { data: feedLogs } = useFetch('/api/feeds/logs')
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center">
      <h1 class="flex-1">新着情報</h1>
      <A3Button label="フィード登録" />
    </div>

    <div class="flex flex-col items-center gap-4">
      <LogCard
        v-for="feedLog in feedLogs?.result ?? []"
        :feed-log="feedLog"
        :key="feedLog.id"
      />
    </div>
  </div>
</template>
