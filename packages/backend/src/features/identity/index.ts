import {
  createExclusiveJWTAuthMiddleware,
  getAuthenticatedUser,
  requireAuth,
  type ExclusiveJWTAuthOptions,
} from "../../core/auth"
import type { JwtValidatorFactory } from "./application/ports/jwt-validator.port"
import { createJwtValidatorFactory } from "./infra/adapters/jwt-validator/jwt-validator.factory"

export interface CreateGlobalJwtAuthOptions extends ExclusiveJWTAuthOptions {
  validatorFactory?: JwtValidatorFactory
}

export const createGlobalJwtAuth = (
  options: CreateGlobalJwtAuthOptions = {},
) => {
  const { validatorFactory = createJwtValidatorFactory(), ...rest } = options
  return createExclusiveJWTAuthMiddleware(
    { validator: validatorFactory() },
    rest,
  )
}

export {
  createAuthRoutes,
  type CreateAuthRoutesOptions,
} from "./presentation"

export {
  createSignUpUseCase,
  type SignUpUseCaseDependencies,
} from "./application/use-cases/sign-up.use-case"

export { createJwtValidatorFactory }
export {
  createJwtValidator,
  type CreateJwtValidatorOptions,
} from "./infra/adapters/jwt-validator/jwt-validator.factory"

export { StubJwtValidatorAdapter } from "./infra/adapters/jwt-validator/stub-jwt-validator.adapter"

export { getAuthenticatedUser, requireAuth }
export type { JwtValidatorFactory } from "./application/ports/jwt-validator.port"
export type {
  SignUpRequest,
  SignUpResponse,
  AuthErrorResponse,
  UserResponse,
} from "./presentation"
