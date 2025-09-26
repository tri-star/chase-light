/**
 * Sign Up Use Case Tests
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { SignUpUseCase } from "../sign-up.use-case"
import type { JwtValidatorPort } from "../../ports/jwt-validator.port"
import type { UserRepository } from "../../../domain/repositories/user.repository"
import { AuthError } from "../../../errors/auth.error"
import type {
  JWTPayload,
  TokenValidationResult,
} from "../../../types/auth.types"
import { User } from "../../../domain/user"

// モックの設定
const mockJwtValidator = {
  validateAccessToken: vi.fn(),
  validateIdToken: vi.fn(),
} as unknown as JwtValidatorPort

const mockUserRepository = {
  findByAuth0Id: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
  findByEmail: vi.fn(),
  findByGithubUsername: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as unknown as UserRepository

describe("SignUpUseCase", () => {
  let signUpUseCase: SignUpUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    signUpUseCase = new SignUpUseCase(mockJwtValidator, mockUserRepository)
  })

  describe("execute", () => {
    const validIdToken = "valid.jwt.token"
    const validPayload: JWTPayload = {
      iss: "https://test-domain.auth0.com/",
      sub: "auth0|github|testuser",
      aud: "test-app-audience",
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
        vi.mocked(mockJwtValidator.validateIdToken).mockResolvedValue(
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
        vi.mocked(mockUserRepository.save).mockResolvedValue()
        vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)

        // テスト実行
        const result = await signUpUseCase.execute({ idToken: validIdToken })

        // 検証
        expect(mockJwtValidator.validateIdToken).toHaveBeenCalledWith(
          validIdToken,
        )
        expect(mockUserRepository.findByAuth0Id).toHaveBeenCalledWith(
          "auth0|github|testuser",
        )
        expect(mockUserRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            auth0UserId: "auth0|github|testuser",
            email: "test@example.com",
            name: "Test User",
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
            githubUsername: "testuser",
            timezone: "Asia/Tokyo",
          }),
        )

        expect(result).toEqual({
          user: expect.objectContaining({
            email: "test@example.com",
            name: "Test User",
            githubUsername: "testuser",
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
          }),
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
        vi.mocked(mockJwtValidator.validateIdToken).mockResolvedValue(
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

        vi.mocked(mockUserRepository.save).mockResolvedValue()
        vi.mocked(mockUserRepository.findById).mockResolvedValue(
          mockExistingUser,
        )

        // テスト実行
        const result = await signUpUseCase.execute({ idToken: validIdToken })

        // 検証
        expect(mockUserRepository.findByAuth0Id).toHaveBeenCalledWith(
          "auth0|github|testuser",
        )
        expect(result).toEqual({
          user: expect.objectContaining({
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "test@example.com",
            name: "Test User",
            githubUsername: "testuser",
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
          }),
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
            description: "subがID形式の場合はnullを返す",
            payload: {
              ...validPayload,
              sub: "auth0|github|12345",
              nickname: undefined,
            },
            expected: null,
          },
          {
            description: "GitHubユーザー名が見つからない場合はnullを返す",
            payload: {
              ...validPayload,
              sub: "auth0|google|test",
              nickname: undefined,
            },
            expected: null,
          },
        ])("$description", async ({ payload, expected }) => {
          // Mock設定
          const mockValidationResult: TokenValidationResult = {
            valid: true,
            payload,
          }
          vi.mocked(mockJwtValidator.validateIdToken).mockResolvedValue(
            mockValidationResult,
          )

          // 新規ユーザー（findByAuth0Idでnullを返す）
          vi.mocked(mockUserRepository.findByAuth0Id).mockResolvedValue(null)

          vi.mocked(mockUserRepository.save).mockResolvedValue()

          const mockCreatedUser: User = {
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
          vi.mocked(mockUserRepository.findById).mockResolvedValue(
            mockCreatedUser,
          )

          // テスト実行
          await signUpUseCase.execute({ idToken: validIdToken })

          // 検証
          expect(mockUserRepository.findByAuth0Id).toHaveBeenCalledWith(
            payload.sub,
          )
          expect(mockUserRepository.save).toHaveBeenCalledWith(
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
        vi.mocked(mockJwtValidator.validateIdToken).mockResolvedValue(
          mockValidationResult,
        )

        // テスト実行・検証
        await expect(
          signUpUseCase.execute({ idToken: "invalid.token" }),
        ).rejects.toThrow(AuthError)

        expect(mockJwtValidator.validateIdToken).toHaveBeenCalledWith(
          "invalid.token",
        )
        expect(vi.mocked(mockUserRepository.save)).not.toHaveBeenCalled()
      })

      it("ペイロードがnullの場合はエラーをスローする", async () => {
        // Mock設定
        const mockValidationResult: TokenValidationResult = {
          valid: true,
          payload: undefined,
        }
        vi.mocked(mockJwtValidator.validateIdToken).mockResolvedValue(
          mockValidationResult,
        )

        // テスト実行・検証
        await expect(
          signUpUseCase.execute({ idToken: validIdToken }),
        ).rejects.toThrow(AuthError)
      })

      describe("必須クレームの検証", () => {
        it.each([
          {
            field: "sub",
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
            vi.mocked(mockJwtValidator.validateIdToken).mockResolvedValue(
              mockValidationResult,
            )

            // テスト実行・検証
            await expect(
              signUpUseCase.execute({ idToken: validIdToken }),
            ).rejects.toThrow(`Required claim is missing: ${expectedError}`)

            expect(vi.mocked(mockUserRepository.save)).not.toHaveBeenCalled()
          },
        )
      })

      it("UserRepositoryでエラーが発生した場合はエラーを再スローする", async () => {
        // Mock設定
        const mockValidationResult: TokenValidationResult = {
          valid: true,
          payload: validPayload,
        }
        vi.mocked(mockJwtValidator.validateIdToken).mockResolvedValue(
          mockValidationResult,
        )

        const repositoryError = new Error("Database connection failed")
        vi.mocked(mockUserRepository.findByAuth0Id).mockRejectedValue(
          repositoryError,
        )

        // テスト実行・検証
        await expect(
          signUpUseCase.execute({ idToken: validIdToken }),
        ).rejects.toThrow("Database connection failed")
      })
    })
  })
})
