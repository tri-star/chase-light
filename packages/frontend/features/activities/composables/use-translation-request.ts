import { ref, onUnmounted } from 'vue'
import { ActivityTranslationRepository } from '../repositories/activity-translation-repository'

const POLLING_INTERVAL_MS = 3000 // 3秒

/**
 * 翻訳リクエストの状態
 */
export type TranslationRequestStatus =
  | 'idle' // 初期状態（翻訳リクエスト前）
  | 'requesting' // 翻訳リクエスト送信中
  | 'polling' // ポーリング中（queued or processing）
  | 'completed' // 翻訳完了
  | 'failed' // 翻訳失敗

/**
 * 翻訳リクエスト機能を提供するcomposable
 *
 * @param activityId - アクティビティID
 * @param initialStatus - 翻訳ステータスの初期値（APIから取得した値）
 * @returns 翻訳リクエストの状態と操作
 */
export function useTranslationRequest(
  activityId: string,
  initialStatus?: TranslationRequestStatus
) {
  const status = ref<TranslationRequestStatus>(initialStatus ?? 'idle')
  const errorMessage = ref<string | null>(null)
  const isPolling = ref(false)
  const onTranslationComplete = ref<(() => void) | null>(null)

  let pollingTimer: ReturnType<typeof setInterval> | null = null
  const repository = new ActivityTranslationRepository()

  /**
   * ポーリング開始
   */
  const startPolling = () => {
    if (isPolling.value) return
    isPolling.value = true
    status.value = 'polling'

    pollingTimer = setInterval(async () => {
      try {
        const result = await repository.getStatus(activityId)

        if (result.translationStatus === 'completed') {
          // 翻訳完了
          stopPolling()
          status.value = 'completed'
          // 親に通知してアクティビティデータを再取得
          onTranslationComplete.value?.()
        } else if (result.translationStatus === 'failed') {
          // 翻訳失敗
          stopPolling()
          status.value = 'failed'
          errorMessage.value =
            result.statusDetail || '翻訳処理中にエラーが発生しました'
        }
        // queued / processing の場合は継続
      } catch (error) {
        console.error('Translation status polling failed:', error)
        stopPolling()
        status.value = 'failed'
        errorMessage.value = 'ステータスの取得に失敗しました'
      }
    }, POLLING_INTERVAL_MS)
  }

  /**
   * ポーリング停止
   */
  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
    isPolling.value = false
  }

  /**
   * 翻訳リクエスト送信
   */
  const requestTranslation = async () => {
    status.value = 'requesting'
    errorMessage.value = null

    try {
      const result = await repository.request(activityId)

      if (result.translationStatus === 'completed') {
        // 既に完了済み
        status.value = 'completed'
        onTranslationComplete.value?.()
      } else if (result.translationStatus === 'failed') {
        // 失敗状態
        status.value = 'failed'
        errorMessage.value =
          result.statusDetail || '翻訳リクエストに失敗しました'
      } else {
        // queued or processing -> ポーリング開始
        startPolling()
      }
    } catch (error) {
      console.error('Translation request failed:', error)
      status.value = 'failed'
      errorMessage.value = '翻訳リクエストの送信に失敗しました'
    }
  }

  // コンポーネントアンマウント時にクリーンアップ
  onUnmounted(() => {
    stopPolling()
  })

  return {
    status,
    errorMessage,
    isPolling,
    requestTranslation,
    stopPolling,
    onTranslationComplete,
  }
}
