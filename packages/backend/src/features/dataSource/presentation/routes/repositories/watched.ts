import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import type { IGitHubRepoService } from "../../../services/github-repo.service.interface"
import { repositorySchema } from "../../../schemas/repository.schema"
import { basicPaginationQuery } from "../../shared/common-schemas"
import { createPaginatedResponse } from "../../shared/pagination"
import {
  handleError,
  githubErrorResponseSchemaDefinition,
} from "../../shared/error-handling"
import { paginate } from "../../../../../shared/utils/pagination"

/**
 * Watch済みリポジトリ一覧エンドポイント
 */

// レスポンススキーマ
const watchedRepositoriesResponse = createPaginatedResponse(
  repositorySchema,
).openapi("WatchedRepositoriesResponse")

// ルート定義
const getWatchedRepositoriesRoute = createRoute({
  method: "get",
  path: "/repositories/watched",
  request: {
    query: basicPaginationQuery,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: watchedRepositoriesResponse,
        },
      },
      description: "認証ユーザーがwatch済みのリポジトリ一覧",
    },
    ...githubErrorResponseSchemaDefinition,
  },
  tags: ["Repositories"],
  summary: "Watch済みリポジトリ一覧取得",
  description:
    "認証されたユーザーがウォッチしているGitHubリポジトリの一覧を取得します。",
})

// ハンドラー実装
export const createWatchedRepositoriesRoute = (
  app: OpenAPIHono,
  githubService: IGitHubRepoService,
) => {
  app.openapi(getWatchedRepositoriesRoute, async (c) => {
    try {
      const query = c.req.valid("query")

      const repositories = await githubService.getWatchedRepositories()

      // Use shared pagination helper
      const { paginatedItems, meta } = paginate(
        repositories,
        query.page,
        query.perPage,
      )

      return c.json(
        {
          success: true,
          data: paginatedItems,
          meta,
        },
        200,
      )
    } catch (error) {
      return handleError(c, error)
    }
  })
}
