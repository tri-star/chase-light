import type {
  TranslationState,
  TranslationRequestParams,
} from '../domain/translation'
import { toHttpError } from '~/errors/http-error'

/**
 * アクティビティ翻訳関連のRepository
 */
export class ActivityTranslationRepository {
  /**
   * 翻訳リクエストを送信
   */
  async request(
    activityId: string,
    params: TranslationRequestParams = {}
  ): Promise<TranslationState> {
    const fetcher = useRequestFetch()

    try {
      const res = await fetcher<{ success: boolean; data: TranslationState }>(
        `/api/activities/${activityId}/translations/body`,
        {
          method: 'POST',
          body: params,
        }
      )
      return res.data
    } catch (error) {
      throw toHttpError(error)
    }
  }

  /**
   * 翻訳ステータスを取得
   */
  async getStatus(activityId: string): Promise<TranslationState> {
    const fetcher = useRequestFetch()

    try {
      const res = await fetcher<{ success: boolean; data: TranslationState }>(
        `/api/activities/${activityId}/translations/body`
      )
      return res.data
    } catch (error) {
      throw toHttpError(error)
    }
  }
}
