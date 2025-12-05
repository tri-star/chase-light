<script setup lang="ts">
import ClDivider from '~/components/base/ClDivider.vue'
import type { DataSourceListItem } from '~/features/data-sources/domain/data-source'
import DataSourceItemSkeleton from './DataSourceItemSkeleton.vue'
import DataSourceListItemComponent from './DataSourceListItem.vue'

interface Props {
  /**
   * データソースの一覧
   */
  dataSources: DataSourceListItem[]
  /**
   * ローディング中かどうか
   */
  isLoading: boolean
  /**
   * 初回ローディング中かどうか
   */
  isInitialLoading: boolean
  /**
   * 次のページがあるかどうか
   */
  hasNextPage: boolean
  /**
   * エラーメッセージ
   */
  fetchError: string | null
  /**
   * 空状態かどうか
   */
  isEmpty: boolean
  /**
   * 検索クエリ（空メッセージの表示に使用）
   */
  searchQuery: string
}

defineProps<Props>()

const skeletonPlaceholders = computed(() => Array.from({ length: 10 }))
</script>

<template>
  <!-- ローディング（初回） -->
  <div v-if="isInitialLoading" class="space-y-6">
    <DataSourceItemSkeleton
      v-for="(_, index) in skeletonPlaceholders"
      :key="`skeleton-${index}`"
    />
  </div>

  <!-- エラー表示 -->
  <div v-else-if="fetchError" class="py-10 text-center">
    <p class="text-sm text-card-value">データソースの取得に失敗しました。</p>
  </div>

  <!-- 空状態 -->
  <div v-else-if="isEmpty" class="py-10 text-center">
    <p class="text-sm font-medium text-card-value">
      {{
        searchQuery
          ? '検索条件に一致するデータソースがありません'
          : 'まだデータソースがありません'
      }}
    </p>
    <p v-if="!searchQuery" class="text-xs mt-2 text-card-value opacity-70">
      ダッシュボードからデータソースを追加してください。
    </p>
  </div>

  <!-- データソース一覧 -->
  <div v-else class="space-y-6">
    <div v-for="(item, index) in dataSources" :key="item.dataSource.id">
      <DataSourceListItemComponent :item="item" />
      <ClDivider v-if="index < dataSources.length - 1" spacing="sm" />
    </div>
  </div>

  <!-- 追加読み込み中 -->
  <div
    v-if="isLoading && hasNextPage"
    class="text-sm mt-6 text-center text-content-default opacity-60"
  >
    読み込み中...
  </div>
</template>
