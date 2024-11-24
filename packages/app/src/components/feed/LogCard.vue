<script setup lang="ts">
import type { FeedLog } from "~/features/feed/domain/feed-log"

defineProps<{
  feedLog: FeedLog
}>()
</script>

<template>
  <div class="flex flex-col p-4 gap-4 rounded-2xl bg-default-input">
    <div class="flex">
      <Icon name="mdi:github" mode="svg" size="80" />
      <div class="flex flex-col gap-2">
        <h4>{{ feedLog.feed.name }}</h4>
        <time>{{ feedLog.date }}</time>
      </div>
    </div>
    <div class="flex gap-2 px-4">
      <NuxtLink :to="{ path: feedLog.url }" :external="true" target="_blank"
        ><h5>{{ feedLog.title }}</h5></NuxtLink
      >
      <p class="whitespace-pre-line">
        {{ feedLog.summary }}
      </p>
    </div>
  </div>
</template>

<style scoped></style>
