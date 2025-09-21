import type {
  JwtValidatorFactory,
  JwtValidatorPort,
} from "../../../application/ports/jwt-validator.port"
import type { Auth0Config } from "../../../../../core/auth"
import { getAuth0Config, validateAuth0Config } from "../../../../../core/auth"
import { JwtValidatorAdapter } from "./jwt-validator.adapter"
import { StubJwtValidatorAdapter } from "./stub-jwt-validator.adapter"

export interface CreateJwtValidatorOptions {
  config?: Auth0Config
  forceStub?: boolean
}

export const createJwtValidator = (
  options: CreateJwtValidatorOptions = {},
): JwtValidatorPort => {
  if (options.forceStub || process.env.NODE_ENV === "test") {
    return new StubJwtValidatorAdapter()
  }

  const config = options.config ?? getAuth0Config()
  validateAuth0Config(config)

  return new JwtValidatorAdapter(config)
}

export const createJwtValidatorFactory =
  (options: CreateJwtValidatorOptions = {}): JwtValidatorFactory =>
  () =>
    createJwtValidator(options)
