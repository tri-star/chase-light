/**
 * Auth Routes Tests
 */
import { OpenAPIHono } from "@hono/zod-openapi"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { StubJWTValidatorAdapter } from "../../../../infra/adapters/jwt-validator/stub-jwt-validator.adapter"
import {
  AuthTestHelper,
  setupComponentTest,
  TestDataFactory,
} from "../../../../../../test"
import { createAuthRouter, createIdentityContext } from "../../../.."
import { AuthError } from "../../../../../auth"

describe("Auth Routes", () => {
  setupComponentTest()

  let app: OpenAPIHono
  let stubValidator: StubJWTValidatorAdapter
  const signUpPath = "/signup"

  beforeEach(() => {
    AuthTestHelper.clearTestUsers()
    stubValidator = new StubJWTValidatorAdapter()
    const identity = createIdentityContext({ jwtValidator: stubValidator })
    app = createAuthRouter(identity.useCases)
  })

  describe("POST /signup", () => {
    const validRequest = {
      idToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    }

    describe("正常系", () => {
      it("新規ユーザー登録が成功した場合は201を返す", async () => {
        const idToken = AuthTestHelper.createTestToken(
          "auth0|identity-new",
          "new-user@example.com",
          "新規ユーザー",
        )

        const response = await app.request(signUpPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        })

        expect(response.status).toBe(201)
        const body = await response.json()
        expect(body).toMatchObject({
          user: {
            email: "new-user@example.com",
            name: "新規ユーザー",
          },
          message: "ユーザー登録が完了しました",
        })
        expect(body.alreadyExists).toBeUndefined()
      })

      it("既存ユーザーの場合は200を返す", async () => {
        const existing = await TestDataFactory.createTestUser(
          "auth0|identity-existing",
        )
        const idToken = AuthTestHelper.createTestToken(
          existing.auth0UserId,
          existing.email,
          existing.name,
        )

        const response = await app.request(signUpPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        })

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body).toMatchObject({
          user: {
            id: existing.id,
            email: existing.email,
            name: existing.name,
          },
          message: "既にアカウントが存在します。ログイン情報を更新しました",
          alreadyExists: true,
        })
      })
    })

    describe("バリデーションエラー", () => {
      it.each([
        {
          description: "idTokenが空文字の場合",
          request: { idToken: "" },
          expectedStatus: 400,
        },
        {
          description: "idTokenが存在しない場合",
          request: {},
          expectedStatus: 400,
        },
        {
          description: "リクエストボディが空の場合",
          request: null,
          expectedStatus: 400,
        },
      ])(
        "$description は400エラーを返す",
        async ({ request, expectedStatus }) => {
          const response = await app.request(signUpPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
          })

          expect(response.status).toBe(expectedStatus)
          const body = await response.json()
          expect(body).toEqual({
            success: false,
            error: {
              code: AuthError.tokenInvalid().code,
              message: AuthError.tokenInvalid().message,
            },
          })
        },
      )
    })

    describe("サーバーエラー", () => {
      it("予期しないエラーの場合は500エラーを返す", async () => {
        const identity = createIdentityContext({ jwtValidator: stubValidator })
        const appWithSpy = createAuthRouter(identity.useCases)
        const idToken = AuthTestHelper.createTestToken(
          "auth0|server-error",
          "server-error@example.com",
          "Server Error",
        )

        vi.spyOn(identity.useCases.signUp, "execute").mockRejectedValueOnce(
          new Error("Unexpected failure"),
        )

        const response = await appWithSpy.request(signUpPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        })

        expect(response.status).toBe(500)
        const body = await response.json()
        expect(body.error.code).toBe("INTERNAL_SERVER_ERROR")
        expect(body.error.details).toBe("Unexpected failure")
      })

      it("文字列以外のエラーの場合も適切に処理する", async () => {
        const identity = createIdentityContext({ jwtValidator: stubValidator })
        const appWithSpy = createAuthRouter(identity.useCases)
        const idToken = AuthTestHelper.createTestToken(
          "auth0|server-error",
          "server-error@example.com",
          "Server Error",
        )

        vi.spyOn(identity.useCases.signUp, "execute").mockRejectedValueOnce(
          "String error message",
        )

        const response = await appWithSpy.request(signUpPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        })

        expect(response.status).toBe(500)
        const body = await response.json()
        expect(body.error.code).toBe("INTERNAL_SERVER_ERROR")
        expect(body.error.details).toBe("Unknown error")
      })
    })

    describe("HTTPメソッドのテスト", () => {
      it("GETメソッドの場合は404エラーを返す", async () => {
        // テスト実行
        const response = await app.request("/signup", {
          method: "GET",
        })

        // 検証
        expect(response.status).toBe(404)
      })

      it("PUTメソッドの場合は404エラーを返す", async () => {
        // テスト実行
        const response = await app.request("/signup", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(validRequest),
        })

        // 検証
        expect(response.status).toBe(404)
      })
    })

    describe("Content-Typeのテスト", () => {
      it("Content-Typeがないと401ラーになる", async () => {
        // テスト実行
        const response = await app.request("/signup", {
          method: "POST",
          body: JSON.stringify(validRequest),
        })

        // 検証
        expect(response.status).toBe(401)
      })

      it("不正なJSONの場合は400エラーを返す", async () => {
        // テスト実行
        const response = await app.request("/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: "invalid json",
        })

        // 検証
        expect(response.status).toBe(400)
      })
    })
  })
})
