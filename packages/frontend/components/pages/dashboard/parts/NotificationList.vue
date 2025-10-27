<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { NotificationListItemViewModel } from '~/features/notifications/models/notification'

interface Props {
  notifications?: NotificationListItemViewModel[]
  initialLoading?: boolean
  loadingMore?: boolean
  error?: string | null
  loadMoreError?: string | null
  hasNextPage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  notifications: () => [],
  initialLoading: false,
  loadingMore: false,
  error: null,
  loadMoreError: null,
  hasNextPage: false,
})

const emit = defineEmits<{
  (event: 'retry' | 'load-more'): void
}>()

const sentinelRef = ref<HTMLElement | null>(null)
const observerSupported = ref(true)
let observer: IntersectionObserver | null = null

const isClient = typeof window !== 'undefined'

const createObserver = () =>
  new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && props.hasNextPage && !props.loadingMore) {
          emit('load-more')
          if (observer && sentinelRef.value) {
            observer.unobserve(sentinelRef.value)
          }
          break
        }
      }
    },
    { rootMargin: '120px 0px' }
  )

const ensureObserver = () => {
  if (!observer) {
    observer = createObserver()
  }
}

const observeSentinel = () => {
  if (!observer || !sentinelRef.value || !props.hasNextPage) {
    return
  }
  observer.observe(sentinelRef.value)
}

const unobserveSentinel = () => {
  if (observer && sentinelRef.value) {
    observer.unobserve(sentinelRef.value)
  }
}

if (isClient) {
  onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') {
      observerSupported.value = false
      return
    }
    observerSupported.value = true
    ensureObserver()
    observeSentinel()
  })
}

watch(
  () => sentinelRef.value,
  (newElement, oldElement) => {
    if (!isClient || !observerSupported.value) {
      return
    }
    ensureObserver()
    if (oldElement && observer) {
      observer.unobserve(oldElement)
    }
    if (newElement && observer && props.hasNextPage && !props.loadingMore) {
      observer.observe(newElement)
    }
  }
)

watch(
  () => props.loadingMore,
  (loading) => {
    if (!isClient || !observerSupported.value || !observer) {
      return
    }
    if (!loading && props.hasNextPage && sentinelRef.value) {
      nextTick().then(() => {
        observeSentinel()
      })
    }
  }
)

watch(
  () => props.hasNextPage,
  (hasNext) => {
    if (!isClient || !observerSupported.value || !observer) {
      return
    }
    if (!hasNext) {
      unobserveSentinel()
    } else if (!props.loadingMore && sentinelRef.value) {
      observeSentinel()
    }
  }
)

if (isClient) {
  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })
}

const hasNotifications = computed(() => props.notifications.length > 0)

const statusLabel = (item: NotificationListItemViewModel) =>
  item.isRead ? '既読' : '未読'

const statusClasses = (item: NotificationListItemViewModel) =>
  item.isRead
    ? 'bg-surface-secondary-hovered text-content-default opacity-70'
    : 'bg-status-info-subtle text-status-info-default'
</script>

