export {
  createJWTAuthMiddleware,
  type JWTAuthOptions,
  type JWTAuthDependencies,
  getAuthenticatedUser,
  requireAuth,
} from "./middleware/jwt-auth.middleware"

export {
  createExclusiveJWTAuthMiddleware,
  type ExclusiveJWTAuthOptions,
} from "./middleware/exclusive-jwt-auth.middleware"

export {
  isPathExcluded,
  getAuthExclusionsFromEnv,
  DEFAULT_AUTH_EXCLUSIONS,
  type AuthExclusionConfig,
} from "./middleware/auth-exclusions"

export {
  AuthError,
  AuthErrorCode,
  type AuthErrorDetails,
} from "./errors/auth.error"

export {
  getAuth0Config,
  validateAuth0Config,
} from "./config/auth-config"

export type {
  Auth0Config,
  AuthContext,
  AuthenticatedUser,
  JWTPayload,
  TokenValidationResult,
  AccessTokenValidator,
  IdTokenValidator,
  JWTValidator,
} from "./types/auth.types"
