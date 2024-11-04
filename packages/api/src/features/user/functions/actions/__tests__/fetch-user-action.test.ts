import type { AppContext } from "@/app/chase-light-app"
import { swapTokenParserForTest } from "@/features/auth/services/token-parser"
import type {
  SignupResult,
  SignupViaProvider,
} from "@/features/user/domain/user"
import { userApp } from "@/features/user/functions"
import { createTokenParserMock } from "@/lib/vitest/mock-token-parser"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { beforeEach, describe, expect, test } from "vitest"

let app: OpenAPIHono<AppContext>

beforeEach(() => {
  app = userApp.getApp()

  const tokenParserMock = createTokenParserMock()
  swapTokenParserForTest(tokenParserMock)
})

describe("FetchUserAction", () => {
  test("ログインしているユーザーの情報を取得出来ること", async () => {
    const result = await app.request("/users/signup-via-provider", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken: "",
        idToken: "",
      } satisfies SignupViaProvider),
    })
    expect(result.status).toBe(200)
    expect(((await result.json()) as SignupResult).success).toBe(true)
  })
})
