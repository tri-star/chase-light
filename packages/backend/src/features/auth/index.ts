/**
 * Authentication Feature Exports
 *
 * 認証機能の公開API
 */

// Middleware
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

// Types
export type {
  JWTPayload,
  Auth0Config,
  AuthenticatedUser,
  AuthContext,
  TokenValidationResult,
} from "./types/auth.types"

// Errors
export {
  AuthError,
  AuthErrorCode,
  type AuthErrorDetails,
} from "./errors/auth.error"

// Utils
export {
  getAuth0Config,
  validateAuth0Config,
} from "./utils/auth-config"

export { JWTValidator } from "./services/jwt-validator.service"

// Services
export {
  AuthSignupService,
  authSignupService,
  type SignUpRequest as ServiceSignUpRequest,
  type SignUpResponse as ServiceSignUpResponse,
} from "./services/auth-signup.service"

// Presentation
export { createAuthRoutes } from "./presentation/routes"
export type {
  SignUpRequest,
  UserResponse,
  SignUpResponse,
  AuthErrorResponse,
} from "./presentation/schemas"
