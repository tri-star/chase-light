import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import { requireAuth } from "../../../../identity/middleware/jwt-auth.middleware"
import type {
  RegisterDataSourceWatchUseCase,
  ListDataSourcesUseCase,
  GetDataSourceUseCase,
  UpdateDataSourceUseCase,
  RemoveDataSourceWatchUseCase,
} from "../../../application/use-cases"
import {
  createDataSourceRequestSchema,
  createDataSourceResponseSchema,
  dataSourceListRequestSchema,
  dataSourceListResponseSchema,
  dataSourceDetailResponseSchema,
  dataSourceErrorResponseSchemaDefinition,
} from "../../schemas"
import { handleDataSourceError } from "../../shared/error-handling"

export function createDataSourceRoutes(
  registerDataSourceWatchUseCase: RegisterDataSourceWatchUseCase,
  listDataSourcesUseCase: ListDataSourcesUseCase,
  getDataSourceUseCase: GetDataSourceUseCase,
  updateDataSourceUseCase: UpdateDataSourceUseCase,
  removeDataSourceWatchUseCase: RemoveDataSourceWatchUseCase,
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
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      const query = c.req.valid("query")

      const result = await listDataSourcesUseCase.execute({
        userId: auth0UserId,
        filters: {
          name: query.name,
          owner: query.owner,
          search: query.search,
          sourceType: query.sourceType,
          isPrivate: query.isPrivate,
          language: query.language,
          createdAfter: query.createdAfter
            ? new Date(query.createdAfter)
            : undefined,
          createdBefore: query.createdBefore
            ? new Date(query.createdBefore)
            : undefined,
          updatedAfter: query.updatedAfter
            ? new Date(query.updatedAfter)
            : undefined,
          updatedBefore: query.updatedBefore
            ? new Date(query.updatedBefore)
            : undefined,
        },
        page: query.page,
        perPage: query.perPage,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      })

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
                repository: {
                  id: item.dataSource.repository.id,
                  githubId: item.dataSource.repository.githubId,
                  fullName: item.dataSource.repository.fullName,
                  owner: item.dataSource.repository.owner,
                  language: item.dataSource.repository.language,
                  starsCount: item.dataSource.repository.starsCount,
                  forksCount: item.dataSource.repository.forksCount,
                  openIssuesCount: item.dataSource.repository.openIssuesCount,
                  isFork: item.dataSource.repository.isFork,
                  createdAt: item.dataSource.repository.createdAt.toISOString(),
                  updatedAt: item.dataSource.repository.updatedAt.toISOString(),
                },
                createdAt: item.dataSource.createdAt.toISOString(),
                updatedAt: item.dataSource.updatedAt.toISOString(),
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

  // ===== データソース作成機能 =====

  /**
   * POST /data-sources ルート定義
   */
  const createDataSourceRoute = createRoute({
    method: "post",
    path: "/",
    summary: "データソース監視登録",
    description:
      "GitHubリポジトリのURLからデータソースを登録し、ユーザーのウォッチ設定を作成します",
    tags: ["DataSources"],
    security: [{ Bearer: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: createDataSourceRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: createDataSourceResponseSchema,
          },
        },
        description: "データソースが正常に登録されました",
      },
      ...dataSourceErrorResponseSchemaDefinition,
    },
  })

  /**
   * POST /data-sources エンドポイント
   */
  app.openapi(createDataSourceRoute, async (c) => {
    try {
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      const body = c.req.valid("json")

      const result = await registerDataSourceWatchUseCase.execute({
        repositoryUrl: body.repositoryUrl,
        userId: auth0UserId,
        name: body.name,
        description: body.description,
        notificationEnabled: body.notificationEnabled,
        watchReleases: body.watchReleases,
        watchIssues: body.watchIssues,
        watchPullRequests: body.watchPullRequests,
      })

      return c.json(
        {
          success: true as const,
          data: {
            dataSource: {
              id: result.dataSource.id,
              sourceType: result.dataSource.sourceType,
              sourceId: result.dataSource.sourceId,
              name: result.dataSource.name,
              description: result.dataSource.description,
              url: result.dataSource.url,
              isPrivate: result.dataSource.isPrivate,
              repository: {
                id: result.dataSource.repository.id,
                githubId: result.dataSource.repository.githubId,
                fullName: result.dataSource.repository.fullName,
                owner: result.dataSource.repository.owner,
                language: result.dataSource.repository.language,
                starsCount: result.dataSource.repository.starsCount,
                forksCount: result.dataSource.repository.forksCount,
                openIssuesCount: result.dataSource.repository.openIssuesCount,
                isFork: result.dataSource.repository.isFork,
                createdAt: result.dataSource.repository.createdAt.toISOString(),
                updatedAt: result.dataSource.repository.updatedAt.toISOString(),
              },
              createdAt: result.dataSource.createdAt.toISOString(),
              updatedAt: result.dataSource.updatedAt.toISOString(),
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
      return handleDataSourceError(c, error, "create")
    }
  })

  // ===== データソース詳細取得機能 =====

  /**
   * GET /data-sources/{id} ルート定義
   */
  const dataSourceDetailParamsSchema = z.object({
    id: z.string().uuid().describe("データソースID"),
  })

  const getDataSourceRoute = createRoute({
    method: "get",
    path: "/{id}",
    summary: "データソース詳細取得",
    description:
      "監視中のデータソースの詳細情報を取得します。認証ユーザーがアクセス権限を持つデータソースのみ取得可能です",
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
   * GET /data-sources/{id} エンドポイント
   */
  app.openapi(getDataSourceRoute, async (c) => {
    try {
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      const { id } = c.req.valid("param")

      const result = await getDataSourceUseCase.execute({
        dataSourceId: id,
        userId: auth0UserId,
      })

      return c.json(
        {
          success: true as const,
          data: {
            dataSource: {
              id: result.dataSource.id,
              sourceType: result.dataSource.sourceType,
              sourceId: result.dataSource.sourceId,
              name: result.dataSource.name,
              description: result.dataSource.description,
              url: result.dataSource.url,
              isPrivate: result.dataSource.isPrivate,
              repository: {
                id: result.dataSource.repository.id,
                githubId: result.dataSource.repository.githubId,
                fullName: result.dataSource.repository.fullName,
                owner: result.dataSource.repository.owner,
                language: result.dataSource.repository.language,
                starsCount: result.dataSource.repository.starsCount,
                forksCount: result.dataSource.repository.forksCount,
                openIssuesCount: result.dataSource.repository.openIssuesCount,
                isFork: result.dataSource.repository.isFork,
                createdAt: result.dataSource.repository.createdAt.toISOString(),
                updatedAt: result.dataSource.repository.updatedAt.toISOString(),
              },
              createdAt: result.dataSource.createdAt.toISOString(),
              updatedAt: result.dataSource.updatedAt.toISOString(),
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

  // ===== データソース更新機能 =====

  /**
   * PUT /data-sources/{id} ルート定義
   */
  const updateDataSourceRoute = createRoute({
    method: "put",
    path: "/{id}",
    summary: "データソース更新",
    description:
      "データソースの基本情報とウォッチ設定を更新します。認証ユーザーがウォッチ中のデータソースのみ更新可能です",
    tags: ["DataSources"],
    security: [{ Bearer: [] }],
    request: {
      params: dataSourceDetailParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: createDataSourceRequestSchema.partial(),
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: createDataSourceResponseSchema,
          },
        },
        description: "データソースが正常に更新されました",
      },
      ...dataSourceErrorResponseSchemaDefinition,
    },
  })

  /**
   * PUT /data-sources/{id} エンドポイント
   */
  app.openapi(updateDataSourceRoute, async (c) => {
    try {
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      const { id } = c.req.valid("param")
      const body = c.req.valid("json")

      const result = await updateDataSourceUseCase.execute({
        dataSourceId: id,
        userId: auth0UserId,
        name: body.name,
        description: body.description,
        notificationEnabled: body.notificationEnabled,
        watchReleases: body.watchReleases,
        watchIssues: body.watchIssues,
        watchPullRequests: body.watchPullRequests,
      })

      return c.json(
        {
          success: true as const,
          data: {
            dataSource: {
              id: result.dataSource.id,
              sourceType: result.dataSource.sourceType,
              sourceId: result.dataSource.sourceId,
              name: result.dataSource.name,
              description: result.dataSource.description,
              url: result.dataSource.url,
              isPrivate: result.dataSource.isPrivate,
              repository: {
                id: result.dataSource.repository.id,
                githubId: result.dataSource.repository.githubId,
                fullName: result.dataSource.repository.fullName,
                owner: result.dataSource.repository.owner,
                language: result.dataSource.repository.language,
                starsCount: result.dataSource.repository.starsCount,
                forksCount: result.dataSource.repository.forksCount,
                openIssuesCount: result.dataSource.repository.openIssuesCount,
                isFork: result.dataSource.repository.isFork,
                createdAt: result.dataSource.repository.createdAt.toISOString(),
                updatedAt: result.dataSource.repository.updatedAt.toISOString(),
              },
              createdAt: result.dataSource.createdAt.toISOString(),
              updatedAt: result.dataSource.updatedAt.toISOString(),
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
      return handleDataSourceError(c, error, "update")
    }
  })

  // ===== データソース削除機能 =====

  /**
   * DELETE /data-sources/{id} ルート定義
   */
  const deleteDataSourceRoute = createRoute({
    method: "delete",
    path: "/{id}",
    summary: "データソース削除",
    description:
      "指定されたIDのデータソース監視を削除します。認証ユーザーがWatch中のデータソースのみ削除可能です",
    tags: ["DataSources"],
    security: [{ Bearer: [] }],
    request: {
      params: dataSourceDetailParamsSchema,
    },
    responses: {
      204: {
        description: "データソースが正常に削除されました",
      },
      ...dataSourceErrorResponseSchemaDefinition,
    },
  })

  /**
   * DELETE /data-sources/{id} エンドポイント
   */
  app.openapi(deleteDataSourceRoute, async (c) => {
    try {
      const authenticatedUser = requireAuth(c)
      const auth0UserId = authenticatedUser.sub

      const { id } = c.req.valid("param")

      await removeDataSourceWatchUseCase.execute({
        dataSourceId: id,
        userId: auth0UserId,
      })

      return c.body(null, 204)
    } catch (error) {
      return handleDataSourceError(c, error, "deletion")
    }
  })

  return app
}
