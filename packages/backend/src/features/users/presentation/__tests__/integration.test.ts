import { describe, test, expect, vi, beforeEach } from "vitest"
import { createUserRoutes } from "../routes"
import { requireAuth } from "../../../auth/middleware/jwt-auth.middleware.js"
import type { UserProfileService } from "../../services/user-profile.service"
import type {
  UserSettingsService,
  UserSettings,
} from "../../services/user-settings.service"
import type { User } from "../../../../repositories/user.repository"

// モック設定
vi.mock("../../../auth/middleware/jwt-auth.middleware.js", () => ({
  requireAuth: vi.fn(),
}))

describe("Users API Integration Tests", () => {
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
    timezone: "Asia/Tokyo",
    emailNotifications: true,
    pushNotifications: false,
    language: "ja",
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

    // 認証ミドルウェアのモック
    vi.mocked(requireAuth).mockReturnValue(mockAuthenticatedUser)
  })

  describe("フル統合テストシナリオ", () => {
    test("ユーザープロフィールと設定の完全な操作フロー", async () => {
      // アプリケーション作成
      const app = createUserRoutes(
        mockUserProfileService,
        mockUserSettingsService,
      )

      // プロフィール取得
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(mockUser)
      const profileResponse = await app.request("/profile", {
        method: "GET",
        headers: {
          "Authorization": "Bearer mock-token",
        },
      })
      expect(profileResponse.status).toBe(200)

      // 設定取得
      vi.mocked(mockUserSettingsService.getUserSettings).mockResolvedValue(
        mockSettings,
      )
      const settingsResponse = await app.request("/settings", {
        method: "GET",
        headers: {
          "Authorization": "Bearer mock-token",
        },
      })
      expect(settingsResponse.status).toBe(200)

      // プロフィール更新
      const updatedUser = { ...mockUser, name: "更新されたユーザー" }
      vi.mocked(mockUserProfileService.updateUserProfile).mockResolvedValue(
        updatedUser,
      )
      const updateProfileResponse = await app.request("/profile", {
        method: "PUT",
        headers: {
          "Authorization": "Bearer mock-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "更新されたユーザー" }),
      })
      expect(updateProfileResponse.status).toBe(200)

      // 設定更新
      const updatedSettings = { ...mockSettings, timezone: "America/New_York" }
      vi.mocked(mockUserSettingsService.updateUserSettings).mockResolvedValue(
        updatedSettings,
      )
      const updateSettingsResponse = await app.request("/settings", {
        method: "PUT",
        headers: {
          "Authorization": "Bearer mock-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezone: "America/New_York" }),
      })
      expect(updateSettingsResponse.status).toBe(200)

      // すべてのサービスメソッドが呼ばれたことを確認
      expect(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).toHaveBeenCalledTimes(4) // profile get, profile put, settings get, settings put
      expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledTimes(1)
      expect(mockUserProfileService.updateUserProfile).toHaveBeenCalledTimes(1)
      expect(mockUserSettingsService.updateUserSettings).toHaveBeenCalledTimes(
        1,
      )
    })

    test("存在しないユーザーでの一連の操作", async () => {
      // アプリケーション作成
      const app = createUserRoutes(
        mockUserProfileService,
        mockUserSettingsService,
      )

      // すべてのメソッドでユーザーが見つからない状態をモック
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(null)

      // プロフィール取得 - 404
      const profileResponse = await app.request("/profile", {
        method: "GET",
        headers: {
          "Authorization": "Bearer mock-token",
        },
      })
      expect(profileResponse.status).toBe(404)

      // プロフィール更新 - 404
      const updateProfileResponse = await app.request("/profile", {
        method: "PUT",
        headers: {
          "Authorization": "Bearer mock-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "新しい名前" }),
      })
      expect(updateProfileResponse.status).toBe(404)

      // 設定取得 - 404
      const settingsResponse = await app.request("/settings", {
        method: "GET",
        headers: {
          "Authorization": "Bearer mock-token",
        },
      })
      expect(settingsResponse.status).toBe(404)

      // 設定更新 - 404
      const updateSettingsResponse = await app.request("/settings", {
        method: "PUT",
        headers: {
          "Authorization": "Bearer mock-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezone: "Europe/London" }),
      })
      expect(updateSettingsResponse.status).toBe(404)
    })

    test("認証が必要な全エンドポイントの動作確認", async () => {
      // アプリケーション作成
      const app = createUserRoutes(
        mockUserProfileService,
        mockUserSettingsService,
      )

      // 正常な認証状態でテスト
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(mockUser)
      vi.mocked(mockUserSettingsService.getUserSettings).mockResolvedValue(
        mockSettings,
      )

      // 全エンドポイントが認証を要求することを確認
      await app.request("/profile", {
        method: "GET",
        headers: {
          "Authorization": "Bearer mock-token",
        },
      })
      await app.request("/profile", {
        method: "PUT",
        headers: {
          "Authorization": "Bearer mock-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "test" }),
      })
      await app.request("/settings", {
        method: "GET",
        headers: {
          "Authorization": "Bearer mock-token",
        },
      })
      await app.request("/settings", {
        method: "PUT",
        headers: {
          "Authorization": "Bearer mock-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezone: "Asia/Tokyo" }),
      })

      // requireAuth が各エンドポイントで呼ばれることを確認
      expect(requireAuth).toHaveBeenCalledTimes(4)
    })
  })

  describe("エラーハンドリング統合テスト", () => {
    test("サービス層エラーの伝播", async () => {
      const app = createUserRoutes(
        mockUserProfileService,
        mockUserSettingsService,
      )

      // プロフィールサービスエラー
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockRejectedValue(new Error("Database connection failed"))

      const profileResponse = await app.request("/profile", {
        method: "GET",
        headers: {
          "Authorization": "Bearer mock-token",
        },
      })
      expect(profileResponse.status).toBe(500)

      // 設定サービスエラー
      vi.mocked(
        mockUserProfileService.getUserProfileByAuth0Id,
      ).mockResolvedValue(mockUser)
      vi.mocked(mockUserSettingsService.getUserSettings).mockRejectedValue(
        new Error("Settings database error"),
      )

      const settingsResponse = await app.request("/settings", {
        method: "GET",
        headers: {
          "Authorization": "Bearer mock-token",
        },
      })
      expect(settingsResponse.status).toBe(500)
    })
  })
})
