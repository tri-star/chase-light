import { describe, test, expect, beforeEach } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { createProfileRoutes } from "../index"
import { UserProfileService } from "../../../../services/user-profile.service"
import { UserRepository } from "../../../../repositories/user.repository"
import { User } from "../../../../domain/user"
import { TestDataFactory, setupComponentTest } from "../../../../../../test"
import { globalJWTAuth } from "../../../../../auth"
import { AuthTestHelper } from "../../../../../auth/test-helpers/auth-test-helper"

// Component Test: 実DBを使用してAPIエンドポイントをテスト

describe("Profile Routes - Component Test", () => {
  setupComponentTest()

  let app: OpenAPIHono
  let userProfileService: UserProfileService
  let testUser: User
  let testToken: string

  beforeEach(async () => {
    // テストユーザーをクリア
    AuthTestHelper.clearTestUsers()

    // 実際のサービスクラスを使用（モックなし）
    const userRepository = new UserRepository()
    userProfileService = new UserProfileService(userRepository)

    // テスト用ユーザーを実際のDBに作成
    testUser = await TestDataFactory.createTestUser("auth0|test123")

    // Mock認証用トークンを生成
    testToken = AuthTestHelper.createTestToken(
      testUser.auth0UserId,
      testUser.email,
      testUser.name,
    )

    // Honoアプリケーションに実際のサービスを設定
    app = new OpenAPIHono()

    // 認証ミドルウェアを追加
    app.use("*", globalJWTAuth)

    createProfileRoutes(app, userProfileService)
  })

  describe("GET /profile", () => {
    test("認証済みユーザーのプロフィール取得に成功", async () => {
      const response = await app.request("/profile", {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(testToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          githubUsername: testUser.githubUsername,
          avatarUrl: testUser.avatarUrl,
          timezone: testUser.timezone,
          createdAt: testUser.createdAt?.toISOString(),
          updatedAt: testUser.updatedAt?.toISOString(),
        },
      })
    })

    test("ユーザーが見つからない場合は404エラー", async () => {
      // 存在しないユーザーのトークンを作成
      const nonexistentToken = AuthTestHelper.createTestToken(
        "auth0|nonexistent",
        "nonexistent@example.com",
        "Nonexistent User",
      )

      const response = await app.request("/profile", {
        method: "GET",
        headers: AuthTestHelper.createAuthHeaders(nonexistentToken),
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

    test.skip("内部エラーの場合は500エラー", async () => {
      // Component Testでは意図的な内部エラーの再現が困難なため、
      // このテストはUnit Testレベルで実施する方が適切
      // 実際のエラーハンドリング動作は統合テストで確認済み
    })
  })

  describe("PUT /profile", () => {
    test("プロフィール更新に成功", async () => {
      const updateData = {
        name: "更新されたユーザー",
        email: "updated@example.com",
      }

      const response = await app.request("/profile", {
        method: "PUT",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.user.name).toBe("更新されたユーザー")
      expect(data.user.email).toBe("updated@example.com")
      expect(data.user.id).toBe(testUser.id)

      // 実際にデータベースでも更新されていることを確認
      const updatedUser = await userProfileService.getUserProfile(testUser.id)
      expect(updatedUser?.name).toBe("更新されたユーザー")
      expect(updatedUser?.email).toBe("updated@example.com")
    })

    test("ユーザーが見つからない場合は404エラー", async () => {
      // 存在しないユーザーのトークンを作成
      const nonexistentToken = AuthTestHelper.createTestToken(
        "auth0|nonexistent",
        "nonexistent@example.com",
        "Nonexistent User",
      )

      const response = await app.request("/profile", {
        method: "PUT",
        headers: {
          ...AuthTestHelper.createAuthHeaders(nonexistentToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "新しい名前", email: "test@example.com" }),
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

    test("重複メールアドレスの場合はバリデーションエラー", async () => {
      // 別のユーザーで既存のメールアドレスを作成
      await TestDataFactory.createCustomUser({
        email: "existing@example.com",
        auth0UserId: "auth0|existing123",
      })

      const response = await app.request("/profile", {
        method: "PUT",
        headers: {
          ...AuthTestHelper.createAuthHeaders(testToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "テストユーザー",
          email: "existing@example.com", // 既に使用されているメールアドレス
        }),
      })

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data).toEqual({
        success: false,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "このメールアドレスは既に使用されています",
          details: {
            field: "email",
            value: "existing@example.com",
          },
        },
      })
    })
  })
})
