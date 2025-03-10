<script setup lang="ts">
import type { Feed } from '~/features/feed/domain/feed'
import FeedListRow from './FeedListRow.vue'

defineProps<{
  feeds: Feed[]
}>()
</script>

<template>
  <table class="w-full">
    <thead>
      <tr class="border-menu bg-list border-b">
        <th class="w-10"></th>
        <th class="p-3 text-left">名前</th>
        <th class="hidden w-36 p-3 md:table-cell">最新ログ日付</th>
        <th class="hidden w-36 p-3 md:table-cell">更新日時</th>
        <th class="hidden w-36 p-3 md:table-cell">登録日時</th>
      </tr>
    </thead>
    <tbody>
      <FeedListRow v-for="feed in feeds" :key="feed.id" :feed="feed" />
    </tbody>
  </table>
</template>

<style scoped></style>
