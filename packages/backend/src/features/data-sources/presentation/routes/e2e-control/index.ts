import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import type { GitHubApiServiceStub } from "../../../services/github-api-service.stub"
import { createGitHubApiService } from "../../../services/github-api-service.factory"
import type { GitHubRepositoryResponse } from "../../../services/interfaces/github-api-service.interface"

/**
 * E2Eテスト制御用APIルート
 * スタブサービスの制御を行うエンドポイント
 */

// スタブレスポンス設定のスキーマ
const StubResponseSchema = z.object({
  key: z.string().describe("リポジトリキー (owner/repo)"),
  response: z
    .object({
      id: z.number(),
      full_name: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      html_url: z.string(),
      private: z.boolean(),
      language: z.string().nullable(),
      stargazers_count: z.number(),
      forks_count: z.number(),
      open_issues_count: z.number(),
      fork: z.boolean(),
    })
    .describe("GitHubレスポンス"),
})

// エラーシナリオ設定のスキーマ
const ErrorScenarioSchema = z.object({
  key: z.string().describe("リポジトリキー (owner/repo)"),
  error: z
    .object({
      status: z.number().describe("HTTPステータスコード"),
      message: z.string().describe("エラーメッセージ"),
    })
    .describe("エラー情報"),
})

// レスポンススキーマ
const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
})

// スタブレスポンス設定ルート
const setStubResponseRoute = createRoute({
  method: "post",
  path: "/e2e-control/github/stub-response",
  request: {
    body: {
      content: {
        "application/json": {
          schema: StubResponseSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
      description: "スタブレスポンス設定成功",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false),
            error: z.string(),
          }),
        },
      },
      description: "不正なリクエスト",
    },
  },
  tags: ["E2E Control"],
  summary: "GitHubスタブレスポンス設定",
  description: "特定のリポジトリに対するスタブレスポンスを設定",
})

// エラーシナリオ設定ルート
const setErrorScenarioRoute = createRoute({
  method: "post",
  path: "/e2e-control/github/error-scenario",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ErrorScenarioSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
      description: "エラーシナリオ設定成功",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false),
            error: z.string(),
          }),
        },
      },
      description: "不正なリクエスト",
    },
  },
  tags: ["E2E Control"],
  summary: "GitHubエラーシナリオ設定",
  description: "特定のリポジトリに対するエラーシナリオを設定",
})

// スタブリセットルート
const resetStubsRoute = createRoute({
  method: "post",
  path: "/e2e-control/github/reset",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
      description: "スタブリセット成功",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(false),
            error: z.string(),
          }),
        },
      },
      description: "リセット失敗",
    },
  },
  tags: ["E2E Control"],
  summary: "GitHubスタブリセット",
  description: "すべてのスタブ設定をリセット",
})

/**
 * E2Eテスト制御ルートを作成
 */
export function createE2EControlRoutes(): OpenAPIHono {
  const app = new OpenAPIHono()

  // スタブサービスのインスタンスを取得
  const getStubService = (): GitHubApiServiceStub => {
    const service = createGitHubApiService()
    if (!("setStubResponse" in service)) {
      throw new Error("E2E control is only available with stub service")
    }
    return service as GitHubApiServiceStub
  }

  // スタブレスポンス設定
  app.openapi(setStubResponseRoute, async (c) => {
    try {
      const { key, response } = c.req.valid("json")
      const stubService = getStubService()

      stubService.setStubResponse(response as GitHubRepositoryResponse)

      return c.json(
        {
          success: true as const,
          message: `Stub response set for ${key}`,
        },
        200,
      )
    } catch (error) {
      return c.json(
        {
          success: false as const,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        400,
      )
    }
  })

  // エラーシナリオ設定
  app.openapi(setErrorScenarioRoute, async (c) => {
    try {
      const { key, error } = c.req.valid("json")
      const stubService = getStubService()

      stubService.setStubResponse(error)

      return c.json(
        {
          success: true as const,
          message: `Error scenario set for ${key}`,
        },
        200,
      )
    } catch (error) {
      return c.json(
        {
          success: false as const,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        400,
      )
    }
  })

  // スタブリセット
  app.openapi(resetStubsRoute, async (c) => {
    try {
      const stubService = getStubService()
      stubService.resetStubs()

      return c.json(
        {
          success: true as const,
          message: "All stubs reset successfully",
        },
        200,
      )
    } catch (error) {
      return c.json(
        {
          success: false as const,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        400,
      )
    }
  })

  return app
}
