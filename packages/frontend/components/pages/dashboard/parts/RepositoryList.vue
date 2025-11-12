<script setup lang="ts">
import type { DataSourceListItem } from '~/generated/api/schemas'

interface Props {
  repositories?: DataSourceListItem[]
  loading?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  repositories: () => [],
  loading: false,
  error: undefined,
})

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}
</script>

<template>
  <div>
    <!-- ローディング状態 -->
    <div v-if="props.loading" class="p-6">
      <div class="animate-pulse space-y-4">
        <div v-for="i in 3" :key="i" class="flex space-x-4">
          <div
            class="h-12 w-12 rounded-full bg-surface-secondary-default"
          ></div>
          <div class="flex-1 space-y-2 py-1">
            <div class="rounded h-4 w-3/4 bg-surface-secondary-default"></div>
            <div class="rounded h-3 w-1/2 bg-surface-secondary-default"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- エラー状態 -->
    <div v-else-if="props.error" class="p-6">
      <div class="text-center">
        <!-- 警告アイコン: データ読み込みエラーを示す三角形の警告マーク -->
        <svg
          class="mx-auto h-12 w-12 text-status-alert-default"
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 class="text-sm mt-2 font-medium text-content-default">
          データの読み込みに失敗しました
        </h3>
        <p class="text-sm mt-1 text-content-default opacity-75">
          {{ props.error }}
        </p>
      </div>
    </div>

    <!-- 空の状態 -->
    <div v-else-if="props.repositories.length === 0" class="p-6">
      <div class="text-center">
        <!-- フォルダアイコン: ウォッチ中のリポジトリがないことを示すアイコン -->
        <svg
          class="mx-auto h-12 w-12 text-content-default opacity-50"
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 class="text-sm mt-2 font-medium text-content-default">
          ウォッチ中のリポジトリがありません
        </h3>
        <p class="text-sm mt-1 text-content-default opacity-75">
          GitHubリポジトリをウォッチして、最新情報を受け取りましょう。
        </p>
      </div>
    </div>

    <!-- リポジトリ一覧 -->
    <div v-else class="divide-y divide-surface-secondary-default">
      <div
        v-for="item in props.repositories"
        :key="item.dataSource.id"
        class="p-6 transition-colors hover:bg-surface-secondary-hovered"
      >
        <div class="flex items-start space-x-4">
          <!-- リポジトリアイコン -->
          <div class="flex-shrink-0">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full
                bg-surface-primary-default"
            >
              <!-- GitHubアイコン: リポジトリを表すオクトキャットのロゴ -->
              <svg
                class="h-6 w-6 text-surface-primary-default"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>

          <!-- リポジトリ情報 -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center space-x-2">
              <h3 class="text-sm truncate font-medium text-content-default">
                {{ item.dataSource.repository.fullName }}
              </h3>
              <span
                class="px-2.5 text-xs inline-flex items-center rounded-full
                  py-0.5 font-medium"
                :class="[
                  item.dataSource.isPrivate
                    ? 'bg-status-warn-subtle text-status-warn-default'
                    : 'bg-status-success-subtle text-status-success-default',
                ]"
              >
                {{ item.dataSource.isPrivate ? 'Private' : 'Public' }}
              </span>
            </div>

            <p
              class="text-sm mt-1 line-clamp-2 text-content-default opacity-75"
            >
              {{ item.dataSource.description || 'No description available' }}
            </p>

            <!-- 統計情報 -->
            <div
              class="text-xs mt-2 flex items-center space-x-4
                text-content-default opacity-60"
            >
              <div
                v-if="item.dataSource.repository.language"
                class="flex items-center space-x-1"
              >
                <div
                  class="h-3 w-3 rounded-full bg-surface-primary-default"
                ></div>
                <span>{{ item.dataSource.repository.language }}</span>
              </div>

              <div class="flex items-center space-x-1">
                <!-- スターアイコン: リポジトリのスター数を表示 -->
                <svg
                  class="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </svg>
                <span>
                  {{ formatNumber(item.dataSource.repository.starsCount) }}
                </span>
              </div>

              <div class="flex items-center space-x-1">
                <!-- フォークアイコン: リポジトリのフォーク数を表示 -->
                <svg
                  class="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7l3.707-3.707a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>
                  {{ formatNumber(item.dataSource.repository.forksCount) }}
                </span>
              </div>

              <div class="flex items-center space-x-1">
                <!-- イシューアイコン: リポジトリのオープンイシュー数を表示 -->
                <svg
                  class="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>
                  {{ formatNumber(item.dataSource.repository.openIssuesCount) }}
                </span>
              </div>
            </div>

            <!-- 監視設定 -->
            <div class="mt-3 flex items-center space-x-2">
              <span class="text-xs text-content-default opacity-60">
                監視中:
              </span>
              <div class="flex space-x-2">
                <span
                  v-if="item.userWatch.watchReleases"
                  class="rounded text-xs inline-flex items-center
                    bg-status-info-subtle px-2 py-1 font-medium
                    text-status-info-default"
                >
                  リリース
                </span>
                <span
                  v-if="item.userWatch.watchIssues"
                  class="rounded text-xs inline-flex items-center
                    bg-status-warn-subtle px-2 py-1 font-medium
                    text-status-warn-default"
                >
                  Issue
                </span>
                <span
                  v-if="item.userWatch.watchPullRequests"
                  class="rounded text-xs inline-flex items-center
                    bg-status-success-subtle px-2 py-1 font-medium
                    text-status-success-default"
                >
                  PR
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
