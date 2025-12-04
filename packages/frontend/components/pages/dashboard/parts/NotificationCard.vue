<script setup lang="ts">
import ClHeading from '~/components/base/ClHeading.vue'
import type { NotificationListItem } from '~/generated/api/schemas'

interface Props {
  item: NotificationListItem
}

const props = defineProps<Props>()

const activityTypeLabels: Record<string, string> = {
  release: 'リリース',
  issue: 'Issue',
  pull_request: 'PR',
}
</script>

<template>
  <div>
    <!-- 通知ヘッダー -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <ClHeading :level="2" class="text-card-value">
          {{
            formatDate(
              props.item.notification.lastActivityOccurredAt,
              'minutes'
            )
          }}
        </ClHeading>
      </div>
    </div>

    <!-- データソース別のアクティビティ -->
    <template
      v-for="(dataSource, index) in props.item.dataSources"
      :key="dataSource.id"
    >
      <div class="mb-6 last:mb-0">
        <!-- データソース名 -->
        <div class="mb-3">
          <a
            :href="dataSource.url"
            target="_blank"
            rel="noopener noreferrer"
            data-id="data-source-link"
            class="text-sm inline-flex items-center space-x-1 font-medium
              text-card-value transition-colors hover:text-card-value"
          >
            <ClHeading :level="3" class="flex items-center gap-2">
              <Icon name="grommet-icons:github" size="40" />
              {{ dataSource.name }}
            </ClHeading>
            <svg
              class="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        <!-- アクティビティグループ -->
        <div
          v-for="group in dataSource.groups"
          :key="group.activityType"
          class="my-6 last:mb-0"
        >
          <!-- グループヘッダー -->
          <!-- アクティビティエントリ（最大5件） -->
          <div class="space-y-8">
            <div
              v-for="entry in group.entries.slice(0, 5)"
              :key="entry.activityId"
              class="pl-4"
            >
              <div class="space-y-1">
                <!-- タイトル -->
                <h4
                  class="text-sm flex items-center gap-x-4 font-medium
                    text-card-value"
                >
                  <span
                    class="rounded inline-flex w-16 items-center justify-center
                      px-2 py-1 font-medium"
                    data-id="activity-group-label"
                    :class="{
                      'bg-status-info-subtle text-status-info-default':
                        group.activityType === 'release',
                      'bg-status-warn-subtle text-status-warn-default':
                        group.activityType === 'issue',
                      'bg-status-success-subtle text-status-success-default':
                        group.activityType === 'pull_request',
                    }"
                  >
                    {{
                      activityTypeLabels[group.activityType] ||
                      group.activityType
                    }}
                  </span>

                  <a
                    v-if="entry.url"
                    :href="entry.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-id="activity-title"
                    class="transition-colors hover:text-surface-primary-default"
                  >
                    {{ entry.title }}
                  </a>
                  <span v-else data-id="activity-title">{{ entry.title }}</span>
                </h4>

                <!-- 要約 -->
                <p class="line-clamp-2 text-card-value opacity-75 md:ml-8">
                  {{ entry.summary }}
                </p>

                <!-- 発生日時 -->
                <div
                  class="text-card-value opacity-60 md:ml-8"
                  data-id="activity-occurred-at"
                  :title="formatDate(entry.occurredAt, 'full')"
                >
                  {{ formatRelativeDate(entry.occurredAt) }}
                </div>
              </div>
            </div>

            <!-- 省略表示 -->
            <div
              v-if="group.entries.length > 5"
              class="text-xs pl-4 text-card-value opacity-60"
            >
              他 {{ group.entries.length - 5 }} 件
            </div>
          </div>
        </div>
      </div>
      <hr
        v-if="index < props.item.dataSources.length - 1"
        class="my-8 border-dashed border-surface-secondary-default px-4"
      />
    </template>
  </div>
</template>
