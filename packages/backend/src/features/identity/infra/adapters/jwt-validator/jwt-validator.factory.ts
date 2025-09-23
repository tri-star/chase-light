import {
  getAuth0Config,
  validateAuth0Config,
} from "../../../../../core/auth/config/auth0.config"
import type { Auth0Config } from "../../../../../core/auth/types/jwt.types"
import type { JWTValidatorPort } from "../../../application/ports/jwt-validator.port"
import { Auth0JWTValidatorAdapter } from "./auth0-jwt-validator.adapter"
import { StubJWTValidatorAdapter } from "./stub-jwt-validator.adapter"

export interface JWTValidatorFactoryOptions {
  config?: Auth0Config
  useStub?: boolean
}

export function createJWTValidatorAdapter(
  options: JWTValidatorFactoryOptions = {},
): JWTValidatorPort {
  const shouldUseStub =
    options.useStub === true || process.env.NODE_ENV === "test"

  if (shouldUseStub) {
    return new StubJWTValidatorAdapter()
  }

  const config = options.config ?? getAuth0Config()
  validateAuth0Config(config)

  return new Auth0JWTValidatorAdapter(config)
}

export { Auth0JWTValidatorAdapter, StubJWTValidatorAdapter }
