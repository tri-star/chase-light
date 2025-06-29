import { createUserRoutes } from "./routes"
import { userProfileService } from "../services/user-profile.service.js"
import { userSettingsService } from "../services/user-settings.service.js"

/**
 * Users Presentation Layer Entry Point
 * ユーザー管理API プレゼンテーション層のエントリーポイント
 *
 * 依存性注入によりサービス層との結合を行う
 */

// 依存性を注入してルーターを構築
const userRoutes = createUserRoutes(userProfileService, userSettingsService)

export default userRoutes

// ファクトリー関数もエクスポート（テスト用）
export { createUserRoutes } from "./routes"

// 共通スキーマとユーティリティをエクスポート
export {
  userParams,
  userErrorResponseSchema,
  userBaseSchema,
  type UserParams,
  type UserErrorResponse,
  type UserBase,
} from "./shared/common-schemas"

export {
  createErrorResponse,
  handleError,
  userNotFoundResponse,
  authenticationErrorResponse,
} from "./shared/error-handling"
