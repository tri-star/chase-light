import { postApiDataSources } from '~/generated/api/backend'
import type { CreateDataSourceRequest } from '~/generated/api/schemas'
import { postApiDataSourcesBody } from '~/generated/api/zod/chaseLightAPI.zod'
import { handleBackendApiError } from '~/server/utils/api'
import { validateWithZod } from '~/utils/validation'

export default defineEventHandler(async (event) => {
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
    handleBackendApiError(error)
  }
})
