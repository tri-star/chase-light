<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Feed } from '~/features/feed/domain/feed'
import { toDateTimeString } from '~/lib/utils/date-utils'
import A3Spinner from '~/components/common/A3Spinner.vue'
import A3Button from '~/components/common/A3Button.vue'
import type { GetFeedResponse } from '~/server/api/feeds/[id].get'

const props = defineProps<{
  feedId: string
}>()

// データ取得中フラグ
const loading = ref(true)

// APIからフィードデータを取得
const { data, error } = await useA3Fetch<GetFeedResponse>(
  `/api/feeds/${props.feedId}`,
  {}
)

// フィードデータと最終更新日時
const feed = ref<Feed | null>(null)
const lastReleaseDate = ref<string | null>(null)

// APIレスポンスがあれば反映
if (data.value) {
  feed.value = data.value.feed
  lastReleaseDate.value = data.value.lastReleaseDate
  loading.value = false
}

// エラー状態
const hasError = computed(() => !!error.value)

// 編集ボタンのクリックハンドラ（機能はまだ実装しない）
const handleEditClick = () => {
  alert('編集機能はまだ実装されていません')
}

// 削除ボタンのクリックハンドラ（機能はまだ実装しない）
const handleDeleteClick = () => {
  alert('削除機能はまだ実装されていません')
}

// 戻るボタンのクリックハンドラ
const router = useRouter()
const handleBackClick = () => {
  router.push('/feeds')
}

// フィードの種類は現在は固定
const feedType = computed(() => 'GitHubリリース')
</script>

<template>
  <div class="container mx-auto p-8">
    <div class="mb-8">
      <h1 class="text-size-h3 mb-6 font-bold">フィード詳細</h1>

      <!-- データ読み込み中 -->
      <div v-if="loading" class="flex items-center justify-center py-10">
        <A3Spinner />
        <span class="ml-2">読み込み中...</span>
      </div>

      <!-- エラー表示 -->
      <div
        v-else-if="hasError"
        class="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
      >
        <p>データの読み込みに失敗しました。</p>
        <p>{{ error }}</p>
      </div>

      <!-- データ表示 -->
      <template v-else-if="feed">
        <div class="bg-list mb-8 rounded-lg p-6 shadow-md">
          <div class="grid grid-cols-1 gap-4">
            <div class="flex">
              <div class="w-40 font-bold">フィード名:</div>
              <div>{{ feed.name }}</div>
            </div>

            <div class="flex">
              <div class="w-40 font-bold">URL:</div>
              <div class="break-all">
                <a
                  :href="feed.url"
                  target="_blank"
                  class="text-blue-600 hover:underline"
                  >{{ feed.url }}</a
                >
              </div>
            </div>

            <div class="flex">
              <div class="w-40 font-bold">種類:</div>
              <div>{{ feedType }}</div>
            </div>

            <div class="flex">
              <div class="w-40 font-bold">最終更新日時:</div>
              <div>
                {{
                  lastReleaseDate ? toDateTimeString(lastReleaseDate) : 'なし'
                }}
              </div>
            </div>

            <div class="flex">
              <div class="w-40 font-bold">登録日時:</div>
              <div>{{ toDateTimeString(feed.createdAt) }}</div>
            </div>

            <div class="flex">
              <div class="w-40 font-bold">更新日時:</div>
              <div>{{ toDateTimeString(feed.updatedAt) }}</div>
            </div>
          </div>
        </div>

        <div class="flex justify-between">
          <A3Button label="編集" type="primary" @click="handleEditClick" />
          <A3Button label="戻る" type="default" @click="handleBackClick" />
          <A3Button label="削除" type="default" @click="handleDeleteClick" />
        </div>
      </template>
    </div>
  </div>
</template>
