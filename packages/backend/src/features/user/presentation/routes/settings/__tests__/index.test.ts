import { describe, test, expect, vi, beforeEach } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { createSettingsRoutes } from "../index"
import { requireAuth } from "../../../../../auth/middleware/jwt-auth.middleware.js"
import type { UserProfileService } from "../../../../services/user-profile.service"
import type {
  UserSettingsService,
  UserSettings,
  SupportedLanguage,
} from "../../../../services/user-settings.service"
import type { User } from "../../../../../../repositories/user.repository"

// モック設定
vi.mock("../../../../../auth/middleware/jwt-auth.middleware.js", () => ({
  requireAuth: vi.fn(),
}))

describe("Settings Routes", () => {
  let app: OpenAPIHono
  let mockUserProfileService: UserProfileService
  let mockUserSettingsService: UserSettingsService

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

  const mockSettings: UserSettings = {
    emailNotifications: true,
    pushNotifications: false,
    language: "ja" as SupportedLanguage,
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

    // UserSettingsServiceのモック
    mockUserSettingsService = {
      getUserSettings: vi.fn(),
      updateUserSettings: vi.fn(),
      resetUserSettings: vi.fn(),
    } as unknown as UserSettingsService

    // アプリケーション作成
    app = new OpenAPIHono()
    createSettingsRoutes(app, mockUserProfileService, mockUserSettingsService)

    // 認証ミドルウェアのモック
    vi.mocked(requireAuth).mockReturnValue(mockAuthenticatedUser)
  })

  describe("GET /settings", () => {
    test("ユーザー設定取得に成功", async () => {
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(mockUser)
      vi.mocked(mockUserSettingsService.getUserSettings).mockResolvedValue(
        mockSettings,
      )

      const response = await app.request("/settings", {
        method: "GET",
        headers: {
          Authorization: "Bearer mock-token",
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          githubUsername: mockUser.githubUsername,
          avatarUrl: mockUser.avatarUrl,
          timezone: mockUser.timezone,
          createdAt: mockUser.createdAt?.toISOString() || "",
          updatedAt: mockUser.updatedAt?.toISOString() || "",
          settings: {
            timezone: mockUser.timezone,
            emailNotifications: mockSettings.emailNotifications,
            pushNotifications: mockSettings.pushNotifications,
            language: mockSettings.language,
          },
        },
      })
      expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith(
        "user-123",
      )
    })

    test("ユーザーが見つからない場合は404エラー", async () => {
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(null)

      const response = await app.request("/settings", {
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

    test("設定が見つからない場合は404エラー", async () => {
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(mockUser)
      vi.mocked(mockUserSettingsService.getUserSettings).mockResolvedValue(null)

      const response = await app.request("/settings", {
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
          code: "SETTINGS_NOT_FOUND",
          message: "設定が見つかりません",
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
        emailNotifications: false,
        pushNotifications: false,
        language: "ja" as SupportedLanguage,
      }

      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(mockUser)
      vi.mocked(mockUserSettingsService.updateUserSettings).mockResolvedValue(
        updatedSettings,
      )

      const response = await app.request("/settings", {
        method: "PUT",
        headers: {
          Authorization: "Bearer mock-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          githubUsername: mockUser.githubUsername,
          avatarUrl: mockUser.avatarUrl,
          timezone: mockUser.timezone,
          createdAt: mockUser.createdAt?.toISOString() || "",
          updatedAt: mockUser.updatedAt?.toISOString() || "",
          settings: {
            timezone: mockUser.timezone,
            emailNotifications: updatedSettings.emailNotifications,
            pushNotifications: updatedSettings.pushNotifications,
            language: updatedSettings.language,
          },
        },
      })
      expect(mockUserSettingsService.updateUserSettings).toHaveBeenCalledWith(
        "user-123",
        updateData,
      )
    })

    test("ユーザーが見つからない場合は404エラー", async () => {
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(null)

      const response = await app.request("/settings", {
        method: "PUT",
        headers: {
          Authorization: "Bearer mock-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezone: "Europe/London" }),
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

    test("タイムゾーンバリデーションエラーの場合は400エラー", async () => {
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(mockUser)
      vi.mocked(mockUserSettingsService.updateUserSettings).mockRejectedValue(
        new Error("無効なタイムゾーンです"),
      )

      const response = await app.request("/settings", {
        method: "PUT",
        headers: {
          Authorization: "Bearer mock-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezone: "invalid/timezone" }),
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
      const response = await app.request("/settings", {
        method: "PUT",
        headers: {
          Authorization: "Bearer mock-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ language: "invalid" }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      // Zod enumバリデーションエラーの形式を期待
      expect(data).toEqual({
        success: false,
        error: {
          name: "ZodError",
          message: expect.stringContaining("Invalid option: expected one of"),
        },
      })
    })

    test("設定更新が失敗した場合は500エラー", async () => {
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(mockUser)
      vi.mocked(mockUserSettingsService.updateUserSettings).mockResolvedValue(
        null,
      )

      const response = await app.request("/settings", {
        method: "PUT",
        headers: {
          Authorization: "Bearer mock-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezone: "Europe/London" }),
      })

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toEqual({
        success: false,
        error: {
          code: "UPDATE_FAILED",
          message: "設定の更新に失敗しました",
        },
      })
    })
  })
})
