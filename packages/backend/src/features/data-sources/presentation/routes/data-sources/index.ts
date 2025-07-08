import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { requireAuth } from "../../../../auth/middleware/jwt-auth.middleware"
import type { DataSourceCreationService } from "../../../services"
import {
  createDataSourceRequestSchema,
  createDataSourceResponseSchema,
  dataSourceErrorResponseSchemaDefinition,
} from "../../schemas"
import { handleDataSourceError } from "../../shared/error-handling"

/**
 * POST /data-sources ルート定義
 */
const createDataSourceRoute = createRoute({
  method: "post",
  path: "/",
  summary: "データソース登録",
  description:
    "GitHubリポジトリをデータソースとして登録し、ユーザーの監視対象に追加します",
  tags: ["DataSources"],
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createDataSourceRequestSchema,
        },
      },
      description: "データソース作成リクエスト",
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: createDataSourceResponseSchema,
        },
      },
      description: "データソースが正常に作成されました",
    },
    ...dataSourceErrorResponseSchemaDefinition,
  },
})

/**
 * データソースルートファクトリー
 */
export function createDataSourceRoutes(
  dataSourceCreationService: DataSourceCreationService,
) {
  const app = new OpenAPIHono()

  /**
   * POST /data-sources - データソース作成エンドポイント
   */
  app.openapi(createDataSourceRoute, async (c) => {
    try {
      // 認証情報を取得
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      // リクエストボディを取得
      const body = c.req.valid("json")

      // サービス層でデータソースを作成
      const result = await dataSourceCreationService.execute({
        repositoryUrl: body.repositoryUrl,
        userId: auth0UserId,
        name: body.name,
        description: body.description,
        notificationEnabled: body.notificationEnabled,
        watchReleases: body.watchReleases,
        watchIssues: body.watchIssues,
        watchPullRequests: body.watchPullRequests,
      })

      // レスポンスを返す
      return c.json(
        {
          success: true,
          data: {
            dataSource: {
              id: result.dataSource.id,
              sourceType: result.dataSource.sourceType,
              sourceId: result.dataSource.sourceId,
              name: result.dataSource.name,
              description: result.dataSource.description,
              url: result.dataSource.url,
              isPrivate: result.dataSource.isPrivate,
              createdAt: result.dataSource.createdAt.toISOString(),
              updatedAt: result.dataSource.updatedAt.toISOString(),
            },
            repository: {
              id: result.repository.id,
              dataSourceId: result.repository.dataSourceId,
              githubId: result.repository.githubId,
              fullName: result.repository.fullName,
              language: result.repository.language,
              starsCount: result.repository.starsCount,
              forksCount: result.repository.forksCount,
              openIssuesCount: result.repository.openIssuesCount,
              isFork: result.repository.isFork,
              createdAt: result.repository.createdAt.toISOString(),
              updatedAt: result.repository.updatedAt.toISOString(),
            },
            userWatch: {
              id: result.userWatch.id,
              userId: result.userWatch.userId,
              dataSourceId: result.userWatch.dataSourceId,
              notificationEnabled: result.userWatch.notificationEnabled,
              watchReleases: result.userWatch.watchReleases,
              watchIssues: result.userWatch.watchIssues,
              watchPullRequests: result.userWatch.watchPullRequests,
              addedAt: result.userWatch.addedAt.toISOString(),
            },
          },
        },
        201,
      )
    } catch (error) {
      return handleDataSourceError(c, error, "creation")
    }
  })

  return app
}
