import { z } from "@hono/zod-openapi"
import { GITHUB_USERNAME, GITHUB_REPOSITORY, PAGINATION } from "../../constants"

/**
 * 複数エンドポイントで共有される共通スキーマ
 */

// リポジトリパラメータ（オーナー/リポジトリ名）
export const repositoryParams = z
  .object({
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
      )
      .openapi({
        param: {
          name: "owner",
          in: "path",
        },
        example: "facebook",
        description: "GitHubリポジトリのオーナー名（ユーザー名または組織名）",
      }),
    repo: z
      .string()
      .min(GITHUB_REPOSITORY.MIN_LENGTH, "リポジトリ名は必須です")
      .max(
        GITHUB_REPOSITORY.MAX_LENGTH,
        `GitHubリポジトリ名は${GITHUB_REPOSITORY.MAX_LENGTH}文字以下である必要があります`,
      )
      .regex(GITHUB_REPOSITORY.PATTERN, GITHUB_REPOSITORY.ERROR_MESSAGE)
      .openapi({
        param: {
          name: "repo",
          in: "path",
        },
        example: "react",
        description: "GitHubリポジトリ名",
      }),
  })
  .openapi("RepositoryParams")

// エラーレスポンス
export const errorResponse = z
  .object({
    success: z.boolean().openapi({
      example: false,
      description: "エラー時は常にfalse",
    }),
    error: z
      .object({
        code: z.string().openapi({
          example: "GITHUB_API_ERROR",
          description: "エラーコード",
        }),
        message: z.string().openapi({
          example: "GitHub APIエラーが発生しました",
          description: "エラーメッセージ",
        }),
        details: z.any().optional().openapi({
          description: "エラーの詳細情報",
        }),
      })
      .openapi({
        description: "エラー情報",
      }),
  })
  .openapi("ErrorResponse")

// 基本的なページングクエリ
export const basicPaginationQuery = z
  .object({
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
      )
      .openapi({
        param: {
          name: "page",
          in: "query",
        },
        example: 1,
        description: `ページ番号（${PAGINATION.MIN_PAGE}-${PAGINATION.MAX_PAGE}）`,
      }),
    perPage: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : PAGINATION.DEFAULT_PER_PAGE))
      .refine(
        (val) =>
          val >= PAGINATION.MIN_PER_PAGE && val <= PAGINATION.MAX_PER_PAGE,
        `1ページあたりの件数は${PAGINATION.MIN_PER_PAGE}から${PAGINATION.MAX_PER_PAGE}の間で指定してください`,
      )
      .openapi({
        param: {
          name: "perPage",
          in: "query",
        },
        example: PAGINATION.DEFAULT_PER_PAGE,
        description: `1ページあたりの件数（${PAGINATION.MIN_PER_PAGE}-${PAGINATION.MAX_PER_PAGE}）`,
      }),
  })
  .openapi("BasicPaginationQuery")

// 型推論用エクスポート
export type RepositoryParams = z.infer<typeof repositoryParams>
export type BasicPaginationQuery = z.infer<typeof basicPaginationQuery>
