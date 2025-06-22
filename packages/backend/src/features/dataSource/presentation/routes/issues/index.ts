import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import type { IGitHubRepoService } from "../../../services/github-repo.service.interface"
import { issueSchema } from "../../../schemas/issue.schema"
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
 * イシュー一覧エンドポイント
 */

// Issue用クエリパラメータ
const issueQuery = z.object({
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
    .enum(["created", "updated", "comments"], "ソート順序が不正です")
    .optional()
    .default("created"),
  direction: z
    .enum(["asc", "desc"], "ソート方向はascまたはdescを指定してください")
    .optional()
    .default("desc"),
  since: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true
      const date = new Date(val)
      return !isNaN(date.getTime())
    }, "有効なISO 8601日付文字列を指定してください"),
})

// レスポンススキーマ
const issuesResponse = z
  .object({
    success: z.boolean().openapi({
      example: true,
      description: "API呼び出しの成功・失敗を示すフラグ",
    }),
    data: z.array(issueSchema).openapi({
      description: "GitHubイシューのリスト",
    }),
    meta: paginationMeta,
  })
  .openapi("IssuesResponse")

// API Optionsマッピング関数
const mapToGitHubIssueOptions = (
  query: z.infer<typeof issueQuery>,
) => ({
  page: query.page,
  perPage: query.perPage,
  state: query.state,
})

// ルート定義
const getRepositoryIssuesRoute = createRoute({
  method: "get",
  path: "/repositories/{owner}/{repo}/issues",
  request: {
    params: repositoryParams,
    query: issueQuery,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: issuesResponse,
        },
      },
      description: "指定されたリポジトリのイシュー一覧",
    },
    ...githubErrorResponseSchemaDefinition,
  },
  tags: ["Repositories"],
  summary: "リポジトリイシュー一覧取得",
  description:
    "指定されたオーナー/リポジトリ名のGitHubリポジトリのイシュー一覧を取得します。",
})

// ハンドラー実装
export const createIssuesRoute = (
  app: OpenAPIHono,
  githubService: IGitHubRepoService,
) => {
  app.openapi(getRepositoryIssuesRoute, async (c) => {
    try {
      const { owner, repo } = c.req.valid("param")
      const query = c.req.valid("query")

      const issues = await githubService.getRepositoryIssues(
        owner,
        repo,
        mapToGitHubIssueOptions(query),
      )

      // Use GitHub-compatible pagination metadata
      const { paginatedItems } = paginate(issues, query.page, query.perPage)
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
