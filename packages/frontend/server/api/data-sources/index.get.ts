import { getApiDataSources } from '~/generated/api/backend'
import type {
  DataSourceListResponseData,
  GetApiDataSourcesParams,
  GetApiDataSourcesSortBy,
  GetApiDataSourcesSortOrder,
} from '~/generated/api/schemas'
import { getApiDataSourcesResponse } from '~/generated/api/zod/chaseLightAPI.zod'
import { validateWithZod } from '~/utils/validation'

export default defineEventHandler(
  async (
    event
  ): Promise<{
    success: boolean
    data: DataSourceListResponseData
  }> => {
    // セッション認証を要求
    const session = await requireUserSession(event)

    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User session not found',
      })
    }

    // クエリパラメータを取得
    const query = getQuery(event)
    const params: GetApiDataSourcesParams = {
      name: query.name as string,
      owner: query.owner as string,
      search: query.search as string,
      sourceType: query.sourceType as string,
      isPrivate: query.isPrivate ? query.isPrivate === 'true' : undefined,
      language: query.language as string,
      createdAfter: query.createdAfter as string,
      createdBefore: query.createdBefore as string,
      updatedAfter: query.updatedAfter as string,
      updatedBefore: query.updatedBefore as string,
      sortBy: query.sortBy as GetApiDataSourcesSortBy,
      sortOrder: query.sortOrder as GetApiDataSourcesSortOrder,
      page: query.page ? parseInt(query.page as string, 10) : 1,
      perPage: query.perPage ? parseInt(query.perPage as string, 10) : 20,
    }

    // 未定義値を除去
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    ) as GetApiDataSourcesParams

    try {
      // Backend APIを呼び出し
      const response = await getApiDataSources(cleanParams, {
        headers: {
          Authorization: `Bearer ${session.userId}`, // 仮の認証情報
        },
      })

      if (response.status === 200) {
        // Backend APIからの応答をZodスキーマでバリデーション
        const validatedData = validateWithZod(
          getApiDataSourcesResponse,
          response.data,
          'data sources API response'
        )
        return validatedData
      }

      throw createError({
        statusCode: response.status,
        statusMessage: 'Failed to fetch data sources',
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
        statusMessage: `Failed to fetch data sources: ${errorMessage}`,
      })
    }
  }
)
