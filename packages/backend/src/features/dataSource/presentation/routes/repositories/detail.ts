import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import type { IGitHubRepoService } from "../../../services/github-repo.service.interface"
import { repositorySchema } from "../../../schemas/repository.schema"
import { repositoryParams } from "../../shared/common-schemas"
import {
  handleError,
  githubErrorResponseSchemaDefinition,
} from "../../shared/error-handling"

/**
 * リポジトリ詳細エンドポイント
 */

// レスポンススキーマ
const repositoryDetailResponse = z
  .object({
    success: z.boolean().openapi({
      example: true,
      description: "API呼び出しの成功・失敗を示すフラグ",
    }),
    data: repositorySchema,
  })
  .openapi("RepositoryDetailResponse")

// ルート定義
const getRepositoryDetailsRoute = createRoute({
  method: "get",
  path: "/repositories/{owner}/{repo}",
  request: {
    params: repositoryParams,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: repositoryDetailResponse,
        },
      },
      description: "指定されたリポジトリの詳細情報",
    },
    ...githubErrorResponseSchemaDefinition,
  },
  tags: ["Repositories"],
  summary: "リポジトリ詳細取得",
  description:
    "指定されたオーナー/リポジトリ名のGitHubリポジトリの詳細情報を取得します。",
})

// ハンドラー実装
export const createRepositoryDetailsRoute = (
  app: OpenAPIHono,
  githubService: IGitHubRepoService,
) => {
  app.openapi(getRepositoryDetailsRoute, async (c) => {
    try {
      const { owner, repo } = c.req.valid("param")

      const repository = await githubService.getRepositoryDetails(owner, repo)

      return c.json(
        {
          success: true,
          data: repository,
        },
        200,
      )
    } catch (error) {
      return handleError(c, error)
    }
  })
}
