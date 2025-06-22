import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
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
import {
  paginate,
  createGitHubPaginationMeta,
} from "../../../shared/utils/pagination"
import { Context, TypedResponse } from "hono"

type GitHubApiErrorResponse = {
  success: boolean
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

const githubErrorResponseSchemaDefinition = {
  400: {
    content: {
      "application/json": {
        schema: dataSourceSchemas.errorResponse,
      },
    },
    description: "Bad Request",
  },
  401: {
    content: {
      "application/json": {
        schema: dataSourceSchemas.errorResponse,
      },
    },
    description: "認証エラー",
  },
  404: {
    content: {
      "application/json": {
        schema: dataSourceSchemas.errorResponse,
      },
    },
    description: "リソースが見つかりません",
  },
  422: {
    content: {
      "application/json": {
        schema: dataSourceSchemas.errorResponse,
      },
    },
    description: "認証エラー",
  },
  429: {
    content: {
      "application/json": {
        schema: dataSourceSchemas.errorResponse,
      },
    },
    description: "レート制限エラー",
  },
  500: {
    content: {
      "application/json": {
        schema: dataSourceSchemas.errorResponse,
      },
    },
    description: "内部サーバーエラー",
  },
}

/**
 * DataSource Routes (GitHub API Integration)
 * GitHub データソース関連のAPIエンドポイント
 */

/**
 * Route Definitions
 */

// GET /repositories/watched
const getWatchedRepositoriesRoute = createRoute({
  method: "get",
  path: "/repositories/watched",
  request: {
    query: dataSourceSchemas.basicPaginationQuery,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: dataSourceSchemas.repositoriesResponse,
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

// GET /repositories/:owner/:repo
const getRepositoryDetailsRoute = createRoute({
  method: "get",
  path: "/repositories/{owner}/{repo}",
  request: {
    params: dataSourceSchemas.repositoryParams,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: dataSourceSchemas.repositoryResponse,
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

// GET /repositories/:owner/:repo/releases
const getRepositoryReleasesRoute = createRoute({
  method: "get",
  path: "/repositories/{owner}/{repo}/releases",
  request: {
    params: dataSourceSchemas.repositoryParams,
    query: dataSourceSchemas.basicPaginationQuery,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: dataSourceSchemas.releasesResponse,
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

// GET /repositories/:owner/:repo/pulls
const getRepositoryPullRequestsRoute = createRoute({
  method: "get",
  path: "/repositories/{owner}/{repo}/pulls",
  request: {
    params: dataSourceSchemas.repositoryParams,
    query: dataSourceSchemas.pullRequestQuery,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: dataSourceSchemas.pullRequestsResponse,
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

// GET /repositories/:owner/:repo/issues
const getRepositoryIssuesRoute = createRoute({
  method: "get",
  path: "/repositories/{owner}/{repo}/issues",
  request: {
    params: dataSourceSchemas.repositoryParams,
    query: dataSourceSchemas.issueQuery,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: dataSourceSchemas.issuesResponse,
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

export const createDataSourceRoutes = (githubService: IGitHubRepoService) => {
  const app = new OpenAPIHono()

  /**
   * GET /repositories/watched
   * 認証ユーザーがwatch済みのリポジトリ一覧を取得
   */
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

  /**
   * GET /repositories/:owner/:repo
   * 指定リポジトリの詳細情報を取得
   */
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

  /**
   * GET /repositories/:owner/:repo/releases
   * 指定リポジトリのリリース一覧を取得
   */
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

  /**
   * GET /repositories/:owner/:repo/pulls
   * 指定リポジトリのプルリクエスト一覧を取得
   */
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

  /**
   * GET /repositories/:owner/:repo/issues
   * 指定リポジトリのイシュー一覧を取得
   */
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

  return app
}

/**
 * エラーハンドリング関数
 * GitHub API特有のエラーを適切なHTTPステータスコードとレスポンスに変換
 */
function handleError<C extends Context>(
  c: C,
  error: unknown,
): TypedResponse<GitHubApiErrorResponse, 400 | 401 | 404 | 422 | 429 | 500> {
  console.error("DataSource API Error:", error)

  // GitHub認証エラー
  if (error instanceof GitHubAuthenticationError) {
    return c.json(
      {
        success: false,
        error: {
          code: "GITHUB_AUTH_ERROR",
          message: "GitHub認証に失敗しました",
          details: {
            message: error.message,
          },
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
