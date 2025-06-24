/**
 * Exclusive JWT Auth Middleware Tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { Hono } from "hono"
import { createExclusiveJWTAuthMiddleware } from "../exclusive-jwt-auth.middleware"
import type { AuthExclusionConfig } from "../auth-exclusions"

// JWT認証ミドルウェアをモック
vi.mock("../jwt-auth.middleware", () => ({
  createJWTAuthMiddleware: vi.fn(
    () =>
      // @ts-expect-error テスト用のモック関数での型簡略化
      async (c, next) => {
        // モックJWT認証：Authorizationヘッダーがあれば成功
        const authHeader = c.req.header("Authorization")
        if (authHeader === "Bearer valid-token") {
          c.set("auth", { user: { sub: "test-user" } })
          await next()
        } else {
          // HTTPExceptionを模擬
          throw new Error("Unauthorized")
        }
      },
  ),
}))

describe("Exclusive JWT Auth Middleware", () => {
  let app: Hono
  const originalEnv = process.env

  beforeEach(() => {
    app = new Hono()
    process.env = { ...originalEnv }

    // コンソールログをモック
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
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
      const res = await app.request("/api/private", {
        headers: {
          Authorization: "Bearer valid-token",
        },
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
      expect(console.warn).toHaveBeenCalledWith(
        "[AUTH] Authentication disabled for development: /api/private",
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

      expect(console.log).toHaveBeenCalledWith(
        "[AUTH] Path excluded from authentication: /health",
      )
    })

    it("認証実行時にログを出力", async () => {
      app.use("*", createExclusiveJWTAuthMiddleware())
      app.get("/api/private", (c) => c.json({ data: "private" }))

      await app.request("/api/private", {
        headers: { Authorization: "Bearer valid-token" },
      })

      expect(console.log).toHaveBeenCalledWith(
        "[AUTH] Authenticating request: /api/private",
      )
    })
  })
})
