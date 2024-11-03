import type { AppContext } from "@/app/chase-light-app"
import { swapTokenValidatorForTest } from "@/features/auth/services/token-validator"
import type { CreateUserViaProvider } from "@/features/user/domain/user"
import { userApp } from "@/features/user/functions"
import { createTokenValidatorMock } from "@/lib/vitest/mock-token-validator"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { beforeEach, describe, expect, test } from "vitest"

let app: OpenAPIHono<AppContext>

beforeEach(() => {
  app = userApp.getApp()

  const tokenValidatorMock = createTokenValidatorMock()
  swapTokenValidatorForTest(tokenValidatorMock)
})

describe("SignupVieProviderAction", () => {
  test("新規登録テスト", async () => {
    const result = await app.request("/users/signup-via-provider", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken: "",
        idToken: "",
      } satisfies CreateUserViaProvider),
    })
    expect(result.status).toBe(200)
  })

  test("新規登録2回目", async () => {
    const result = await app.request("/users/signup-via-provider", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken: "",
        idToken: "",
      } satisfies CreateUserViaProvider),
    })
    expect(result.status).toBe(200)
  })
})
