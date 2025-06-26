import { describe, test, expect, vi, beforeEach } from "vitest"
import { UserProfileService } from "../user-profile.service"
import type {
  UserRepository,
  User,
} from "../../../../repositories/user.repository"

const mockUserRepository = {
  findById: vi.fn(),
  findByAuth0Id: vi.fn(),
  findByEmail: vi.fn(),
  findByGithubUsername: vi.fn(),
  update: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  findOrCreateByAuth0: vi.fn(),
} as unknown as UserRepository

describe("UserProfileService", () => {
  let userProfileService: UserProfileService

  beforeEach(() => {
    vi.clearAllMocks()
    userProfileService = new UserProfileService(mockUserRepository)
  })

  describe("getUserProfile", () => {
    test("有効なユーザーIDでプロフィールを取得できる", async () => {
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

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)

      const result = await userProfileService.getUserProfile("user-123")

      expect(mockUserRepository.findById).toHaveBeenCalledWith("user-123")
      expect(result).toEqual(mockUser)
    })

    test("存在しないユーザーIDの場合はnullを返す", async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const result = await userProfileService.getUserProfile("non-existent")

      expect(mockUserRepository.findById).toHaveBeenCalledWith("non-existent")
      expect(result).toBeNull()
    })
  })

  describe("getUserProfileByAuth0Id", () => {
    test("有効なAuth0 IDでプロフィールを取得できる", async () => {
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

      vi.mocked(mockUserRepository.findByAuth0Id).mockResolvedValue(mockUser)

      const result =
        await userProfileService.getUserProfileByAuth0Id("auth0|user123")

      expect(mockUserRepository.findByAuth0Id).toHaveBeenCalledWith(
        "auth0|user123",
      )
      expect(result).toEqual(mockUser)
    })
  })

  describe("updateUserProfile", () => {
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

    test("正常なデータでプロフィールを更新できる", async () => {
      const updateData = {
        name: "更新されたユーザー",
        timezone: "America/New_York",
      }

      const updatedUser = { ...mockUser, ...updateData }

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)
      vi.mocked(mockUserRepository.update).mockResolvedValue(updatedUser)

      const result = await userProfileService.updateUserProfile(
        "user-123",
        updateData,
      )

      expect(mockUserRepository.findById).toHaveBeenCalledWith("user-123")
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        "user-123",
        updateData,
      )
      expect(result).toEqual(updatedUser)
    })

    test("存在しないユーザーの場合はnullを返す", async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

      const result = await userProfileService.updateUserProfile(
        "non-existent",
        {
          name: "新しい名前",
        },
      )

      expect(mockUserRepository.findById).toHaveBeenCalledWith("non-existent")
      expect(mockUserRepository.update).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    test("GitHubユーザー名の重複チェック - 成功", async () => {
      const updateData = { githubUsername: "newusername" }

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)
      vi.mocked(mockUserRepository.findByGithubUsername).mockResolvedValue(null)
      vi.mocked(mockUserRepository.update).mockResolvedValue({
        ...mockUser,
        ...updateData,
      })

      const result = await userProfileService.updateUserProfile(
        "user-123",
        updateData,
      )

      expect(mockUserRepository.findByGithubUsername).toHaveBeenCalledWith(
        "newusername",
      )
      expect(result).toBeDefined()
    })

    test("GitHubユーザー名の重複チェック - 他ユーザーと重複", async () => {
      const updateData = { githubUsername: "existinguser" }
      const existingUser = {
        ...mockUser,
        id: "other-user",
        githubUsername: "existinguser",
      }

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)
      vi.mocked(mockUserRepository.findByGithubUsername).mockResolvedValue(
        existingUser,
      )

      await expect(
        userProfileService.updateUserProfile("user-123", updateData),
      ).rejects.toThrow("このGitHubユーザー名は既に使用されています")

      expect(mockUserRepository.update).not.toHaveBeenCalled()
    })

    test("GitHubユーザー名の重複チェック - 自分のユーザー名は許可", async () => {
      const updateData = { githubUsername: "testuser" } // 現在と同じユーザー名

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)
      vi.mocked(mockUserRepository.findByGithubUsername).mockResolvedValue(
        mockUser,
      )
      vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser)

      const result = await userProfileService.updateUserProfile(
        "user-123",
        updateData,
      )

      expect(result).toBeDefined()
      expect(mockUserRepository.update).toHaveBeenCalled()
    })

    test.each([
      ["Asia/Tokyo", true],
      ["America/New_York", true],
      ["Europe/London", true],
      ["invalid/timezone", false],
      ["", false],
    ])("タイムゾーン検証: %s -> %s", async (timezone, shouldSucceed) => {
      const updateData = { timezone }

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)

      if (shouldSucceed) {
        vi.mocked(mockUserRepository.update).mockResolvedValue({
          ...mockUser,
          timezone,
        })

        const result = await userProfileService.updateUserProfile(
          "user-123",
          updateData,
        )
        expect(result).toBeDefined()
      } else {
        await expect(
          userProfileService.updateUserProfile("user-123", updateData),
        ).rejects.toThrow("無効なタイムゾーンです")

        expect(mockUserRepository.update).not.toHaveBeenCalled()
      }
    })
  })
})
