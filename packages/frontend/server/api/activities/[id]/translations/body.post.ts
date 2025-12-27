import { postApiActivitiesActivityIdTranslationsBody } from '~/generated/api/backend'
import type { TranslationRequest } from '~/generated/api/schemas'
import {
  postApiActivitiesActivityIdTranslationsBodyBody,
  postApiActivitiesActivityIdTranslationsBodyResponse,
} from '~/generated/api/zod/chaseLightAPI.zod'
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

  // リクエストボディを取得してバリデーション
  const body = await readBody(event)

  try {
    // 入力データをZodスキーマでバリデーション
    const validatedInput = validateWithZod<TranslationRequest>(
      postApiActivitiesActivityIdTranslationsBodyBody,
      body,
      'translation request'
    )

    // Backend APIを呼び出し
    const response = await postApiActivitiesActivityIdTranslationsBody(
      activityId,
      validatedInput
    )

    if (response.status === 200 || response.status === 202) {
      // レスポンスをZodスキーマでバリデーション
      const validatedData = validateWithZod(
        postApiActivitiesActivityIdTranslationsBodyResponse,
        response.data,
        'translation request API response'
      )
      return validatedData
    }

    throw createError({
      statusCode: response.status,
      statusMessage: 'Failed to request translation',
      data: response.data,
    })
  } catch (error) {
    handleBackendApiError(error)
  }
})
