import { getApiNotifications } from '~/generated/api/backend'
import type { NotificationListResponseData } from '~/generated/api/schemas'
import {
  getApiNotificationsResponse,
  getApiNotificationsQueryParams,
} from '~/generated/api/zod/chaseLightAPI.zod'
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

    // クエリパラメータを取得してバリデーション
    const query = getQuery(event)
    const cleanParams = validateWithZod(
      getApiNotificationsQueryParams.extend({
        // BFFの要件に合わせてデフォルトを 'unread' にオーバーライド
        read: getApiNotificationsQueryParams.shape.read.default('unread'),
      }),
      {
        ...query,
        limit: query.limit ? Number(query.limit) : undefined,
      },
      'notifications query params'
    )

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
