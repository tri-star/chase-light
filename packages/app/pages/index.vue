<script setup lang="ts">
import { SIDE_MENU_ITEM_MAP } from '~/components/common/side-menu/side-menu'
import LogCard from '~/components/feed/LogCard.vue'

definePageMeta({
  allowGuest: false,
  menuId: SIDE_MENU_ITEM_MAP.dashboard.id,
})

const { data: feedLogs } = useFetch('/api/feeds/logs')
</script>

<template>
  <h1>新着情報</h1>

  <div class="flex flex-col items-center gap-4">
    <LogCard
      v-for="feedLog in feedLogs?.feedLogs ?? []"
      :feed-log="feedLog"
      :key="feedLog.id"
    />
  </div>
</template>
