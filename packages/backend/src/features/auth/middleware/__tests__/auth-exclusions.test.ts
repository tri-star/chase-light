/**
 * Auth Exclusions Tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  isPathExcluded,
  isAuthDisabledForDevelopment,
  getAuthExclusionsFromEnv,
  DEFAULT_AUTH_EXCLUSIONS,
  type AuthExclusionConfig,
} from "../auth-exclusions"

describe("Auth Exclusions", () => {
  describe("isPathExcluded", () => {
    it("完全パスマッチで除外される", () => {
      const config: AuthExclusionConfig = {
        exactPaths: ["/health", "/doc"],
      }

      expect(isPathExcluded("/health", config)).toBe(true)
      expect(isPathExcluded("/doc", config)).toBe(true)
      expect(isPathExcluded("/api/test", config)).toBe(false)
    })

    it("前置詞マッチで除外される", () => {
      const config: AuthExclusionConfig = {
        pathPrefixes: ["/api/public/", "/static/"],
      }

      expect(isPathExcluded("/api/public/info", config)).toBe(true)
      expect(isPathExcluded("/static/css/main.css", config)).toBe(true)
      expect(isPathExcluded("/api/private/data", config)).toBe(false)
    })

    it("正規表現パターンで除外される", () => {
      const config: AuthExclusionConfig = {
        patterns: [/^\/assets\/.*/, /^\/api\/v\d+\/public$/],
      }

      expect(isPathExcluded("/assets/images/logo.png", config)).toBe(true)
      expect(isPathExcluded("/api/v1/public", config)).toBe(true)
      expect(isPathExcluded("/api/v1/private", config)).toBe(false)
    })

    it("デフォルト設定で動作する", () => {
      expect(isPathExcluded("/health")).toBe(true)
      expect(isPathExcluded("/doc")).toBe(true)
      expect(isPathExcluded("/scalar")).toBe(true)
      expect(isPathExcluded("/api/auth/signup")).toBe(true)
      expect(isPathExcluded("/api/datasource/repositories")).toBe(false)
    })

    it("複数の条件が組み合わされて動作する", () => {
      const config: AuthExclusionConfig = {
        exactPaths: ["/health"],
        pathPrefixes: ["/api/public/"],
        patterns: [/^\/static\/.*/],
      }

      expect(isPathExcluded("/health", config)).toBe(true)
      expect(isPathExcluded("/api/public/info", config)).toBe(true)
      expect(isPathExcluded("/static/js/app.js", config)).toBe(true)
      expect(isPathExcluded("/api/private/data", config)).toBe(false)
    })
  })

  describe("isAuthDisabledForDevelopment", () => {
    const originalEnv = process.env

    beforeEach(() => {
      vi.resetModules()
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it("開発環境でDISABLE_AUTH=trueの場合にtrueを返す", () => {
      process.env.NODE_ENV = "development"
      process.env.DISABLE_AUTH = "true"

      expect(isAuthDisabledForDevelopment()).toBe(true)
    })

    it("開発環境でもDISABLE_AUTH=falseの場合にfalseを返す", () => {
      process.env.NODE_ENV = "development"
      process.env.DISABLE_AUTH = "false"

      expect(isAuthDisabledForDevelopment()).toBe(false)
    })

    it("本番環境では常にfalseを返す", () => {
      process.env.NODE_ENV = "production"
      process.env.DISABLE_AUTH = "true"

      expect(isAuthDisabledForDevelopment()).toBe(false)
    })

    it("DISABLE_AUTHが未設定の場合にfalseを返す", () => {
      process.env.NODE_ENV = "development"
      delete process.env.DISABLE_AUTH

      expect(isAuthDisabledForDevelopment()).toBe(false)
    })
  })

  describe("getAuthExclusionsFromEnv", () => {
    const originalEnv = process.env

    beforeEach(() => {
      vi.resetModules()
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it("デフォルト設定を返す", () => {
      delete process.env.AUTH_EXCLUDE_PATHS

      const config = getAuthExclusionsFromEnv()

      expect(config.exactPaths).toEqual(DEFAULT_AUTH_EXCLUSIONS.exactPaths)
      expect(config.pathPrefixes).toEqual(DEFAULT_AUTH_EXCLUSIONS.pathPrefixes)
      expect(config.patterns).toEqual(DEFAULT_AUTH_EXCLUSIONS.patterns)
    })

    it("環境変数から追加パスを取得する", () => {
      process.env.AUTH_EXCLUDE_PATHS = "/api/test,/debug,/monitoring"

      const config = getAuthExclusionsFromEnv()

      expect(config.exactPaths).toContain("/api/test")
      expect(config.exactPaths).toContain("/debug")
      expect(config.exactPaths).toContain("/monitoring")
      expect(config.exactPaths).toContain("/health") // デフォルトも含む
    })

    it("空白を含む環境変数を正しく処理する", () => {
      process.env.AUTH_EXCLUDE_PATHS = " /api/test , /debug , /monitoring "

      const config = getAuthExclusionsFromEnv()

      expect(config.exactPaths).toContain("/api/test")
      expect(config.exactPaths).toContain("/debug")
      expect(config.exactPaths).toContain("/monitoring")
    })
  })
})
