import type { Context, Next } from "hono"
import {
  createJWTAuthMiddleware,
  type JWTAuthDependencies,
  type JWTAuthOptions,
} from "./jwt-auth.middleware"
import {
  isPathExcluded,
  getAuthExclusionsFromEnv,
  type AuthExclusionConfig,
} from "./auth-exclusions"

export interface ExclusiveJWTAuthOptions extends JWTAuthOptions {
  exclusions?: AuthExclusionConfig
}

export function createExclusiveJWTAuthMiddleware(
  dependencies: JWTAuthDependencies,
  options: ExclusiveJWTAuthOptions = {},
) {
  const { exclusions = getAuthExclusionsFromEnv(), ...jwtOptions } = options

  const jwtAuthMiddleware = createJWTAuthMiddleware(dependencies, jwtOptions)

  return async (c: Context, next: Next) => {
    const path = c.req.path

    if (isPathExcluded(path, exclusions)) {
      console.log(`[AUTH] Path excluded from authentication: ${path}`)
      await next()
      return
    }

    console.log(`[AUTH] Authenticating request: ${path}`)
    try {
      await jwtAuthMiddleware(c, next)
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        return c.json({ error: "Unauthorized" }, 401)
      }
      throw error
    }
  }
}
