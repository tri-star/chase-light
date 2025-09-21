/**
 * Exclusive JWT Auth Middleware Tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { Hono } from "hono"
import { createExclusiveJWTAuthMiddleware } from "../exclusive-jwt-auth.middleware"
import type { AuthExclusionConfig } from "../auth-exclusions"
import type {
  AccessTokenValidator,
  TokenValidationResult,
} from "../../types/auth.types"

const createValidatorStub = () => {
  const responses = new Map<string, TokenValidationResult>()
  const validateAccessToken = vi.fn(async (token: string) => {
    const cleanToken = token.replace(/^Bearer\s+/i, "").trim()
    return responses.get(cleanToken) ?? { valid: false, error: "token missing" }
  })

  return {
    validator: { validateAccessToken } satisfies AccessTokenValidator,
    register(token: string, result: TokenValidationResult) {
      responses.set(token, result)
    },
    clear() {
      responses.clear()
    },
  }
}

describe("Exclusive JWT Auth Middleware", () => {
  let app: Hono
  const originalEnv = process.env
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
  }
  let stub: ReturnType<typeof createValidatorStub>

  beforeEach(() => {
    app = new Hono()
    process.env = { ...originalEnv }

    stub = createValidatorStub()

    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    process.env = originalEnv
    stub.clear()
    vi.restoreAllMocks()
  })

  describe("パス除外機能", () => {
    it("除外パスでは認証をスキップする", async () => {
      const exclusions: AuthExclusionConfig = {
        exactPaths: ["/health"],
        pathPrefixes: ["/api/public/"],
      }

      app.use(
        "*",
        createExclusiveJWTAuthMiddleware(
          { validator: stub.validator },
          { exclusions },
        ),
      )
      app.get("/health", (c) => c.json({ status: "ok" }))
      app.get("/api/public/info", (c) => c.json({ info: "public" }))

      const healthRes = await app.request("/health")
      expect(healthRes.status).toBe(200)
      expect(stub.validator.validateAccessToken).not.toHaveBeenCalled()

      const publicRes = await app.request("/api/public/info")
      expect(publicRes.status).toBe(200)
      expect(stub.validator.validateAccessToken).not.toHaveBeenCalled()
    })

    it("除外されないパスでは認証が必要", async () => {
      const exclusions: AuthExclusionConfig = {
        exactPaths: ["/health"],
      }

      app.use(
        "*",
        createExclusiveJWTAuthMiddleware(
          { validator: stub.validator },
          { exclusions },
        ),
      )
      app.get("/api/private", (c) => c.json({ data: "private" }))

      const res = await app.request("/api/private")
      expect(res.status).toBe(401)
    })

    it("有効なトークンがあれば認証が成功する", async () => {
      const exclusions: AuthExclusionConfig = {
        exactPaths: ["/health"],
      }

      stub.register("valid-token", {
        valid: true,
        payload: {
          sub: "valid-user",
          iss: "https://example.com/",
          aud: "api",
          iat: Math.floor(Date.now() / 1000) - 10,
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      })

      app.use(
        "*",
        createExclusiveJWTAuthMiddleware(
          { validator: stub.validator },
          { exclusions },
        ),
      )
      app.get("/api/private", (c) => c.json({ data: "private" }))

      const res = await app.request("/api/private", {
        headers: {
          Authorization: "Bearer valid-token",
        },
      })
      expect(res.status).toBe(200)
      expect(stub.validator.validateAccessToken).toHaveBeenCalledWith(
        "Bearer valid-token",
      )
    })
  })

  describe("ログ出力", () => {
    it("除外パスでログを出力", async () => {
      app.use(
        "*",
        createExclusiveJWTAuthMiddleware({ validator: stub.validator }),
      )
      app.get("/health", (c) => c.json({ status: "ok" }))

      await app.request("/health")

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[AUTH] Path excluded from authentication: /health",
      )
    })

    it("認証実行時にログを出力", async () => {
      stub.register("auth-token", {
        valid: true,
        payload: {
          sub: "auth-user",
          iss: "https://example.com/",
          aud: "api",
          iat: Math.floor(Date.now() / 1000) - 10,
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      })

      app.use(
        "*",
        createExclusiveJWTAuthMiddleware({ validator: stub.validator }),
      )
      app.get("/api/private", (c) => c.json({ data: "private" }))

      await app.request("/api/private", {
        headers: { Authorization: "Bearer auth-token" },
      })

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[AUTH] Authenticating request: /api/private",
      )
    })
  })
})
