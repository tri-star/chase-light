import { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { Scalar } from "@scalar/hono-api-reference"
import { globalJWTAuth, createAuthRoutes } from "./features/auth"
import userRoutes from "./features/user/presentation"

/**
 * Chase Light Backend Application
 *
 * OpenAPI/Swagger対応のHonoアプリケーション
 * Scalarを使用したモダンなAPI仕様書UI
 */
export const createApp = () => {
  const app = new OpenAPIHono()

  // ミドルウェア設定
  app.use("*", logger())
  app.use(
    "*",
    cors({
      origin: process.env.FRONTEND_URL?.split(",") || ["http://localhost:3000"],
      credentials: true,
    }),
  )

  // グローバルJWT認証（除外パス対応）
  app.use("*", globalJWTAuth)

  // ヘルスチェックエンドポイント
  app.get("/health", (c) =>
    c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    }),
  )

  // GitHub API サービス初期化（環境変数から）
  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) {
    throw new Error("GITHUB_TOKEN environment variable is required")
  }

  // Auth API routes
  app.route("/api/auth", createAuthRoutes())

  // User management API routes
  app.route("/api/users", userRoutes)

  // OpenAPI仕様書エンドポイント
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Chase Light Data Source API",
      description:
        "GitHub リポジトリデータ取得API - TypeScript + Hono + Zod + OpenAPI",
    },
    servers: [
      {
        url: process.env.API_BASE_URL || "http://localhost:3001",
        description: "Chase Light API Server",
      },
    ],
  })

  // Scalar API仕様書UI
  app.get(
    "/scalar",
    Scalar({
      url: "/doc",
      theme: "alternate", // モダンなテーマ
    }),
  )

  return app
}
