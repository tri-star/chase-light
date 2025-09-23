import type { Context, Next } from "hono"
import { HTTPException } from "hono/http-exception"
import type {
  AuthContext,
  AuthenticatedUser,
  TokenValidationResult,
} from "../types/jwt.types"
import { AuthError } from "../errors/auth.error"

export interface JWTValidatorLike {
  validateAccessToken(token: string): Promise<TokenValidationResult>
}

export interface JWTAuthDependencies {
  validator: JWTValidatorLike
}

export interface JWTAuthOptions {
  optional?: boolean
  extractToken?: (c: Context) => string | null
  onError?: (error: AuthError, c: Context) => never
}

function defaultExtractToken(c: Context): string | null {
  const authHeader = c.req.header("Authorization")
  if (authHeader) {
    return authHeader
  }

  const appStage = process.env.APP_STAGE
  if (!appStage) {
    throw new Error("APP_STAGE environment variable is required but not set")
  }

  if (appStage !== "prod") {
    const tokenFromQuery = c.req.query("access_token")
    if (tokenFromQuery) {
      return `Bearer ${tokenFromQuery}`
    }
  }

  return null
}

function defaultErrorHandler(error: AuthError, c: Context): never {
  throw new HTTPException(error.httpStatus as 401, {
    message: error.message,
    cause: {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
      timestamp: new Date().toISOString(),
      path: c.req.path,
    },
  })
}

export function createJWTAuthMiddleware(
  dependencies: JWTAuthDependencies,
  options: JWTAuthOptions = {},
) {
  const {
    optional = false,
    extractToken = defaultExtractToken,
    onError = defaultErrorHandler,
  } = options

  const { validator } = dependencies

  return async (c: Context, next: Next) => {
    try {
      const token = extractToken(c)

      if (!token) {
        if (optional) {
          await next()
          return
        }

        throw AuthError.tokenMissing()
      }

      const validationResult = await validator.validateAccessToken(token)

      if (!validationResult.valid) {
        if (optional) {
          await next()
          return
        }

        throw AuthError.tokenInvalid(validationResult.error)
      }

      if (!validationResult.payload) {
        throw AuthError.tokenInvalid("No payload found in token")
      }

      const cleanToken = token.replace(/^Bearer\s+/i, "").trim()
      const authenticatedUser: AuthenticatedUser = {
        sub: validationResult.payload.sub,
        payload: validationResult.payload,
        accessToken: cleanToken,
      }

      const authContext: AuthContext = {
        user: authenticatedUser,
      }

      c.set("auth", authContext)

      await next()
    } catch (error) {
      if (error instanceof AuthError) {
        onError(error, c)
        return
      }

      if (error instanceof HTTPException) {
        throw error
      }

      const authError = AuthError.validationError(
        error instanceof Error ? error.message : "Unknown authentication error",
      )
      onError(authError, c)
    }
  }
}

export function getAuthenticatedUser(c: Context): AuthenticatedUser | null {
  const authContext = c.get("auth")
  return authContext?.user || null
}

export function requireAuth(c: Context): AuthenticatedUser {
  const user = getAuthenticatedUser(c)
  if (!user) {
    throw AuthError.tokenMissing()
  }
  return user
}
