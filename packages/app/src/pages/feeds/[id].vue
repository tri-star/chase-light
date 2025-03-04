<script setup lang="ts">
// フィード詳細ページのエントリーポイント
import { SIDE_MENU_ITEM_MAP } from '~/components/common/side-menu/side-menu'
import FeedDetailPage from '~/components/pages/feed-detail/FeedDetailPage.vue'

definePageMeta({
  allowGuest: false,
  menuId: SIDE_MENU_ITEM_MAP.feeds.id,
})

// URLからフィードIDを取得
const route = useRoute()
const feedId = route.params.id as string
</script>

<template>
  <FeedDetailPage :feed-id="feedId" />
</template>
