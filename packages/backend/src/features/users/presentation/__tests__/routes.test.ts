import { describe, test, expect, vi, beforeEach } from "vitest"
import { testClient } from "hono/testing"
import userRoutes from "../routes"
import { userProfileService } from "../../services/user-profile.service"
import { userSettingsService } from "../../services/user-settings.service"
import { requireAuth } from "../../../auth/middleware/jwt-auth.middleware"
import type { User } from "../../../../repositories/user.repository"

// モック設定
vi.mock("../../services/user-profile.service", () => ({
  userProfileService: {
    getUserProfileByAuth0Id: vi.fn(),
    updateUserProfile: vi.fn(),
  },
}))

vi.mock("../../services/user-settings.service", () => ({
  userSettingsService: {
    getUserSettings: vi.fn(),
    updateUserSettings: vi.fn(),
  },
}))

vi.mock("../../../auth/middleware/jwt-auth.middleware", () => ({
  requireAuth: vi.fn(),
}))

describe("User Routes", () => {
  const client = testClient(userRoutes)

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
    payload: { sub: "auth0|user123" },
    accessToken: "mock-token",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockReturnValue(mockAuthenticatedUser)
  })

  describe("GET /profile", () => {
    test("認証済みユーザーのプロフィール取得に成功", async () => {
      vi.mocked(userProfileService.getUserProfileByAuth0Id).mockResolvedValue(mockUser)

      const response = await client.profile.$get()

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
      expect(userProfileService.getUserProfileByAuth0Id).toHaveBeenCalledWith("auth0|user123")
    })

    test("ユーザーが見つからない場合は404エラー", async () => {
      vi.mocked(userProfileService.getUserProfileByAuth0Id).mockResolvedValue(null)

      const response = await client.profile.$get()

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
      vi.mocked(userProfileService.getUserProfileByAuth0Id).mockRejectedValue(
        new Error("Database error"),
      )

      const response = await client.profile.$get()

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

      vi.mocked(userProfileService.getUserProfileByAuth0Id).mockResolvedValue(mockUser)
      vi.mocked(userProfileService.updateUserProfile).mockResolvedValue(updatedUser)

      const response = await client.profile.$put({
        json: updateData,
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.user.name).toBe("更新されたユーザー")
      expect(data.user.timezone).toBe("America/New_York")
      expect(userProfileService.updateUserProfile).toHaveBeenCalledWith("user-123", updateData)
    })

    test("ユーザーが見つからない場合は404エラー", async () => {
      vi.mocked(userProfileService.getUserProfileByAuth0Id).mockResolvedValue(null)

      const response = await client.profile.$put({
        json: { name: "新しい名前" },
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
      vi.mocked(userProfileService.getUserProfileByAuth0Id).mockResolvedValue(mockUser)
      vi.mocked(userProfileService.updateUserProfile).mockRejectedValue(
        new Error("このGitHubユーザー名は既に使用されています"),
      )

      const response = await client.profile.$put({
        json: { githubUsername: "existinguser" },
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

  describe("GET /settings", () => {
    test("ユーザー設定取得に成功", async () => {
      const mockSettings = {
        timezone: "Asia/Tokyo",
        emailNotifications: true,
        pushNotifications: false,
        language: "ja",
      }

      vi.mocked(userProfileService.getUserProfileByAuth0Id).mockResolvedValue(mockUser)
      vi.mocked(userSettingsService.getUserSettings).mockResolvedValue(mockSettings)

      const response = await client.settings.$get()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({ settings: mockSettings })
      expect(userSettingsService.getUserSettings).toHaveBeenCalledWith("user-123")
    })

    test("ユーザーが見つからない場合は404エラー", async () => {
      vi.mocked(userProfileService.getUserProfileByAuth0Id).mockResolvedValue(null)

      const response = await client.settings.$get()

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
  })

  describe("PUT /settings", () => {
    test("ユーザー設定更新に成功", async () => {
      const updateData = {
        timezone: "Europe/London",
        emailNotifications: false,
      }

      const updatedSettings = {
        timezone: "Europe/London",
        emailNotifications: false,
        pushNotifications: false,
        language: "ja",
      }

      vi.mocked(userProfileService.getUserProfileByAuth0Id).mockResolvedValue(mockUser)
      vi.mocked(userSettingsService.updateUserSettings).mockResolvedValue(updatedSettings)

      const response = await client.settings.$put({
        json: updateData,
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({ settings: updatedSettings })
      expect(userSettingsService.updateUserSettings).toHaveBeenCalledWith("user-123", updateData)
    })

    test("タイムゾーンバリデーションエラーの場合は400エラー", async () => {
      vi.mocked(userProfileService.getUserProfileByAuth0Id).mockResolvedValue(mockUser)
      vi.mocked(userSettingsService.updateUserSettings).mockRejectedValue(
        new Error("無効なタイムゾーンです"),
      )

      const response = await client.settings.$put({
        json: { timezone: "invalid/timezone" },
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toEqual({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "無効なタイムゾーンです",
        },
      })
    })

    test("言語バリデーションエラーの場合は400エラー", async () => {
      vi.mocked(userProfileService.getUserProfileByAuth0Id).mockResolvedValue(mockUser)
      vi.mocked(userSettingsService.updateUserSettings).mockRejectedValue(
        new Error("サポートされていない言語です"),
      )

      const response = await client.settings.$put({
        json: { language: "invalid" },
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toEqual({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "サポートされていない言語です",
        },
      })
    })
  })
})