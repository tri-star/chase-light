import { z } from "zod/v4"
import type {
  GitHubApiOptions,
  GitHubPullRequestOptions,
  GitHubIssueOptions,
} from "../types/api-options"
import { GITHUB_USERNAME, GITHUB_REPOSITORY, PAGINATION } from "../constants"

/**
 * DataSource Presentation Schemas
 * GitHub API エンドポイント用のリクエスト/レスポンスバリデーションスキーマ
 */

/**
 * Path Parameters
 */
export const dataSourceSchemas = {
  // ユーザー名のパラメータ
  usernameParams: z.object({
    username: z
      .string()
      .min(GITHUB_USERNAME.MIN_LENGTH, "ユーザー名は必須です")
      .max(
        GITHUB_USERNAME.MAX_LENGTH,
        `GitHubユーザー名は${GITHUB_USERNAME.MAX_LENGTH}文字以下である必要があります`,
      )
      .regex(GITHUB_USERNAME.PATTERN, GITHUB_USERNAME.ERROR_MESSAGE),
  }),

  // リポジトリパラメータ（オーナー/リポジトリ名）
  repositoryParams: z.object({
    owner: z
      .string()
      .min(GITHUB_USERNAME.MIN_LENGTH, "オーナー名は必須です")
      .max(
        GITHUB_USERNAME.MAX_LENGTH,
        `GitHubオーナー名は${GITHUB_USERNAME.MAX_LENGTH}文字以下である必要があります`,
      )
      .regex(
        GITHUB_USERNAME.PATTERN,
        "有効なGitHubオーナー名を指定してください",
      ),
    repo: z
      .string()
      .min(GITHUB_REPOSITORY.MIN_LENGTH, "リポジトリ名は必須です")
      .max(
        GITHUB_REPOSITORY.MAX_LENGTH,
        `GitHubリポジトリ名は${GITHUB_REPOSITORY.MAX_LENGTH}文字以下である必要があります`,
      )
      .regex(GITHUB_REPOSITORY.PATTERN, GITHUB_REPOSITORY.ERROR_MESSAGE),
  }),

  /**
   * Query Parameters
   */
  // 基本的なページングクエリ
  basicPaginationQuery: z.object({
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
        (val) =>
          val >= PAGINATION.MIN_PER_PAGE && val <= PAGINATION.MAX_PER_PAGE,
        `1ページあたりの件数は${PAGINATION.MIN_PER_PAGE}から${PAGINATION.MAX_PER_PAGE}の間で指定してください`,
      ),
  }),

  // Pull Request用クエリパラメータ
  pullRequestQuery: z.object({
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
        (val) =>
          val >= PAGINATION.MIN_PER_PAGE && val <= PAGINATION.MAX_PER_PAGE,
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
  }),

  // Issue用クエリパラメータ
  issueQuery: z.object({
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
        (val) =>
          val >= PAGINATION.MIN_PER_PAGE && val <= PAGINATION.MAX_PER_PAGE,
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
  }),

  /**
   * Response Schemas
   */
  // API レスポンス共通フォーマット
  apiResponse: <T>(dataSchema: z.ZodType<T>) =>
    z.object({
      success: z.boolean(),
      data: dataSchema,
      meta: z
        .object({
          page: z.number().optional(),
          perPage: z.number().optional(),
          total: z.number().optional(),
          hasNext: z.boolean().optional(),
          hasPrev: z.boolean().optional(),
        })
        .optional(),
    }),

  // エラーレスポンス
  errorResponse: z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    }),
  }),
}

// 型推論用のエクスポート
export type UsernameParams = z.infer<typeof dataSourceSchemas.usernameParams>
export type RepositoryParams = z.infer<
  typeof dataSourceSchemas.repositoryParams
>
export type BasicPaginationQuery = z.infer<
  typeof dataSourceSchemas.basicPaginationQuery
>
export type PullRequestQuery = z.infer<
  typeof dataSourceSchemas.pullRequestQuery
>
export type IssueQuery = z.infer<typeof dataSourceSchemas.issueQuery>

// API Options へのマッピング関数
export const mapToGitHubApiOptions = (
  query: BasicPaginationQuery,
): GitHubApiOptions => ({
  page: query.page,
  perPage: query.perPage,
})

export const mapToGitHubPullRequestOptions = (
  query: PullRequestQuery,
): GitHubPullRequestOptions => ({
  page: query.page,
  perPage: query.perPage,
  state: query.state,
  sort: query.sort,
  direction: query.direction,
})

export const mapToGitHubIssueOptions = (
  query: IssueQuery,
): GitHubIssueOptions => ({
  page: query.page,
  perPage: query.perPage,
  state: query.state,
  sort: query.sort,
  direction: query.direction,
  since: query.since,
})
