<script setup lang="ts">
// フィード詳細ページのエントリーポイント
import FeedDetailPage from '~/components/pages/feed-detail/FeedDetailPage.vue'

// URLからフィードIDを取得
const route = useRoute()
const feedId = route.params.id as string
</script>

<template>
  <FeedDetailPage :feed-id="feedId" />
</template>