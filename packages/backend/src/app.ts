import { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { Scalar } from "@scalar/hono-api-reference"
import {
  createGlobalJwtAuth,
  createAuthRoutes,
  createJwtValidatorFactory,
  createSignUpUseCase,
} from "./features/identity"
import userRoutes from "./features/user/presentation"
import dataSourceRoutes from "./features/data-sources"
import { createE2EControlRoutes } from "./features/data-sources/presentation/routes/e2e-control"

/**
 * Chase Light Backend Application
 *
 * OpenAPI/Swagger対応のHonoアプリケーション
 * Scalarを使用したモダンなAPI仕様書UI
 */
export const createApp = () => {
  const app = new OpenAPIHono()

  const jwtValidatorFactory = createJwtValidatorFactory()
  const globalJWTAuth = createGlobalJwtAuth({
    validatorFactory: jwtValidatorFactory,
  })

  // REVIEW: ここでUseCaseを初期化してしまうと、今後他のユースケースも増えてきた時、このファイルが非常に長くなってしまいます。
  //         UseCaseの初期化は各ルートの内部で実施、jwtValidatorはcreateJwtValidatorのファクトリ関数からいつでも環境に応じたインスタンスを取得できるようにしして、
  //         ルート定義ファイルの中で取得するようにしてください。
  const signUpUseCase = createSignUpUseCase({
    jwtValidator: jwtValidatorFactory(),
  })

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

  // Auth API routes
  app.route("/api/auth", createAuthRoutes({ signUpUseCase }))

  // User management API routes
  app.route("/api/users", userRoutes)

  // Data Source management API routes
  app.route("/api", dataSourceRoutes)

  // E2E Control API routes (only in stub mode)
  if (process.env.USE_GITHUB_API_STUB === "true") {
    app.route("/api", createE2EControlRoutes())
  }

  // OpenAPI仕様書エンドポイント
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Chase Light API",
      description:
        "GitHub リポジトリ監視サービス API - TypeScript + Hono + Zod + OpenAPI",
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
