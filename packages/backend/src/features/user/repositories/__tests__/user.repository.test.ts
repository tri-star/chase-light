import { describe, test, expect, beforeEach } from "vitest"
import { UserRepository } from "../user.repository"
import { User } from "../../domain/user"
import { TestDataFactory, setupComponentTest } from "../../../../test"
import { uuidv7 } from "uuidv7"

// Repository Unit Test: 実DBを使用してデータアクセス層をテスト

describe("UserRepository - Unit Test", () => {
  setupComponentTest()

  let userRepository: UserRepository

  beforeEach(() => {
    userRepository = new UserRepository()
  })

  describe("save()", () => {
    test("新規ユーザーのINSERTが正常に動作する", async () => {
      const newUser: User = {
        id: uuidv7(),
        auth0UserId: "auth0|new_user_test",
        email: "newuser@example.com",
        name: "新規ユーザー",
        githubUsername: "newuser",
        avatarUrl: "https://example.com/new.jpg",
        timezone: "Asia/Tokyo",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // INSERT実行
      await userRepository.save(newUser)

      // データが正しく保存されているか確認
      const savedUser = await userRepository.findById(newUser.id)
      expect(savedUser).not.toBeNull()
      expect(savedUser?.email).toBe("newuser@example.com")
      expect(savedUser?.name).toBe("新規ユーザー")
    })

    test("既存ユーザーのUPDATEが正常に動作する", async () => {
      // 既存ユーザーを作成
      const existingUser =
        await TestDataFactory.createTestUser("auth0|update_test")
      const originalUpdatedAt = existingUser.updatedAt

      // 少し待って時刻を変える
      await new Promise((resolve) => globalThis.setTimeout(resolve, 10))

      // ユーザー情報を更新
      const updatedUserData: User = {
        ...existingUser,
        name: "更新されたユーザー名",
        email: "updated@example.com",
      }

      // UPDATE実行
      await userRepository.save(updatedUserData)

      // データが正しく更新されているか確認
      const updatedUser = await userRepository.findById(existingUser.id)
      expect(updatedUser).not.toBeNull()
      expect(updatedUser?.name).toBe("更新されたユーザー名")
      expect(updatedUser?.email).toBe("updated@example.com")
      expect(updatedUser?.updatedAt).not.toEqual(originalUpdatedAt)
    })
  })

  describe("findById()", () => {
    test("存在するユーザーIDで正常に取得できる", async () => {
      const testUser = await TestDataFactory.createTestUser(
        "auth0|findbyid_test",
      )

      const foundUser = await userRepository.findById(testUser.id)

      expect(foundUser).not.toBeNull()
      expect(foundUser?.id).toBe(testUser.id)
      expect(foundUser?.auth0UserId).toBe("auth0|findbyid_test")
    })

    test("存在しないユーザーIDの場合はnullを返す", async () => {
      const nonExistentId = uuidv7()

      const foundUser = await userRepository.findById(nonExistentId)

      expect(foundUser).toBeNull()
    })
  })

  describe("findByAuth0Id()", () => {
    test("存在するAuth0 IDで正常に取得できる", async () => {
      const testUser = await TestDataFactory.createTestUser(
        "auth0|findbyauth0_test",
      )

      const foundUser = await userRepository.findByAuth0Id(
        "auth0|findbyauth0_test",
      )

      expect(foundUser).not.toBeNull()
      expect(foundUser?.id).toBe(testUser.id)
      expect(foundUser?.auth0UserId).toBe("auth0|findbyauth0_test")
    })

    test("存在しないAuth0 IDの場合はnullを返す", async () => {
      const foundUser = await userRepository.findByAuth0Id("auth0|nonexistent")

      expect(foundUser).toBeNull()
    })
  })

  describe("findByEmail()", () => {
    test("存在するメールアドレスで正常に取得できる", async () => {
      const testUser = await TestDataFactory.createCustomUser({
        email: "findbyemail@example.com",
        auth0UserId: "auth0|findbyemail_test",
      })

      const foundUser = await userRepository.findByEmail(
        "findbyemail@example.com",
      )

      expect(foundUser).not.toBeNull()
      expect(foundUser?.id).toBe(testUser.id)
      expect(foundUser?.email).toBe("findbyemail@example.com")
    })

    test("存在しないメールアドレスの場合はnullを返す", async () => {
      const foundUser = await userRepository.findByEmail(
        "nonexistent@example.com",
      )

      expect(foundUser).toBeNull()
    })
  })

  describe("findByGithubUsername()", () => {
    test("存在するGitHubユーザー名で正常に取得できる", async () => {
      const testUser = await TestDataFactory.createCustomUser({
        githubUsername: "findbygh_user",
        auth0UserId: "auth0|findbygh_test",
      })

      const foundUser =
        await userRepository.findByGithubUsername("findbygh_user")

      expect(foundUser).not.toBeNull()
      expect(foundUser?.id).toBe(testUser.id)
      expect(foundUser?.githubUsername).toBe("findbygh_user")
    })

    test("存在しないGitHubユーザー名の場合はnullを返す", async () => {
      const foundUser =
        await userRepository.findByGithubUsername("nonexistent_user")

      expect(foundUser).toBeNull()
    })
  })

  describe("findMany()", () => {
    test("クエリオプションなしで全ユーザーを取得できる", async () => {
      // テストユーザーを複数作成
      await TestDataFactory.createTestUsers(3)

      const users = await userRepository.findMany()

      expect(users.length).toBeGreaterThanOrEqual(3)
      expect(Array.isArray(users)).toBe(true)
    })

    test("GitHubユーザー名での検索フィルタが動作する", async () => {
      await TestDataFactory.createCustomUser({
        githubUsername: "searchtest_user",
        auth0UserId: "auth0|searchtest",
      })

      const users = await userRepository.findMany({
        queries: { githubUserName: "searchtest" },
      })

      expect(users.length).toBeGreaterThanOrEqual(1)
      expect(users[0].githubUsername).toContain("searchtest")
    })

    test("limitオプションが正常に動作する", async () => {
      await TestDataFactory.createTestUsers(5)

      const users = await userRepository.findMany({ queries: {}, limit: 2 })

      expect(users.length).toBeLessThanOrEqual(2)
    })
  })

  describe("delete()", () => {
    test("存在するユーザーの削除が正常に動作する", async () => {
      const testUser = await TestDataFactory.createTestUser("auth0|delete_test")

      const result = await userRepository.delete(testUser.id)

      expect(result).toBe(true)

      // 削除されたことを確認
      const deletedUser = await userRepository.findById(testUser.id)
      expect(deletedUser).toBeNull()
    })

    test("存在しないユーザーの削除はfalseを返す", async () => {
      const nonExistentId = uuidv7()

      const result = await userRepository.delete(nonExistentId)

      expect(result).toBe(false)
    })
  })
})
