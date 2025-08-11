import { postApiDataSources } from '~/generated/api/backend'
import type { CreateDataSourceRequest } from '~/generated/api/schemas'
import { postApiDataSourcesBody } from '~/generated/api/zod/chaseLightAPI.zod'
import { validateWithZod } from '~/utils/validation'

export default defineEventHandler(async (event) => {
  // セッション認証を要求
  const session = await requireUserSession(event)

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'User session not found',
    })
  }

  // リクエストボディを取得してバリデーション
  const body = await readBody(event)

  try {
    // 入力データをZodスキーマでバリデーション
    const validatedInput = validateWithZod<CreateDataSourceRequest>(
      postApiDataSourcesBody,
      body,
      'data source creation request'
    )

    // Backend APIを呼び出し
    const response = await postApiDataSources(validatedInput)

    if (response.status === 201) {
      // レスポンススキーマが生成されていないので、現時点ではそのまま返す
      // TODO: レスポンススキーマが利用可能になったらバリデーションを追加
      return response.data
    }

    throw createError({
      statusCode: response.status,
      statusMessage: 'Failed to create data source',
      data: response.data,
    })
  } catch (error) {
    console.error('Backend API error:', error)

    // Zodバリデーションエラーの場合（リクエストのバリデーション）
    if (error instanceof Error && error.name === 'ValidationError') {
      console.error('Request validation failed:', error.message)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: { validationError: error.message },
      })
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create data source: ${errorMessage}`,
    })
  }
})
