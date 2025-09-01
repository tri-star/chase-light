<script setup lang="ts">
import RepositoryList from './parts/RepositoryList.vue'
import type { DataSourceListResponse } from '~/generated/api/schemas'

// データ取得（SSRファースト）
const {
  data: dataSources,
  pending,
  error,
  refresh,
} = await useFetch<DataSourceListResponse>('/api/data-sources', {
  key: 'dashboard-data-sources',
  params: {
    page: 1,
    perPage: 20,
  },
  default: () => ({
    success: true,
    data: {
      items: [],
      pagination: {
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    },
  }),
  server: true,
  lazy: false,
})
</script>

<template>
  <!-- ページタイトル -->
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-content-default">ダッシュボード</h1>
    <p class="mt-2 text-content-default opacity-75">
      ウォッチ中のリポジトリの最新情報をチェックしましょう
    </p>
  </div>

  <!-- メインコンテンツ -->
  <div class="space-y-6">
    <!-- 統計情報 -->
    <div
      v-if="dataSources?.success"
      class="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      <div
        class="bg-surface-secondary-default rounded-lg p-6 border border-surface-secondary-default"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <!-- 目のアイコン: ウォッチ中のリポジトリ数を表示するアイコン -->
            <svg
              class="w-8 h-8 text-surface-primary-default"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt
                class="text-sm font-medium text-content-default opacity-75 truncate"
              >
                ウォッチ中リポジトリ
              </dt>
              <dd class="text-lg font-medium text-content-default">
                {{ dataSources.data.pagination.total }}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div
        class="bg-surface-secondary-default rounded-lg p-6 border border-surface-secondary-default"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <!-- 情報アイコン: 未読通知数を表示する情報マーク -->
            <svg
              class="w-8 h-8 text-status-info-default"
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt
                class="text-sm font-medium text-content-default opacity-75 truncate"
              >
                未読通知
              </dt>
              <dd class="text-lg font-medium text-content-default">0</dd>
            </dl>
          </div>
        </div>
      </div>

      <div
        class="bg-surface-secondary-default rounded-lg p-6 border border-surface-secondary-default"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <!-- チェックマークアイコン: 今日の更新数を表示する成功マーク -->
            <svg
              class="w-8 h-8 text-status-success-default"
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt
                class="text-sm font-medium text-content-default opacity-75 truncate"
              >
                今日の更新
              </dt>
              <dd class="text-lg font-medium text-content-default">0</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <!-- リポジトリ一覧 -->
    <div
      class="bg-surface-secondary-default rounded-lg border border-surface-secondary-default"
    >
      <div class="px-6 py-4 border-b border-surface-secondary-default">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium text-content-default">
            ウォッチ中のリポジトリ
          </h2>
          <button
            type="button"
            class="text-sm text-surface-primary-default hover:text-surface-primary-hovered focus:outline-none focus:ring-2 focus:ring-status-focus-default rounded-md px-2 py-1"
            :disabled="pending"
            @click="refresh()"
          >
            {{ pending ? '更新中...' : '更新' }}
          </button>
        </div>
      </div>

      <RepositoryList
        :repositories="dataSources?.success ? dataSources.data.items : []"
        :loading="pending"
        :error="error?.message"
      />
    </div>
  </div>
</template>
