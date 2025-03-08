<script setup lang="ts">
import { computed } from 'vue'
import { toDateTimeString } from '~/lib/utils/date-utils'
import A3Spinner from '~/components/common/A3Spinner.vue'
import A3Button from '~/components/common/A3Button.vue'
import type { GetFeedResponse } from '~/server/api/feeds/[id].get'
import { isNotFoundError } from '~/lib/utils/h3-utils'

const props = defineProps<{
  feedId: string
}>()

// ルーター参照の初期化
const router = useRouter()
const toastStore = useToastStore()

// APIからフィードデータを取得
const {
  data: feed,
  error,
  status,
} = await useA3Fetch<GetFeedResponse>(`/api/feeds/${props.feedId}`, {})

// エラー状態
const hasError = computed(() => !!error.value)

const isLoading = computed(() => status.value === 'pending')

// 404エラーが発生した場合（削除済みフィードなど）、一覧画面に自動リダイレクト
watch(
  error,
  (newError) => {
    if (isNotFoundError(newError)) {
      toastStore.createToast({
        type: 'alert',
        message: 'このフィードは存在しないか削除されています',
      })
      router.replace('/feeds')
    }
  },
  {
    immediate: true,
  }
)

// 編集ボタンのクリックハンドラ（機能はまだ実装しない）
const handleEditClick = () => {
  alert('編集機能はまだ実装されていません')
}

// 削除ボタンのクリックハンドラ
const handleDeleteClick = async () => {
  // 確認ダイアログを表示
  const isConfirmed = window.confirm('このフィードを削除してもよろしいですか？')
  if (!isConfirmed) return

  try {
    // APIを呼び出し
    await $fetch(`/api/feeds/${props.feedId}`, {
      method: 'DELETE',
    })

    // 成功時はトーストを表示してフィード一覧に戻る
    toastStore.createToast({
      type: 'success',
      message: 'フィードを削除しました',
    })
    router.push('/feeds')
  } catch (error) {
    console.error('削除エラー:', error)
    toastStore.createToast({
      type: 'alert',
      message: '削除に失敗しました',
    })
  }
}

// 戻るボタンのクリックハンドラ
const handleBackClick = () => {
  router.push('/feeds')
}

// フィードの種類は現在は固定
const feedType = computed(() => 'GitHubリリース')
</script>

<template>
  <div
    class="bg-default flex flex-col rounded-2xl p-4 md:w-[600px] lg:w-[800px]"
  >
    <div class="flex flex-col gap-6">
      <h1 class="flex-1">フィード詳細</h1>

      <div class="flex flex-col gap-2">
        <h2>基本情報</h2>
        <div class="bg-list rounded-lg p-6 shadow-md">
          <!-- データ読み込み中 -->
          <div v-if="isLoading" class="flex items-center justify-center py-10">
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

          <!-- ロード完了 -->
          <div v-else-if="feed" class="grid grid-cols-1 gap-4">
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
              <div class="w-40 font-bold">最新リリース日:</div>
              <div>
                {{
                  feed.feedGitHubMeta?.lastReleaseDate
                    ? toDateTimeString(feed.feedGitHubMeta?.lastReleaseDate)
                    : 'なし'
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
      </div>
      <div class="flex">
        <div class="flex flex-1 justify-center gap-8">
          <A3Button
            label="編集"
            type="primary"
            class="w-36"
            @click="handleEditClick"
          />
          <A3Button
            label="戻る"
            type="default"
            class="w-36"
            @click="handleBackClick"
          />
        </div>
        <div>
          <A3Button label="削除" type="default" @click="handleDeleteClick" />
        </div>
      </div>
    </div>
  </div>
</template>
