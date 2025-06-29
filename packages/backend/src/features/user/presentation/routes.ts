import { OpenAPIHono } from "@hono/zod-openapi"
import type { UserProfileService } from "../services/user-profile.service"
import type { UserSettingsService } from "../services/user-settings.service"
import { createProfileRoutes } from "./routes/profile"
import { createSettingsRoutes } from "./routes/settings"

/**
 * User Routes Factory
 * ユーザー管理API全体のルート統合
 */
export const createUserRoutes = (
  userProfileService: UserProfileService,
  userSettingsService: UserSettingsService,
) => {
  const app = new OpenAPIHono()

  // プロフィール関連ルートを追加
  createProfileRoutes(app, userProfileService)

  // 設定関連ルートを追加
  createSettingsRoutes(app, userProfileService, userSettingsService)

  return app
}
