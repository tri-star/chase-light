import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import { requireAuth } from "../../../../auth/middleware/jwt-auth.middleware"
import type { DataSourceCreationService, DataSourceListService, DataSourceDetailService } from "../../../services"
import {
  createDataSourceRequestSchema,
  createDataSourceResponseSchema,
  dataSourceListRequestSchema,
  dataSourceListResponseSchema,
  dataSourceDetailResponseSchema,
  dataSourceErrorResponseSchemaDefinition,
} from "../../schemas"
import { handleDataSourceError } from "../../shared/error-handling"

/**
 * データソースルートファクトリー
 */
export function createDataSourceRoutes(
  dataSourceCreationService: DataSourceCreationService,
  dataSourceListService: DataSourceListService,
  dataSourceDetailService: DataSourceDetailService,
) {
  const app = new OpenAPIHono()

  // ===== データソース一覧取得機能 =====

  /**
   * GET /data-sources ルート定義
   */
  const listDataSourcesRoute = createRoute({
    method: "get",
    path: "/",
    summary: "データソース一覧取得",
    description:
      "ユーザーが監視中のデータソース一覧を取得します。フィルタリング、ソート、ページネーションに対応しています",
    tags: ["DataSources"],
    security: [{ Bearer: [] }],
    request: {
      query: dataSourceListRequestSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: dataSourceListResponseSchema,
          },
        },
        description: "データソース一覧が正常に取得されました",
      },
      ...dataSourceErrorResponseSchemaDefinition,
    },
  })

  /**
   * GET /data-sources - データソース一覧取得エンドポイント
   */
  app.openapi(listDataSourcesRoute, async (c) => {
    try {
      // 認証情報を取得
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      // クエリパラメータを取得
      const query = c.req.valid("query")

      // サービス層でデータソース一覧を取得
      const result = await dataSourceListService.execute({
        userId: auth0UserId,
        filters: {
          name: query.name,
          owner: query.owner,
          search: query.search,
          sourceType: query.sourceType,
          isPrivate: query.isPrivate,
          language: query.language,
          createdAfter: query.createdAfter ? new Date(query.createdAfter) : undefined,
          createdBefore: query.createdBefore ? new Date(query.createdBefore) : undefined,
          updatedAfter: query.updatedAfter ? new Date(query.updatedAfter) : undefined,
          updatedBefore: query.updatedBefore ? new Date(query.updatedBefore) : undefined,
        },
        page: query.page,
        perPage: query.perPage,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      })

      // レスポンスを返す
      return c.json(
        {
          success: true,
          data: {
            items: result.items.map((item) => ({
              dataSource: {
                id: item.dataSource.id,
                sourceType: item.dataSource.sourceType,
                sourceId: item.dataSource.sourceId,
                name: item.dataSource.name,
                description: item.dataSource.description,
                url: item.dataSource.url,
                isPrivate: item.dataSource.isPrivate,
                createdAt: item.dataSource.createdAt.toISOString(),
                updatedAt: item.dataSource.updatedAt.toISOString(),
              },
              repository: {
                id: item.repository.id,
                dataSourceId: item.repository.dataSourceId,
                githubId: item.repository.githubId,
                fullName: item.repository.fullName,
                owner: item.repository.owner,
                language: item.repository.language,
                starsCount: item.repository.starsCount,
                forksCount: item.repository.forksCount,
                openIssuesCount: item.repository.openIssuesCount,
                isFork: item.repository.isFork,
                createdAt: item.repository.createdAt.toISOString(),
                updatedAt: item.repository.updatedAt.toISOString(),
              },
              userWatch: {
                id: item.userWatch.id,
                userId: item.userWatch.userId,
                dataSourceId: item.userWatch.dataSourceId,
                notificationEnabled: item.userWatch.notificationEnabled,
                watchReleases: item.userWatch.watchReleases,
                watchIssues: item.userWatch.watchIssues,
                watchPullRequests: item.userWatch.watchPullRequests,
                addedAt: item.userWatch.addedAt.toISOString(),
              },
            })),
            pagination: result.pagination,
          },
        },
        200,
      )
    } catch (error) {
      return handleDataSourceError(c, error, "list")
    }
  })

  // ===== データソース詳細取得機能 =====

  /**
   * パラメータスキーマ
   */
  const dataSourceDetailParamsSchema = z.object({
    id: z.string().uuid().openapi({
      param: {
        name: "id",
        in: "path",
        required: true,
      },
      example: "550e8400-e29b-41d4-a716-446655440000",
      description: "データソースID（UUID形式）",
    }),
  })

  /**
   * GET /data-sources/{id} ルート定義
   */
  const getDataSourceDetailRoute = createRoute({
    method: "get",
    path: "/{id}",
    summary: "データソース詳細取得",
    description:
      "指定されたIDのデータソース詳細情報を取得します。認証ユーザーがWatch中のデータソースのみアクセス可能です",
    tags: ["DataSources"],
    security: [{ Bearer: [] }],
    request: {
      params: dataSourceDetailParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: dataSourceDetailResponseSchema,
          },
        },
        description: "データソース詳細が正常に取得されました",
      },
      ...dataSourceErrorResponseSchemaDefinition,
    },
  })

  /**
   * GET /data-sources/{id} - データソース詳細取得エンドポイント
   */
  app.openapi(getDataSourceDetailRoute, async (c) => {
    try {
      // 認証情報を取得
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      // パスパラメータを取得
      const { id } = c.req.valid("param")

      // サービス層でデータソース詳細を取得
      const result = await dataSourceDetailService.execute({
        dataSourceId: id,
        userId: auth0UserId,
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
              owner: result.repository.owner,
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
        200,
      )
    } catch (error) {
      return handleDataSourceError(c, error, "detail")
    }
  })

  // ===== データソース作成機能 =====

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
