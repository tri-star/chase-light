import { getApiNotifications } from '~/generated/api/backend'
import type {
  GetApiNotificationsParams,
  NotificationListResponseData,
} from '~/generated/api/schemas'
import { getApiNotificationsResponse } from '~/generated/api/zod/chaseLightAPI.zod'
import { validateWithZod } from '~/utils/validation'

export default defineEventHandler(
  async (
    event
  ): Promise<{
    success: boolean
    data: NotificationListResponseData
  }> => {
    // 認証チェック
    await requireUserSession(event)

    // クエリパラメータを取得
    const query = getQuery(event)
    const params: GetApiNotificationsParams = {
      cursor: query.cursor as string | undefined,
      limit: query.limit ? parseInt(query.limit as string, 10) : 20,
      read: (query.read as 'all' | 'read' | 'unread') || 'unread', // デフォルトで未読のみ
      search: query.search as string | undefined,
    }

    // 未定義値を除去
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    ) as GetApiNotificationsParams

    try {
      // Backend APIを呼び出し
      const response = await getApiNotifications(cleanParams)

      if (response.status === 200) {
        // Backend APIからの応答をZodスキーマでバリデーション
        const validatedData = validateWithZod(
          getApiNotificationsResponse,
          response.data,
          'notifications API response'
        )
        return validatedData
      }

      // ステータスコード400または422の場合
      throw createError({
        statusCode: response.status,
        statusMessage: 'Failed to fetch notifications',
        data: response.data,
      })
    } catch (error) {
      console.error('Backend API error:', error)

      // Zodバリデーションエラーの場合
      if (error instanceof Error && error.name === 'ValidationError') {
        console.error('Response validation failed:', error.message)
        throw createError({
          statusCode: 502,
          statusMessage: 'Invalid response format from backend API',
          data: { validationError: error.message },
        })
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to fetch notifications: ${errorMessage}`,
      })
    }
  }
)
