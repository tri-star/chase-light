<script setup lang="ts">
import type { FeedLogListItemModel } from '~/features/feed/domain/feed-log'
import { toDateTimeString } from '~/lib/utils/date-utils'

defineProps<{
  feedLog: FeedLogListItemModel
}>()
</script>

<template>
  <div
    class="bg-default-input flex w-full flex-col gap-4 rounded-2xl p-2 md:w-10/12"
    :data-id="feedLog.id"
  >
    <div class="flex flex-col gap-2 px-4">
      <div class="flex gap-2">
        <div class="flex-shrink-0">
          <Icon
            name="mdi:github"
            mode="svg"
            size="80"
            class="hidden md:block"
          />
          <Icon
            name="mdi:github"
            mode="svg"
            size="40"
            class="block md:hidden"
          />
        </div>
        <div class="flex min-w-0 flex-col gap-2">
          <NuxtLink
            :to="{ path: `/feeds/${feedLog.feed.id}` }"
            class="cursor-pointer underline"
          >
            <h4 class="overflow-hidden text-ellipsis whitespace-nowrap">
              {{ feedLog.feed.name }}
            </h4></NuxtLink
          >
          <time>{{ toDateTimeString(feedLog.date) }}</time>
        </div>
      </div>

      <NuxtLink
        :to="{ path: feedLog.url }"
        :external="true"
        target="_blank"
        class="cursor-pointer underline"
        ><h5>{{ feedLog.title }}</h5></NuxtLink
      >
      <ul
        class="flex list-inside list-disc flex-col gap-1 break-words px-2 pb-4"
      >
        <li v-for="item of feedLog.items" :key="item.id" class="list-item">
          <p class="inline whitespace-pre-line break-all">
            {{ item.summary }}
          </p>
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
