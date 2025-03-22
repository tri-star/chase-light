<script setup lang="ts">
import type { Notification } from '~/features/notification/domain/notification'
import dayjs from 'dayjs'
import { toDateTimeString } from '~/lib/utils/date-utils'

defineProps<{
  notification: Notification
}>()
</script>

<template>
  <article
    class="bg-card flex w-full flex-col gap-2 rounded-md p-2 drop-shadow-sm"
  >
    <time
      :datetime="dayjs(notification.createdAt).format()"
      class="text-sm text-gray-600"
      >{{ toDateTimeString(notification.createdAt) }}</time
    >
    <p>{{ notification.title }}</p>
    <section class="flex flex-col gap-2">
      <ul>
        <!--v-forでループ-->
        <li
          v-for="item of notification.notificationItems"
          :key="item.feedLogId"
        >
          <NuxtLink
            class="underline"
            :to="{ path: `/feed-logs/${item.feedLogId}` }"
            >{{ item.title }}</NuxtLink
          >
        </li>
      </ul>
    </section>
  </article>
</template>
