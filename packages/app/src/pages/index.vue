<script setup lang="ts">
import A3Button from "~/components/common/A3Button.vue"
import { SIDE_MENU_ITEM_MAP } from "~/components/common/side-menu/side-menu"
import LogCard from "~/components/feed/LogCard.vue"

const router = useRouter()

definePageMeta({
  allowGuest: false,
  menuId: SIDE_MENU_ITEM_MAP.dashboard.id,
})

const { data: feedLogs } = useA3Fetch("/api/feeds/logs")

function handleAddFeedClick() {
  router.push({ path: "/feeds/new" })
}
</script>

<template>
  <div
    class="bg-default flex flex-col rounded-2xl p-4 md:w-[600px] lg:w-[800px]"
  >
    <div class="flex flex-col gap-6">
      <div class="flex items-center">
        <h1 class="flex-1">新着情報</h1>
        <A3Button
          label="フィード登録"
          type="primary"
          @click="handleAddFeedClick"
        />
      </div>

      <div class="flex flex-col items-center gap-4">
        <LogCard
          v-for="feedLog in feedLogs?.result ?? []"
          :key="feedLog.id"
          :feed-log="feedLog"
        />
      </div>
    </div>
  </div>
</template>
