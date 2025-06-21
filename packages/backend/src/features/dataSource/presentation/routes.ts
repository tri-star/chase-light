import { Hono, type Context } from "hono"
import { zValidator } from "@hono/zod-validator"
import {
  dataSourceSchemas,
  mapToGitHubApiOptions,
  mapToGitHubPullRequestOptions,
  mapToGitHubIssueOptions,
} from "./schemas"
import type { IGitHubRepoService } from "../services/github-repo.service.interface"
import {
  GitHubApiError,
  GitHubRateLimitError,
  GitHubAuthenticationError,
} from "../errors/github-api.error"
import { GitHubApiParseError } from "../errors/github-parse.error"

/**
 * DataSource Routes (GitHub API Integration)
 * GitHub データソース関連のAPIエンドポイント
 */

export const createDataSourceRoutes = (githubService: IGitHubRepoService) => {
  const app = new Hono()

  /**
   * GET /repositories/watched/:username
   * ユーザーがwatch済みのリポジトリ一覧を取得
   */
  app.get(
    "/repositories/watched/:username",
    zValidator("param", dataSourceSchemas.usernameParams),
    zValidator("query", dataSourceSchemas.basicPaginationQuery),
    async (c) => {
      try {
        const { username } = c.req.valid("param")
        const query = c.req.valid("query")

        const repositories =
          await githubService.getWatchedRepositories(username)

        // シンプルなクライアントサイドページング（GitHub APIの制限に合わせて）
        const startIndex = (query.page - 1) * query.perPage
        const endIndex = startIndex + query.perPage
        const paginatedRepositories = repositories.slice(startIndex, endIndex)

        return c.json({
          success: true,
          data: paginatedRepositories,
          meta: {
            page: query.page,
            perPage: query.perPage,
            total: repositories.length,
            hasNext: endIndex < repositories.length,
            hasPrev: query.page > 1,
          },
        })
      } catch (error) {
        return handleError(c, error)
      }
    },
  )

  /**
   * GET /repositories/:owner/:repo
   * 指定リポジトリの詳細情報を取得
   */
  app.get(
    "/repositories/:owner/:repo",
    zValidator("param", dataSourceSchemas.repositoryParams),
    async (c) => {
      try {
        const { owner, repo } = c.req.valid("param")

        const repository = await githubService.getRepositoryDetails(owner, repo)

        return c.json({
          success: true,
          data: repository,
        })
      } catch (error) {
        return handleError(c, error)
      }
    },
  )

  /**
   * GET /repositories/:owner/:repo/releases
   * 指定リポジトリのリリース一覧を取得
   */
  app.get(
    "/repositories/:owner/:repo/releases",
    zValidator("param", dataSourceSchemas.repositoryParams),
    zValidator("query", dataSourceSchemas.basicPaginationQuery),
    async (c) => {
      try {
        const { owner, repo } = c.req.valid("param")
        const query = c.req.valid("query")

        const releases = await githubService.getRepositoryReleases(
          owner,
          repo,
          mapToGitHubApiOptions(query),
        )

        return c.json({
          success: true,
          data: releases,
          meta: {
            page: query.page,
            perPage: query.perPage,
            hasNext: releases.length === query.perPage,
            hasPrev: query.page > 1,
          },
        })
      } catch (error) {
        return handleError(c, error)
      }
    },
  )

  /**
   * GET /repositories/:owner/:repo/pulls
   * 指定リポジトリのPull Request一覧を取得
   */
  app.get(
    "/repositories/:owner/:repo/pulls",
    zValidator("param", dataSourceSchemas.repositoryParams),
    zValidator("query", dataSourceSchemas.pullRequestQuery),
    async (c) => {
      try {
        const { owner, repo } = c.req.valid("param")
        const query = c.req.valid("query")

        const pullRequests = await githubService.getRepositoryPullRequests(
          owner,
          repo,
          mapToGitHubPullRequestOptions(query),
        )

        return c.json({
          success: true,
          data: pullRequests,
          meta: {
            page: query.page,
            perPage: query.perPage,
            hasNext: pullRequests.length === query.perPage,
            hasPrev: query.page > 1,
          },
        })
      } catch (error) {
        return handleError(c, error)
      }
    },
  )

  /**
   * GET /repositories/:owner/:repo/issues
   * 指定リポジトリのIssue一覧を取得
   */
  app.get(
    "/repositories/:owner/:repo/issues",
    zValidator("param", dataSourceSchemas.repositoryParams),
    zValidator("query", dataSourceSchemas.issueQuery),
    async (c) => {
      try {
        const { owner, repo } = c.req.valid("param")
        const query = c.req.valid("query")

        const issues = await githubService.getRepositoryIssues(
          owner,
          repo,
          mapToGitHubIssueOptions(query),
        )

        return c.json({
          success: true,
          data: issues,
          meta: {
            page: query.page,
            perPage: query.perPage,
            hasNext: issues.length === query.perPage,
            hasPrev: query.page > 1,
          },
        })
      } catch (error) {
        return handleError(c, error)
      }
    },
  )

  return app
}

/**
 * エラーハンドリング関数
 * GitHub API特有のエラーを適切なHTTPステータスコードとレスポンスに変換
 */
function handleError(c: Context, error: unknown) {
  console.error("DataSource API Error:", error)

  // GitHub認証エラー
  if (error instanceof GitHubAuthenticationError) {
    return c.json(
      {
        success: false,
        error: {
          code: "GITHUB_AUTH_ERROR",
          message: "GitHub認証に失敗しました",
          details: error.message,
        },
      },
      401,
    )
  }

  // GitHub Rate Limitエラー
  if (error instanceof GitHubRateLimitError) {
    return c.json(
      {
        success: false,
        error: {
          code: "GITHUB_RATE_LIMIT",
          message: "GitHub APIのレート制限に達しました",
          details: {
            resetTime: error.resetTime,
            remaining: error.remaining,
          },
        },
      },
      429,
    )
  }

  // GitHub一般的なAPIエラー
  if (error instanceof GitHubApiError) {
    const statusCode = error.status === 404 ? 404 : 400
    return c.json(
      {
        success: false,
        error: {
          code: "GITHUB_API_ERROR",
          message: "GitHub APIエラーが発生しました",
          details: {
            status: error.status,
            originalMessage: error.message,
          },
        },
      },
      statusCode,
    )
  }

  // GitHub APIパースエラー
  if (error instanceof GitHubApiParseError) {
    return c.json(
      {
        success: false,
        error: {
          code: "GITHUB_PARSE_ERROR",
          message: "GitHub APIレスポンスの解析に失敗しました",
          details: {
            originalMessage: error.message,
            errors: error.getFormattedErrors(),
          },
        },
      },
      422,
    )
  }

  // その他の予期しないエラー
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "内部サーバーエラーが発生しました",
      },
    },
    500,
  )
}

export default createDataSourceRoutes
