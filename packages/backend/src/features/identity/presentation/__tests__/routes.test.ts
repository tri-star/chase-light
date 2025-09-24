/**
 * Auth Routes Tests
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { createAuthRoutes } from "../routes"
import { SignUpUseCase } from "../../application/use-cases/sign-up.use-case"
import { AuthError } from "../../errors/auth.error"

// SignUpUseCaseをモック
vi.mock("../../application/use-cases/sign-up.use-case", () => ({
  SignUpUseCase: vi.fn().mockImplementation(() => ({
    execute: vi.fn(),
  })),
}))

// JWT Validator Adapterをモック
vi.mock("../../infra/adapters/jwt-validator/jwt-validator-factory", () => ({
  createJwtValidatorAdapter: vi.fn(),
}))

// User Repositoryをモック
vi.mock("../../infra/repositories/drizzle-user.repository", () => ({
  DrizzleUserRepository: vi.fn(),
}))

describe("Auth Routes", () => {
  let app: ReturnType<typeof createAuthRoutes>
  let mockSignUpUseCase: { execute: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.clearAllMocks()

    // モックインスタンスを作成
    mockSignUpUseCase = {
      execute: vi.fn(),
    }

    // SignUpUseCaseのコンストラクタをモック
    vi.mocked(SignUpUseCase).mockImplementation(
      () => mockSignUpUseCase as unknown as SignUpUseCase,
    )

    app = createAuthRoutes()
  })

  describe("POST /signup", () => {
    const validRequest = {
      idToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    }

    describe("正常系", () => {
      it("新規ユーザー登録が成功した場合は201を返す", async () => {
        // Mock設定
        const mockResponse = {
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "test@example.com",
            name: "Test User",
            githubUsername: "testuser",
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          message: "ユーザー登録が完了しました",
          alreadyExists: false,
        }
        mockSignUpUseCase.execute.mockResolvedValue(mockResponse)

        // テスト実行
        const response = await app.request("/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(validRequest),
        })

        // 検証
        expect(response.status).toBe(201)
        const responseBody = await response.json()
        expect(responseBody).toEqual(mockResponse)
        expect(mockSignUpUseCase.execute).toHaveBeenCalledWith(validRequest)
      })

      it("既存ユーザーの場合は200を返す", async () => {
        // Mock設定
        const mockResponse = {
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "test@example.com",
            name: "Test User",
            githubUsername: "testuser",
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          message: "既にアカウントが存在します。ログイン情報を更新しました",
          alreadyExists: true,
        }
        mockSignUpUseCase.execute.mockResolvedValue(mockResponse)

        // テスト実行
        const response = await app.request("/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(validRequest),
        })

        // 検証
        expect(response.status).toBe(200)
        const responseBody = await response.json()
        expect(responseBody).toEqual(mockResponse)
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
          // テスト実行
          const response = await app.request("/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: request ? JSON.stringify(request) : "",
          })

          // 検証
          expect(response.status).toBe(expectedStatus)

          // サービスが呼び出されていないことを確認
          expect(mockSignUpUseCase.execute).not.toHaveBeenCalled()
        },
      )
    })

    describe("認証エラー", () => {
      it.each([
        {
          description: "無効なトークンエラー",
          error: AuthError.tokenInvalid("Invalid token signature"),
          expectedStatus: 401,
          expectedCode: "TOKEN_INVALID",
        },
        {
          description: "期限切れトークンエラー",
          error: AuthError.tokenExpired(),
          expectedStatus: 401,
          expectedCode: "TOKEN_EXPIRED",
        },
        {
          description: "トークン形式エラー",
          error: AuthError.tokenMalformed(),
          expectedStatus: 401,
          expectedCode: "TOKEN_MALFORMED",
        },
        {
          description: "必須クレーム不足エラー",
          error: AuthError.missingClaims("sub"),
          expectedStatus: 400,
          expectedCode: "MISSING_CLAIMS",
        },
      ])(
        "$description の場合は適切なエラーレスポンスを返す",
        async ({ error, expectedStatus, expectedCode }) => {
          // Mock設定
          mockSignUpUseCase.execute.mockRejectedValue(error)

          // テスト実行
          const response = await app.request("/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(validRequest),
          })

          // 検証
          expect(response.status).toBe(expectedStatus)
          const responseBody = await response.json()
          expect(responseBody).toEqual({
            success: false,
            error: {
              code: expectedCode,
              message: error.message,
              details: error.details,
            },
          })
        },
      )
    })

    describe("サーバーエラー", () => {
      it("予期しないエラーの場合は500エラーを返す", async () => {
        // Mock設定
        const unexpectedError = new Error("Database connection failed")
        mockSignUpUseCase.execute.mockRejectedValue(unexpectedError)

        // テスト実行
        const response = await app.request("/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(validRequest),
        })

        // 検証
        expect(response.status).toBe(500)
        const responseBody = await response.json()
        expect(responseBody).toEqual({
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "内部サーバーエラーが発生しました",
            details: "Database connection failed",
          },
        })
      })

      it("文字列以外のエラーの場合も適切に処理する", async () => {
        // Mock設定
        mockSignUpUseCase.execute.mockRejectedValue("string error")

        // テスト実行
        const response = await app.request("/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(validRequest),
        })

        // 検証
        expect(response.status).toBe(500)
        const responseBody = await response.json()
        expect(responseBody).toEqual({
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "内部サーバーエラーが発生しました",
            details: "Unknown error",
          },
        })
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
      it("Content-Typeがないとサーバーエラーになる", async () => {
        // テスト実行
        const response = await app.request("/signup", {
          method: "POST",
          body: JSON.stringify(validRequest),
        })

        // 検証
        expect(response.status).toBe(500)
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
