import { OpenAPIHono } from "@hono/zod-openapi"
import { DrizzleUserRepository } from "./infra/repositories/drizzle-user.repository"
import {
  createJWTValidatorAdapter,
  Auth0JWTValidatorAdapter,
  StubJWTValidatorAdapter,
} from "./infra/adapters/jwt-validator/jwt-validator.factory"
import type { UserRepository } from "./domain/repositories/user.repository"
import type { JWTValidatorPort } from "./application/ports/jwt-validator.port"
import { SignUpUseCase } from "./application/use-cases/sign-up.use-case"
import { GetProfileUseCase } from "./application/use-cases/get-profile.use-case"
import { UpdateProfileUseCase } from "./application/use-cases/update-profile.use-case"
import { GetSettingsUseCase } from "./application/use-cases/get-settings.use-case"
import { UpdateSettingsUseCase } from "./application/use-cases/update-settings.use-case"
import { createAuthRoutes } from "./presentation/routes/auth"
import { createUserRoutes } from "./presentation/routes/users"
import type { UserRoutesDependencies } from "./presentation/routes/users"

export interface IdentityDependencies {
  userRepository?: UserRepository
  jwtValidator?: JWTValidatorPort
}

export interface IdentityUseCases {
  signUp: SignUpUseCase
  getProfile: GetProfileUseCase
  updateProfile: UpdateProfileUseCase
  getSettings: GetSettingsUseCase
  updateSettings: UpdateSettingsUseCase
}

export interface IdentityContext {
  userRepository: UserRepository
  jwtValidator: JWTValidatorPort
  useCases: IdentityUseCases
}

export function createIdentityContext(
  dependencies: IdentityDependencies = {},
): IdentityContext {
  const userRepository =
    dependencies.userRepository ?? new DrizzleUserRepository()
  const jwtValidator =
    dependencies.jwtValidator ?? createJWTValidatorAdapter()

  const signUp = new SignUpUseCase(userRepository, jwtValidator)
  const getProfile = new GetProfileUseCase(userRepository)
  const updateProfile = new UpdateProfileUseCase(userRepository)
  const getSettings = new GetSettingsUseCase(userRepository)
  const updateSettings = new UpdateSettingsUseCase(userRepository)

  return {
    userRepository,
    jwtValidator,
    useCases: {
      signUp,
      getProfile,
      updateProfile,
      getSettings,
      updateSettings,
    },
  }
}

export function createAuthRouter(useCases: IdentityUseCases): OpenAPIHono {
  return createAuthRoutes(useCases.signUp)
}

export function createUserRouter(useCases: IdentityUseCases): OpenAPIHono {
  const deps: UserRoutesDependencies = {
    getProfileUseCase: useCases.getProfile,
    updateProfileUseCase: useCases.updateProfile,
    getSettingsUseCase: useCases.getSettings,
    updateSettingsUseCase: useCases.updateSettings,
  }

  return createUserRoutes(deps)
}

export {
  DrizzleUserRepository,
  createJWTValidatorAdapter,
  Auth0JWTValidatorAdapter,
  StubJWTValidatorAdapter,
}

export { AuthTestHelper } from "./testing/auth-test-helper"
