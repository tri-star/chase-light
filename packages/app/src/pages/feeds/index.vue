<script setup lang="ts">
import { SIDE_MENU_ITEM_MAP } from "~/components/common/side-menu/side-menu"
import FeedListPage from "~/features/feed/pages/feed-list/FeedListPage.vue"

definePageMeta({
  allowGuest: false,
  menuId: SIDE_MENU_ITEM_MAP.feeds.id,
})
</script>

<template>
  <FeedListPage />
</template>
