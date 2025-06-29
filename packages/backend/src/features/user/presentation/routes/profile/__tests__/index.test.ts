import { describe, test, expect, vi, beforeEach } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { createProfileRoutes } from "../index"
import { requireAuth } from "../../../../../auth/middleware/jwt-auth.middleware.js"
import type { UserProfileService } from "../../../../services/user-profile.service"
import type { User } from "../../../../../../repositories/user.repository"

// モック設定
vi.mock("../../../../../auth/middleware/jwt-auth.middleware.js", () => ({
  requireAuth: vi.fn(),
}))

describe("Profile Routes", () => {
  let app: OpenAPIHono
  let mockUserProfileService: UserProfileService

  const mockUser: User = {
    id: "user-123",
    auth0UserId: "auth0|user123",
    email: "test@example.com",
    name: "テストユーザー",
    githubUsername: "testuser",
    avatarUrl: "https://example.com/avatar.jpg",
    timezone: "Asia/Tokyo",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  }

  const mockAuthenticatedUser = {
    sub: "auth0|user123",
    payload: {
      sub: "auth0|user123",
      iss: "https://test.auth0.com/",
      aud: ["test-audience"],
      iat: 1640995200,
      exp: 1640998800,
    },
    accessToken: "mock-token",
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // UserProfileServiceのモック
    mockUserProfileService = {
      getUserProfile: vi.fn(),
      getUserProfileByAuth0Id: vi.fn(),
      updateUserProfile: vi.fn(),
    } as unknown as UserProfileService

    // アプリケーション作成
    app = new OpenAPIHono()
    createProfileRoutes(app, mockUserProfileService)

    // 認証ミドルウェアのモック
    vi.mocked(requireAuth).mockReturnValue(mockAuthenticatedUser)
  })

  describe("GET /profile", () => {
    test("認証済みユーザーのプロフィール取得に成功", async () => {
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(mockUser)

      const response = await app.request("/profile", {
        method: "GET",
        headers: {
          Authorization: "Bearer mock-token",
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "テストユーザー",
          githubUsername: "testuser",
          avatarUrl: "https://example.com/avatar.jpg",
          timezone: "Asia/Tokyo",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      })
      expect(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).toHaveBeenCalledWith("auth0|user123")
    })

    test("ユーザーが見つからない場合は404エラー", async () => {
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(null)

      const response = await app.request("/profile", {
        method: "GET",
        headers: {
          Authorization: "Bearer mock-token",
        },
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data).toEqual({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "ユーザーが見つかりません",
        },
      })
    })

    test("内部エラーの場合は500エラー", async () => {
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockRejectedValue(new Error("Database error"))

      const response = await app.request("/profile", {
        method: "GET",
        headers: {
          Authorization: "Bearer mock-token",
        },
      })

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toEqual({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "プロフィール取得中にエラーが発生しました",
        },
      })
    })
  })

  describe("PUT /profile", () => {
    test("プロフィール更新に成功", async () => {
      const updateData = {
        name: "更新されたユーザー",
        timezone: "America/New_York",
      }

      const updatedUser = { ...mockUser, ...updateData }

      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(mockUser)
      vi.mocked(mockUserProfileService.updateUserProfile).mockResolvedValue(
        updatedUser,
      )

      const response = await app.request("/profile", {
        method: "PUT",
        headers: {
          Authorization: "Bearer mock-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.user.name).toBe("更新されたユーザー")
      expect(data.user.timezone).toBe("America/New_York")
      expect(mockUserProfileService.updateUserProfile).toHaveBeenCalledWith(
        "user-123",
        updateData,
      )
    })

    test("ユーザーが見つからない場合は404エラー", async () => {
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(null)

      const response = await app.request("/profile", {
        method: "PUT",
        headers: {
          Authorization: "Bearer mock-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "新しい名前" }),
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data).toEqual({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "ユーザーが見つかりません",
        },
      })
    })

    test("バリデーションエラーの場合は400エラー", async () => {
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(mockUser)
      vi.mocked(mockUserProfileService.updateUserProfile).mockRejectedValue(
        new Error("このGitHubユーザー名は既に使用されています"),
      )

      const response = await app.request("/profile", {
        method: "PUT",
        headers: {
          Authorization: "Bearer mock-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ githubUsername: "existinguser" }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toEqual({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "このGitHubユーザー名は既に使用されています",
        },
      })
    })
  })
})
