/**
 * Auth Signup Service Tests
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { AuthSignupService } from "../auth-signup.service"
import { JWTValidator } from "../jwt-validator.service"
import { UserRepository } from "../../../../repositories/user.repository"
import { AuthError } from "../../errors/auth.error"
import type { JWTPayload, TokenValidationResult } from "../../types/auth.types"
import type { User } from "../../../../repositories/user.repository"

// 環境変数をモック
vi.mock("../../utils/auth-config", () => ({
  getAuth0Config: () => ({
    domain: "test-domain.auth0.com",
    audience: "test-audience",
    issuer: "https://test-domain.auth0.com/",
    jwksUri: "https://test-domain.auth0.com/.well-known/jwks.json",
    algorithms: ["RS256"],
  }),
}))

// モックの設定
const mockJWTValidator = {
  validateAccessToken: vi.fn(),
} as unknown as JWTValidator

const mockUserRepository = {
  findByAuth0Id: vi.fn(),
  findOrCreateByAuth0: vi.fn(),
} as unknown as UserRepository

describe("AuthSignupService", () => {
  let authSignupService: AuthSignupService

  beforeEach(() => {
    vi.clearAllMocks()
    authSignupService = new AuthSignupService(
      mockJWTValidator,
      mockUserRepository,
    )
  })

  describe("signUp", () => {
    const validIdToken = "valid.jwt.token"
    const validPayload: JWTPayload = {
      iss: "https://test-domain.auth0.com/",
      sub: "auth0|github|testuser",
      aud: "test-audience",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      email: "test@example.com",
      name: "Test User",
      picture: "https://avatars.githubusercontent.com/u/12345?v=4",
      nickname: "testuser",
    }

    describe("正常系", () => {
      it("新規ユーザーを正常に登録する", async () => {
        // Mock設定
        const mockValidationResult: TokenValidationResult = {
          valid: true,
          payload: validPayload,
        }
        vi.mocked(mockJWTValidator.validateAccessToken).mockResolvedValue(
          mockValidationResult,
        )

        // 新規ユーザー（findByAuth0Idでnullを返す）
        vi.mocked(mockUserRepository.findByAuth0Id).mockResolvedValue(null)

        const mockUser: User = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          auth0UserId: "auth0|github|testuser",
          email: "test@example.com",
          name: "Test User",
          avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
          githubUsername: "testuser",
          timezone: "Asia/Tokyo",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        vi.mocked(mockUserRepository.findOrCreateByAuth0).mockResolvedValue(
          mockUser,
        )

        // テスト実行
        const result = await authSignupService.signUp({ idToken: validIdToken })

        // 検証
        expect(mockJWTValidator.validateAccessToken).toHaveBeenCalledWith(
          validIdToken,
        )
        expect(mockUserRepository.findByAuth0Id).toHaveBeenCalledWith(
          "auth0|github|testuser",
        )
        expect(mockUserRepository.findOrCreateByAuth0).toHaveBeenCalledWith({
          auth0UserId: "auth0|github|testuser",
          email: "test@example.com",
          name: "Test User",
          avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
          githubUsername: "testuser",
          timezone: "Asia/Tokyo",
        })

        expect(result).toEqual({
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "test@example.com",
            name: "Test User",
            githubUsername: "testuser",
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
            createdAt: mockUser.createdAt?.toISOString(),
          },
          message: "ユーザー登録が完了しました",
          alreadyExists: false,
        })
      })

      it("既存ユーザーの場合は更新メッセージを返す", async () => {
        // Mock設定
        const mockValidationResult: TokenValidationResult = {
          valid: true,
          payload: validPayload,
        }
        vi.mocked(mockJWTValidator.validateAccessToken).mockResolvedValue(
          mockValidationResult,
        )

        // 既存ユーザー（findByAuth0Idで既存ユーザーを返す）
        const mockExistingUser: User = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          auth0UserId: "auth0|github|testuser",
          email: "test@example.com",
          name: "Test User",
          avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
          githubUsername: "testuser",
          timezone: "Asia/Tokyo",
          createdAt: new Date("2023-01-01T00:00:00.000Z"),
          updatedAt: new Date(),
        }
        vi.mocked(mockUserRepository.findByAuth0Id).mockResolvedValue(
          mockExistingUser,
        )
        vi.mocked(mockUserRepository.findOrCreateByAuth0).mockResolvedValue(
          mockExistingUser,
        )

        // テスト実行
        const result = await authSignupService.signUp({ idToken: validIdToken })

        // 検証
        expect(mockUserRepository.findByAuth0Id).toHaveBeenCalledWith(
          "auth0|github|testuser",
        )
        expect(result).toEqual({
          user: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "test@example.com",
            name: "Test User",
            githubUsername: "testuser",
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
            createdAt: mockExistingUser.createdAt?.toISOString(),
          },
          message: "既にアカウントが存在します。ログイン情報を更新しました",
          alreadyExists: true,
        })
      })

      describe("GitHubユーザー名の抽出パターン", () => {
        it.each([
          {
            description: "nicknameからGitHubユーザー名を抽出",
            payload: { ...validPayload, nickname: "github-user" },
            expected: "github-user",
          },
          {
            description: "preferred_usernameからGitHubユーザー名を抽出",
            payload: {
              ...validPayload,
              nickname: undefined,
              preferred_username: "preferred-user",
            },
            expected: "preferred-user",
          },
          {
            description: "subからGitHubユーザー名を抽出（ユーザー名形式）",
            payload: {
              ...validPayload,
              sub: "auth0|github|username123",
              nickname: undefined,
            },
            expected: "username123",
          },
          {
            description: "subがID形式の場合はundefinedを返す",
            payload: {
              ...validPayload,
              sub: "auth0|github|12345",
              nickname: undefined,
            },
            expected: undefined,
          },
          {
            description: "GitHubユーザー名が見つからない場合はundefinedを返す",
            payload: {
              ...validPayload,
              sub: "auth0|google|test",
              nickname: undefined,
            },
            expected: undefined,
          },
        ])("$description", async ({ payload, expected }) => {
          // Mock設定
          const mockValidationResult: TokenValidationResult = {
            valid: true,
            payload,
          }
          vi.mocked(mockJWTValidator.validateAccessToken).mockResolvedValue(
            mockValidationResult,
          )

          // 新規ユーザー（findByAuth0Idでnullを返す）
          vi.mocked(mockUserRepository.findByAuth0Id).mockResolvedValue(null)

          const mockUser: User = {
            id: "test-id",
            auth0UserId: payload.sub,
            email: (payload.email as string) || "test@example.com",
            name: (payload.name as string) || "Test User",
            avatarUrl:
              (payload.picture as string) || "https://example.com/avatar.jpg",
            githubUsername: expected || null,
            timezone: "Asia/Tokyo",
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          vi.mocked(mockUserRepository.findOrCreateByAuth0).mockResolvedValue(
            mockUser,
          )

          // テスト実行
          await authSignupService.signUp({ idToken: validIdToken })

          // 検証
          expect(mockUserRepository.findByAuth0Id).toHaveBeenCalledWith(
            payload.sub,
          )
          expect(mockUserRepository.findOrCreateByAuth0).toHaveBeenCalledWith(
            expect.objectContaining({
              githubUsername: expected,
            }),
          )
        })
      })
    })

    describe("異常系", () => {
      it("無効なIDトークンの場合はエラーをスローする", async () => {
        // Mock設定
        const mockValidationResult: TokenValidationResult = {
          valid: false,
          error: "Invalid token signature",
        }
        vi.mocked(mockJWTValidator.validateAccessToken).mockResolvedValue(
          mockValidationResult,
        )

        // テスト実行・検証
        await expect(
          authSignupService.signUp({ idToken: "invalid.token" }),
        ).rejects.toThrow(AuthError)

        expect(mockJWTValidator.validateAccessToken).toHaveBeenCalledWith(
          "invalid.token",
        )
        expect(mockUserRepository.findOrCreateByAuth0).not.toHaveBeenCalled()
      })

      it("ペイロードがnullの場合はエラーをスローする", async () => {
        // Mock設定
        const mockValidationResult: TokenValidationResult = {
          valid: true,
          payload: undefined,
        }
        vi.mocked(mockJWTValidator.validateAccessToken).mockResolvedValue(
          mockValidationResult,
        )

        // テスト実行・検証
        await expect(
          authSignupService.signUp({ idToken: validIdToken }),
        ).rejects.toThrow(AuthError)
      })

      describe("必須クレームの検証", () => {
        it.each([
          {
            field: "sub",
            // as unknown as JWTPayload は避けたい。
            payload: {
              ...validPayload,
              sub: undefined,
            } as unknown as JWTPayload,
            expectedError: "sub",
          },
          {
            field: "email",
            payload: {
              ...validPayload,
              email: undefined,
            } as unknown as JWTPayload,
            expectedError: "email",
          },
          {
            field: "name",
            payload: {
              ...validPayload,
              name: undefined,
            } as unknown as JWTPayload,
            expectedError: "name",
          },
        ])(
          "$fieldクレームが欠如している場合はエラーをスローする",
          async ({ payload, expectedError }) => {
            // Mock設定
            const mockValidationResult: TokenValidationResult = {
              valid: true,
              payload,
            }
            vi.mocked(mockJWTValidator.validateAccessToken).mockResolvedValue(
              mockValidationResult,
            )

            // テスト実行・検証
            await expect(
              authSignupService.signUp({ idToken: validIdToken }),
            ).rejects.toThrow(`Required claim is missing: ${expectedError}`)

            expect(
              mockUserRepository.findOrCreateByAuth0,
            ).not.toHaveBeenCalled()
          },
        )
      })

      it("UserRepositoryでエラーが発生した場合はエラーを再スローする", async () => {
        // Mock設定
        const mockValidationResult: TokenValidationResult = {
          valid: true,
          payload: validPayload,
        }
        vi.mocked(mockJWTValidator.validateAccessToken).mockResolvedValue(
          mockValidationResult,
        )

        const repositoryError = new Error("Database connection failed")
        vi.mocked(mockUserRepository.findByAuth0Id).mockRejectedValue(
          repositoryError,
        )

        // テスト実行・検証
        await expect(
          authSignupService.signUp({ idToken: validIdToken }),
        ).rejects.toThrow("Database connection failed")
      })
    })

    describe("境界値テスト", () => {
      it.each([
        {
          description: "空文字のIDトークン",
          idToken: "",
          expectedError: "Missing or invalid token",
        },
        {
          description: "nullのIDトークン",
          idToken: null as unknown as string,
          expectedError: "Missing or invalid token",
        },
        {
          description: "undefinedのIDトークン",
          idToken: undefined as unknown as string,
          expectedError: "Missing or invalid token",
        },
      ])(
        "$description の場合はエラーをスローする",
        async ({ idToken, expectedError }) => {
          // Mock設定
          const mockValidationResult: TokenValidationResult = {
            valid: false,
            error: expectedError,
          }
          vi.mocked(mockJWTValidator.validateAccessToken).mockResolvedValue(
            mockValidationResult,
          )

          // テスト実行・検証
          await expect(authSignupService.signUp({ idToken })).rejects.toThrow(
            AuthError,
          )
        },
      )
    })
  })
})
