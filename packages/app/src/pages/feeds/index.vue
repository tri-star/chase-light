<script setup lang="ts">
import A3Button from "~/components/common/A3Button.vue"
import { SIDE_MENU_ITEM_MAP } from "~/components/common/side-menu/side-menu"

const router = useRouter()

definePageMeta({
  allowGuest: false,
  menuId: SIDE_MENU_ITEM_MAP.feeds.id,
})

const { data: feeds } = useFetch("/api/feeds")

function handleAddFeedClick() {
  router.push({ path: "/feeds/new" })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center">
      <h1 class="flex-1">フィード一覧</h1>
      <A3Button
        label="フィード登録"
        type="primary"
        @click="handleAddFeedClick"
      />
    </div>

    <div class="flex flex-col items-center gap-4">
      <li v-for="feed in feeds?.result ?? []" :key="feed.id">
        {{ feed.name }}
      </li>
    </div>
  </div>
</template>
