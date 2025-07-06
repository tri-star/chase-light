/**
 * Exclusive JWT Auth Middleware Tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { Hono } from "hono"
import { createExclusiveJWTAuthMiddleware } from "../exclusive-jwt-auth.middleware"
import type { AuthExclusionConfig } from "../auth-exclusions"
import { AuthTestHelper } from "../../test-helpers/auth-test-helper"

describe("Exclusive JWT Auth Middleware", () => {
  let app: Hono
  const originalEnv = process.env
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    app = new Hono()
    process.env = { ...originalEnv }

    // テストユーザーをクリア
    AuthTestHelper.clearTestUsers()

    // テスト用ユーザーを登録
    AuthTestHelper.createTestToken("test-user", "test@example.com", "Test User")

    // コンソールログをモック
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    process.env = originalEnv
    AuthTestHelper.clearTestUsers()
    vi.restoreAllMocks()
  })

  describe("パス除外機能", () => {
    it("除外パスでは認証をスキップする", async () => {
      const exclusions: AuthExclusionConfig = {
        exactPaths: ["/health"],
        pathPrefixes: ["/api/public/"],
      }

      app.use("*", createExclusiveJWTAuthMiddleware({ exclusions }))
      app.get("/health", (c) => c.json({ status: "ok" }))
      app.get("/api/public/info", (c) => c.json({ info: "public" }))

      // 認証なしでアクセス
      const healthRes = await app.request("/health")
      expect(healthRes.status).toBe(200)

      const publicRes = await app.request("/api/public/info")
      expect(publicRes.status).toBe(200)
    })

    it("除外されないパスでは認証が必要", async () => {
      const exclusions: AuthExclusionConfig = {
        exactPaths: ["/health"],
      }

      app.use("*", createExclusiveJWTAuthMiddleware({ exclusions }))
      app.get("/api/private", (c) => c.json({ data: "private" }))

      // 認証なしでアクセス
      const res = await app.request("/api/private")
      expect(res.status).toBe(401)
    })

    it("有効なトークンがあれば認証が成功する", async () => {
      const exclusions: AuthExclusionConfig = {
        exactPaths: ["/health"],
      }

      app.use("*", createExclusiveJWTAuthMiddleware({ exclusions }))
      app.get("/api/private", (c) => c.json({ data: "private" }))

      // 有効なトークンでアクセス
      const validToken = AuthTestHelper.createTestToken("valid-user", "valid@example.com", "Valid User")
      const res = await app.request("/api/private", {
        headers: AuthTestHelper.createAuthHeaders(validToken),
      })
      expect(res.status).toBe(200)
    })
  })

  describe("開発環境での認証無効化", () => {
    it("開発環境でDISABLE_AUTH=trueの場合、すべてのリクエストを通す", async () => {
      process.env.NODE_ENV = "development"
      process.env.DISABLE_AUTH = "true"

      app.use("*", createExclusiveJWTAuthMiddleware({ allowDevDisable: true }))
      app.get("/api/private", (c) => c.json({ data: "private" }))

      // 認証なしでアクセス
      const res = await app.request("/api/private")
      expect(res.status).toBe(200)
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "[AUTH] Authentication disabled for non-production: /api/private",
      )
    })

    it("allowDevDisable=falseの場合、開発環境でも認証を実行", async () => {
      process.env.NODE_ENV = "development"
      process.env.DISABLE_AUTH = "true"

      app.use("*", createExclusiveJWTAuthMiddleware({ allowDevDisable: false }))
      app.get("/api/private", (c) => c.json({ data: "private" }))

      // 認証なしでアクセス
      const res = await app.request("/api/private")
      expect(res.status).toBe(401)
    })

    it("本番環境では認証無効化を無視", async () => {
      process.env.NODE_ENV = "production"
      process.env.DISABLE_AUTH = "true"

      app.use("*", createExclusiveJWTAuthMiddleware({ allowDevDisable: true }))
      app.get("/api/private", (c) => c.json({ data: "private" }))

      // 認証なしでアクセス
      const res = await app.request("/api/private")
      expect(res.status).toBe(401)
    })
  })

  describe("ログ出力", () => {
    it("除外パスでログを出力", async () => {
      app.use("*", createExclusiveJWTAuthMiddleware())
      app.get("/health", (c) => c.json({ status: "ok" }))

      await app.request("/health")

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[AUTH] Path excluded from authentication: /health",
      )
    })

    it("認証実行時にログを出力", async () => {
      app.use("*", createExclusiveJWTAuthMiddleware())
      app.get("/api/private", (c) => c.json({ data: "private" }))

      const validToken = AuthTestHelper.createTestToken("auth-user", "auth@example.com", "Auth User")
      await app.request("/api/private", {
        headers: AuthTestHelper.createAuthHeaders(validToken),
      })

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[AUTH] Authenticating request: /api/private",
      )
    })
  })
})