<template>
  <div class="space-y-4">
    <div v-if="props.initialLoading" class="space-y-4 px-6 py-6">
      <div
        v-for="index in 3"
        :key="`skeleton-${index}`"
        class="animate-pulse space-y-4 rounded-lg border border-surface-secondary-default bg-surface-primary-default/40 p-4"
      >
        <div class="h-4 w-48 rounded bg-surface-secondary-default/80"></div>
        <div class="space-y-3">
          <div
            v-for="groupIndex in 2"
            :key="`skeleton-${index}-${groupIndex}`"
            class="space-y-2"
          >
            <div class="h-3 w-32 rounded bg-surface-secondary-default/80"></div>
            <div
              class="h-3 w-full rounded bg-surface-secondary-default/60"
            ></div>
            <div
              class="h-3 w-2/3 rounded bg-surface-secondary-default/60"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="props.error" class="space-y-4 px-6 py-10 text-center">
      <p class="text-content-default">{{ props.error }}</p>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md bg-surface-primary-default px-4 py-2 text-sm font-medium text-content-on-primary hover:bg-surface-primary-hovered focus:outline-none focus:ring-2 focus:ring-status-focus-default"
        @click="emit('retry')"
      >
        再読み込み
      </button>
    </div>

    <div
      v-else-if="!hasNotifications"
      class="px-6 py-12 text-center text-content-default opacity-75"
    >
      未読通知はありません
    </div>

    <div v-else class="divide-y divide-surface-secondary-default">
      <article
        v-for="notification in props.notifications"
        :key="notification.id"
        class="px-6 py-6"
      >
        <header
          class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
        >
          <div class="space-y-1">
            <p class="text-xs text-content-default opacity-60">
              最新アクティビティ:
              {{ notification.lastActivityOccurredAtLabel || '---' }}
            </p>
            <p class="text-lg font-semibold text-content-default">
              {{
                notification.dataSources.map((source) => source.name).join(', ')
              }}
            </p>
            <p class="text-sm text-content-default opacity-60">
              送信予定:
              {{ notification.displayTimestampLabel || '未送信' }}
            </p>
          </div>
          <span
            class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            :class="statusClasses(notification)"
          >
            {{ statusLabel(notification) }}
          </span>
        </header>

        <div class="mt-6 space-y-6">
          <section
            v-for="source in notification.dataSources"
            :key="`${notification.id}-${source.id}`"
            class="space-y-4"
          >
            <div
              class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
            >
              <div class="flex flex-wrap items-center gap-2 text-sm">
                <a
                  :href="source.url"
                  class="font-medium text-surface-primary-default hover:text-surface-primary-hovered focus:outline-none focus:ring-2 focus:ring-status-focus-default"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ source.name }}
                </a>
                <span
                  v-if="source.repositoryFullName"
                  class="text-content-default opacity-60"
                >
                  {{ source.repositoryFullName }}
                </span>
              </div>
              <span class="text-xs text-content-default opacity-50">
                {{ source.sourceType }}
              </span>
            </div>

            <div
              class="space-y-5 rounded-md border border-surface-secondary-default bg-surface-primary-default/40 p-4"
            >
              <div
                v-for="group in source.groups"
                :key="`${notification.id}-${source.id}-${group.activityType}`"
                class="space-y-3"
              >
                <div
                  class="inline-flex items-center rounded-full bg-surface-secondary-default px-3 py-1 text-xs font-semibold text-content-default"
                >
                  {{ group.activityLabel }}
                </div>
                <ul class="space-y-3">
                  <li
                    v-for="entry in group.entries"
                    :key="entry.id"
                    class="space-y-1 border-b border-surface-secondary-default pb-3 last:border-none last:pb-0"
                  >
                    <p class="text-sm font-medium text-content-default">
                      <a
                        v-if="entry.url"
                        :href="entry.url"
                        class="text-surface-primary-default hover:text-surface-primary-hovered focus:outline-none focus:ring-2 focus:ring-status-focus-default"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {{ entry.title }}
                      </a>
                      <span v-else>{{ entry.title }}</span>
                    </p>
                    <p class="text-sm text-content-default opacity-80">
                      {{ entry.summary }}
                    </p>
                    <p class="text-xs text-content-default opacity-60">
                      {{ entry.occurredAtLabel || entry.occurredAt }}
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </article>
    </div>

    <div class="px-6 pb-6 space-y-3">
      <p v-if="props.loadMoreError" class="text-sm text-status-alert-default">
        {{ props.loadMoreError }}
      </p>

      <div v-if="props.hasNextPage" class="flex flex-col items-center gap-2">
        <button
          type="button"
          class="text-sm text-surface-primary-default hover:text-surface-primary-hovered focus:outline-none focus:ring-2 focus:ring-status-focus-default rounded-md px-4 py-2"
          :disabled="props.loadingMore"
          @click="emit('load-more')"
        >
          {{ props.loadingMore ? '読み込み中...' : 'もっと見る' }}
        </button>
        <div
          ref="sentinelRef"
          class="h-px w-full opacity-0"
          aria-hidden="true"
        ></div>
        <p
          v-if="props.loadingMore"
          class="text-xs text-content-default opacity-60"
        >
          追加の通知を読み込んでいます...
        </p>
        <p
          v-else-if="!observerSupported"
          class="text-xs text-content-default opacity-60"
        >
          自動読み込みに対応していない環境のため、ボタンで読み込んでください。
        </p>
      </div>
    </div>
  </div>
</template>
