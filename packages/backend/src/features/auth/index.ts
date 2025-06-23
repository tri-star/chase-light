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
} from "./middleware/jwt-auth.middleware.js"

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

export { JWTValidator } from "./utils/jwt-validator.js"
