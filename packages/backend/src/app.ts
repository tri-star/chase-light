import { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { Scalar } from "@scalar/hono-api-reference"
import { createExclusiveJWTAuthMiddleware } from "./core/auth"
import {
  createIdentityContext,
  createAuthRouter,
  createUserRouter,
} from "./features/identity"
import dataSourceRoutes from "./features/data-sources"
import { createE2EControlRoutes } from "./features/data-sources/presentation/routes/e2e-control"

export const createApp = () => {
  const app = new OpenAPIHono()

  const identity = createIdentityContext()
  const authMiddleware = createExclusiveJWTAuthMiddleware({
    validator: identity.jwtValidator,
  })

  const authRoutes = createAuthRouter(identity.useCases)
  const userRoutes = createUserRouter(identity.useCases)

  app.use("*", logger())
  app.use(
    "*",
    cors({
      origin: process.env.FRONTEND_URL?.split(",") || ["http://localhost:3000"],
      credentials: true,
    }),
  )

  app.use("*", authMiddleware)

  app.get("/health", (c) =>
    c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    }),
  )

  app.route("/api/auth", authRoutes)
  app.route("/api/users", userRoutes)
  app.route("/api", dataSourceRoutes)

  if (process.env.USE_GITHUB_API_STUB === "true") {
    app.route("/api", createE2EControlRoutes())
  }

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

  app.get(
    "/scalar",
    Scalar({
      url: "/doc",
      theme: "alternate",
    }),
  )

  return app
}
