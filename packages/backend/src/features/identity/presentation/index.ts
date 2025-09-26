import { createIdentityRoutes } from "./routes"

/**
 * Identity Presentation Layer Entry Point
 * 認証・ユーザー管理API プレゼンテーション層のエントリーポイント
 *
 * authとuserフィーチャーを統合したidentityフィーチャーのプレゼンテーション層
 * 依存性注入によりサービス層との結合を行う
 */

// 依存性を注入してルーターを構築
const identityRoutes = createIdentityRoutes()

export default identityRoutes

// ファクトリー関数もエクスポート（テスト用）
export { createIdentityRoutes, createAuthRoutes } from "./routes"

// Auth関連スキーマをエクスポート
export type {
  SignUpRequest,
  UserResponse,
  SignUpResponse,
  AuthErrorResponse,
} from "./schemas"

// User関連スキーマをエクスポート
export {
  userParams,
  type UserParams,
} from "./schemas/user-params.schema"

export {
  userErrorResponseSchema,
  type UserErrorResponse,
} from "./schemas/user-error.schema"

export {
  userBaseSchema,
  type UserBase,
} from "./schemas/user-base.schema"

// User関連共通ユーティリティをエクスポート
export {
  createErrorResponse,
  handleError,
  userNotFoundResponse,
  authenticationErrorResponse,
} from "./shared/error-handling"
