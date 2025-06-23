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
