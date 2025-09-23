/**
 * Authentication Feature Exports (legacy)
 *
 * 新しいIdentity構成へ段階的に移行中。順次 `core/auth` / `features/identity` 側へ置き換えてください。
 */

// Middleware
export {
  createJWTAuthMiddleware,
  type JWTAuthDependencies,
  type JWTAuthOptions,
  getAuthenticatedUser,
  requireAuth,
} from "./middleware/jwt-auth.middleware.js"

export {
  createExclusiveJWTAuthMiddleware,
  type ExclusiveJWTAuthOptions,
} from "./middleware/exclusive-jwt-auth.middleware.js"

export {
  isPathExcluded,
  getAuthExclusionsFromEnv,
  DEFAULT_AUTH_EXCLUSIONS,
  type AuthExclusionConfig,
} from "./middleware/auth-exclusions.js"

// Types
export type {
  JWTPayload,
  Auth0Config,
  AuthenticatedUser,
  AuthContext,
  TokenValidationResult,
} from "./types/auth.types.js"

// Errors
export {
  AuthError,
  AuthErrorCode,
  type AuthErrorDetails,
} from "./errors/auth.error.js"

// Utils
export {
  getAuth0Config,
  validateAuth0Config,
} from "./utils/auth-config.js"

// Services (legacy)
export {
  AuthSignupService,
  authSignupService,
  type SignUpRequest as ServiceSignUpRequest,
  type SignUpResponse as ServiceSignUpResponse,
} from "./services/auth-signup.service"

// Presentation (legacy)
export { createAuthRoutes } from "./presentation/routes.js"
export type {
  SignUpRequest,
  UserResponse,
  SignUpResponse,
  AuthErrorResponse,
} from "./presentation/schemas.js"
