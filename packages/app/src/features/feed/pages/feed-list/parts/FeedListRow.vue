<script setup lang="ts">
import type { Feed } from '~/features/feed/domain/feed'
import { toDateTimeString } from '~/lib/utils/date-utils'

defineProps<{
  feed: Feed
}>()
</script>

<template>
  <tr class="border-list bg-list border-b">
    <td><Icon name="mdi:github" size="40" /></td>
    <td class="p-3 text-left">
      <NuxtLink
        :to="`/feeds/${feed.id}`"
        class="text-size-h5 text-default font-bold hover:underline"
        >{{ feed.name }}</NuxtLink
      >
    </td>
    <td class="w-36 p-3 text-center">
      <p class="text-disabled">N/A</p>
    </td>
    <td class="w-36 p-3 text-center">
      <p class="text-nowrap">
        {{ toDateTimeString(feed.updatedAt) }}
      </p>
    </td>
    <td class="w-36 p-3 text-center">
      <p class="text-nowrap">{{ toDateTimeString(feed.createdAt) }}</p>
    </td>
  </tr>
</template>
