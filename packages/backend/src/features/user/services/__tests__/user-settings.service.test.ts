import { describe, test, expect, vi, beforeEach } from "vitest"
import { UserSettingsService } from "../user-settings.service"
import type { SupportedLanguage } from "../../constants/index.js"
import type { UserRepository } from "../../repositories/user.repository.js"
import { User } from "../../domain/user"

const mockUserRepository = {
  findById: vi.fn(),
  findByAuth0Id: vi.fn(),
  findByEmail: vi.fn(),
  findByGithubUsername: vi.fn(),
  save: vi.fn(),
  findMany: vi.fn(),
  delete: vi.fn(),
  findOrCreateByAuth0: vi.fn(),
} as unknown as UserRepository

describe("UserSettingsService", () => {
  let userSettingsService: UserSettingsService

  beforeEach(() => {
    vi.clearAllMocks()
    userSettingsService = new UserSettingsService(mockUserRepository)
  })

  describe("getUserSettings", () => {
    test("有効なユーザーIDで設定を取得できる", async () => {
      const mockUser: User = {
        id: "user-123",
        auth0UserId: "auth0|user123",
        email: "test@example.com",
        name: "テストユーザー",
        githubUsername: "testuser",
        avatarUrl: "https://example.com/avatar.jpg",
        timezone: "America/New_York",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      }

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)

      const result = await userSettingsService.getUserSettings("user-123")

      expect(mockUserRepository.findById).toHaveBeenCalledWith("user-123")
      expect(result).toEqual({
        emailNotifications: true,
        pushNotifications: false,
        language: "ja" as SupportedLanguage,
      })
    })

    test("存在しないユーザーIDの場合はnullを返す", async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const result = await userSettingsService.getUserSettings("non-existent")

      expect(mockUserRepository.findById).toHaveBeenCalledWith("non-existent")
      expect(result).toBeNull()
    })
  })

  describe("updateUserSettings", () => {
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

    test("タイムゾーンを正常に更新できる", async () => {
      const updateData = { timezone: "Europe/London" }

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(mockUser) // 更新前の呼び出し
        .mockResolvedValueOnce({ ...mockUser, timezone: "Europe/London" }) // getUserSettings内の呼び出し

      vi.mocked(mockUserRepository.save).mockResolvedValue()

      const result = await userSettingsService.updateUserSettings(
        "user-123",
        updateData,
      )

      expect(mockUserRepository.findById).toHaveBeenCalledWith("user-123")
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        timezone: "Europe/London",
      })
      expect(result).toEqual({
        emailNotifications: true,
        pushNotifications: false,
        language: "ja" as SupportedLanguage,
      })
    })

    test("存在しないユーザーの場合はnullを返す", async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const result = await userSettingsService.updateUserSettings(
        "non-existent",
        {
          timezone: "Asia/Tokyo",
        },
      )

      expect(mockUserRepository.findById).toHaveBeenCalledWith("non-existent")
      expect(mockUserRepository.save).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    test.each([
      ["Asia/Tokyo", true],
      ["America/New_York", true],
      ["Europe/London", true],
      ["invalid/timezone", false],
      ["Not/A/Timezone", false],
    ])("タイムゾーン検証: %s -> %s", async (timezone, shouldSucceed) => {
      const updateData = { timezone }

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)

      if (shouldSucceed) {
        vi.mocked(mockUserRepository.findById)
          .mockResolvedValueOnce(mockUser)
          .mockResolvedValueOnce({ ...mockUser, timezone })

        vi.mocked(mockUserRepository.save).mockResolvedValue()

        const result = await userSettingsService.updateUserSettings(
          "user-123",
          updateData,
        )
        expect(result).toBeDefined()
        expect(result).toEqual({
          emailNotifications: true,
          pushNotifications: false,
          language: "ja" as SupportedLanguage,
        })
      } else {
        await expect(
          userSettingsService.updateUserSettings("user-123", updateData),
        ).rejects.toThrow("無効なタイムゾーンです")

        expect(mockUserRepository.save).not.toHaveBeenCalled()
      }
    })

    test.each([
      ["ja", true],
      ["en", true],
      ["fr", false],
      ["invalid", false],
    ])("言語検証: %s -> %s", async (language, shouldSucceed) => {
      const updateData = { language: language as SupportedLanguage }

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)

      if (shouldSucceed) {
        vi.mocked(mockUserRepository.findById)
          .mockResolvedValueOnce(mockUser)
          .mockResolvedValueOnce(mockUser)

        const result = await userSettingsService.updateUserSettings(
          "user-123",
          updateData,
        )
        expect(result).toBeDefined()
        // 現在の実装では言語設定はDBに保存されないため、常にデフォルト値が返される
        expect(result?.language).toBe("ja") // デフォルト値
      } else {
        await expect(
          userSettingsService.updateUserSettings("user-123", updateData),
        ).rejects.toThrow("サポートされていない言語です")
      }
    })

    test("通知設定のみ更新する場合（将来の実装用）", async () => {
      const updateData = {
        emailNotifications: false,
        pushNotifications: true,
      }

      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser)

      const result = await userSettingsService.updateUserSettings(
        "user-123",
        updateData,
      )

      // 現在の実装では通知設定はDBに保存されないが、レスポンスにはデフォルト値が含まれる
      expect(result).toEqual({
        emailNotifications: true, // デフォルト値
        pushNotifications: false, // デフォルト値
        language: "ja" as SupportedLanguage,
      })
    })
  })

  describe("resetUserSettings", () => {
    const mockUser: User = {
      id: "user-123",
      auth0UserId: "auth0|user123",
      email: "test@example.com",
      name: "テストユーザー",
      githubUsername: "testuser",
      avatarUrl: "https://example.com/avatar.jpg",
      timezone: "America/New_York",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    }

    test("設定をデフォルト値にリセットできる", async () => {
      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(mockUser) // リセット前の呼び出し
        .mockResolvedValueOnce({ ...mockUser, timezone: "Asia/Tokyo" }) // getUserSettings内の呼び出し

      vi.mocked(mockUserRepository.save).mockResolvedValue()

      const result = await userSettingsService.resetUserSettings("user-123")

      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        timezone: "Asia/Tokyo",
      })
      expect(result).toEqual({
        emailNotifications: true,
        pushNotifications: false,
        language: "ja" as SupportedLanguage,
      })
    })

    test("存在しないユーザーの場合はnullを返す", async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)
      vi.mocked(mockUserRepository.save).mockResolvedValue()

      const result = await userSettingsService.resetUserSettings("non-existent")

      expect(mockUserRepository.save).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })
  })
})
