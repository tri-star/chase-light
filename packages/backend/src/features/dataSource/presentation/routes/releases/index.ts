import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import type { IGitHubRepoService } from "../../../services/github-repo.service.interface"
import { releaseSchema } from "../../../schemas/release.schema"
import {
  repositoryParams,
  basicPaginationQuery,
} from "../../shared/common-schemas"
import { paginationMeta, mapToGitHubApiOptions } from "../../shared/pagination"
import {
  handleError,
  githubErrorResponseSchemaDefinition,
} from "../../shared/error-handling"
import {
  paginate,
  createGitHubPaginationMeta,
} from "../../../../../shared/utils/pagination"

/**
 * リリース一覧エンドポイント
 */

// レスポンススキーマ
const releasesResponse = z
  .object({
    success: z.boolean().openapi({
      example: true,
      description: "API呼び出しの成功・失敗を示すフラグ",
    }),
    data: z.array(releaseSchema).openapi({
      description: "GitHubリリースのリスト",
    }),
    meta: paginationMeta,
  })
  .openapi("ReleasesResponse")

// ルート定義
const getRepositoryReleasesRoute = createRoute({
  method: "get",
  path: "/repositories/{owner}/{repo}/releases",
  request: {
    params: repositoryParams,
    query: basicPaginationQuery,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: releasesResponse,
        },
      },
      description: "指定されたリポジトリのリリース一覧",
    },
    ...githubErrorResponseSchemaDefinition,
  },
  tags: ["Repositories"],
  summary: "リポジトリリリース一覧取得",
  description:
    "指定されたオーナー/リポジトリ名のGitHubリポジトリのリリース一覧を取得します。",
})

// ハンドラー実装
export const createReleasesRoute = (
  app: OpenAPIHono,
  githubService: IGitHubRepoService,
) => {
  app.openapi(getRepositoryReleasesRoute, async (c) => {
    try {
      const { owner, repo } = c.req.valid("param")
      const query = c.req.valid("query")

      const releases = await githubService.getRepositoryReleases(
        owner,
        repo,
        mapToGitHubApiOptions(query),
      )

      // Use GitHub-compatible pagination metadata
      const { paginatedItems } = paginate(releases, query.page, query.perPage)
      const meta = createGitHubPaginationMeta(
        query.page,
        query.perPage,
        paginatedItems.length,
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
