/**
 * Identity Feature Exports
 *
 * 認証・ユーザー管理機能の公開API
 * authとuserフィーチャーを統合したidentityフィーチャー
 */

// TODO: Phase毎に段階的にエクスポートを追加

// Domain (Phase 2で追加予定)
// export type { User, UserId } from "./domain/user"
// export type { UserSettings } from "./domain/user-settings"
// export type { Timezone } from "./domain/timezone"

// Use Cases (Phase 3で追加予定 → 順次追加中)
export { GetUserProfileUseCase } from "./application/use-cases/get-user-profile.use-case"
export { UpdateUserProfileUseCase } from "./application/use-cases/update-user-profile.use-case"
export { GetUserSettingsUseCase } from "./application/use-cases/get-user-settings.use-case"
export { UpdateUserSettingsUseCase } from "./application/use-cases/update-user-settings.use-case"
export { SignUpUseCase } from "./application/use-cases/sign-up.use-case"
export type {
  SignUpRequest as UseCaseSignUpRequest,
  SignUpResponse as UseCaseSignUpResponse,
} from "./application/use-cases/sign-up.use-case"

// Ports (Phase 3で追加予定)
// export type { JwtValidatorPort } from "./application/ports/jwt-validator.port"

// Adapters (Phase 4で追加予定)
// export { createJwtValidatorAdapter } from "./infra/adapters/jwt-validator/jwt-validator-factory"

// Constants (Phase 2で追加予定)
// export * from "./constants/identity.constants"

// Errors (Phase 2で追加予定)
// export * from "./errors/auth.error"

// Middleware (Phase 5で統合予定)
export {
  createJWTAuthMiddleware,
  jwtAuth,
  optionalJwtAuth,
  getAuthenticatedUser,
  requireAuth,
  type JWTAuthOptions,
} from "./middleware/jwt-auth.middleware"

export {
  createExclusiveJWTAuthMiddleware,
  globalJWTAuth,
  type ExclusiveJWTAuthOptions,
} from "./middleware/exclusive-jwt-auth.middleware"

export {
  isPathExcluded,
  getAuthExclusionsFromEnv,
  DEFAULT_AUTH_EXCLUSIONS,
  type AuthExclusionConfig,
} from "./middleware/auth-exclusions"

// Types (Phase 5で統合予定)
export type {
  JWTPayload,
  Auth0Config,
  AuthenticatedUser,
  AuthContext,
  TokenValidationResult,
} from "./types/auth.types"

// Errors (Phase 5で統合予定)
export {
  AuthError,
  AuthErrorCode,
  type AuthErrorDetails,
} from "./errors/auth.error"

// Utils (Phase 5で統合予定)
export {
  getAuth0Config,
  validateAuth0Config,
} from "./utils/auth-config"

// JWT Validator (新アーキテクチャ: Adapter経由)
export { createJwtValidatorAdapter } from "./infra/adapters/jwt-validator/jwt-validator-factory"
export type { JwtValidatorPort } from "./application/ports/jwt-validator.port"

// Auth Signup Service - UseCaseに移行済み (SignUpUseCase)
// Service層は非推奨、新しいコードはUseCaseパターンを使用してください

// Presentation (Phase 5で統合予定)
export { createAuthRoutes } from "./presentation/routes"
export type {
  SignUpRequest,
  UserResponse,
  SignUpResponse,
  AuthErrorResponse,
} from "./presentation/schemas"
