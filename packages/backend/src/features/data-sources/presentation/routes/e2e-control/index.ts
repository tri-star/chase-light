import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import {
  getGitHubRepositoryStub,
  type GitHubRepositoryStubResponse,
} from "../../../infra/adapters/github-repository"

const StubResponseSchema = z.object({
  key: z.string().describe("リポジトリキー (owner/repo)"),
  response: z
    .object({
      id: z.number(),
      fullName: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      htmlUrl: z.string(),
      private: z.boolean(),
      language: z.string().nullable(),
      stargazersCount: z.number(),
      forksCount: z.number(),
      openIssuesCount: z.number(),
      fork: z.boolean(),
    })
    .describe("GitHubレスポンス"),
})

const ErrorScenarioSchema = z.object({
  key: z.string().describe("リポジトリキー (owner/repo)"),
  error: z
    .object({
      status: z.number().describe("HTTPステータスコード"),
      message: z.string().describe("エラーメッセージ"),
    })
    .describe("エラー情報"),
})

const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
})

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

export function createE2EControlRoutes(): OpenAPIHono {
  const app = new OpenAPIHono()

  const resolveStub = () => {
    const stub = getGitHubRepositoryStub()
    if (!stub) {
      throw new Error("E2E control is only available with stub service")
    }
    return stub
  }

  app.openapi(setStubResponseRoute, async (c) => {
    try {
      const { key, response } = c.req.valid("json")
      const stub = resolveStub()

      stub.setStubResponse(response as GitHubRepositoryStubResponse)

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

  app.openapi(setErrorScenarioRoute, async (c) => {
    try {
      const { key, error } = c.req.valid("json")
      const stub = resolveStub()

      stub.setStubResponse(error)

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

  app.openapi(resetStubsRoute, async (c) => {
    try {
      const stub = resolveStub()
      stub.resetStubs()

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
