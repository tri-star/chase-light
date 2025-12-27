import { getApiActivitiesActivityIdTranslationsBody } from '~/generated/api/backend'
import { getApiActivitiesActivityIdTranslationsBodyResponse } from '~/generated/api/zod/chaseLightAPI.zod'
import { handleBackendApiError } from '~/server/utils/api'
import { validateWithZod } from '~/utils/validation'

export default defineEventHandler(async (event) => {
  // ルートパラメータからactivityIdを取得
  const activityId = getRouterParam(event, 'id')
  if (!activityId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Activity ID is required',
    })
  }

  try {
    // Backend APIを呼び出し
    const response =
      await getApiActivitiesActivityIdTranslationsBody(activityId)

    if (response.status === 200) {
      // レスポンスをZodスキーマでバリデーション
      const validatedData = validateWithZod(
        getApiActivitiesActivityIdTranslationsBodyResponse,
        response.data,
        'translation status API response'
      )
      return validatedData
    }

    throw createError({
      statusCode: response.status,
      statusMessage: 'Failed to get translation status',
      data: response.data,
    })
  } catch (error) {
    handleBackendApiError(error)
  }
})
