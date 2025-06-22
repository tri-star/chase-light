import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import type { IGitHubRepoService } from "../../../services/github-repo.service.interface"
import { pullRequestSchema } from "../../../schemas/pull-request.schema"
import { repositoryParams } from "../../shared/common-schemas"
import { paginationMeta } from "../../shared/pagination"
import {
  handleError,
  githubErrorResponseSchemaDefinition,
} from "../../shared/error-handling"
import {
  paginate,
  createGitHubPaginationMeta,
} from "../../../../../shared/utils/pagination"
import { PAGINATION } from "../../../constants"

/**
 * プルリクエスト一覧エンドポイント
 */

// プルリクエスト用クエリパラメータ
const pullRequestQuery = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : PAGINATION.MIN_PAGE))
    .refine(
      (val) => val >= PAGINATION.MIN_PAGE,
      `ページ番号は${PAGINATION.MIN_PAGE}以上である必要があります`,
    )
    .refine(
      (val) => val <= PAGINATION.MAX_PAGE,
      `ページ番号は${PAGINATION.MAX_PAGE}以下である必要があります`,
    ),
  perPage: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : PAGINATION.DEFAULT_PER_PAGE))
    .refine(
      (val) => val >= PAGINATION.MIN_PER_PAGE && val <= PAGINATION.MAX_PER_PAGE,
      `1ページあたりの件数は${PAGINATION.MIN_PER_PAGE}から${PAGINATION.MAX_PER_PAGE}の間で指定してください`,
    ),
  state: z
    .enum(
      ["open", "closed", "all"],
      "状態はopen、closed、allのいずれかを指定してください",
    )
    .optional()
    .default("open"),
  sort: z
    .enum(
      ["created", "updated", "popularity", "long-running"],
      "ソート順序が不正です",
    )
    .optional()
    .default("created"),
  direction: z
    .enum(["asc", "desc"], "ソート方向はascまたはdescを指定してください")
    .optional()
    .default("desc"),
})

// レスポンススキーマ
const pullRequestsResponse = z
  .object({
    success: z.boolean().openapi({
      example: true,
      description: "API呼び出しの成功・失敗を示すフラグ",
    }),
    data: z.array(pullRequestSchema).openapi({
      description: "GitHubプルリクエストのリスト",
    }),
    meta: paginationMeta,
  })
  .openapi("PullRequestsResponse")

// API Optionsマッピング関数
const mapToGitHubPullRequestOptions = (
  query: z.infer<typeof pullRequestQuery>,
) => ({
  page: query.page,
  perPage: query.perPage,
  state: query.state,
})

// ルート定義
const getRepositoryPullRequestsRoute = createRoute({
  method: "get",
  path: "/repositories/{owner}/{repo}/pulls",
  request: {
    params: repositoryParams,
    query: pullRequestQuery,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: pullRequestsResponse,
        },
      },
      description: "指定されたリポジトリのプルリクエスト一覧",
    },
    ...githubErrorResponseSchemaDefinition,
  },
  tags: ["Repositories"],
  summary: "リポジトリプルリクエスト一覧取得",
  description:
    "指定されたオーナー/リポジトリ名のGitHubリポジトリのプルリクエスト一覧を取得します。",
})

// ハンドラー実装
export const createPullRequestsRoute = (
  app: OpenAPIHono,
  githubService: IGitHubRepoService,
) => {
  app.openapi(getRepositoryPullRequestsRoute, async (c) => {
    try {
      const { owner, repo } = c.req.valid("param")
      const query = c.req.valid("query")

      const pullRequests = await githubService.getRepositoryPullRequests(
        owner,
        repo,
        mapToGitHubPullRequestOptions(query),
      )

      // Use GitHub-compatible pagination metadata
      const { paginatedItems } = paginate(
        pullRequests,
        query.page,
        query.perPage,
      )
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
