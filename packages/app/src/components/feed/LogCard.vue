<script setup lang="ts">
import type { FeedLogListItemModel } from '~/features/feed/domain/feed-log'

defineProps<{
  feedLog: FeedLogListItemModel
}>()
</script>

<template>
  <div
    class="bg-default-input flex w-10/12 w-80 flex-col gap-4 rounded-2xl"
    :data-id="feedLog.id"
  >
    <div class="flex">
      <Icon name="mdi:github" mode="svg" size="80" />
      <div class="flex flex-col gap-2">
        <h4>{{ feedLog.feed.name }}</h4>
        <time>{{ feedLog.date }}</time>
      </div>
    </div>
    <div class="flex gap-2 px-4">
      <NuxtLink
        :to="{ path: feedLog.url }"
        :external="true"
        target="_blank"
        class="cursor-pointer"
        ><h5>{{ feedLog.title }}</h5></NuxtLink
      >
      <ul class="flex flex-col">
        <li v-for="item of feedLog.items" :key="item.id" class="block">
          <p class="inline whitespace-pre-line">{{ item.summary }}</p>
          <p v-if="item.link" class="inline">
            (<NuxtLink
              :to="{ path: item.link.url }"
              :external="true"
              target="_blank"
              class="cursor-pointer underline"
              >{{ item.link.title != '' ? item.link.title : 'link' }}</NuxtLink
            >)
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped></style>
